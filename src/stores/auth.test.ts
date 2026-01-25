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
});
