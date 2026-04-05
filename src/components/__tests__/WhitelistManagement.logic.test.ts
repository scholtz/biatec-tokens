/**
 * Logic Tests: WhitelistManagement — function branches, filters, CSV handling
 *
 * Uses (wrapper.vm as any) to directly invoke internal functions for branch
 * coverage of addAddress, removeAddress, validateCsvData, showPreviewStep,
 * confirmBulkUpload, and filteredEntries computed property.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import WhitelistManagement from '../WhitelistManagement.vue'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../services/legacyWhitelistService', () => ({
  whitelistService: {
    getWhitelist: vi.fn().mockResolvedValue([]),
    addAddress: vi.fn().mockResolvedValue({}),
    removeAddress: vi.fn().mockResolvedValue({}),
    validateCsv: vi.fn().mockResolvedValue([]),
    bulkUpload: vi.fn().mockResolvedValue({ success: 1, failed: 0 }),
    exportReport: vi.fn().mockResolvedValue('csv data'),
  },
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastWarning = vi.fn()

vi.mock('../../composables/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
    info: vi.fn(),
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} }),
  RouterLink: { template: '<a><slot /></a>' },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

import { whitelistService } from '../../services/legacyWhitelistService'

const VALID_ALGORAND_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

async function mountWM() {
  const wrapper = mount(WhitelistManagement, {
    props: { tokenId: 'token123' },
  })
  await nextTick()
  return wrapper
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WhitelistManagement — addAddress branches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([])
  })

  it('sets addressError when address is empty', async () => {
    const w = await mountWM()
    const vm = w.vm as any
    vm.newAddress = ''
    await vm.addAddress()
    await nextTick()
    expect(vm.addressError).toMatch(/required/i)
  })

  it('sets addressError when address format is invalid (not 58 Algorand chars)', async () => {
    const w = await mountWM()
    const vm = w.vm as any
    vm.newAddress = '0xinvalidethformat'
    await vm.addAddress()
    await nextTick()
    expect(vm.addressError).toMatch(/Invalid/i)
  })

  it('successfully adds a valid Algorand address', async () => {
    vi.mocked(whitelistService.addAddress).mockResolvedValue({})
    const w = await mountWM()
    const vm = w.vm as any
    vm.newAddress = VALID_ALGORAND_ADDRESS
    vm.newAddressNotes = 'test note'
    await vm.addAddress()
    await nextTick()
    expect(whitelistService.addAddress).toHaveBeenCalledWith('token123', VALID_ALGORAND_ADDRESS, { notes: 'test note' })
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('added'))
    expect(vm.showAddModal).toBe(false)
    expect(vm.newAddress).toBe('')
  })

  it('handles error from addAddress service call', async () => {
    vi.mocked(whitelistService.addAddress).mockRejectedValue(new Error('Add failed'))
    const w = await mountWM()
    const vm = w.vm as any
    vm.newAddress = VALID_ALGORAND_ADDRESS
    await vm.addAddress()
    await nextTick()
    expect(vm.addressError).toMatch(/Add failed/)
    expect(mockToastError).toHaveBeenCalledWith('Failed to add address')
  })

  it('handles non-Error exception from addAddress', async () => {
    vi.mocked(whitelistService.addAddress).mockRejectedValue('plain string error')
    const w = await mountWM()
    const vm = w.vm as any
    vm.newAddress = VALID_ALGORAND_ADDRESS
    await vm.addAddress()
    await nextTick()
    expect(vm.addressError).toBeTruthy()
  })
})

describe('WhitelistManagement — removeAddress branches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([])
  })

  it('confirmRemove sets addressToRemove and opens modal', async () => {
    const w = await mountWM()
    const vm = w.vm as any
    vm.confirmRemove('ADDR1')
    expect(vm.addressToRemove).toBe('ADDR1')
    expect(vm.showRemoveModal).toBe(true)
  })

  it('successfully removes address', async () => {
    vi.mocked(whitelistService.removeAddress).mockResolvedValue({})
    const w = await mountWM()
    const vm = w.vm as any
    vm.addressToRemove = VALID_ALGORAND_ADDRESS
    vm.showRemoveModal = true
    await vm.removeAddress()
    await nextTick()
    expect(whitelistService.removeAddress).toHaveBeenCalledWith('token123', VALID_ALGORAND_ADDRESS)
    expect(mockToastSuccess).toHaveBeenCalled()
    expect(vm.showRemoveModal).toBe(false)
  })

  it('handles error from removeAddress service call', async () => {
    vi.mocked(whitelistService.removeAddress).mockRejectedValue(new Error('Remove failed'))
    const w = await mountWM()
    const vm = w.vm as any
    vm.addressToRemove = VALID_ALGORAND_ADDRESS
    await vm.removeAddress()
    await nextTick()
    expect(mockToastError).toHaveBeenCalledWith('Remove failed')
  })
})

describe('WhitelistManagement — loadWhitelist branches', () => {
  beforeEach(() => vi.clearAllMocks())

  it('handles error from getWhitelist', async () => {
    vi.mocked(whitelistService.getWhitelist).mockRejectedValue(new Error('Load failed'))
    const w = await mountWM()
    const vm = w.vm as any
    await vm.loadWhitelist()
    await nextTick()
    expect(vm.error).toMatch(/Load failed/)
    expect(mockToastError).toHaveBeenCalledWith('Failed to load whitelist')
  })

  it('loads entries successfully', async () => {
    const mockEntries = [
      { address: VALID_ALGORAND_ADDRESS, status: 'active', addedAt: '2024-01-01' },
    ]
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockEntries as any)
    const w = await mountWM()
    const vm = w.vm as any
    await vm.loadWhitelist()
    await nextTick()
    expect(vm.entries.length).toBe(1)
    expect(vm.error).toBeNull()
  })
})

describe('WhitelistManagement — filteredEntries computed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filters by search query', async () => {
    const entries = [
      { address: 'AAAAAAAAAA', status: 'active', addedAt: '2024-01-01' },
      { address: 'BBBBBBBBBB', status: 'active', addedAt: '2024-01-01' },
    ]
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(entries as any)
    const w = await mountWM()
    const vm = w.vm as any
    await vm.loadWhitelist()
    vm.searchQuery = 'aaaa'
    await nextTick()
    expect(vm.filteredEntries.length).toBe(1)
    expect(vm.filteredEntries[0].address).toBe('AAAAAAAAAA')
  })

  it('filters by status', async () => {
    const entries = [
      { address: 'AAAAAAAAAA', status: 'active', addedAt: '2024-01-01' },
      { address: 'BBBBBBBBBB', status: 'removed', addedAt: '2024-01-01' },
    ]
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(entries as any)
    const w = await mountWM()
    const vm = w.vm as any
    await vm.loadWhitelist()
    vm.statusFilter = 'removed'
    await nextTick()
    expect(vm.filteredEntries.length).toBe(1)
    expect(vm.filteredEntries[0].address).toBe('BBBBBBBBBB')
  })

  it('returns all entries when no filter', async () => {
    const entries = [
      { address: 'AAAAAAAAAA', status: 'active', addedAt: '2024-01-01' },
      { address: 'BBBBBBBBBB', status: 'pending', addedAt: '2024-01-01' },
    ]
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(entries as any)
    const w = await mountWM()
    const vm = w.vm as any
    await vm.loadWhitelist()
    await nextTick()
    expect(vm.filteredEntries.length).toBe(2)
  })
})

describe('WhitelistManagement — validateCsvData branches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([])
  })

  it('returns early when csvData is empty', async () => {
    const w = await mountWM()
    const vm = w.vm as any
    vm.csvData = ''
    await vm.validateCsvData()
    expect(whitelistService.validateCsv).not.toHaveBeenCalled()
  })

  it('sets csvError when lines are empty after filter', async () => {
    const w = await mountWM()
    const vm = w.vm as any
    vm.csvData = '   \n   \n   '
    await vm.validateCsvData()
    await nextTick()
    expect(vm.csvError).toMatch(/empty/i)
    expect(vm.validationResults).toEqual([])
  })

  it('sets csvError when CSV has no address header', async () => {
    const w = await mountWM()
    const vm = w.vm as any
    vm.csvData = 'wallet,name\nAAAA,John'
    await vm.validateCsvData()
    await nextTick()
    expect(vm.csvError).toMatch(/address.*column/i)
    expect(vm.validationResults).toEqual([])
  })

  it('detects non-Algorand format addresses and sets network mismatch error', async () => {
    vi.mocked(whitelistService.validateCsv).mockResolvedValue([
      { valid: true, address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', row: 1 } as any,
    ])
    const w = await mountWM()
    const vm = w.vm as any
    vm.csvData = 'address\n0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    await vm.validateCsvData()
    await nextTick()
    expect(vm.csvError).toMatch(/Network mismatch/i)
  })

  it('detects duplicate addresses in CSV and marks them invalid', async () => {
    vi.mocked(whitelistService.validateCsv).mockResolvedValue([
      { valid: true, address: VALID_ALGORAND_ADDRESS, row: 1 } as any,
      { valid: true, address: VALID_ALGORAND_ADDRESS, row: 2 } as any,
    ])
    const w = await mountWM()
    const vm = w.vm as any
    vm.csvData = `address\n${VALID_ALGORAND_ADDRESS}\n${VALID_ALGORAND_ADDRESS}`
    await vm.validateCsvData()
    await nextTick()
    const invalid = vm.validationResults.filter((r: any) => !r.valid)
    expect(invalid.length).toBeGreaterThan(0)
  })

  it('handles service error during CSV validation', async () => {
    vi.mocked(whitelistService.validateCsv).mockRejectedValue(new Error('CSV service error'))
    const w = await mountWM()
    const vm = w.vm as any
    vm.csvData = `address\n${VALID_ALGORAND_ADDRESS}`
    await vm.validateCsvData()
    await nextTick()
    expect(vm.csvError).toMatch(/CSV service error/)
    expect(mockToastError).toHaveBeenCalledWith('Failed to validate CSV')
  })
})

describe('WhitelistManagement — showPreviewStep branches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([])
  })

  it('returns early when csvData is empty', async () => {
    const w = await mountWM()
    const vm = w.vm as any
    vm.csvData = ''
    await vm.showPreviewStep()
    expect(vm.showPreview).toBe(false)
  })

  it('returns early when there are invalid entries (invalidCount > 0)', async () => {
    vi.mocked(whitelistService.validateCsv).mockResolvedValue([
      { valid: false, address: 'bad', row: 1, error: 'invalid' } as any,
    ])
    const w = await mountWM()
    const vm = w.vm as any
    vm.csvData = 'address\nbad'
    vm.validationResults = [{ valid: false, address: 'bad', row: 1, error: 'invalid' }]
    await vm.showPreviewStep()
    expect(vm.showPreview).toBe(false)
  })

  it('shows preview with duplicate detection between CSV and existing entries', async () => {
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([
      { address: VALID_ALGORAND_ADDRESS, status: 'active', addedAt: '2024-01-01' } as any,
    ])
    const ADDR2 = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    vi.mocked(whitelistService.validateCsv).mockResolvedValue([
      { valid: true, address: VALID_ALGORAND_ADDRESS, row: 1 } as any,
      { valid: true, address: ADDR2, row: 2 } as any,
    ])
    const w = await mountWM()
    const vm = w.vm as any
    await vm.loadWhitelist()
    vm.csvData = `address\n${VALID_ALGORAND_ADDRESS}\n${ADDR2}`
    vm.validationResults = [
      { valid: true, address: VALID_ALGORAND_ADDRESS, row: 1 },
      { valid: true, address: ADDR2, row: 2 },
    ]
    await vm.showPreviewStep()
    await nextTick()
    expect(vm.showPreview).toBe(true)
    expect(vm.duplicateAddresses).toContain(VALID_ALGORAND_ADDRESS)
    expect(vm.previewAddresses).toContain(ADDR2)
  })
})

describe('WhitelistManagement — confirmBulkUpload branches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([])
  })

  it('returns early when previewAddresses is empty', async () => {
    const w = await mountWM()
    const vm = w.vm as any
    vm.previewAddresses = []
    await vm.confirmBulkUpload()
    expect(whitelistService.bulkUpload).not.toHaveBeenCalled()
  })

  it('shows warning toast when some addresses fail', async () => {
    vi.mocked(whitelistService.bulkUpload).mockResolvedValue({ success: 2, failed: 1 })
    const w = await mountWM()
    const vm = w.vm as any
    vm.previewAddresses = [VALID_ALGORAND_ADDRESS, 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB']
    await vm.confirmBulkUpload()
    await nextTick()
    expect(mockToastSuccess).toHaveBeenCalled()
    expect(mockToastWarning).toHaveBeenCalledWith(expect.stringContaining('failed'))
  })

  it('handles singular success message (1 address)', async () => {
    vi.mocked(whitelistService.bulkUpload).mockResolvedValue({ success: 1, failed: 0 })
    const w = await mountWM()
    const vm = w.vm as any
    vm.previewAddresses = [VALID_ALGORAND_ADDRESS]
    await vm.confirmBulkUpload()
    await nextTick()
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('1 address'))
    expect(mockToastWarning).not.toHaveBeenCalled()
  })

  it('handles error from bulkUpload service call', async () => {
    vi.mocked(whitelistService.bulkUpload).mockRejectedValue(new Error('Upload failed'))
    const w = await mountWM()
    const vm = w.vm as any
    vm.previewAddresses = [VALID_ALGORAND_ADDRESS]
    await vm.confirmBulkUpload()
    await nextTick()
    expect(mockToastError).toHaveBeenCalledWith('Upload failed')
  })
})

describe('WhitelistManagement — closeBulkUploadModal', () => {
  it('resets all bulk upload state', async () => {
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([])
    const w = await mountWM()
    const vm = w.vm as any
    vm.showBulkUploadModal = true
    vm.showPreview = true
    vm.csvData = 'test'
    vm.validationResults = [{ valid: true, address: 'x', row: 1 }]
    vm.closeBulkUploadModal()
    await nextTick()
    expect(vm.showBulkUploadModal).toBe(false)
    expect(vm.showPreview).toBe(false)
    expect(vm.csvData).toBe('')
    expect(vm.validationResults).toEqual([])
  })
})

describe('WhitelistManagement — computed: validCount, invalidCount, duplicateCount', () => {
  it('validCount returns count of valid validation results', async () => {
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([])
    const w = await mountWM()
    const vm = w.vm as any
    vm.validationResults = [
      { valid: true, address: 'A', row: 1 },
      { valid: false, address: 'B', row: 2, error: 'bad' },
    ]
    await nextTick()
    expect(vm.validCount).toBe(1)
    expect(vm.invalidCount).toBe(1)
  })

  it('duplicateCount returns number of duplicates among valid results', async () => {
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([])
    const w = await mountWM()
    const vm = w.vm as any
    vm.validationResults = [
      { valid: true, address: 'A', row: 1 },
      { valid: true, address: 'A', row: 2 },
    ]
    await nextTick()
    expect(vm.duplicateCount).toBe(1)
  })
})
