/**
 * Unit tests for MetadataStatusBadge component
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetadataStatusBadge from '../MetadataStatusBadge.vue'
import type { MetadataValidationResult } from '../../utils/metadataValidation'

describe('MetadataStatusBadge', () => {
  const validResult: MetadataValidationResult = {
    isValid: true,
    standard: 'ARC3',
    score: 100,
    issues: [],
    passedChecks: ['Has name', 'Has description', 'Has valid image URL'],
    summary: 'Fully compliant ARC3 metadata with no issues'
  }

  const goodResult: MetadataValidationResult = {
    isValid: true,
    standard: 'ARC3',
    score: 80,
    issues: [
      { field: 'image_integrity', severity: 'info', message: 'Image integrity hash is recommended' }
    ],
    passedChecks: ['Has name', 'Has description'],
    summary: 'Valid ARC3 metadata with 1 recommendation'
  }

  const fairResult: MetadataValidationResult = {
    isValid: true,
    standard: 'ARC3',
    score: 60,
    issues: [
      { field: 'description', severity: 'warning', message: 'Description is recommended' },
      { field: 'image', severity: 'warning', message: 'Image is recommended' }
    ],
    passedChecks: ['Has name'],
    summary: 'Valid ARC3 metadata with 2 warnings'
  }

  const invalidResult: MetadataValidationResult = {
    isValid: false,
    standard: 'ARC3',
    score: 40,
    issues: [
      { field: 'name', severity: 'error', message: 'Name is required' },
      { field: 'image', severity: 'error', message: 'Image URL is invalid' }
    ],
    passedChecks: [],
    summary: 'ARC3 metadata has 2 errors'
  }

  describe('Rendering', () => {
    it('should render with valid metadata', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: validResult }
      })

      expect(wrapper.find('span').exists()).toBe(true)
      expect(wrapper.text()).toContain('ARC3')
      expect(wrapper.text()).toContain('Valid')
    })

    it('should render loading state', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: null, loading: true }
      })

      expect(wrapper.text()).toContain('Validating')
      expect(wrapper.find('.animate-pulse').exists()).toBe(true)
      expect(wrapper.find('.pi-spinner').exists()).toBe(true)
    })

    it('should render no metadata state', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: null }
      })

      expect(wrapper.text()).toContain('No Metadata')
      expect(wrapper.find('.pi-times-circle').exists()).toBe(true)
    })

    it('should show quality score when showScore is true', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: validResult, showScore: true }
      })

      expect(wrapper.text()).toContain('100')
    })

    it('should hide quality score when showScore is false', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: validResult, showScore: false }
      })

      expect(wrapper.findAll('span').length).toBe(1) // Only the main badge, no score
    })
  })

  describe('Badge Colors', () => {
    it('should show green for excellent score (90+)', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: validResult }
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-green-500/20')
      expect(badge.classes()).toContain('text-green-400')
    })

    it('should show yellow for good score (70-89)', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: goodResult }
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-yellow-500/20')
      expect(badge.classes()).toContain('text-yellow-400')
    })

    it('should show orange for fair score (50-69)', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: fairResult }
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-orange-500/20')
      expect(badge.classes()).toContain('text-orange-400')
    })

    it('should show red for poor score (<50)', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: invalidResult }
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-red-500/20')
      expect(badge.classes()).toContain('text-red-400')
    })
  })

  describe('Badge Text', () => {
    it('should show "Valid" for perfect score with no issues', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: validResult }
      })

      expect(wrapper.text()).toContain('Valid')
    })

    it('should show quality label for good score with some issues', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: goodResult }
      })

      expect(wrapper.text()).toContain('Good')
    })

    it('should show "Issues" for invalid metadata', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: invalidResult }
      })

      expect(wrapper.text()).toContain('Issues')
    })
  })

  describe('Icons', () => {
    it('should show check icon for valid metadata', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: validResult }
      })

      expect(wrapper.find('.pi-check-circle').exists()).toBe(true)
    })

    it('should show warning icon for fair score', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: fairResult }
      })

      expect(wrapper.find('.pi-exclamation-triangle').exists()).toBe(true)
    })

    it('should show times icon for invalid metadata', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: invalidResult }
      })

      expect(wrapper.find('.pi-times-circle').exists()).toBe(true)
    })

    it('should show spinner icon when loading', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: null, loading: true }
      })

      expect(wrapper.find('.pi-spinner').exists()).toBe(true)
      expect(wrapper.find('.pi-spin').exists()).toBe(true)
    })
  })

  describe('Tooltips', () => {
    it('should have tooltip with validation summary', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: validResult }
      })

      const badge = wrapper.find('span')
      expect(badge.attributes('title')).toBe(validResult.summary)
    })

    it('should have tooltip for loading state', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: null, loading: true }
      })

      const badge = wrapper.find('span')
      expect(badge.attributes('title')).toContain('Validating')
    })

    it('should have tooltip for no metadata state', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: null }
      })

      const badge = wrapper.find('span')
      expect(badge.attributes('title')).toContain('No metadata')
    })

    it('should have score tooltip when showing score', () => {
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: validResult, showScore: true }
      })

      const scoreSpan = wrapper.findAll('span')[1]
      expect(scoreSpan.attributes('title')).toContain('Quality Score')
      expect(scoreSpan.attributes('title')).toContain('100')
    })
  })

  describe('Different Standards', () => {
    it('should display ARC3 standard', () => {
      const arc3Result = { ...validResult, standard: 'ARC3' as const }
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: arc3Result }
      })

      expect(wrapper.text()).toContain('ARC3')
    })

    it('should display ARC69 standard', () => {
      const arc69Result = { ...validResult, standard: 'ARC69' as const }
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: arc69Result }
      })

      expect(wrapper.text()).toContain('ARC69')
    })

    it('should display ARC19 standard', () => {
      const arc19Result = { ...validResult, standard: 'ARC19' as const }
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: arc19Result }
      })

      expect(wrapper.text()).toContain('ARC19')
    })

    it('should display ASA standard', () => {
      const asaResult = { ...validResult, standard: 'ASA' as const }
      const wrapper = mount(MetadataStatusBadge, {
        props: { validationResult: asaResult }
      })

      expect(wrapper.text()).toContain('ASA')
    })
  })
})
