import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTokenDraftStore, type TokenDraftForm } from './tokenDraft'

describe('TokenDraft Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with no draft', () => {
      const store = useTokenDraftStore()
      expect(store.currentDraft).toBeNull()
      expect(store.isDraftLoaded).toBe(false)
      expect(store.lastSavedNetwork).toBeNull()
    })

    it('should create new draft on initializeDraft', () => {
      const store = useTokenDraftStore()
      const draft = store.initializeDraft('voi-mainnet')
      
      expect(draft).toBeDefined()
      expect(draft.name).toBe('')
      expect(draft.symbol).toBe('')
      expect(draft.selectedNetwork).toBe('voi-mainnet')
      expect(draft.createdAt).toBeInstanceOf(Date)
      expect(store.isDraftLoaded).toBe(true)
    })

    it('should load existing draft from sessionStorage', () => {
      const mockDraft: TokenDraftForm = {
        name: 'Test Token',
        symbol: 'TEST',
        description: 'Test description',
        supply: 1000000,
        decimals: 6,
        imageUrl: '',
        attributes: [],
        selectedNetwork: 'aramidmain',
        createdAt: new Date(),
        lastModified: new Date(),
      }

      const stored = {
        version: '1.0',
        draft: mockDraft,
        network: 'aramidmain',
        timestamp: Date.now(),
      }

      sessionStorage.setItem('biatec_token_draft', JSON.stringify(stored))

      const store = useTokenDraftStore()
      const loaded = store.loadDraft()

      expect(loaded).toBeDefined()
      expect(loaded?.name).toBe('Test Token')
      expect(loaded?.symbol).toBe('TEST')
      expect(loaded?.selectedNetwork).toBe('aramidmain')
    })
  })

  describe('Draft Management', () => {
    it('should update draft with new values', () => {
      const store = useTokenDraftStore()
      store.initializeDraft('voi-mainnet')

      store.updateDraft({
        name: 'Updated Token',
        symbol: 'UPD',
      })

      expect(store.currentDraft?.name).toBe('Updated Token')
      expect(store.currentDraft?.symbol).toBe('UPD')
    })

    it('should save draft to sessionStorage', () => {
      const store = useTokenDraftStore()
      const draft = store.initializeDraft('voi-mainnet')
      
      draft.name = 'My Token'
      draft.symbol = 'MTK'
      
      store.saveDraft(draft, 'voi-mainnet')

      const stored = sessionStorage.getItem('biatec_token_draft')
      expect(stored).toBeTruthy()
      
      const parsed = JSON.parse(stored!)
      expect(parsed.draft.name).toBe('My Token')
      expect(parsed.draft.symbol).toBe('MTK')
      expect(parsed.network).toBe('voi-mainnet')
    })

    it('should clear draft', () => {
      const store = useTokenDraftStore()
      store.initializeDraft('voi-mainnet')
      store.updateDraft({ name: 'Test' })

      store.clearDraft()

      expect(store.currentDraft).toBeNull()
      expect(store.lastSavedNetwork).toBeNull()
      expect(sessionStorage.getItem('biatec_token_draft')).toBeNull()
    })

    it('should detect if draft has content', () => {
      const store = useTokenDraftStore()
      store.initializeDraft('voi-mainnet')

      expect(store.hasDraft()).toBe(false)

      store.updateDraft({ name: 'Test Token' })
      expect(store.hasDraft()).toBe(true)
    })
  })

  describe('Network Compatibility', () => {
    it('should validate ERC standard requires EVM network', () => {
      const store = useTokenDraftStore()
      store.initializeDraft('voi-mainnet')
      store.updateDraft({ selectedStandard: 'ERC20' })

      expect(store.isDraftCompatibleWithNetwork('ethereum')).toBe(true)
      expect(store.isDraftCompatibleWithNetwork('voi-mainnet')).toBe(false)
      expect(store.isDraftCompatibleWithNetwork('aramidmain')).toBe(false)
    })

    it('should validate ASA/ARC standards require AVM network', () => {
      const store = useTokenDraftStore()
      store.initializeDraft('voi-mainnet')
      store.updateDraft({ selectedStandard: 'ARC200' })

      expect(store.isDraftCompatibleWithNetwork('voi-mainnet')).toBe(true)
      expect(store.isDraftCompatibleWithNetwork('aramidmain')).toBe(true)
      expect(store.isDraftCompatibleWithNetwork('ethereum')).toBe(false)
    })

    it('should allow network switch if no standard selected', () => {
      const store = useTokenDraftStore()
      store.initializeDraft('voi-mainnet')

      expect(store.isDraftCompatibleWithNetwork('ethereum')).toBe(true)
      expect(store.isDraftCompatibleWithNetwork('aramidmain')).toBe(true)
    })

    it('should provide warnings for incompatible network switch', () => {
      const store = useTokenDraftStore()
      store.initializeDraft('voi-mainnet')
      store.updateDraft({ 
        selectedStandard: 'ARC200',
        micaMetadata: {
          issuerId: 'test-issuer',
          issuerName: 'Test Issuer',
          legalEntityType: 'Corporation',
          jurisdiction: 'EU',
          registrationNumber: '123456',
          regulatoryStatus: 'Registered',
          tokenClassification: 'Asset-referenced token',
          disclosureDocument: 'https://example.com/disclosure.pdf',
          kycProvider: 'Test KYC',
          amlCompliance: true,
        }
      })

      const result = store.validateNetworkSwitch('voi-mainnet', 'ethereum')

      expect(result.compatible).toBe(false)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('not compatible')
    })

    it('should warn about compliance metadata on network switch', () => {
      const store = useTokenDraftStore()
      store.initializeDraft('voi-mainnet')
      store.updateDraft({ 
        selectedStandard: 'ARC200',
        micaMetadata: {
          issuerId: 'test-issuer',
          issuerName: 'Test Issuer',
          legalEntityType: 'Corporation',
          jurisdiction: 'EU',
          registrationNumber: '123456',
          regulatoryStatus: 'Registered',
          tokenClassification: 'Asset-referenced token',
          disclosureDocument: 'https://example.com/disclosure.pdf',
          kycProvider: 'Test KYC',
          amlCompliance: true,
        }
      })
      
      // Simulate network switch
      store.saveDraft(store.currentDraft!, 'voi-mainnet')
      const result = store.validateNetworkSwitch('voi-mainnet', 'aramidmain')

      expect(result.warnings.some(w => w.includes('compliance metadata'))).toBe(true)
    })
  })

  describe('Persistence', () => {
    it('should handle corrupted sessionStorage gracefully', () => {
      sessionStorage.setItem('biatec_token_draft', 'invalid json{')

      const store = useTokenDraftStore()
      const loaded = store.loadDraft()

      expect(loaded).toBeNull()
      expect(sessionStorage.getItem('biatec_token_draft')).toBeNull()
    })

    it('should clear draft on version mismatch', () => {
      const oldVersion = {
        version: '0.9',
        draft: { name: 'Old Token' },
        network: 'voi-mainnet',
      }

      sessionStorage.setItem('biatec_token_draft', JSON.stringify(oldVersion))

      const store = useTokenDraftStore()
      const loaded = store.loadDraft()

      expect(loaded).toBeNull()
    })

    it('should restore dates correctly', () => {
      const now = new Date()
      const mockDraft: TokenDraftForm = {
        name: 'Test',
        symbol: 'TST',
        description: 'Test',
        supply: 1000,
        decimals: 0,
        imageUrl: '',
        attributes: [],
        createdAt: now,
        lastModified: now,
      }

      const stored = {
        version: '1.0',
        draft: mockDraft,
        network: 'voi-mainnet',
        timestamp: Date.now(),
      }

      sessionStorage.setItem('biatec_token_draft', JSON.stringify(stored))

      const store = useTokenDraftStore()
      const loaded = store.loadDraft()

      expect(loaded?.createdAt).toBeInstanceOf(Date)
      expect(loaded?.lastModified).toBeInstanceOf(Date)
    })
  })
})
