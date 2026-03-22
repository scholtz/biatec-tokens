import { describe, it, expect, beforeEach } from 'vitest'
import { WhitelistService, whitelistService } from '../whitelistService'

describe('WhitelistService', () => {
  let service: WhitelistService

  beforeEach(() => {
    service = new WhitelistService()
  })

  describe('getWhitelistEntries', () => {
    it('returns paginated entries', async () => {
      const result = await service.getWhitelistEntries()
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('perPage')
      expect(result).toHaveProperty('totalPages')
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('returns entries with expected fields', async () => {
      const result = await service.getWhitelistEntries()
      if (result.data.length > 0) {
        const entry = result.data[0]
        expect(entry).toHaveProperty('id')
        expect(entry).toHaveProperty('name')
        expect(entry).toHaveProperty('status')
        expect(entry).toHaveProperty('jurisdictionCode')
      }
    })

    it('filters by status', async () => {
      const result = await service.getWhitelistEntries({ status: 'approved' })
      result.data.forEach(entry => {
        expect(entry.status).toBe('approved')
      })
    })

    it('filters by jurisdiction code', async () => {
      const result = await service.getWhitelistEntries({ jurisdictionCode: 'US' })
      result.data.forEach(entry => {
        expect(entry.jurisdictionCode).toBe('US')
      })
    })

    it('filters by search query (name match)', async () => {
      const result = await service.getWhitelistEntries({ search: 'John' })
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('applies pagination (page 1, perPage 1)', async () => {
      const result = await service.getWhitelistEntries({ page: 1, perPage: 1 })
      expect(result.data.length).toBeLessThanOrEqual(1)
      expect(result.perPage).toBe(1)
    })
  })

  describe('getWhitelistSummary', () => {
    it('returns summary object with counts', async () => {
      const summary = await service.getWhitelistSummary()
      expect(summary).toHaveProperty('totalEntries')
      expect(summary).toHaveProperty('approvedCount')
      expect(summary).toHaveProperty('pendingCount')
      expect(summary).toHaveProperty('rejectedCount')
    })

    it('summary totalEntries is a number', async () => {
      const summary = await service.getWhitelistSummary()
      expect(typeof summary.totalEntries).toBe('number')
      expect(typeof summary.approvedCount).toBe('number')
    })
  })

  describe('getWhitelistEntry', () => {
    it('returns existing entry by id', async () => {
      const entries = await service.getWhitelistEntries()
      if (entries.data.length > 0) {
        const id = entries.data[0].id
        const entry = await service.getWhitelistEntry(id)
        expect(entry).not.toBeNull()
        expect(entry?.id).toBe(id)
      }
    })

    it('returns null for unknown id', async () => {
      const entry = await service.getWhitelistEntry('non-existent-id-xyz')
      expect(entry).toBeNull()
    })
  })

  describe('createWhitelistEntry', () => {
    it('creates a new entry and returns it with an id', async () => {
      const request = {
        name: 'Test User',
        email: 'test@example.com',
        entityType: 'individual' as const,
        jurisdictionCode: 'DE',
        kycStatus: 'pending' as const,
        accreditationStatus: 'not_required' as const,
        riskLevel: 'low' as const,
        documentationComplete: false,
      }
      const entry = await service.createWhitelistEntry(request)
      expect(entry).toHaveProperty('id')
      expect(entry.name).toBe('Test User')
      expect(entry.email).toBe('test@example.com')
      expect(entry.status).toBe('pending')
    })
  })

  describe('approveWhitelistEntry', () => {
    it('approves an existing pending entry', async () => {
      const entries = await service.getWhitelistEntries({ status: ['pending'] })
      if (entries.data.length > 0) {
        const id = entries.data[0].id
        const result = await service.approveWhitelistEntry({ id, notes: 'Approved' })
        expect(result?.status).toBe('approved')
      }
    })

    it('returns null for non-existent entry', async () => {
      const result = await service.approveWhitelistEntry({ entryId: 'no-such-id', approvedBy: 'a@b.com' })
      expect(result).toBeNull()
    })
  })

  describe('rejectWhitelistEntry', () => {
    it('rejects an existing pending entry', async () => {
      const entries = await service.getWhitelistEntries({ status: ['pending'] })
      if (entries.data.length > 0) {
        const id = entries.data[0].id
        const result = await service.rejectWhitelistEntry({ id, reason: 'Docs missing' })
        expect(result?.status).toBe('rejected')
      }
    })

    it('returns null for non-existent entry', async () => {
      const result = await service.rejectWhitelistEntry({ entryId: 'no-such-id', rejectedBy: 'a@b.com', reason: 'n/a' })
      expect(result).toBeNull()
    })
  })

  describe('requestMoreInfo', () => {
    it('updates entry status to under_review', async () => {
      const entries = await service.getWhitelistEntries({ status: ['pending'] })
      if (entries.data.length > 0) {
        const id = entries.data[0].id
        const result = await service.requestMoreInfo({ id, requestedInfo: ['Need docs'] })
        expect(result.status).toBe('under_review')
      }
    })
  })

  describe('updateWhitelistEntry', () => {
    it('updates an existing entry', async () => {
      const entries = await service.getWhitelistEntries()
      if (entries.data.length > 0) {
        const id = entries.data[0].id
        const result = await service.updateWhitelistEntry(id, { notes: 'Updated note' })
        expect(result?.notes).toBe('Updated note')
      }
    })

    it('returns null for non-existent entry', async () => {
      const result = await service.updateWhitelistEntry('no-such-id', { notes: 'x' })
      expect(result).toBeNull()
    })
  })

  describe('getJurisdictionRules', () => {
    it('returns an array of rules', async () => {
      const rules = await service.getJurisdictionRules()
      expect(Array.isArray(rules)).toBe(true)
    })

    it('each rule has required fields', async () => {
      const rules = await service.getJurisdictionRules()
      if (rules.length > 0) {
        const rule = rules[0]
        expect(rule).toHaveProperty('id')
        expect(rule).toHaveProperty('countryCode')
        expect(rule).toHaveProperty('status')
      }
    })
  })

  describe('getJurisdictionCoverage', () => {
    it('returns coverage object', async () => {
      const coverage = await service.getJurisdictionCoverage()
      expect(coverage).toHaveProperty('totalJurisdictions')
      expect(coverage).toHaveProperty('allowedJurisdictions')
      expect(coverage).toHaveProperty('blockedJurisdictions')
    })
  })

  describe('createJurisdictionRule', () => {
    it('creates and returns a new jurisdiction rule', async () => {
      const rule = await service.createJurisdictionRule({
        countryCode: 'NZ',
        countryName: 'New Zealand',
        status: 'allowed',
        tokenPrograms: [],
        requiresAdditionalVerification: false,
        notes: 'Test',
      })
      expect(rule).toHaveProperty('id')
      expect(rule.countryCode).toBe('NZ')
    })
  })

  describe('updateJurisdictionRule', () => {
    it('updates an existing rule', async () => {
      const rules = await service.getJurisdictionRules()
      if (rules.length > 0) {
        const updated = await service.updateJurisdictionRule(rules[0].id, { notes: 'Updated' })
        expect(updated.notes).toBe('Updated')
      }
    })
  })

  describe('deleteJurisdictionRule', () => {
    it('removes a rule without error', async () => {
      const rules = await service.getJurisdictionRules()
      if (rules.length > 0) {
        await expect(service.deleteJurisdictionRule(rules[0].id)).resolves.toBeUndefined()
      }
    })
  })

  describe('checkJurisdictionConflicts', () => {
    it('returns an array of conflicts', async () => {
      const conflicts = await service.checkJurisdictionConflicts()
      expect(Array.isArray(conflicts)).toBe(true)
    })
  })

  describe('validateCsv', () => {
    it('returns validation result object', async () => {
      const file = new File(['name,email\nJohn,john@example.com'], 'test.csv', { type: 'text/csv' })
      const result = await service.validateCsv(file)
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('totalRows')
    })
  })

  describe('bulkImport', () => {
    it('returns bulk import response', async () => {
      const result = await service.bulkImport({ entries: [], dryRun: true })
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('totalProcessed')
    })
  })

  describe('singleton export', () => {
    it('exports a singleton whitelistService instance', () => {
      expect(whitelistService).toBeInstanceOf(WhitelistService)
    })
  })
})
