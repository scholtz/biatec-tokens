import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { generateAlgorandAccount } from "../utils/arc76Account";
import algosdk from "algosdk";
import { Buffer } from "buffer";
import { makeArc14AuthHeader, makeArc14TxWithSuggestedParams } from "../utils/arc14Auth";
import { accountProvisioningService } from "../services/AccountProvisioningService";
import { auditTrailService } from "../services/AuditTrailService";
import type { AccountProvisioningStatus } from "../types/accountProvisioning";

export interface AlgorandUser {
  address: string;
  name?: string;
  email?: string;
  avatar?: string;
  provisioningStatus?: AccountProvisioningStatus;
  canDeploy?: boolean;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AlgorandUser | null>(null);
  const loading = ref(false);
  const isConnected = ref(false);
  // ARC76 email for email/password authentication
  const arc76email = ref<string | null>(null);
  const account = ref<string>("");
  const formattedAddress = ref<string>("");
  const session = ref<string>("");
  const provisioningStatus = ref<AccountProvisioningStatus>("not_started");
  const provisioningError = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value && isConnected.value);
  const isAccountReady = computed(() => isAuthenticated.value && provisioningStatus.value === "active" && user.value?.canDeploy === true);

  const initialize = async () => {
    loading.value = true;
    try {
      // Check if user was previously connected
      const savedUser = localStorage.getItem("algorand_user");
      if (savedUser) {
        user.value = JSON.parse(savedUser);
        isConnected.value = true;
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      loading.value = false;
    }
  };

  const connectWallet = async (walletAddress: string, userInfo?: Partial<AlgorandUser>) => {
    loading.value = true;
    try {
      const newUser: AlgorandUser = {
        address: walletAddress,
        name: userInfo?.name || `User ${walletAddress.slice(0, 6)}...`,
        email: userInfo?.email,
        avatar: userInfo?.avatar,
      };

      user.value = newUser;
      isConnected.value = true;

      // Save to localStorage
      localStorage.setItem("algorand_user", JSON.stringify(newUser));

      return newUser;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const signOut = async () => {
    user.value = null;
    isConnected.value = false;
    arc76email.value = null;
    provisioningStatus.value = "not_started";
    provisioningError.value = null;
    localStorage.removeItem("algorand_user");
    localStorage.removeItem("arc76_session");
    localStorage.removeItem("arc76_account");
    localStorage.removeItem("arc76_email");
  };

  const updateUser = (updates: Partial<AlgorandUser>) => {
    if (user.value) {
      user.value = { ...user.value, ...updates };
      localStorage.setItem("algorand_user", JSON.stringify(user.value));
    }
  };

  /**
   * Authenticate with email/password using ARC76
   * This is the primary authentication method for the platform
   * Now includes automatic account provisioning
   */
  const authenticateWithARC76 = async (email: string, p: string) => {
    loading.value = true;
    provisioningError.value = null;

    try {
      // Step 1: Generate ARC76 account
      const arc76account: algosdk.Account = await generateAlgorandAccount(p, email, 1);
      const derivedAddress = arc76account.addr.toString();

      // Step 2: Create user from ARC76 authentication
      const newUser: AlgorandUser = {
        address: derivedAddress,
        name: email.split("@")[0], // Use email prefix as name
        email: email,
        provisioningStatus: "provisioning",
        canDeploy: false,
      };

      user.value = newUser;
      isConnected.value = true;
      arc76email.value = email;
      account.value = derivedAddress;
      formattedAddress.value = `${derivedAddress.slice(0, 4)}...${derivedAddress.slice(-4)}`;

      const params: algosdk.SuggestedParams = {
        fee: 1000n,
        genesisHash: new Uint8Array(Buffer.from("wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=", "base64")),
        genesisID: "mainnet-v1.0",
        lastValid: 46916880n,
        minFee: 1000n,
        flatFee: false,
        firstValid: 46915880n,
      };
      const tx = await makeArc14TxWithSuggestedParams("realm#ARC14", algosdk.encodeAddress(arc76account.addr.publicKey), params);
      const signed = tx.signTxn(arc76account.sk);
      const sessionToken = makeArc14AuthHeader(signed);
      session.value = sessionToken;

      // Step 3: Provision account on backend
      provisioningStatus.value = "provisioning";

      try {
        const provisioningResponse = await accountProvisioningService.provisionAccount({
          email,
          derivedAddress,
          derivationIndex: 1,
        });

        // Update user with provisioning result
        user.value = {
          ...newUser,
          provisioningStatus: provisioningResponse.status,
          canDeploy: provisioningResponse.status === "active",
        };

        provisioningStatus.value = provisioningResponse.status;

        // Log audit event
        await auditTrailService.logEvent(
          "account_created",
          "info",
          { address: derivedAddress, email, name: newUser.name },
          { type: "account", id: derivedAddress },
          "ARC76 account created and provisioned",
          { status: provisioningResponse.status },
        );
      } catch (provisioningErr: unknown) {
        console.error("Account provisioning failed:", provisioningErr);
        provisioningStatus.value = "failed";
        const errorMessage = provisioningErr instanceof Error ? provisioningErr.message : "Account provisioning failed. Please try again.";
        provisioningError.value = errorMessage;

        // Still allow user to continue, but mark as not ready for deployment
        user.value = {
          ...newUser,
          provisioningStatus: "failed",
          canDeploy: false,
        };
      }

      // Save to localStorage
      localStorage.setItem("algorand_user", JSON.stringify(user.value));
      localStorage.setItem("arc76_session", sessionToken);
      localStorage.setItem("arc76_account", account.value);
      localStorage.setItem("arc76_email", email);

      return user.value;
    } catch (error) {
      console.error("Error authenticating with ARC76:", error);
      provisioningStatus.value = "failed";
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Restore ARC76 session from localStorage
   * Also checks account provisioning status
   */
  const restoreARC76Session = async () => {
    try {
      const savedSession = localStorage.getItem("arc76_session");
      session.value = savedSession || "";
      // Only update isConnected based on ARC76 session when not already authenticated
      // via the algorand_user flow (email/password). Prevents restoreARC76Session from
      // clearing auth state for users who authenticated via algorand_user but don't have
      // a separate arc76_session key stored (e.g. in E2E tests and browser-only sessions).
      if (savedSession) {
        isConnected.value = true;
      } else if (!user.value) {
        isConnected.value = false;
      }
      const savedEmail = localStorage.getItem("arc76_email");
      arc76email.value = savedEmail;
      const savedAccount = localStorage.getItem("arc76_account");
      account.value = savedAccount || "";
      formattedAddress.value = savedAccount ? `${savedAccount.slice(0, 4)}...${savedAccount.slice(-4)}` : "";

      // Check account provisioning status if we have an account
      if (savedAccount && savedSession) {
        try {
          const accountStatus = await accountProvisioningService.getAccountStatus(savedAccount);
          provisioningStatus.value = accountStatus.status;

          if (user.value) {
            user.value.provisioningStatus = accountStatus.status;
            user.value.canDeploy = accountStatus.canDeploy;
          }
        } catch (error) {
          console.error("Error checking account status:", error);
          // Don't fail session restore if status check fails
          provisioningStatus.value = "active"; // Assume active for backward compatibility
        }
      }

      return !!savedSession;
    } catch (error) {
      console.error("Error restoring ARC76 session:", error);
      return false;
    }
  };

  /**
   * Manually refresh account provisioning status
   * Used when checking if account is ready for deployment
   */
  const refreshProvisioningStatus = async (): Promise<boolean> => {
    if (!account.value) {
      return false;
    }

    try {
      const accountStatus = await accountProvisioningService.getAccountStatus(account.value);
      provisioningStatus.value = accountStatus.status;

      if (user.value) {
        user.value.provisioningStatus = accountStatus.status;
        user.value.canDeploy = accountStatus.canDeploy;
        localStorage.setItem("algorand_user", JSON.stringify(user.value));
      }

      return accountStatus.canDeploy;
    } catch (error) {
      console.error("Error refreshing provisioning status:", error);
      return false;
    }
  };
  return {
    user,
    loading,
    isConnected,
    isAuthenticated,
    isAccountReady,
    arc76email,
    account,
    formattedAddress,
    session,
    provisioningStatus,
    provisioningError,
    initialize,
    connectWallet,
    signOut,
    updateUser,
    authenticateWithARC76,
    restoreARC76Session,
    refreshProvisioningStatus,
  };
});
