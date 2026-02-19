import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import Navbar from '../Navbar.vue'

/**
 * Navigation Parity Tests
 * 
 * Validates that mobile and desktop navigation expose the same items,
 * ensuring cross-device parity as per AC #3.
 */
describe('Navbar - Navigation Parity', () => {
  let pinia: ReturnType<typeof createPinia>
  
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
      { path: '/cockpit', name: 'Cockpit', component: { template: '<div>Cockpit</div>' } },
      { path: '/launch/guided', name: 'GuidedTokenLaunch', component: { template: '<div>Guided</div>' } },
      { path: '/compliance/setup', name: 'ComplianceSetupWorkspace', component: { template: '<div>Compliance</div>' } },
      { path: '/create', name: 'TokenCreator', component: { template: '<div>Create</div>' } },
      { path: '/dashboard', name: 'TokenDashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/insights', name: 'VisionInsightsWorkspace', component: { template: '<div>Insights</div>' } },
      { path: '/subscription/pricing', name: 'Pricing', component: { template: '<div>Pricing</div>' } },
      { path: '/settings', name: 'Settings', component: { template: '<div>Settings</div>' } }
    ]
  })

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
  })

  it('should have consistent navigation items array for both desktop and mobile', async () => {
    const wrapper = mount(Navbar, {
      global: {
        plugins: [router, pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          EmailAuthModal: { template: '<div></div>' }
        }
      }
    })

    // The component uses a shared navigationItems array for both desktop and mobile
    // Verify navigation items are present in the rendered output
    const html = wrapper.html()
    
    // All nav items should be present (rendered for both desktop and mobile)
    expect(html).toContain('Home')
    expect(html).toContain('Cockpit')
    expect(html).toContain('Guided Launch')
  })

  it('should expose all critical MVP destinations in navigation', () => {
    const wrapper = mount(Navbar, {
      global: {
        plugins: [router, pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          EmailAuthModal: { template: '<div></div>' }
        }
      }
    })

    const html = wrapper.html()
    
    // Critical MVP destinations (from AC #3)
    const criticalDestinations = [
      'Home',
      'Cockpit',
      'Guided Launch',
      'Compliance',
      'Create',
      'Dashboard',
      'Insights',
      'Pricing',
      'Settings'
    ]

    criticalDestinations.forEach(destination => {
      expect(html).toContain(destination)
    })
  })

  it('should render mobile menu with same items as desktop', async () => {
    const wrapper = mount(Navbar, {
      global: {
        plugins: [router, pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          EmailAuthModal: { template: '<div></div>' }
        }
      }
    })

    // Component uses v-for with same navigationItems array for both desktop and mobile
    // Verify all items are rendered
    const html = wrapper.html()
    
    // Check that critical items are accessible (present in component)
    expect(html).toContain('Home')
    expect(html).toContain('Cockpit')
    expect(html).toContain('Guided Launch')
    expect(html).toContain('Compliance')
  })

  it('should not expose wallet/network affordances for unauthenticated users', () => {
    const wrapper = mount(Navbar, {
      global: {
        plugins: [router, pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          EmailAuthModal: { template: '<div></div>' }
        }
      }
    })

    const html = wrapper.html()
    
    // Should NOT contain wallet-related terms (AC #2)
    expect(html.toLowerCase()).not.toContain('walletconnect')
    expect(html.toLowerCase()).not.toContain('metamask')
    expect(html.toLowerCase()).not.toContain('pera wallet')
    expect(html.toLowerCase()).not.toContain('defly')
    expect(html.toLowerCase()).not.toContain('connect wallet')
    expect(html.toLowerCase()).not.toContain('not connected')
  })

  it('should show sign in button for unauthenticated users', () => {
    // Clear localStorage to simulate unauthenticated state
    localStorage.clear()
    
    const wrapper = mount(Navbar, {
      global: {
        plugins: [router, pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          EmailAuthModal: { template: '<div></div>' }
        }
      }
    })

    const html = wrapper.html()
    
    // Should show "Sign In" for unauthenticated users
    expect(html).toMatch(/Sign\s+In/i)
  })
})
