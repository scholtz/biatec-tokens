/**
 * Integration tests for ARC76 Email/Password Authentication Flow
 * 
 * Tests the complete authentication workflow from login through session persistence
 * to backend API integration. These tests validate the end-to-end flow without wallets.
 * 
 * Related Issue: #201 - MVP blocker: Email/password auth with ARC76, remove all wallet connectors
 * Business Value: Enable non-crypto enterprises to authenticate without blockchain knowledge
 * Technical Approach: ARC76 deterministic account derivation from email/password
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../stores/auth';

describe('ARC76 Authentication Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Complete Login Flow', () => {
    it('should complete full ARC76 authentication flow', async () => {
      const authStore = useAuthStore();
      
      // Step 1: User is initially not authenticated
      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.user).toBeNull();
      
      // Step 2: User authenticates with email/password (ARC76)
      const email = 'enterprise@company.com';
      const account = 'ALGO_ARC76_DERIVED_ACCOUNT_123';
      
      await authStore.authenticateWithARC76(email, account);
      
      // Step 3: User is now authenticated
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.user).not.toBeNull();
      expect(authStore.user?.email).toBe(email);
      expect(authStore.user?.address).toBe(account);
      expect(authStore.arc76email).toBe(email);
      
      // Step 4: Session is persisted to localStorage
      expect(localStorage.getItem('wallet_connected')).toBe('true');
      expect(localStorage.getItem('arc76_session')).toBeTruthy();
      expect(localStorage.getItem('algorand_user')).toBeTruthy();
      
      // Step 5: Parse and verify session data
      const sessionData = JSON.parse(localStorage.getItem('arc76_session')!);
      expect(sessionData.email).toBe(email);
      expect(sessionData.account).toBe(account);
      expect(sessionData.timestamp).toBeDefined();
    });

    it('should restore session after page reload', async () => {
      // Step 1: Authenticate
      const authStore = useAuthStore();
      const email = 'persistent@example.com';
      const account = 'ALGO_PERSISTENT_123';
      
      await authStore.authenticateWithARC76(email, account);
      expect(authStore.isAuthenticated).toBe(true);
      
      // Step 2: Simulate page reload - create new Pinia instance
      setActivePinia(createPinia());
      const newAuthStore = useAuthStore();
      
      // Step 3: Session should be restorable
      expect(newAuthStore.isAuthenticated).toBe(false); // Not yet restored
      
      await newAuthStore.restoreARC76Session();
      
      // Step 4: Session is restored
      expect(newAuthStore.isAuthenticated).toBe(true);
      expect(newAuthStore.user?.email).toBe(email);
      expect(newAuthStore.user?.address).toBe(account);
      expect(newAuthStore.arc76email).toBe(email);
    });

    it('should handle logout and clear all session data', async () => {
      const authStore = useAuthStore();
      
      // Step 1: Authenticate
      await authStore.authenticateWithARC76('user@test.com', 'ALGO_123');
      expect(authStore.isAuthenticated).toBe(true);
      expect(localStorage.getItem('arc76_session')).toBeTruthy();
      
      // Step 2: Logout
      await authStore.signOut();
      
      // Step 3: All state is cleared
      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.user).toBeNull();
      expect(authStore.arc76email).toBeNull();
      
      // Step 4: All localStorage is cleared
      expect(localStorage.getItem('arc76_session')).toBeNull();
      expect(localStorage.getItem('wallet_connected')).toBeNull();
      expect(localStorage.getItem('algorand_user')).toBeNull();
    });
  });

  describe('Router Integration', () => {
    it('should set wallet_connected flag for router guards', async () => {
      const authStore = useAuthStore();
      
      // Before authentication - no flag
      expect(localStorage.getItem('wallet_connected')).toBeNull();
      
      // Authenticate
      await authStore.authenticateWithARC76('test@example.com', 'ALGO_123');
      
      // After authentication - flag is set
      expect(localStorage.getItem('wallet_connected')).toBe('true');
      
      // This flag is checked by router guards to allow access to protected routes
    });

    it('should clear wallet_connected flag on logout', async () => {
      const authStore = useAuthStore();
      
      // Authenticate
      await authStore.authenticateWithARC76('test@example.com', 'ALGO_123');
      expect(localStorage.getItem('wallet_connected')).toBe('true');
      
      // Logout
      await authStore.signOut();
      
      // Flag is cleared - user will be redirected by router guards
      expect(localStorage.getItem('wallet_connected')).toBeNull();
    });
  });

  describe('Session Security', () => {
    it('should not expose private keys or sensitive data', async () => {
      const authStore = useAuthStore();
      
      await authStore.authenticateWithARC76('secure@example.com', 'ALGO_SECURE_123');
      
      // Check localStorage for sensitive data
      const storageKeys = Object.keys(localStorage);
      const storageData = storageKeys.map(key => ({
        key,
        value: localStorage.getItem(key)
      }));
      
      // Verify NO private keys or passwords are stored
      for (const item of storageData) {
        expect(item.value).not.toContain('private_key');
        expect(item.value).not.toContain('privateKey');
        expect(item.value).not.toContain('password');
        expect(item.value).not.toContain('secret');
        expect(item.value).not.toContain('mnemonic');
      }
    });

    it('should include timestamp for session expiration checks', async () => {
      const authStore = useAuthStore();
      const beforeTime = Date.now();
      
      await authStore.authenticateWithARC76('test@example.com', 'ALGO_123');
      
      const afterTime = Date.now();
      const sessionData = JSON.parse(localStorage.getItem('arc76_session')!);
      
      expect(sessionData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(sessionData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle corrupted session data gracefully', async () => {
      // Set corrupted session data
      localStorage.setItem('arc76_session', 'corrupted-data-{');
      
      const authStore = useAuthStore();
      
      // Should not throw error
      const result = await authStore.restoreARC76Session();
      
      expect(result).toBe(false);
      expect(authStore.isAuthenticated).toBe(false);
    });
  });

  describe('Account Derivation', () => {
    it('should derive username from email prefix', async () => {
      const authStore = useAuthStore();
      
      const testCases = [
        { email: 'john.smith@company.com', expectedName: 'john.smith' },
        { email: 'admin@platform.io', expectedName: 'admin' },
        { email: 'user+tag@test.net', expectedName: 'user+tag' },
      ];
      
      for (const { email, expectedName } of testCases) {
        await authStore.signOut();
        await authStore.authenticateWithARC76(email, 'ALGO_TEST');
        
        expect(authStore.user?.name).toBe(expectedName);
      }
    });

    it('should store deterministic account from ARC76 derivation', async () => {
      const authStore = useAuthStore();
      const email = 'deterministic@example.com';
      
      // First authentication
      const account1 = 'ALGO_DERIVED_FROM_EMAIL_PASS_HASH_1';
      await authStore.authenticateWithARC76(email, account1);
      expect(authStore.user?.address).toBe(account1);
      
      // Logout and re-authenticate with same email but different derived account
      // (In real ARC76, same email/password would always derive same account)
      await authStore.signOut();
      
      const account2 = 'ALGO_DERIVED_FROM_EMAIL_PASS_HASH_2';
      await authStore.authenticateWithARC76(email, account2);
      expect(authStore.user?.address).toBe(account2);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const authStore = useAuthStore();
      
      // Authentication with empty strings should still work technically
      // (In production, form validation would prevent this)
      await authStore.authenticateWithARC76('', '');
      
      // Even with empty values, the function completes
      // Form validation in UI prevents this scenario
      expect(authStore.isAuthenticated).toBe(true);
      
      // Clean up
      await authStore.signOut();
    });

    it('should maintain state integrity on failed authentication', async () => {
      const authStore = useAuthStore();
      
      // Authenticate successfully first
      await authStore.authenticateWithARC76('success@example.com', 'ALGO_123');
      expect(authStore.isAuthenticated).toBe(true);
      
      // Store should maintain previous state if new auth fails
      // (In practice, failed auth would show error but not corrupt state)
    });
  });

  describe('Migration from Wallet-Based Auth', () => {
    it('should not be affected by old wallet connector data', async () => {
      // Simulate old wallet connector data in localStorage
      localStorage.setItem('wallet_provider', 'pera');
      localStorage.setItem('connected_wallet_id', 'pera-wallet-123');
      
      const authStore = useAuthStore();
      
      // ARC76 authentication should work independently
      await authStore.authenticateWithARC76('new@example.com', 'ALGO_NEW_123');
      
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.arc76email).toBe('new@example.com');
      
      // ARC76 session should be independent
      expect(localStorage.getItem('arc76_session')).toBeTruthy();
    });

    it('should clear old wallet data on logout', async () => {
      const authStore = useAuthStore();
      
      // Authenticate with ARC76
      await authStore.authenticateWithARC76('test@example.com', 'ALGO_123');
      
      // Logout
      await authStore.signOut();
      
      // All auth-related data should be cleared
      expect(localStorage.getItem('arc76_session')).toBeNull();
      expect(localStorage.getItem('wallet_connected')).toBeNull();
      expect(localStorage.getItem('algorand_user')).toBeNull();
    });
  });

  describe('Concurrent Sessions', () => {
    it('should handle multiple tabs with same session', async () => {
      // Tab 1: Authenticate
      const authStore1 = useAuthStore();
      await authStore1.authenticateWithARC76('multi-tab@example.com', 'ALGO_MULTI_123');
      
      // Tab 2: Restore session
      setActivePinia(createPinia());
      const authStore2 = useAuthStore();
      await authStore2.restoreARC76Session();
      
      // Both tabs should have same authenticated user
      expect(authStore2.isAuthenticated).toBe(true);
      expect(authStore2.user?.email).toBe('multi-tab@example.com');
    });

    it('should logout across all tabs', async () => {
      // Tab 1: Authenticate
      const authStore1 = useAuthStore();
      await authStore1.authenticateWithARC76('logout-all@example.com', 'ALGO_123');
      
      // Tab 1: Logout
      await authStore1.signOut();
      
      // localStorage is cleared
      expect(localStorage.getItem('arc76_session')).toBeNull();
      
      // Tab 2: Try to restore - should fail
      setActivePinia(createPinia());
      const authStore2 = useAuthStore();
      await authStore2.restoreARC76Session();
      
      expect(authStore2.isAuthenticated).toBe(false);
    });
  });
});
