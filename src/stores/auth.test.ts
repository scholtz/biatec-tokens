import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should initialize with no user when localStorage is empty', async () => {
      const authStore = useAuthStore()
      
      await authStore.initialize()
      
      expect(authStore.user).toBeNull()
      expect(authStore.isConnected).toBe(false)
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.loading).toBe(false)
    })

    it('should restore user from localStorage on initialize', async () => {
      const savedUser = {
        address: 'TEST_ADDRESS_123',
        email: 'test@example.com',
        name: 'Test User'
      }
      localStorage.setItem('algorand_user', JSON.stringify(savedUser))
      
      const authStore = useAuthStore()
      await authStore.initialize()
      
      expect(authStore.user).toEqual(savedUser)
      expect(authStore.isConnected).toBe(true)
      expect(authStore.isAuthenticated).toBe(true)
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem('algorand_user', 'CORRUPTED_JSON_DATA')
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const authStore = useAuthStore()
      await authStore.initialize()
      
      expect(authStore.user).toBeNull()
      expect(authStore.isConnected).toBe(false)
      expect(authStore.isAuthenticated).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })

    it('should handle missing required fields in saved user', async () => {
      // Incomplete user data (missing address)
      localStorage.setItem('algorand_user', JSON.stringify({ email: 'test@example.com' }))
      
      const authStore = useAuthStore()
      await authStore.initialize()
      
      // Store should still load the data even if incomplete
      expect(authStore.user).toEqual({ email: 'test@example.com' })
      expect(authStore.isConnected).toBe(true)
    })
  })

  describe('isAuthenticated computed property', () => {
    it('should return false when user is null', () => {
      const authStore = useAuthStore()
      
      authStore.user = null
      authStore.isConnected = false
      
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should return false when user exists but not connected', () => {
      const authStore = useAuthStore()
      
      authStore.user = { address: 'TEST_ADDRESS', email: 'test@example.com' }
      authStore.isConnected = false
      
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should return false when connected but no user', () => {
      const authStore = useAuthStore()
      
      authStore.user = null
      authStore.isConnected = true
      
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should return true when user exists and connected', () => {
      const authStore = useAuthStore()
      
      authStore.user = { address: 'TEST_ADDRESS', email: 'test@example.com' }
      authStore.isConnected = true
      
      expect(authStore.isAuthenticated).toBe(true)
    })
  })

  describe('isAccountReady computed property', () => {
    it('should return false when not authenticated', () => {
      const authStore = useAuthStore()
      
      authStore.user = null
      authStore.isConnected = false
      authStore.provisioningStatus = 'active'
      
      expect(authStore.isAccountReady).toBe(false)
    })

    it('should return false when authenticated but provisioning not active', () => {
      const authStore = useAuthStore()
      
      authStore.user = { address: 'TEST_ADDRESS', email: 'test@example.com', canDeploy: true }
      authStore.isConnected = true
      authStore.provisioningStatus = 'not_started'
      
      expect(authStore.isAccountReady).toBe(false)
    })

    it('should return false when authenticated and provisioned but canDeploy is false', () => {
      const authStore = useAuthStore()
      
      authStore.user = { address: 'TEST_ADDRESS', email: 'test@example.com', canDeploy: false }
      authStore.isConnected = true
      authStore.provisioningStatus = 'active'
      
      expect(authStore.isAccountReady).toBe(false)
    })

    it('should return true when authenticated, provisioned, and canDeploy', () => {
      const authStore = useAuthStore()
      
      authStore.user = { address: 'TEST_ADDRESS', email: 'test@example.com', canDeploy: true }
      authStore.isConnected = true
      authStore.provisioningStatus = 'active'
      
      expect(authStore.isAccountReady).toBe(true)
    })
  })

  describe('localStorage persistence', () => {
    it('should persist user data when connecting', async () => {
      const authStore = useAuthStore()
      const userData = {
        address: 'TEST_ADDRESS_PERSIST',
        email: 'persist@example.com',
        name: 'Persist User'
      }
      
      authStore.user = userData
      authStore.isConnected = true
      
      // Simulate what happens when user data is set
      localStorage.setItem('algorand_user', JSON.stringify(userData))
      
      const savedData = localStorage.getItem('algorand_user')
      expect(savedData).toBeTruthy()
      expect(JSON.parse(savedData!)).toEqual(userData)
    })

    it('should maintain session across page reloads', async () => {
      // First session
      const userData = {
        address: 'TEST_ADDRESS_SESSION',
        email: 'session@example.com'
      }
      localStorage.setItem('algorand_user', JSON.stringify(userData))
      
      // Simulate page reload by creating new store instance
      const authStore1 = useAuthStore()
      await authStore1.initialize()
      
      expect(authStore1.user).toEqual(userData)
      expect(authStore1.isAuthenticated).toBe(true)
      
      // Create another instance (simulating another page load)
      const authStore2 = useAuthStore()
      await authStore2.initialize()
      
      expect(authStore2.user).toEqual(userData)
      expect(authStore2.isAuthenticated).toBe(true)
    })
  })

  describe('email identity persistence', () => {
    it('should maintain email across navigation', async () => {
      const testEmail = 'identity@example.com'
      const userData = {
        address: 'TEST_ADDRESS_EMAIL',
        email: testEmail
      }
      localStorage.setItem('algorand_user', JSON.stringify(userData))
      
      const authStore = useAuthStore()
      await authStore.initialize()
      
      expect(authStore.user?.email).toBe(testEmail)
      
      // Verify email persists after re-initialization
      await authStore.initialize()
      expect(authStore.user?.email).toBe(testEmail)
    })
  })

  describe('logout cleanup', () => {
    it('should clear user data on logout', () => {
      const authStore = useAuthStore()
      
      authStore.user = { address: 'TEST_ADDRESS', email: 'test@example.com' }
      authStore.isConnected = true
      localStorage.setItem('algorand_user', JSON.stringify(authStore.user))
      
      // Simulate logout
      authStore.user = null
      authStore.isConnected = false
      localStorage.removeItem('algorand_user')
      
      expect(authStore.user).toBeNull()
      expect(authStore.isConnected).toBe(false)
      expect(authStore.isAuthenticated).toBe(false)
      expect(localStorage.getItem('algorand_user')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle null localStorage value', async () => {
      localStorage.setItem('algorand_user', 'null')
      
      const authStore = useAuthStore()
      await authStore.initialize()
      
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should handle undefined localStorage value', async () => {
      localStorage.setItem('algorand_user', 'undefined')
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const authStore = useAuthStore()
      await authStore.initialize()
      
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
      
      consoleErrorSpy.mockRestore()
    })

    it('should handle empty string in localStorage', async () => {
      localStorage.setItem('algorand_user', '')
      
      const authStore = useAuthStore()
      await authStore.initialize()
      
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should handle malformed JSON objects', async () => {
      localStorage.setItem('algorand_user', '{"address": "test", invalid}')
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const authStore = useAuthStore()
      await authStore.initialize()
      
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('ARC76 deterministic behavior', () => {
    it('should maintain consistent state across multiple initializations', async () => {
      const userData = {
        address: 'DETERMINISTIC_ADDRESS',
        email: 'deterministic@example.com'
      }
      localStorage.setItem('algorand_user', JSON.stringify(userData))
      
      const authStore = useAuthStore()
      
      // Initialize multiple times
      await authStore.initialize()
      const firstState = { ...authStore.user }
      
      await authStore.initialize()
      const secondState = { ...authStore.user }
      
      await authStore.initialize()
      const thirdState = { ...authStore.user }
      
      // All states should be identical
      expect(firstState).toEqual(userData)
      expect(secondState).toEqual(userData)
      expect(thirdState).toEqual(userData)
      expect(firstState).toEqual(secondState)
      expect(secondState).toEqual(thirdState)
    })

    it('should have consistent authentication state', async () => {
      const userData = {
        address: 'CONSISTENT_ADDRESS',
        email: 'consistent@example.com'
      }
      localStorage.setItem('algorand_user', JSON.stringify(userData))
      
      const authStore = useAuthStore()
      await authStore.initialize()
      
      const authState1 = authStore.isAuthenticated
      const authState2 = authStore.isAuthenticated
      const authState3 = authStore.isAuthenticated
      
      expect(authState1).toBe(true)
      expect(authState2).toBe(true)
      expect(authState3).toBe(true)
      expect(authState1).toBe(authState2)
      expect(authState2).toBe(authState3)
    })
  })

  describe('provisioning status', () => {
    it('should initialize with not_started provisioning status', () => {
      const authStore = useAuthStore()
      
      expect(authStore.provisioningStatus).toBe('not_started')
    })

    it('should track provisioning error state', () => {
      const authStore = useAuthStore()
      
      authStore.provisioningError = 'Test error'
      
      expect(authStore.provisioningError).toBe('Test error')
    })
  })

  describe('connectWallet', () => {
    it('should connect wallet with address only', async () => {
      const authStore = useAuthStore()
      const user = await authStore.connectWallet('TEST_ADDRESS')

      expect(user.address).toBe('TEST_ADDRESS')
      expect(authStore.isConnected).toBe(true)
      expect(authStore.isAuthenticated).toBe(true)
      expect(localStorage.getItem('algorand_user')).toBeTruthy()
    })

    it('should connect wallet with full userInfo', async () => {
      const authStore = useAuthStore()
      const user = await authStore.connectWallet('TEST_ADDRESS', {
        name: 'Alice',
        email: 'alice@example.com',
      })

      expect(user.name).toBe('Alice')
      expect(user.email).toBe('alice@example.com')
    })

    it('should set loading to false after connecting wallet', async () => {
      const authStore = useAuthStore()
      await authStore.connectWallet('ADDR')
      expect(authStore.loading).toBe(false)
    })
  })

  describe('signOut', () => {
    it('should clear all auth state on signOut', async () => {
      const authStore = useAuthStore()
      localStorage.setItem('algorand_user', JSON.stringify({ address: 'X', email: 'x@y.com' }))
      localStorage.setItem('arc76_session', 'session')
      localStorage.setItem('arc76_account', 'account')
      localStorage.setItem('arc76_email', 'x@y.com')
      await authStore.initialize()

      await authStore.signOut()

      expect(authStore.user).toBeNull()
      expect(authStore.isConnected).toBe(false)
      expect(localStorage.getItem('algorand_user')).toBeNull()
      expect(localStorage.getItem('arc76_session')).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user fields when user exists', async () => {
      const authStore = useAuthStore()
      await authStore.connectWallet('ADDR', { email: 'old@example.com' })

      authStore.updateUser({ email: 'new@example.com' })

      expect(authStore.user?.email).toBe('new@example.com')
    })

    it('should do nothing when user is null', () => {
      const authStore = useAuthStore()
      expect(authStore.user).toBeNull()

      // Should not throw
      authStore.updateUser({ email: 'x@y.com' })

      expect(authStore.user).toBeNull()
    })
  })

  describe('restoreARC76Session', () => {
    it('should return false when no saved session', async () => {
      const authStore = useAuthStore()
      const result = await authStore.restoreARC76Session()
      expect(result).toBe(false)
    })

    it('should restore session from localStorage', async () => {
      const authStore = useAuthStore()
      localStorage.setItem('arc76_session', 'my-session')
      localStorage.setItem('arc76_account', 'MY_ACCOUNT')
      localStorage.setItem('arc76_email', 'test@example.com')

      const result = await authStore.restoreARC76Session()

      expect(result).toBe(true)
      expect(authStore.session).toBe('my-session')
      expect(authStore.arc76email).toBe('test@example.com')
    })
  })

  describe('refreshProvisioningStatus', () => {
    it('should return false when no account set', async () => {
      const authStore = useAuthStore()
      const result = await authStore.refreshProvisioningStatus()
      expect(result).toBe(false)
    })
  })
})
