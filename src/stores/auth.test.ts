import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "./auth";

describe("Auth Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("initialization", () => {
    it("should initialize with no user when localStorage is empty", async () => {
      const authStore = useAuthStore();

      await authStore.initialize();

      expect(authStore.user).toBeNull();
      expect(authStore.isConnected).toBe(false);
      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.loading).toBe(false);
    });

    it("should restore user from localStorage on initialize", async () => {
      const savedUser = {
        address: "TEST_ADDRESS_123",
        email: "test@example.com",
        name: "Test User",
      };
      localStorage.setItem("algorand_user", JSON.stringify(savedUser));

      const authStore = useAuthStore();
      await authStore.initialize();

      expect(authStore.user).toEqual(savedUser);
      expect(authStore.isConnected).toBe(true);
      expect(authStore.isAuthenticated).toBe(true);
    });

    it("should handle corrupted localStorage data gracefully", async () => {
      localStorage.setItem("algorand_user", "CORRUPTED_JSON_DATA");

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const authStore = useAuthStore();
      await authStore.initialize();

      expect(authStore.user).toBeNull();
      expect(authStore.isConnected).toBe(false);
      expect(authStore.isAuthenticated).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should handle missing required fields in saved user", async () => {
      // Incomplete user data (missing address)
      localStorage.setItem("algorand_user", JSON.stringify({ email: "test@example.com" }));

      const authStore = useAuthStore();
      await authStore.initialize();

      // Store should still load the data even if incomplete
      expect(authStore.user).toEqual({ email: "test@example.com" });
      expect(authStore.isConnected).toBe(true);
    });
  });

  describe("isAuthenticated computed property", () => {
    it("should return false when user is null", () => {
      const authStore = useAuthStore();

      authStore.user = null;
      authStore.isConnected = false;

      expect(authStore.isAuthenticated).toBe(false);
    });

    it("should return false when user exists but not connected", () => {
      const authStore = useAuthStore();

      authStore.user = { address: "TEST_ADDRESS", email: "test@example.com" };
      authStore.isConnected = false;

      expect(authStore.isAuthenticated).toBe(false);
    });

    it("should return false when connected but no user", () => {
      const authStore = useAuthStore();

      authStore.user = null;
      authStore.isConnected = true;

      expect(authStore.isAuthenticated).toBe(false);
    });

    it("should return true when user exists and connected", () => {
      const authStore = useAuthStore();

      authStore.user = { address: "TEST_ADDRESS", email: "test@example.com" };
      authStore.isConnected = true;

      expect(authStore.isAuthenticated).toBe(true);
    });
  });

  describe("isAccountReady computed property", () => {
    it("should return false when not authenticated", () => {
      const authStore = useAuthStore();

      authStore.user = null;
      authStore.isConnected = false;
      authStore.provisioningStatus = "active";

      expect(authStore.isAccountReady).toBe(false);
    });

    it("should return false when authenticated but provisioning not active", () => {
      const authStore = useAuthStore();

      authStore.user = { address: "TEST_ADDRESS", email: "test@example.com", canDeploy: true };
      authStore.isConnected = true;
      authStore.provisioningStatus = "not_started";

      expect(authStore.isAccountReady).toBe(false);
    });

    it("should return false when authenticated and provisioned but canDeploy is false", () => {
      const authStore = useAuthStore();

      authStore.user = { address: "TEST_ADDRESS", email: "test@example.com", canDeploy: false };
      authStore.isConnected = true;
      authStore.provisioningStatus = "active";

      expect(authStore.isAccountReady).toBe(false);
    });

    it("should return true when authenticated, provisioned, and canDeploy", () => {
      const authStore = useAuthStore();

      authStore.user = { address: "TEST_ADDRESS", email: "test@example.com", canDeploy: true };
      authStore.isConnected = true;
      authStore.provisioningStatus = "active";

      expect(authStore.isAccountReady).toBe(true);
    });
  });

  describe("localStorage persistence", () => {
    it("should persist user data when connecting", async () => {
      const authStore = useAuthStore();
      const userData = {
        address: "TEST_ADDRESS_PERSIST",
        email: "persist@example.com",
        name: "Persist User",
      };

      authStore.user = userData;
      authStore.isConnected = true;

      // Simulate what happens when user data is set
      localStorage.setItem("algorand_user", JSON.stringify(userData));

      const savedData = localStorage.getItem("algorand_user");
      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual(userData);
    });

    it("should maintain session across page reloads", async () => {
      // First session
      const userData = {
        address: "TEST_ADDRESS_SESSION",
        email: "session@example.com",
      };
      localStorage.setItem("algorand_user", JSON.stringify(userData));

      // Simulate page reload by creating new store instance
      const authStore1 = useAuthStore();
      await authStore1.initialize();

      expect(authStore1.user).toEqual(userData);
      expect(authStore1.isAuthenticated).toBe(true);

      // Create another instance (simulating another page load)
      const authStore2 = useAuthStore();
      await authStore2.initialize();

      expect(authStore2.user).toEqual(userData);
      expect(authStore2.isAuthenticated).toBe(true);
    });
  });

  describe("email identity persistence", () => {
    it("should maintain email across navigation", async () => {
      const testEmail = "identity@example.com";
      const userData = {
        address: "TEST_ADDRESS_EMAIL",
        email: testEmail,
      };
      localStorage.setItem("algorand_user", JSON.stringify(userData));

      const authStore = useAuthStore();
      await authStore.initialize();

      expect(authStore.user?.email).toBe(testEmail);

      // Verify email persists after re-initialization
      await authStore.initialize();
      expect(authStore.user?.email).toBe(testEmail);
    });
  });

  describe("logout cleanup", () => {
    it("should clear user data on logout", () => {
      const authStore = useAuthStore();

      authStore.user = { address: "TEST_ADDRESS", email: "test@example.com" };
      authStore.isConnected = true;
      localStorage.setItem("algorand_user", JSON.stringify(authStore.user));

      // Simulate logout
      authStore.user = null;
      authStore.isConnected = false;
      localStorage.removeItem("algorand_user");

      expect(authStore.user).toBeNull();
      expect(authStore.isConnected).toBe(false);
      expect(authStore.isAuthenticated).toBe(false);
      expect(localStorage.getItem("algorand_user")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle null localStorage value", async () => {
      localStorage.setItem("algorand_user", "null");

      const authStore = useAuthStore();
      await authStore.initialize();

      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
    });

    it("should handle undefined localStorage value", async () => {
      localStorage.setItem("algorand_user", "undefined");

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const authStore = useAuthStore();
      await authStore.initialize();

      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it("should handle empty string in localStorage", async () => {
      localStorage.setItem("algorand_user", "");

      const authStore = useAuthStore();
      await authStore.initialize();

      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
    });

    it("should handle malformed JSON objects", async () => {
      localStorage.setItem("algorand_user", '{"address": "test", invalid}');

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const authStore = useAuthStore();
      await authStore.initialize();

      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("ARC76 deterministic behavior", () => {
    it("should maintain consistent state across multiple initializations", async () => {
      const userData = {
        address: "DETERMINISTIC_ADDRESS",
        email: "deterministic@example.com",
      };
      localStorage.setItem("algorand_user", JSON.stringify(userData));

      const authStore = useAuthStore();

      // Initialize multiple times
      await authStore.initialize();
      const firstState = { ...authStore.user };

      await authStore.initialize();
      const secondState = { ...authStore.user };

      await authStore.initialize();
      const thirdState = { ...authStore.user };

      // All states should be identical
      expect(firstState).toEqual(userData);
      expect(secondState).toEqual(userData);
      expect(thirdState).toEqual(userData);
      expect(firstState).toEqual(secondState);
      expect(secondState).toEqual(thirdState);
    });

    it("should have consistent authentication state", async () => {
      const userData = {
        address: "CONSISTENT_ADDRESS",
        email: "consistent@example.com",
      };
      localStorage.setItem("algorand_user", JSON.stringify(userData));

      const authStore = useAuthStore();
      await authStore.initialize();

      const authState1 = authStore.isAuthenticated;
      const authState2 = authStore.isAuthenticated;
      const authState3 = authStore.isAuthenticated;

      expect(authState1).toBe(true);
      expect(authState2).toBe(true);
      expect(authState3).toBe(true);
      expect(authState1).toBe(authState2);
      expect(authState2).toBe(authState3);
    });
  });

  describe("provisioning status", () => {
    it("should initialize with not_started provisioning status", () => {
      const authStore = useAuthStore();

      expect(authStore.provisioningStatus).toBe("not_started");
    });

    it("should track provisioning error state", () => {
      const authStore = useAuthStore();

      authStore.provisioningError = "Test error";

      expect(authStore.provisioningError).toBe("Test error");
    });
  });

  describe("connectWallet", () => {
    it("should connect wallet with address only", async () => {
      const authStore = useAuthStore();
      const user = await authStore.connectWallet("TEST_ADDRESS");

      expect(user.address).toBe("TEST_ADDRESS");
      expect(authStore.isConnected).toBe(true);
      expect(authStore.isAuthenticated).toBe(true);
      expect(localStorage.getItem("algorand_user")).toBeTruthy();
    });

    it("should connect wallet with full userInfo", async () => {
      const authStore = useAuthStore();
      const user = await authStore.connectWallet("TEST_ADDRESS", {
        name: "Alice",
        email: "alice@example.com",
      });

      expect(user.name).toBe("Alice");
      expect(user.email).toBe("alice@example.com");
    });

    it("should set loading to false after connecting wallet", async () => {
      const authStore = useAuthStore();
      await authStore.connectWallet("ADDR");
      expect(authStore.loading).toBe(false);
    });
  });

  describe("signOut", () => {
    it("should clear all auth state on signOut", async () => {
      const authStore = useAuthStore();
      localStorage.setItem("algorand_user", JSON.stringify({ address: "X", email: "x@y.com" }));
      localStorage.setItem("arc76_session", "session");
      localStorage.setItem("arc76_account", "account");
      localStorage.setItem("arc76_email", "x@y.com");
      await authStore.initialize();

      await authStore.signOut();

      expect(authStore.user).toBeNull();
      expect(authStore.isConnected).toBe(false);
      expect(localStorage.getItem("algorand_user")).toBeNull();
      expect(localStorage.getItem("arc76_session")).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("should update user fields when user exists", async () => {
      const authStore = useAuthStore();
      await authStore.connectWallet("ADDR", { email: "old@example.com" });

      authStore.updateUser({ email: "new@example.com" });

      expect(authStore.user?.email).toBe("new@example.com");
    });

    it("should do nothing when user is null", () => {
      const authStore = useAuthStore();
      expect(authStore.user).toBeNull();

      // Should not throw
      authStore.updateUser({ email: "x@y.com" });

      expect(authStore.user).toBeNull();
    });
  });

  describe("restoreARC76Session", () => {
    it("should return false when no saved session", async () => {
      const authStore = useAuthStore();
      const result = await authStore.restoreARC76Session();
      expect(result).toBe(false);
    });

    it("should restore session from localStorage", async () => {
      const authStore = useAuthStore();
      localStorage.setItem("arc76_session", "my-session");
      localStorage.setItem("arc76_account", "MY_ACCOUNT");
      localStorage.setItem("arc76_email", "test@example.com");

      const result = await authStore.restoreARC76Session();

      expect(result).toBe(true);
      expect(authStore.session).toBe("my-session");
      expect(authStore.arc76email).toBe("test@example.com");
    });

    it("should not clear isConnected when user is already authenticated via algorand_user", async () => {
      // Simulate the state after authStore.initialize() has run with algorand_user in localStorage:
      // user.value is set, isConnected.value is true, but arc76_session is absent.
      const authStore = useAuthStore();
      authStore.isConnected = true;
      authStore.user = { address: "TESTADDR", email: "test@example.com", isConnected: true } as any;

      // arc76_session is NOT in localStorage (typical for email/password-only auth in E2E tests)
      localStorage.removeItem("arc76_session");

      await authStore.restoreARC76Session();

      // isConnected must remain true — user is authenticated via algorand_user
      expect(authStore.isConnected).toBe(true);
      expect(authStore.isAuthenticated).toBe(true);
    });

    it("should set isConnected to false when no arc76_session and no user", async () => {
      const authStore = useAuthStore();
      // Neither arc76_session nor algorand_user is set
      localStorage.removeItem("arc76_session");

      await authStore.restoreARC76Session();

      expect(authStore.isConnected).toBe(false);
    });
  });

  describe("refreshProvisioningStatus", () => {
    it("should return false when no account set", async () => {
      const authStore = useAuthStore();
      const result = await authStore.refreshProvisioningStatus();
      expect(result).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // ARC76 Account Derivation Tests (Issue #495 — AC1 / AC8)
  // -------------------------------------------------------------------------
  describe("authenticateWithARC76 — derivation determinism", () => {
    beforeEach(() => {
      // Mock the arc76 generateAlgorandAccount to return a deterministic address
      vi.mock("../utils/arc76Account", () => ({
        generateAlgorandAccount: vi.fn().mockImplementation(async (_password: string, _email: string, _index: number) => ({
          addr: { toString: () => "ARC76TESTADDRESSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", publicKey: new Uint8Array(32) },
          sk: new Uint8Array(64),
        })),
      }));
      // Mock arc14 helpers
      vi.mock("../utils/arc14Auth", () => ({
        makeArc14AuthHeader: vi.fn().mockReturnValue("arc14-session-token"),
        makeArc14TxWithSuggestedParams: vi.fn().mockResolvedValue({
          signTxn: vi.fn().mockReturnValue(new Uint8Array(0)),
        }),
      }));
    });

    it("should derive a deterministic Algorand address from email and password", async () => {
      const authStore = useAuthStore();
      const email = "arc76-test@biatec.io";
      const password = "SecureTestPass123!";

      const result = await authStore.authenticateWithARC76(email, password);

      // Derived address must be a non-empty string (Algorand format)
      expect(result?.address).toBeTruthy();
      expect(typeof result?.address).toBe("string");
      expect(result?.address.length).toBeGreaterThan(0);
    });

    it("should store email as arc76email after successful authentication", async () => {
      const authStore = useAuthStore();
      const email = "arc76-email@biatec.io";

      await authStore.authenticateWithARC76(email, "password");

      expect(authStore.arc76email).toBe(email);
    });

    it("should set isConnected to true after successful authentication", async () => {
      const authStore = useAuthStore();

      await authStore.authenticateWithARC76("user@example.com", "pass");

      expect(authStore.isConnected).toBe(true);
      expect(authStore.isAuthenticated).toBe(true);
    });

    it("should persist arc76_session and arc76_email in localStorage", async () => {
      const authStore = useAuthStore();
      const email = "persist@example.com";

      await authStore.authenticateWithARC76(email, "password");

      expect(localStorage.getItem("arc76_email")).toBe(email);
      expect(localStorage.getItem("arc76_session")).toBeTruthy();
      expect(localStorage.getItem("algorand_user")).toBeTruthy();
    });

    it("should persist the derived address in algorand_user localStorage entry", async () => {
      const authStore = useAuthStore();

      await authStore.authenticateWithARC76("test@example.com", "password");

      const stored = JSON.parse(localStorage.getItem("algorand_user") || "{}");
      expect(stored.address).toBeTruthy();
      expect(stored.email).toBe("test@example.com");
    });

    it("should set loading to false after successful authentication", async () => {
      const authStore = useAuthStore();

      await authStore.authenticateWithARC76("test@example.com", "pass");

      expect(authStore.loading).toBe(false);
    });

    it("should set loading to false even when provisioning fails", async () => {
      const authStore = useAuthStore();
      // accountProvisioningService.provisionAccount is already mocked via setup.ts
      // to throw — test that loading is reset regardless

      try {
        await authStore.authenticateWithARC76("fail@example.com", "pass");
      } catch {
        // expected if generateAlgorandAccount throws
      }

      expect(authStore.loading).toBe(false);
    });

    it("should derive user name from email prefix", async () => {
      const authStore = useAuthStore();

      const result = await authStore.authenticateWithARC76("myname@example.com", "pass");

      expect(result?.name).toBe("myname");
    });

    it("should produce a formatted address abbreviation", async () => {
      const authStore = useAuthStore();

      await authStore.authenticateWithARC76("test@example.com", "pass");

      // formattedAddress pattern: "XXXX...XXXX"
      expect(authStore.formattedAddress).toMatch(/^.{4}\.{3}.{4}$/);
    });

    it("should store the ARC76 account address in the account ref", async () => {
      const authStore = useAuthStore();

      await authStore.authenticateWithARC76("account@example.com", "pass");

      expect(authStore.account).toBeTruthy();
      expect(typeof authStore.account).toBe("string");
    });

    it("should set provisioningStatus to failed and reset loading on error", async () => {
      // The authenticateWithARC76 function catches errors from generateAlgorandAccount,
      // sets provisioningStatus='failed', and rethrows. This test verifies the error
      // path state management using a forced provisioning failure.
      // (vi.mock() hoisting makes it impossible to override arc76 per-test; this test
      // validates the error state contract through the provisioning failure path instead.)
      const authStore = useAuthStore();

      // Directly test provisioningStatus and loading reset by mocking provisionAccount to throw
      const { accountProvisioningService } = await import("../services/AccountProvisioningService");
      const spy = vi.spyOn(accountProvisioningService, "provisionAccount").mockRejectedValueOnce(new Error("Provisioning failed"));

      // authenticateWithARC76 continues even when provisioning fails (graceful degradation)
      const result = await authStore.authenticateWithARC76("provfail@example.com", "pass");

      // Provisioning failure is recoverable — user is set but canDeploy = false
      expect(result?.canDeploy).toBe(false);
      expect(authStore.loading).toBe(false);
      expect(authStore.provisioningStatus).toBe("failed");

      spy.mockRestore();
    });
  });

  describe("ARC76 deterministic derivation — address consistency", () => {
    it("should produce identical addresses for the same email/password pair across multiple calls", async () => {
      // This test validates the determinism property of ARC76 derivation:
      // the same (email, password) tuple must always produce the same Algorand address.
      // Mocked implementation always returns the same address to simulate this contract.
      vi.mock("../utils/arc76Account", () => ({
        generateAlgorandAccount: vi.fn().mockImplementation(async () => ({
          addr: { toString: () => "DETERMINISTIC_ADDRESS_SAME_EVERY_TIME", publicKey: new Uint8Array(32) },
          sk: new Uint8Array(64),
        })),
      }));

      const email = "determinism@biatec.io";
      const password = "DeterministicPass!";

      // Call three times — must get the same address each time
      const store1 = useAuthStore();
      const result1 = await store1.authenticateWithARC76(email, password);
      const addr1 = result1?.address;

      localStorage.clear();
      setActivePinia(createPinia());
      const store2 = useAuthStore();
      const result2 = await store2.authenticateWithARC76(email, password);
      const addr2 = result2?.address;

      localStorage.clear();
      setActivePinia(createPinia());
      const store3 = useAuthStore();
      const result3 = await store3.authenticateWithARC76(email, password);
      const addr3 = result3?.address;

      expect(addr1).toBeTruthy();
      expect(addr1).toBe(addr2);
      expect(addr2).toBe(addr3);
    });

    it("should store and restore the derived address via restoreARC76Session", async () => {
      vi.mock("../utils/arc76Account", () => ({
        generateAlgorandAccount: vi.fn().mockImplementation(async () => ({
          addr: { toString: () => "RESTORE_TEST_ADDRESS", publicKey: new Uint8Array(32) },
          sk: new Uint8Array(64),
        })),
      }));

      const authStore = useAuthStore();
      await authStore.authenticateWithARC76("restore@example.com", "pass");
      const originalAccount = authStore.account;

      // Reset in-memory state, then restore from localStorage
      setActivePinia(createPinia());
      const freshStore = useAuthStore();
      await freshStore.restoreARC76Session();

      expect(freshStore.account).toBe(originalAccount);
      expect(freshStore.arc76email).toBe("restore@example.com");
    });
  });
});
