import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth';

describe('Auth Store', () => {
  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should initialize with null user and not connected', () => {
    const store = useAuthStore();
    
    expect(store.user).toBeNull();
    expect(store.isConnected).toBe(false);
    expect(store.isAuthenticated).toBe(false);
  });

  it('should connect wallet with valid address', async () => {
    const store = useAuthStore();
    const walletAddress = 'ALGO123456789ABCDEF';
    
    await store.connectWallet(walletAddress);
    
    expect(store.user).not.toBeNull();
    expect(store.user?.address).toBe(walletAddress);
    expect(store.isConnected).toBe(true);
    expect(store.isAuthenticated).toBe(true);
  });

  it('should save user to localStorage on connect', async () => {
    const store = useAuthStore();
    const walletAddress = 'ALGO123456789ABCDEF';
    
    await store.connectWallet(walletAddress);
    
    const savedData = localStorage.getItem('algorand_user');
    expect(savedData).toBeTruthy();
    expect(savedData).toContain(walletAddress);
  });

  it('should sign out and clear state', async () => {
    const store = useAuthStore();
    
    // First connect
    await store.connectWallet('ALGO123456789ABCDEF');
    expect(store.isAuthenticated).toBe(true);
    
    // Then sign out
    await store.signOut();
    
    expect(store.user).toBeNull();
    expect(store.isConnected).toBe(false);
    expect(store.isAuthenticated).toBe(false);
  });

  it('should initialize from localStorage if user was saved', async () => {
    const savedUser = {
      address: 'ALGO123456789ABCDEF',
      name: 'Test User',
    };
    
    localStorage.setItem('algorand_user', JSON.stringify(savedUser));
    
    const store = useAuthStore();
    await store.initialize();
    
    expect(store.user).toEqual(savedUser);
    expect(store.isConnected).toBe(true);
    expect(store.isAuthenticated).toBe(true);
  });

  it('should update user information', async () => {
    const store = useAuthStore();
    await store.connectWallet('ALGO123456789ABCDEF');
    
    store.updateUser({ name: 'Updated Name', email: 'test@example.com' });
    
    expect(store.user?.name).toBe('Updated Name');
    expect(store.user?.email).toBe('test@example.com');
  });

  describe('Session Persistence', () => {
    it('should persist wallet connection state across page reloads', async () => {
      const store = useAuthStore();
      const walletAddress = 'ALGO123456789ABCDEF';
      
      // Connect wallet
      await store.connectWallet(walletAddress);
      
      // Verify state is saved
      expect(localStorage.getItem('algorand_user')).toBeTruthy();
      
      // Simulate page reload by creating new store instance
      setActivePinia(createPinia());
      const newStore = useAuthStore();
      await newStore.initialize();
      
      // Verify state is restored
      expect(newStore.user?.address).toBe(walletAddress);
      expect(newStore.isConnected).toBe(true);
      expect(newStore.isAuthenticated).toBe(true);
    });

    it('should persist network selection with wallet connection', async () => {
      // Set network before connecting wallet
      localStorage.setItem('selected_network', 'voi-mainnet');
      
      const store = useAuthStore();
      await store.connectWallet('ALGO123456789ABCDEF');
      
      // Simulate page reload
      setActivePinia(createPinia());
      const newStore = useAuthStore();
      await newStore.initialize();
      
      // Verify both wallet and network persisted
      expect(newStore.isAuthenticated).toBe(true);
      expect(localStorage.getItem('selected_network')).toBe('voi-mainnet');
    });

    it('should clear session on sign out', async () => {
      const store = useAuthStore();
      
      // Set up connected state with network
      localStorage.setItem('selected_network', 'aramidmain');
      await store.connectWallet('ALGO123456789ABCDEF');
      
      // Sign out
      await store.signOut();
      
      // Verify only algorand_user is cleared, not network preference
      expect(localStorage.getItem('algorand_user')).toBeNull();
      expect(localStorage.getItem('selected_network')).toBe('aramidmain');
    });

    it('should handle corrupted session data gracefully', async () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('algorand_user', 'invalid-json-{');
      
      const store = useAuthStore();
      await store.initialize();
      
      // Should not crash, should have no user
      expect(store.user).toBeNull();
      expect(store.isConnected).toBe(false);
    });
  });

  describe('ARC76 Authentication', () => {
    it('should authenticate with email and password using ARC76', async () => {
      const store = useAuthStore();
      const email = 'test@example.com';
      const account = 'ALGO123456789ABCDEF';
      
      await store.authenticateWithARC76(email, account);
      
      expect(store.user).not.toBeNull();
      expect(store.user?.address).toBe(account);
      expect(store.user?.email).toBe(email);
      expect(store.user?.name).toBe('test'); // Email prefix
      expect(store.arc76email).toBe(email);
      expect(store.isConnected).toBe(true);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should persist ARC76 session to localStorage', async () => {
      const store = useAuthStore();
      const email = 'user@company.com';
      const account = 'ALGO987654321FEDCBA';
      
      await store.authenticateWithARC76(email, account);
      
      // Verify all required localStorage keys are set
      expect(localStorage.getItem('algorand_user')).toBeTruthy();
      expect(localStorage.getItem('wallet_connected')).toBe('true');
      
      const arc76Session = localStorage.getItem('arc76_session');
      expect(arc76Session).toBeTruthy();
      
      const session = JSON.parse(arc76Session!);
      expect(session.email).toBe(email);
      expect(session.account).toBe(account);
      expect(session.timestamp).toBeDefined();
    });

    it('should restore ARC76 session from localStorage', async () => {
      const email = 'restored@example.com';
      const account = 'ALGO111222333444555';
      const timestamp = Date.now();
      
      // Simulate saved session
      localStorage.setItem('arc76_session', JSON.stringify({
        email,
        account,
        timestamp
      }));
      localStorage.setItem('wallet_connected', 'true');
      
      const store = useAuthStore();
      await store.restoreARC76Session();
      
      expect(store.user).not.toBeNull();
      expect(store.user?.address).toBe(account);
      expect(store.user?.email).toBe(email);
      expect(store.arc76email).toBe(email);
      expect(store.isConnected).toBe(true);
    });

    it('should clear ARC76 session on sign out', async () => {
      const store = useAuthStore();
      
      // First authenticate with ARC76
      await store.authenticateWithARC76('test@example.com', 'ALGO123456789');
      expect(localStorage.getItem('arc76_session')).toBeTruthy();
      expect(localStorage.getItem('wallet_connected')).toBe('true');
      
      // Sign out
      await store.signOut();
      
      // Verify all ARC76 data is cleared
      expect(store.arc76email).toBeNull();
      expect(localStorage.getItem('arc76_session')).toBeNull();
      expect(localStorage.getItem('wallet_connected')).toBeNull();
      expect(localStorage.getItem('algorand_user')).toBeNull();
    });

    it('should handle restore with missing session gracefully', async () => {
      // No session in localStorage
      const store = useAuthStore();
      await store.restoreARC76Session();
      
      // Should not crash, should have no user
      expect(store.user).toBeNull();
      expect(store.arc76email).toBeNull();
      expect(store.isConnected).toBe(false);
    });

    it('should handle corrupted ARC76 session data', async () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('arc76_session', 'invalid-json-{');
      
      const store = useAuthStore();
      await store.restoreARC76Session();
      
      // Should not crash
      expect(store.user).toBeNull();
      expect(store.isConnected).toBe(false);
    });

    it('should derive user name from email prefix', async () => {
      const store = useAuthStore();
      const testCases = [
        { email: 'john.doe@company.com', expectedName: 'john.doe' },
        { email: 'admin@platform.io', expectedName: 'admin' },
        { email: 'user123@test.net', expectedName: 'user123' },
      ];
      
      for (const { email, expectedName } of testCases) {
        await store.signOut();
        await store.authenticateWithARC76(email, 'ALGO123456789');
        expect(store.user?.name).toBe(expectedName);
      }
    });

    it('should maintain session across page reloads', async () => {
      const store = useAuthStore();
      const email = 'persistent@example.com';
      const account = 'ALGO999888777666555';
      
      // Authenticate
      await store.authenticateWithARC76(email, account);
      
      // Simulate page reload by creating new store instance
      setActivePinia(createPinia());
      const newStore = useAuthStore();
      await newStore.restoreARC76Session();
      
      // Verify session is restored
      expect(newStore.user?.address).toBe(account);
      expect(newStore.user?.email).toBe(email);
      expect(newStore.arc76email).toBe(email);
      expect(newStore.isAuthenticated).toBe(true);
    });

    it('should set wallet_connected flag for router guards', async () => {
      const store = useAuthStore();
      
      // Before authentication
      expect(localStorage.getItem('wallet_connected')).toBeNull();
      
      // Authenticate
      await store.authenticateWithARC76('test@example.com', 'ALGO123456789');
      
      // After authentication - flag should be set for router guards
      expect(localStorage.getItem('wallet_connected')).toBe('true');
    });

    it('should handle deterministic account generation', async () => {
      const store = useAuthStore();
      const email = 'deterministic@example.com';
      const account1 = 'ALGO_DERIVED_123';
      const account2 = 'ALGO_DERIVED_456';
      
      // Authenticate with first account
      await store.authenticateWithARC76(email, account1);
      expect(store.user?.address).toBe(account1);
      
      // Re-authenticate with same email but different account
      // (simulating re-derivation)
      await store.signOut();
      await store.authenticateWithARC76(email, account2);
      expect(store.user?.address).toBe(account2);
    });
  });
});
