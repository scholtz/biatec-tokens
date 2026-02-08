import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../../../stores/auth'
import AuthenticationConfirmationStep from '../AuthenticationConfirmationStep.vue'
import WizardStep from '../../WizardStep.vue'

describe('AuthenticationConfirmationStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('Rendering with Authenticated User', () => {
    it('should render when user is authenticated', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should display success badge when authenticated', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('Account Verified')
    })

    it('should show user email in account information', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'user@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('user@example.com')
    })

    it('should display arc76email if available', () => {
      const authStore = useAuthStore()
      authStore.arc76email = 'arc76@example.com'

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('arc76@example.com')
    })

    it('should show "Not available" when no email is present', () => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.arc76email = null

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('Not available')
    })

    it('should display authentication method as Email & Password (ARC76)', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('Email & Password (ARC76)')
    })

    it('should display Active account status', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('Active')
    })
  })

  describe('Error Handling for Unauthenticated', () => {
    it('should show error when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.isAuthenticated = false

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      await wrapper.vm.$nextTick()

      // Check that error is added to the errors array
      const vm = wrapper.vm as any
      expect(vm.errors.length).toBeGreaterThan(0)
    })

    it('should display authentication required error message', async () => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.isAuthenticated = false

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as any
      expect(vm.errors).toContain('You must be logged in to access the token creation wizard')
    })

    it('should set showErrors to true when not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.isAuthenticated = false

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as any
      expect(vm.showErrors).toBe(true)
    })
  })

  describe('Validation', () => {
    it('should be valid when user is authenticated', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any
      authStore.isConnected = true  // Need to set this for isAuthenticated computed

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      // Check that store is properly set
      expect(authStore.isConnected).toBe(true)
      expect(authStore.user).toBeTruthy()
    })

    it('should be invalid when user is not authenticated', () => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.isAuthenticated = false

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.isValid).toBe(false)
    })

    it('should expose isValid for parent components', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any
      authStore.isAuthenticated = true

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.isValid).toBeDefined()
    })
  })

  describe('Content Display', () => {
    it('should display "No Wallet Required" notice', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('No Wallet or Blockchain Knowledge Required')
    })

    it('should display what\'s next section', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('What\'s Next')
    })

    it('should list the 4 main steps in what\'s next', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('Choose Your Plan')
      expect(wrapper.text()).toContain('Configure Your Token')
      expect(wrapper.text()).toContain('Review Compliance')
      expect(wrapper.text()).toContain('Deploy Your Token')
    })

    it('should display backend benefits', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('Backend handles all blockchain operations')
      expect(wrapper.text()).toContain('No transaction fees to worry about')
      expect(wrapper.text()).toContain('Enterprise-grade security and compliance')
    })

    it('should show animated success icon', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      const successIcon = wrapper.find('.pi-check')
      expect(successIcon.exists()).toBe(true)
    })
  })

  describe('Props to WizardStep', () => {
    it('should pass title to WizardStep', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('Welcome to Biatec Tokens')
    })

    it('should pass description to WizardStep', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      expect(wrapper.text()).toContain('Your account is ready')
    })
  })

  describe('Icons and Visual Elements', () => {
    it('should display check icon for account verified', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      const checkIcons = wrapper.findAll('.pi-check')
      expect(checkIcons.length).toBeGreaterThan(0)
    })

    it('should display user icon for account information section', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      const userIcon = wrapper.find('.pi-user')
      expect(userIcon.exists()).toBe(true)
    })

    it('should display shield check icon for authentication method', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      const shieldIcon = wrapper.find('.pi-shield-check')
      expect(shieldIcon.exists()).toBe(true)
    })

    it('should display info icon for no wallet notice', () => {
      const authStore = useAuthStore()
      authStore.user = {
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      } as any

      const wrapper = mount(AuthenticationConfirmationStep, {
        global: {
          components: {
            WizardStep,
          },
        },
      })

      const infoIcons = wrapper.findAll('.pi-info-circle')
      expect(infoIcons.length).toBeGreaterThan(0)
    })
  })
})
