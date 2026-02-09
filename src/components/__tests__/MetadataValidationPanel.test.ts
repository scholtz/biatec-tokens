/**
 * Unit tests for MetadataValidationPanel component
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetadataValidationPanel from '../MetadataValidationPanel.vue'
import type { MetadataValidationResult } from '../../utils/metadataValidation'

describe('MetadataValidationPanel', () => {
  const perfectResult: MetadataValidationResult = {
    isValid: true,
    standard: 'ARC3',
    score: 100,
    issues: [],
    passedChecks: ['Has name', 'Has description', 'Has valid image URL', 'Has image integrity', 'Valid ARC3 URL format'],
    summary: 'Fully compliant ARC3 metadata with no issues'
  }

  const resultWithIssues: MetadataValidationResult = {
    isValid: false,
    standard: 'ARC3',
    score: 60,
    issues: [
      { field: 'name', severity: 'error', message: 'Token name is required in ARC3 metadata' },
      { field: 'description', severity: 'warning', message: 'Token description is recommended for ARC3 tokens' },
      { field: 'image_integrity', severity: 'info', message: 'Image integrity hash is recommended for verification' }
    ],
    passedChecks: ['Has valid image URL', 'Valid ARC3 URL format'],
    summary: 'ARC3 metadata has 1 error and 2 recommendations'
  }

  describe('Rendering States', () => {
    it('should render loading state', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: null, loading: true }
      })

      expect(wrapper.find('.pi-spinner').exists()).toBe(true)
      expect(wrapper.text()).toContain('Validating metadata')
    })

    it('should render no result state', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: null, loading: false }
      })

      expect(wrapper.find('.pi-info-circle').exists()).toBe(true)
      expect(wrapper.text()).toContain('No metadata validation available')
    })

    it('should render validation result', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      expect(wrapper.text()).toContain('Metadata Validation')
      expect(wrapper.text()).toContain('Validation Status')
    })
  })

  describe('Overall Status Display', () => {
    it('should display quality score', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      expect(wrapper.text()).toContain('100')
      expect(wrapper.text()).toContain('Quality Score')
    })

    it('should display validation summary', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      expect(wrapper.text()).toContain(perfectResult.summary)
    })

    it('should apply green border for excellent score', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      const statusDiv = wrapper.find('.border-green-500\\/30')
      expect(statusDiv.exists()).toBe(true)
    })

    it('should apply red border for poor score', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: { ...perfectResult, score: 30 } }
      })

      const statusDiv = wrapper.find('.border-red-500\\/30')
      expect(statusDiv.exists()).toBe(true)
    })
  })

  describe('Passed Checks Display', () => {
    it('should display all passed checks', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      expect(wrapper.text()).toContain('Passed Checks')
      expect(wrapper.text()).toContain(`(${perfectResult.passedChecks.length})`)
      
      perfectResult.passedChecks.forEach(check => {
        expect(wrapper.text()).toContain(check)
      })
    })

    it('should show check icons for passed checks', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      const checkIcons = wrapper.findAll('.pi-check')
      // At least one check icon per passed check
      expect(checkIcons.length).toBeGreaterThanOrEqual(perfectResult.passedChecks.length)
    })

    it('should apply green styling to passed checks', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      const passedCheckDivs = wrapper.findAll('.bg-green-500\\/10')
      expect(passedCheckDivs.length).toBeGreaterThan(0)
    })
  })

  describe('Issues Display', () => {
    it('should display all issues', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: resultWithIssues }
      })

      expect(wrapper.text()).toContain('Issues Found')
      expect(wrapper.text()).toContain(`(${resultWithIssues.issues.length})`)
      
      resultWithIssues.issues.forEach(issue => {
        expect(wrapper.text()).toContain(issue.field)
        expect(wrapper.text()).toContain(issue.message)
        expect(wrapper.text()).toContain(issue.severity)
      })
    })

    it('should show error icon for error severity', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: resultWithIssues }
      })

      const errorIcons = wrapper.findAll('.pi-times-circle')
      // At least one error icon should exist
      expect(errorIcons.length).toBeGreaterThan(0)
    })

    it('should show warning icon for warning severity', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: resultWithIssues }
      })

      const warningIcons = wrapper.findAll('.pi-exclamation-triangle')
      expect(warningIcons.length).toBeGreaterThan(0)
    })

    it('should show info icon for info severity', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: resultWithIssues }
      })

      const infoIcons = wrapper.findAll('.pi-info-circle')
      expect(infoIcons.length).toBeGreaterThan(0)
    })

    it('should apply appropriate colors based on severity', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: resultWithIssues }
      })

      // Error styling
      expect(wrapper.html()).toContain('border-red-500/30')
      // Warning styling
      expect(wrapper.html()).toContain('border-yellow-500/30')
      // Info styling
      expect(wrapper.html()).toContain('border-blue-500/30')
    })
  })

  describe('No Issues State', () => {
    it('should show success message when no issues', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      expect(wrapper.text()).toContain('No validation issues found')
      expect(wrapper.text()).toContain('This token meets all')
    })

    it('should show success icon when no issues', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      const successIcon = wrapper.find('.pi-check-circle')
      expect(successIcon.exists()).toBe(true)
    })
  })

  describe('Standard Information', () => {
    it('should display ARC3 standard information', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: { ...perfectResult, standard: 'ARC3' } }
      })

      expect(wrapper.text()).toContain('About ARC3 Standard')
      expect(wrapper.text()).toContain('fungible and non-fungible tokens')
      expect(wrapper.text()).toContain('off-chain')
    })

    it('should display ARC69 standard information', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: { ...perfectResult, standard: 'ARC69' } }
      })

      expect(wrapper.text()).toContain('About ARC69 Standard')
      expect(wrapper.text()).toContain('note field')
      expect(wrapper.text()).toContain('on-chain')
    })

    it('should display ARC19 standard information', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: { ...perfectResult, standard: 'ARC19' } }
      })

      expect(wrapper.text()).toContain('About ARC19 Standard')
      expect(wrapper.text()).toContain('dynamic')
      expect(wrapper.text()).toContain('placeholder')
    })

    it('should display ASA standard information', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: { ...perfectResult, standard: 'ASA' } }
      })

      expect(wrapper.text()).toContain('About ASA Standard')
      expect(wrapper.text()).toContain('Standard Algorand Standard Asset')
    })

    it('should have documentation link', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      const link = wrapper.find('a[target="_blank"]')
      expect(link.exists()).toBe(true)
      expect(link.text()).toContain('Learn more')
      expect(link.attributes('href')).toContain('github.com')
    })

    it('should have correct documentation URL for each standard', () => {
      const standards = ['ARC3', 'ARC69', 'ARC19', 'ASA'] as const
      
      standards.forEach(standard => {
        const wrapper = mount(MetadataValidationPanel, {
          props: { validationResult: { ...perfectResult, standard } }
        })
        
        const link = wrapper.find('a[target="_blank"]')
        const href = link.attributes('href')
        
        if (standard === 'ASA') {
          expect(href).toContain('developer.algorand.org')
        } else {
          expect(href).toContain('ARCs')
        }
      })
    })
  })

  describe('Visual Elements', () => {
    it('should have glass-effect styling', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      expect(wrapper.find('.glass-effect').exists()).toBe(true)
    })

    it('should have header with icon', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      expect(wrapper.find('.pi-shield-check').exists()).toBe(true)
      expect(wrapper.text()).toContain('Metadata Validation')
    })

    it('should have rounded corners', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      expect(wrapper.find('.rounded-xl').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have external link icon', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      expect(wrapper.find('.pi-external-link').exists()).toBe(true)
    })

    it('should have rel="noopener noreferrer" on external links', () => {
      const wrapper = mount(MetadataValidationPanel, {
        props: { validationResult: perfectResult }
      })

      const link = wrapper.find('a[target="_blank"]')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
    })
  })
})
