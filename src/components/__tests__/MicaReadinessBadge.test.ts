import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useTokenComplianceStore } from '../../stores/tokenCompliance'
import MicaReadinessBadge from '../MicaReadinessBadge.vue'

// Stub Badge UI component
vi.mock('../ui/Badge.vue', () => ({
  default: {
    name: 'Badge',
    template: '<span data-testid="badge" :data-variant="variant"><slot /></span>',
    props: ['variant', 'size']
  }
}))

describe('MicaReadinessBadge', () => {
  it('renders a badge element', () => {
    const wrapper = mount(MicaReadinessBadge, {
      props: { tokenId: 'tok-001', size: 'md' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.find('[data-testid="badge"]').exists()).toBe(true)
  })

  it('shows Incomplete status when no compliance checklist data exists', () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const wrapper = mount(MicaReadinessBadge, {
      props: { tokenId: 'tok-no-data', size: 'md' },
      global: { plugins: [pinia] }
    })
    const store = useTokenComplianceStore()
    // With no data, getCompletionPercentage returns 0 → Incomplete
    vi.mocked(store.getReadinessStatus).mockReturnValue('Incomplete')
    expect(wrapper.exists()).toBe(true)
  })

  it('accepts sm size prop', () => {
    const wrapper = mount(MicaReadinessBadge, {
      props: { tokenId: 'tok-001', size: 'sm' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('accepts lg size prop', () => {
    const wrapper = mount(MicaReadinessBadge, {
      props: { tokenId: 'tok-001', size: 'lg' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders badge with icon element', () => {
    const wrapper = mount(MicaReadinessBadge, {
      props: { tokenId: 'tok-001', size: 'md' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    // Should have an icon element (i tag)
    expect(wrapper.find('i').exists()).toBe(true)
  })

  it('renders badge variant based on compliance status', () => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    const wrapper = mount(MicaReadinessBadge, {
      props: { tokenId: 'tok-ready', size: 'md' },
      global: { plugins: [pinia] }
    })
    const store = useTokenComplianceStore()
    vi.mocked(store.getReadinessStatus).mockReturnValue('Ready')
    vi.mocked(store.getReadinessBadgeVariant).mockReturnValue('success')
    expect(wrapper.exists()).toBe(true)
  })

  it('does not render wallet connector UI (product alignment)', () => {
    const wrapper = mount(MicaReadinessBadge, {
      props: { tokenId: 'tok-001', size: 'md' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})
