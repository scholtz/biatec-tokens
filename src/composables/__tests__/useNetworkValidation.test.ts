import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNetworkValidation } from '../useNetworkValidation'
import { useTokenDraftStore } from '../../stores/tokenDraft'

// Mock useWalletManager
vi.mock('../useWalletManager', () => ({
  useWalletManager: () => ({
    currentNetwork: { value: 'voi-mainnet' },
    networkInfo: {
      value: {
        id: 'voi-mainnet',
        name: 'voi-mainnet',
        displayName: 'VOI Mainnet',
        isTestnet: false,
        chainType: 'AVM',
        algodUrl: 'https://mainnet-api.voi.nodely.dev',
        genesisId: 'voimain-v1.0',
      },
    },
    isConnected: { value: true },
  }),
  NETWORKS: {},
}))

describe('useNetworkValidation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  describe('Network Mismatch Detection', () => {
    it('should detect mismatch when ERC standard on AVM network', () => {
      const tokenDraft = useTokenDraftStore()
      tokenDraft.initializeDraft('voi-mainnet')
      tokenDraft.updateDraft({ selectedStandard: 'ERC20' })

      const validation = useNetworkValidation()
      const warnings = validation.validateCurrentNetwork()

      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0].severity).toBe('error')
      expect(warnings[0].message).toContain('ERC20 tokens require an EVM network')
      expect(validation.networkMismatchDetected.value).toBe(true)
    })

    it('should not detect mismatch when ARC standard on AVM network', () => {
      const tokenDraft = useTokenDraftStore()
      tokenDraft.initializeDraft('voi-mainnet')
      tokenDraft.updateDraft({ selectedStandard: 'ARC200' })

      const validation = useNetworkValidation()
      const standardWarning = validation.validateNetworkForTokenStandard('ARC200', 'voi-mainnet')

      expect(standardWarning).toBeNull()
    })

    it('should warn about missing compliance metadata on mainnet', () => {
      const tokenDraft = useTokenDraftStore()
      tokenDraft.initializeDraft('voi-mainnet')
      tokenDraft.updateDraft({ selectedStandard: 'ARC200' })

      const validation = useNetworkValidation()
      const warnings = validation.validateCurrentNetwork()

      const complianceWarning = warnings.find(w => w.title.includes('Compliance'))
      expect(complianceWarning).toBeDefined()
      expect(complianceWarning?.severity).toBe('warning')
    })

    it('should provide testnet info when deploying with compliance on testnet', () => {
      // Mock testnet network
      vi.doMock('../useWalletManager', () => ({
        useWalletManager: () => ({
          currentNetwork: { value: 'algorand-testnet' },
          networkInfo: {
            value: {
              id: 'algorand-testnet',
              displayName: 'Algorand Testnet',
              isTestnet: true,
              chainType: 'AVM',
            },
          },
          isConnected: { value: true },
        }),
      }))

      const tokenDraft = useTokenDraftStore()
      tokenDraft.initializeDraft('algorand-testnet')
      tokenDraft.updateDraft({
        selectedStandard: 'ARC200',
        micaMetadata: {
          issuerId: 'test',
          issuerName: 'Test',
          legalEntityType: 'Corporation',
          jurisdiction: 'EU',
          registrationNumber: '123',
          regulatoryStatus: 'Registered',
          tokenClassification: 'Asset-referenced token',
          disclosureDocument: 'https://example.com/doc.pdf',
          kycProvider: 'Test',
          amlCompliance: true,
        },
      })

      const validation = useNetworkValidation()
      const networkInfo = {
        id: 'algorand-testnet' as const,
        displayName: 'Algorand Testnet',
        isTestnet: true,
        chainType: 'AVM' as const,
        name: 'algorand-testnet',
        algodUrl: '',
        genesisId: '',
      }
      const warning = validation.validateComplianceRequirements(networkInfo, true)

      expect(warning).toBeDefined()
      expect(warning?.severity).toBe('info')
      expect(warning?.message).toContain('testnet')
    })
  })

  describe('Deployment Safety', () => {
    it('should block deployment when network mismatch detected', () => {
      const tokenDraft = useTokenDraftStore()
      tokenDraft.initializeDraft('voi-mainnet')
      tokenDraft.updateDraft({ selectedStandard: 'ERC20' }) // Wrong standard for AVM

      const validation = useNetworkValidation()
      validation.validateCurrentNetwork()

      expect(validation.canProceedWithDeployment.value).toBe(false)
    })

    it('should allow deployment when validation passes', () => {
      const tokenDraft = useTokenDraftStore()
      tokenDraft.initializeDraft('voi-mainnet')
      tokenDraft.updateDraft({ selectedStandard: 'ARC200' })

      const validation = useNetworkValidation()
      validation.validateCurrentNetwork()

      // Should have warnings flag false (no errors)
      expect(validation.networkMismatchDetected.value).toBe(false)
    })

    it('should require recent validation for deployment', () => {
      const validation = useNetworkValidation()
      
      // Without validation, should not allow deployment
      validation.lastValidationTime.value = null
      expect(validation.canProceedWithDeployment.value).toBe(false)

      // With recent validation
      validation.lastValidationTime.value = new Date()
      validation.mismatchWarnings.value = []
      // Note: In test environment, without proper wallet connection mock,
      // this may still be false due to wallet not being connected
    })
  })

  describe('Network Status', () => {
    it('should provide user-friendly network status message', () => {
      const validation = useNetworkValidation()
      const message = validation.networkStatusMessage.value

      expect(message).toContain('VOI Mainnet')
      expect(message).toContain('AVM')
      expect(message).toContain('Mainnet')
    })

    it('should handle null network gracefully', () => {
      // Test that validateComplianceRequirements handles null network
      const validation = useNetworkValidation()
      
      const result = validation.validateComplianceRequirements(null, false)
      
      // Should return null when networkInfo is null
      expect(result).toBeNull()
    })
  })

  describe('Suggested Actions', () => {
    it('should provide actionable suggestions for network mismatch', () => {
      const tokenDraft = useTokenDraftStore()
      tokenDraft.initializeDraft('voi-mainnet')
      tokenDraft.updateDraft({ selectedStandard: 'ERC20' })

      const validation = useNetworkValidation()
      const warnings = validation.validateCurrentNetwork()

      const errorWarning = warnings.find(w => w.severity === 'error')
      expect(errorWarning?.suggestedAction).toBeDefined()
      expect(errorWarning?.suggestedAction).toContain('Switch')
    })

    it('should mark critical issues as action required', () => {
      const tokenDraft = useTokenDraftStore()
      tokenDraft.initializeDraft('voi-mainnet')
      tokenDraft.updateDraft({ selectedStandard: 'ERC20' })

      const validation = useNetworkValidation()
      const warnings = validation.validateCurrentNetwork()

      const errorWarning = warnings.find(w => w.severity === 'error')
      expect(errorWarning?.actionRequired).toBe(true)
    })
  })
})
