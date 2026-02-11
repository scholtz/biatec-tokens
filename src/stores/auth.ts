import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { generateAlgorandAccount } from "arc76";
import algosdk from "algosdk";
import { makeArc14AuthHeader, makeArc14TxWithSuggestedParams } from "arc14";

export interface AlgorandUser {
  address: string;
  name?: string;
  email?: string;
  avatar?: string;
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

  const isAuthenticated = computed(() => !!user.value && isConnected.value);

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
    localStorage.removeItem("algorand_user");
    localStorage.removeItem("arc76_session");
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
   */
  const authenticateWithARC76 = async (email: string, p: string) => {
    loading.value = true;
    try {
      const arc76account: algosdk.Account = await generateAlgorandAccount(p, email, 1);
      // Create user from ARC76 authentication
      const newUser: AlgorandUser = {
        address: arc76account.addr.toString(),
        name: email.split("@")[0], // Use email prefix as name
        email: email,
      };

      user.value = newUser;
      isConnected.value = true;
      arc76email.value = email;
      account.value = arc76account.addr.toString();
      formattedAddress.value = `${arc76account.addr.toString().slice(0, 4)}...${arc76account.addr.toString().slice(-4)}`;
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
      const session = makeArc14AuthHeader(signed);

      // Save to localStorage
      localStorage.setItem("algorand_user", JSON.stringify(newUser));
      localStorage.setItem("arc76_session", session);
      localStorage.setItem("arc76_account", account.value);
      localStorage.setItem("arc76_email", email);

      return newUser;
    } catch (error) {
      console.error("Error authenticating with ARC76:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Restore ARC76 session from localStorage
   */
  const restoreARC76Session = async () => {
    try {
      const savedSession = localStorage.getItem("arc76_session");
      session.value = savedSession || "";
      isConnected.value = !!savedSession;
      const savedEmail = localStorage.getItem("arc76_email");
      arc76email.value = savedEmail;
      const savedAccount = localStorage.getItem("arc76_account");
      account.value = savedAccount || "";
      formattedAddress.value = savedAccount ? `${savedAccount.slice(0, 4)}...${savedAccount.slice(-4)}` : "";
      return !!savedSession;
    } catch (error) {
      console.error("Error restoring ARC76 session:", error);
      return false;
    }
  };
  return {
    user,
    loading,
    isConnected,
    isAuthenticated,
    arc76email,
    account,
    formattedAddress,
    initialize,
    connectWallet,
    signOut,
    updateUser,
    authenticateWithARC76,
    restoreARC76Session,
  };
});
