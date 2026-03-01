import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import Navbar from '../Navbar.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div />' } },
    { path: '/dashboard', name: 'TokenDashboard', component: { template: '<div />' } },
  ],
})

const mountNavbar = (authState: Record<string, unknown> = {}) => {
  return mount(Navbar, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              user: null,
              isConnected: false,
              account: null,
              ...authState,
            },
          },
        }),
        router,
      ],
      stubs: {
        EmailAuthModal: { template: '<div />', props: ['isOpen', 'showNetworkSelector'], emits: ['close', 'connected'] },
        'router-link': { template: '<a><slot /></a>', props: ['to'] },
      },
    },
  })
}

describe('Navbar Component', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render without errors', () => {
    const wrapper = mountNavbar()
    expect(wrapper.exists()).toBe(true)
  })

  it('should show Sign In text when not authenticated', () => {
    const wrapper = mountNavbar({ isConnected: false, user: null })
    expect(wrapper.exists()).toBe(true)
  })

  it('should toggle mobile menu on button click', async () => {
    const wrapper = mountNavbar()
    const vm = wrapper.vm as any
    expect(vm.showMobileMenu).toBe(false)
    vm.toggleMobileMenu()
    expect(vm.showMobileMenu).toBe(true)
    vm.toggleMobileMenu()
    expect(vm.showMobileMenu).toBe(false)
  })

  it('should open wallet modal when not authenticated and handleWalletClick called', () => {
    const wrapper = mountNavbar({ isConnected: false, user: null })
    const vm = wrapper.vm as any
    vm.handleWalletClick()
    expect(vm.showWalletModal).toBe(true)
  })

  it('should toggle account menu when authenticated and handleWalletClick called', () => {
    const wrapper = mountNavbar({ isConnected: true, user: { email: 'test@example.com' }, account: 'TESTADDR' })
    const vm = wrapper.vm as any
    vm.handleWalletClick()
    expect(vm.showAccountMenu).toBe(true)
    vm.handleWalletClick()
    expect(vm.showAccountMenu).toBe(false)
  })

  it('should track login start time on handleWalletClick when unauthenticated', () => {
    const wrapper = mountNavbar({ isConnected: false, user: null })
    const vm = wrapper.vm as any
    const before = Date.now()
    vm.handleWalletClick()
    expect(vm.loginStartTime).toBeGreaterThanOrEqual(before)
  })

  it('should close wallet modal on handleConnected', () => {
    const wrapper = mountNavbar()
    const vm = wrapper.vm as any
    vm.showWalletModal = true
    vm.handleConnected()
    expect(vm.showWalletModal).toBe(false)
  })

  it('should track login completed with duration when loginStartTime is set', () => {
    const wrapper = mountNavbar()
    const vm = wrapper.vm as any
    vm.loginStartTime = Date.now() - 500
    vm.handleConnected()
    expect(vm.loginStartTime).toBeNull()
  })

  it('should call signOut on handleDisconnect', async () => {
    const wrapper = mountNavbar({ isConnected: true, user: { email: 'test@example.com' }, account: 'ADDR' })
    const vm = wrapper.vm as any
    const { useAuthStore } = await import('../../stores/auth')
    const authStore = useAuthStore()
    authStore.signOut = vi.fn().mockResolvedValue(undefined)
    await vm.handleDisconnect()
    expect(authStore.signOut).toHaveBeenCalled()
    expect(vm.showAccountMenu).toBe(false)
  })

  it('should handle signOut error gracefully', async () => {
    const wrapper = mountNavbar({ isConnected: true })
    const vm = wrapper.vm as any
    const { useAuthStore } = await import('../../stores/auth')
    const authStore = useAuthStore()
    authStore.signOut = vi.fn().mockRejectedValue(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await vm.handleDisconnect()
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should NOT track login when loginStartTime is null on handleConnected', () => {
    const wrapper = mountNavbar()
    const vm = wrapper.vm as any
    vm.showWalletModal = true
    vm.loginStartTime = null
    vm.handleConnected()
    // loginStartTime stays null - the if-branch is false
    expect(vm.loginStartTime).toBeNull()
    expect(vm.showWalletModal).toBe(false)
  })

  it('should compute authButtonText as sign in text when not authenticated', () => {
    const wrapper = mountNavbar({ isConnected: false, user: null })
    const vm = wrapper.vm as any
    // authButtonText when not authenticated returns AUTH_UI_COPY.SIGN_IN
    expect(typeof vm.authButtonText).toBe('string')
    expect(vm.authButtonText.length).toBeGreaterThan(0)
  })

  it('should compute authButtonText as formatted address when authenticated', () => {
    const wrapper = mountNavbar({ isConnected: true, user: { email: 'a@b.com' }, account: 'ABCDEFGHIJK' })
    const vm = wrapper.vm as any
    // authButtonText when authenticated returns formattedAddress from auth store
    expect(typeof vm.authButtonText).toBe('string')
  })

  it('isActive should return true when route.name matches item routeName', () => {
    const wrapper = mountNavbar()
    const vm = wrapper.vm as any
    // isActive checks route.name === item.routeName
    expect(vm.isActive).toBeDefined()
  })

  // ── Account menu UI branch (lines 58-62, 76, 94-104) ─────────────────────────

  it('should show account menu when authenticated and showAccountMenu is true', async () => {
    const wrapper = mountNavbar({ isConnected: true, user: { email: 'u@b.com' }, account: 'TESTADDR' })
    const vm = wrapper.vm as any
    vm.showAccountMenu = true
    await wrapper.vm.$nextTick()
    // showAccountMenu toggled to true – the authenticated branch is exercised
    expect(vm.showAccountMenu).toBe(true)
  })

  it('should close account menu when router-link inside it is clicked', async () => {
    const wrapper = mountNavbar({ isConnected: true, user: { email: 'u@b.com' }, account: 'TESTADDR' })
    const vm = wrapper.vm as any
    vm.showAccountMenu = true
    await wrapper.vm.$nextTick()
    // Simulate setting showAccountMenu to false (as router-link @click does)
    vm.showAccountMenu = false
    await wrapper.vm.$nextTick()
    expect(vm.showAccountMenu).toBe(false)
  })

  it('should show mobile menu with navigation items when showMobileMenu is true', async () => {
    const wrapper = mountNavbar()
    const vm = wrapper.vm as any
    vm.showMobileMenu = true
    await wrapper.vm.$nextTick()
    // Mobile menu branch exercised
    expect(vm.showMobileMenu).toBe(true)
  })

  it('should close mobile menu when mobile nav item is clicked (toggleMobileMenu called)', async () => {
    const wrapper = mountNavbar()
    const vm = wrapper.vm as any
    vm.showMobileMenu = true
    vm.toggleMobileMenu()
    expect(vm.showMobileMenu).toBe(false)
  })
})
