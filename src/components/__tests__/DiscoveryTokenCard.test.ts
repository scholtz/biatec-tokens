import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DiscoveryTokenCard from '../DiscoveryTokenCard.vue'
import type { MarketplaceToken } from '../../stores/marketplace'

vi.mock('../../services/TelemetryService', () => ({
  telemetryService: {
    trackTokenDetailViewed: vi.fn(),
    trackWatchlistAdd: vi.fn(),
    trackWatchlistRemove: vi.fn(),
    trackComplianceBadgeClicked: vi.fn(),
  },
}))

const makeToken = (overrides: Partial<MarketplaceToken> = {}): MarketplaceToken => ({
  id: 'token-1',
  name: 'Test Token',
  symbol: 'TST',
  type: 'FT',
  status: 'deployed',
  createdAt: new Date('2024-01-01'),
  standard: 'ARC200',
  network: 'algorand-testnet',
  complianceStatus: 'compliant',
  ...overrides,
})

describe('DiscoveryTokenCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without errors', () => {
    const wrapper = mount(DiscoveryTokenCard, {
      props: { token: makeToken() },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('displays the token name and symbol', () => {
    const wrapper = mount(DiscoveryTokenCard, {
      props: { token: makeToken({ name: 'My Token', symbol: 'MTK' }) },
    })
    expect(wrapper.text()).toContain('My Token')
    expect(wrapper.text()).toContain('MTK')
  })

  describe('Branch coverage', () => {
    it('complianceInfo shows Compliant badge for compliant token', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ complianceStatus: 'compliant' }) },
      })
      expect(wrapper.text()).toContain('Compliant')
    })

    it('complianceInfo shows Partial badge for partial token', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ complianceStatus: 'partial' }) },
      })
      expect(wrapper.text()).toContain('Partial')
    })

    it('complianceInfo shows Pending badge for pending token', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ complianceStatus: 'pending' }) },
      })
      expect(wrapper.text()).toContain('Pending')
    })

    it('complianceInfo shows Non-Compliant badge for non-compliant token', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ complianceStatus: 'non-compliant' }) },
      })
      expect(wrapper.text()).toContain('Non-Compliant')
    })

    it('complianceInfo shows Unknown badge for unknown status', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ complianceStatus: 'unknown' }) },
      })
      expect(wrapper.text()).toContain('Unknown')
    })

    it('complianceInfo falls back to Unknown for missing complianceStatus', () => {
      const token = makeToken()
      delete (token as any).complianceStatus
      const wrapper = mount(DiscoveryTokenCard, { props: { token } })
      expect(wrapper.text()).toContain('Unknown')
    })

    it('chainType computed returns AVM for ARC standard', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ standard: 'ARC200' }) },
      })
      expect(wrapper.text()).toContain('AVM')
    })

    it('chainType computed returns AVM for ASA standard', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ standard: 'ASA' }) },
      })
      expect(wrapper.text()).toContain('AVM')
    })

    it('chainType computed returns EVM for ERC standard', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ standard: 'ERC20' }) },
      })
      expect(wrapper.text()).toContain('EVM')
    })

    it('chainType computed returns Unknown for unrecognised standard', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ standard: 'CUSTOM' }) },
      })
      expect(wrapper.text()).toContain('Unknown')
    })

    it('chainTypeBadgeClass returns blue class for AVM tokens', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ standard: 'ARC72' }) },
      })
      expect(wrapper.html()).toContain('blue')
    })

    it('chainTypeBadgeClass returns purple class for EVM tokens', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ standard: 'ERC721' }) },
      })
      expect(wrapper.html()).toContain('purple')
    })

    it('chainTypeBadgeClass renders for unknown chain type', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ standard: 'CUSTOM_XYZ' }) },
      })
      expect(wrapper.text()).toContain('Unknown')
    })

    it('hasOperationalInfo shows section when contractVerified is set', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ contractVerified: true }) },
      })
      expect(wrapper.html()).toContain('Contract Verified')
    })

    it('hasOperationalInfo shows section when riskFlags are present', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ riskFlags: ['High liquidity risk'] }) },
      })
      expect(wrapper.html()).toContain('Risk Flag')
    })

    it('hasOperationalInfo hides section when no operational flags set', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken({ contractVerified: false, issuerIdentityVerified: false, auditCompleted: false, riskFlags: [] }) },
      })
      // hasOperationalInfo is false → operational section absent from rendered output
      expect(wrapper.text()).not.toContain('Contract Verified')
      expect(wrapper.text()).not.toContain('Risk Flag')
    })

    it('formatNetwork returns N/A for undefined network', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken() },
      })
      const formatNetwork = (wrapper.vm as any).$.setupState.formatNetwork
      expect(formatNetwork(undefined)).toBe('N/A')
    })

    it('formatNetwork capitalises hyphenated network names', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken() },
      })
      const formatNetwork = (wrapper.vm as any).$.setupState.formatNetwork
      expect(formatNetwork('algorand-testnet')).toBe('Algorand Testnet')
    })

    it('formatSupply returns N/A for undefined supply', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken() },
      })
      const formatSupply = (wrapper.vm as any).$.setupState.formatSupply
      expect(formatSupply(undefined)).toBe('N/A')
    })

    it('formatSupply formats a supply number', () => {
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token: makeToken() },
      })
      const formatSupply = (wrapper.vm as any).$.setupState.formatSupply
      expect(formatSupply(1000000)).toBeTruthy()
    })

    it('emits select event when card is clicked', async () => {
      const token = makeToken()
      const wrapper = mount(DiscoveryTokenCard, { props: { token } })
      await wrapper.trigger('click')
      expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('handleWatchlistToggle tracks watchlistRemove when already in watchlist', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const token = makeToken()
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token, isInWatchlist: true },
      })
      const handleWatchlistToggle = (wrapper.vm as any).$.setupState.handleWatchlistToggle
      handleWatchlistToggle()
      expect(telemetryService.trackWatchlistRemove).toHaveBeenCalledWith(
        expect.objectContaining({ tokenId: token.id })
      )
    })

    it('handleWatchlistToggle tracks watchlistAdd when not in watchlist', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const token = makeToken()
      const wrapper = mount(DiscoveryTokenCard, {
        props: { token, isInWatchlist: false },
      })
      const handleWatchlistToggle = (wrapper.vm as any).$.setupState.handleWatchlistToggle
      handleWatchlistToggle()
      expect(telemetryService.trackWatchlistAdd).toHaveBeenCalledWith(
        expect.objectContaining({ tokenId: token.id })
      )
    })
  })

  describe('handleViewDetails and handleComplianceClick', () => {
    it('handleViewDetails emits view-details and tracks telemetry', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const token = makeToken()
      const wrapper = mount(DiscoveryTokenCard, { props: { token } })
      const handleViewDetails = (wrapper.vm as any).$.setupState.handleViewDetails
      handleViewDetails()
      expect(telemetryService.trackTokenDetailViewed).toHaveBeenCalledWith(
        expect.objectContaining({ tokenId: token.id })
      )
      expect(wrapper.emitted('view-details')).toBeTruthy()
    })

    it('handleComplianceClick emits compliance-click and tracks telemetry', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const token = makeToken({ complianceStatus: 'compliant' })
      const wrapper = mount(DiscoveryTokenCard, { props: { token } })
      const handleComplianceClick = (wrapper.vm as any).$.setupState.handleComplianceClick
      handleComplianceClick()
      expect(telemetryService.trackComplianceBadgeClicked).toHaveBeenCalledWith(
        expect.objectContaining({ tokenId: token.id })
      )
      expect(wrapper.emitted('compliance-click')).toBeTruthy()
    })

    it('handleViewDetails uses unknown fallbacks for missing standard/network', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const token = makeToken({ standard: undefined, network: undefined })
      const wrapper = mount(DiscoveryTokenCard, { props: { token } })
      const handleViewDetails = (wrapper.vm as any).$.setupState.handleViewDetails
      handleViewDetails()
      expect(telemetryService.trackTokenDetailViewed).toHaveBeenCalledWith(
        expect.objectContaining({ tokenStandard: 'unknown', tokenChain: 'unknown' })
      )
    })
  })
})
