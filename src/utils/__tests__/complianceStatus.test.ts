import { describe, it, expect } from 'vitest'
import {
  getComplianceStatusMetadata,
  getAMLVerdictMetadata,
  canIssueTokens,
  getBlockedIssuanceMessage,
  getNextActionText,
  normalizeComplianceStatus,
  requiresUserAction,
  getEstimatedCompletionTime,
} from '../complianceStatus'
import type { UserComplianceStatus, AMLScreeningVerdict } from '../../types/compliance'

describe('complianceStatus utility', () => {
  describe('getComplianceStatusMetadata', () => {
    it('should return correct metadata for not_started status', () => {
      const metadata = getComplianceStatusMetadata('not_started')
      
      expect(metadata.label).toBe('Not Started')
      expect(metadata.color).toBe('gray')
      expect(metadata.requiresAction).toBe(true)
      expect(metadata.canRetry).toBe(false)
    })

    it('should return correct metadata for approved status', () => {
      const metadata = getComplianceStatusMetadata('approved')
      
      expect(metadata.label).toBe('Approved')
      expect(metadata.color).toBe('green')
      expect(metadata.requiresAction).toBe(false)
      expect(metadata.canRetry).toBe(false)
    })

    it('should return correct metadata for rejected status', () => {
      const metadata = getComplianceStatusMetadata('rejected')
      
      expect(metadata.label).toBe('Rejected')
      expect(metadata.color).toBe('red')
      expect(metadata.requiresAction).toBe(true)
      expect(metadata.canRetry).toBe(true)
    })

    it('should return correct metadata for blocked_by_aml status', () => {
      const metadata = getComplianceStatusMetadata('blocked_by_aml')
      
      expect(metadata.label).toBe('AML Block')
      expect(metadata.color).toBe('red')
      expect(metadata.requiresAction).toBe(true)
      expect(metadata.canRetry).toBe(false)
    })

    it('should return correct metadata for all status values', () => {
      const statuses: UserComplianceStatus[] = [
        'not_started',
        'pending_documents',
        'pending_review',
        'approved',
        'rejected',
        'escalated',
        'blocked_by_aml',
        'expired',
      ]

      statuses.forEach(status => {
        const metadata = getComplianceStatusMetadata(status)
        expect(metadata).toBeDefined()
        expect(metadata.label).toBeTruthy()
        expect(metadata.color).toBeTruthy()
        expect(metadata.description).toBeTruthy()
      })
    })
  })

  describe('getAMLVerdictMetadata', () => {
    it('should return correct metadata for clear verdict', () => {
      const metadata = getAMLVerdictMetadata('clear')
      
      expect(metadata.label).toBe('Clear')
      expect(metadata.color).toBe('green')
      expect(metadata.isBlocking).toBe(false)
      expect(metadata.requiresAction).toBe(false)
    })

    it('should return correct metadata for confirmed_match verdict', () => {
      const metadata = getAMLVerdictMetadata('confirmed_match')
      
      expect(metadata.label).toBe('Confirmed Match')
      expect(metadata.color).toBe('red')
      expect(metadata.isBlocking).toBe(true)
      expect(metadata.requiresAction).toBe(true)
    })

    it('should return correct metadata for all verdict values', () => {
      const verdicts: AMLScreeningVerdict[] = [
        'not_started',
        'in_progress',
        'clear',
        'potential_match',
        'confirmed_match',
        'error',
        'manual_review',
      ]

      verdicts.forEach(verdict => {
        const metadata = getAMLVerdictMetadata(verdict)
        expect(metadata).toBeDefined()
        expect(metadata.label).toBeTruthy()
        expect(metadata.description).toBeTruthy()
      })
    })
  })

  describe('canIssueTokens', () => {
    it('should return true only for approved status', () => {
      expect(canIssueTokens('approved')).toBe(true)
    })

    it('should return false for all non-approved statuses', () => {
      const statuses: UserComplianceStatus[] = [
        'not_started',
        'pending_documents',
        'pending_review',
        'rejected',
        'escalated',
        'blocked_by_aml',
        'expired',
      ]

      statuses.forEach(status => {
        expect(canIssueTokens(status)).toBe(false)
      })
    })
  })

  describe('getBlockedIssuanceMessage', () => {
    it('should return message with status label', () => {
      const message = getBlockedIssuanceMessage('pending_review', [])
      
      expect(message).toContain('Under Review')
      expect(message).toContain('unavailable')
    })

    it('should include reasons when provided', () => {
      const reasons = ['Missing document A', 'Invalid document B']
      const message = getBlockedIssuanceMessage('pending_documents', reasons)
      
      expect(message).toContain(reasons[0])
      expect(message).toContain(reasons[1])
    })

    it('should include status description when no reasons provided', () => {
      const message = getBlockedIssuanceMessage('expired', [])
      
      expect(message).toContain('expired')
      expect(message).toContain('re-verification')
    })
  })

  describe('getNextActionText', () => {
    it('should return appropriate action text for each status', () => {
      expect(getNextActionText('not_started')).toContain('Start compliance')
      expect(getNextActionText('pending_documents')).toContain('Upload')
      expect(getNextActionText('pending_review')).toContain('being reviewed')
      expect(getNextActionText('approved')).toContain('issue tokens')
      expect(getNextActionText('rejected')).toContain('rejection')
      expect(getNextActionText('escalated')).toContain('manual review')
      expect(getNextActionText('blocked_by_aml')).toContain('Contact support')
      expect(getNextActionText('expired')).toContain('expired')
    })
  })

  describe('normalizeComplianceStatus', () => {
    it('should normalize backend status strings to enums', () => {
      expect(normalizeComplianceStatus('not_started')).toBe('not_started')
      expect(normalizeComplianceStatus('NOT_STARTED')).toBe('not_started')
      expect(normalizeComplianceStatus('Not Started')).toBe('not_started')
      expect(normalizeComplianceStatus('not-started')).toBe('not_started')
    })

    it('should handle all valid status values', () => {
      const backendStatuses = [
        'not_started',
        'pending_documents',
        'pending_review',
        'approved',
        'rejected',
        'escalated',
        'blocked_by_aml',
        'expired',
      ]

      backendStatuses.forEach(status => {
        const normalized = normalizeComplianceStatus(status)
        expect(backendStatuses).toContain(normalized)
      })
    })

    it('should fallback to not_started for unknown statuses', () => {
      expect(normalizeComplianceStatus('unknown_status')).toBe('not_started')
      expect(normalizeComplianceStatus('invalid')).toBe('not_started')
      expect(normalizeComplianceStatus('')).toBe('not_started')
    })
  })

  describe('requiresUserAction', () => {
    it('should return true for statuses requiring action', () => {
      const actionRequired: UserComplianceStatus[] = [
        'not_started',
        'pending_documents',
        'rejected',
        'blocked_by_aml',
        'expired',
      ]

      actionRequired.forEach(status => {
        expect(requiresUserAction(status)).toBe(true)
      })
    })

    it('should return false for statuses not requiring action', () => {
      const noActionRequired: UserComplianceStatus[] = [
        'pending_review',
        'approved',
        'escalated',
      ]

      noActionRequired.forEach(status => {
        expect(requiresUserAction(status)).toBe(false)
      })
    })
  })

  describe('getEstimatedCompletionTime', () => {
    it('should return time estimates for all statuses', () => {
      const statuses: UserComplianceStatus[] = [
        'not_started',
        'pending_documents',
        'pending_review',
        'approved',
        'rejected',
        'escalated',
        'blocked_by_aml',
        'expired',
      ]

      statuses.forEach(status => {
        const estimate = getEstimatedCompletionTime(status)
        expect(estimate).toBeTruthy()
        expect(typeof estimate).toBe('string')
      })
    })

    it('should return "Complete" for approved status', () => {
      expect(getEstimatedCompletionTime('approved')).toBe('Complete')
    })

    it('should return business day estimates for review statuses', () => {
      const estimate = getEstimatedCompletionTime('pending_review')
      expect(estimate).toContain('business days')
    })
  })
})
