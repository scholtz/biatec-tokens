import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AlgorandUser {
  address: string
  name?: string
  email?: string
  avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AlgorandUser | null>(null)
  const loading = ref(false)
  const isConnected = ref(false)
  // ARC76 email for email/password authentication
  const arc76email = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && isConnected.value)

  const initialize = async () => {
    loading.value = true
    try {
      // Check if user was previously connected
      const savedUser = localStorage.getItem('algorand_user')
      if (savedUser) {
        user.value = JSON.parse(savedUser)
        isConnected.value = true
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      loading.value = false
    }
  }

  const connectWallet = async (walletAddress: string, userInfo?: Partial<AlgorandUser>) => {
    loading.value = true
    try {
      const newUser: AlgorandUser = {
        address: walletAddress,
        name: userInfo?.name || `User ${walletAddress.slice(0, 6)}...`,
        email: userInfo?.email,
        avatar: userInfo?.avatar
      }
      
      user.value = newUser
      isConnected.value = true
      
      // Save to localStorage
      localStorage.setItem('algorand_user', JSON.stringify(newUser))
      
      return newUser
    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    user.value = null
    isConnected.value = false
    arc76email.value = null
    localStorage.removeItem('algorand_user')
    localStorage.removeItem('wallet_connected')
    localStorage.removeItem('arc76_session')
  }

  const updateUser = (updates: Partial<AlgorandUser>) => {
    if (user.value) {
      user.value = { ...user.value, ...updates }
      localStorage.setItem('algorand_user', JSON.stringify(user.value))
    }
  }

  /**
   * Authenticate with email/password using ARC76
   * This is the primary authentication method for the platform
   */
  const authenticateWithARC76 = async (email: string, account: string) => {
    loading.value = true
    try {
      // Create user from ARC76 authentication
      const newUser: AlgorandUser = {
        address: account,
        name: email.split('@')[0], // Use email prefix as name
        email: email,
      }
      
      user.value = newUser
      isConnected.value = true
      arc76email.value = email
      
      // Save to localStorage
      localStorage.setItem('algorand_user', JSON.stringify(newUser))
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('arc76_session', JSON.stringify({
        email,
        account,
        timestamp: Date.now()
      }))
      
      return newUser
    } catch (error) {
      console.error('Error authenticating with ARC76:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Restore ARC76 session from localStorage
   */
  const restoreARC76Session = async () => {
    try {
      const savedSession = localStorage.getItem('arc76_session')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        await authenticateWithARC76(session.email, session.account)
        return true
      }
      return false
    } catch (error) {
      console.error('Error restoring ARC76 session:', error)
      return false
    }
  }

  return {
    user,
    loading,
    isConnected,
    isAuthenticated,
    arc76email,
    initialize,
    connectWallet,
    signOut,
    updateUser,
    authenticateWithARC76,
    restoreARC76Session
  }
})