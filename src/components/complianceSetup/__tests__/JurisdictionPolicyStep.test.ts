import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import JurisdictionPolicyStep from '../JurisdictionPolicyStep.vue'
import type { JurisdictionPolicy } from '../../../types/complianceSetup'

describe('JurisdictionPolicyStep Component', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(JurisdictionPolicyStep)
  })

  describe('Component Rendering', () => {
    it('should render the component', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should display step title and description', () => {
      expect(wrapper.text()).toContain('Jurisdiction & Distribution Policy')
      expect(wrapper.text()).toContain('Configure where your token is issued from')
    })

    it('should render issuer jurisdiction section', () => {
      expect(wrapper.text()).toContain('Issuer Jurisdiction')
      expect(wrapper.text()).toContain('Country of Registration')
      expect(wrapper.text()).toContain('Jurisdiction Type')
    })

    it('should render distribution geography section', () => {
      expect(wrapper.text()).toContain('Distribution Geography')
      expect(wrapper.text()).toContain('Distribution Scope')
    })

    it('should render target investors section', () => {
      expect(wrapper.text()).toContain('Target Investors')
      expect(wrapper.text()).toContain('Investor Types')
    })

    it('should render regulatory framework section', () => {
      expect(wrapper.text()).toContain('Regulatory Framework')
      expect(wrapper.text()).toContain('MICA Compliance')
      expect(wrapper.text()).toContain('SEC Compliance')
    })

    it('should render why this matters section', () => {
      expect(wrapper.text()).toContain('Why This Matters')
      expect(wrapper.text()).toContain('Comply with local and international securities laws')
    })
  })

  describe('Form Field Defaults', () => {
    it('should have empty issuer country by default', () => {
      expect(wrapper.vm.formData.issuerCountry).toBe('')
    })

    it('should have "other" as default jurisdiction type', () => {
      expect(wrapper.vm.formData.issuerJurisdictionType).toBe('other')
    })

    it('should have "global" as default distribution scope', () => {
      expect(wrapper.vm.formData.distributionScope).toBe('global')
    })

    it('should have empty investor types by default', () => {
      expect(wrapper.vm.formData.investorTypes).toEqual([])
    })

    it('should have accreditation not required by default', () => {
      expect(wrapper.vm.formData.requiresAccreditation).toBe(false)
    })

    it('should have MICA compliance off by default', () => {
      expect(wrapper.vm.formData.requiresMICACompliance).toBe(false)
    })

    it('should have SEC compliance off by default', () => {
      expect(wrapper.vm.formData.requiresSECCompliance).toBe(false)
    })
  })

  describe('Country Selection', () => {
    it('should display country dropdown options', async () => {
      const selects = wrapper.findAll('select')
      const countrySelect = selects.find((s: any) => 
        s.findAll('option').some((o: any) => o.text().includes('United States'))
      )
      expect(countrySelect).toBeDefined()
    })

    it('should have US in country list', () => {
      expect(wrapper.vm.countries.some((c: any) => c.code === 'US')).toBe(true)
    })

    it('should have major countries in list', () => {
      const codes = wrapper.vm.countries.map((c: any) => c.code)
      expect(codes).toContain('US')
      expect(codes).toContain('GB')
      expect(codes).toContain('DE')
      expect(codes).toContain('JP')
      expect(codes).toContain('SG')
    })

    it('should emit update when country changes', async () => {
      wrapper.vm.formData.issuerCountry = 'US'
      await wrapper.vm.handleFieldChange()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('validation-change')).toBeTruthy()
    })
  })

  describe('Jurisdiction Type Selection', () => {
    it('should have all jurisdiction type options', () => {
      const options = ['eu', 'us', 'asia_pacific', 'middle_east', 'other']
      options.forEach(option => {
        wrapper.vm.formData.issuerJurisdictionType = option
        expect(wrapper.vm.formData.issuerJurisdictionType).toBe(option)
      })
    })

    it('should emit events when jurisdiction type changes', async () => {
      wrapper.vm.formData.issuerJurisdictionType = 'eu'
      await wrapper.vm.handleFieldChange()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('Distribution Scope', () => {
    it('should render all distribution scope radio options', () => {
      const text = wrapper.text()
      expect(text).toContain('Global')
      expect(text).toContain('Regional')
      expect(text).toContain('Country-Specific')
    })

    it('should change distribution scope', async () => {
      wrapper.vm.formData.distributionScope = 'regional'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.formData.distributionScope).toBe('regional')
    })

    it('should show allowed countries field when country_specific selected', async () => {
      wrapper.vm.formData.distributionScope = 'country_specific'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('Allowed Countries')
    })

    it('should not show allowed countries field for global scope', async () => {
      wrapper.vm.formData.distributionScope = 'global'
      await wrapper.vm.$nextTick()
      
      const multiSelects = wrapper.findAll('select[multiple]')
      expect(multiSelects.length).toBe(0)
    })

    it('should emit events when distribution scope changes', async () => {
      wrapper.vm.formData.distributionScope = 'country_specific'
      await wrapper.vm.handleFieldChange()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('validation-change')).toBeTruthy()
    })
  })

  describe('Investor Types', () => {
    it('should display all investor type options', () => {
      const investorTypes = [
        'Retail Investors',
        'Accredited Investors',
        'Institutional Investors',
        'Qualified Purchasers',
        'Professional Investors'
      ]
      
      investorTypes.forEach(type => {
        expect(wrapper.text()).toContain(type)
      })
    })

    it('should allow selecting multiple investor types', async () => {
      wrapper.vm.formData.investorTypes = ['retail', 'accredited']
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.formData.investorTypes).toHaveLength(2)
      expect(wrapper.vm.formData.investorTypes).toContain('retail')
      expect(wrapper.vm.formData.investorTypes).toContain('accredited')
    })

    it('should emit events when investor types change', async () => {
      wrapper.vm.formData.investorTypes = ['institutional']
      await wrapper.vm.handleFieldChange()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('Accreditation Requirement', () => {
    it('should display accreditation checkbox', () => {
      expect(wrapper.text()).toContain('Accreditation Required')
    })

    it('should toggle accreditation requirement', async () => {
      wrapper.vm.formData.requiresAccreditation = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.formData.requiresAccreditation).toBe(true)
      
      wrapper.vm.formData.requiresAccreditation = false
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.formData.requiresAccreditation).toBe(false)
    })
  })

  describe('Regulatory Framework', () => {
    it('should display MICA compliance checkbox', () => {
      expect(wrapper.text()).toContain('MICA Compliance')
      expect(wrapper.text()).toContain('EU Markets in Crypto-Assets regulation')
    })

    it('should display SEC compliance checkbox', () => {
      expect(wrapper.text()).toContain('SEC Compliance')
      expect(wrapper.text()).toContain('US Securities and Exchange Commission')
    })

    it('should show MICA info when enabled', async () => {
      wrapper.vm.formData.requiresMICACompliance = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('MICA compliance requires additional documentation')
    })

    it('should show SEC info when enabled', async () => {
      wrapper.vm.formData.requiresSECCompliance = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('SEC compliance requires securities law expertise')
    })

    it('should emit events when regulatory options change', async () => {
      wrapper.vm.formData.requiresMICACompliance = true
      await wrapper.vm.handleFieldChange()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('Policy Summary', () => {
    it('should not show policy summary with incomplete data', () => {
      expect(wrapper.vm.policySummary).toBe('')
    })

    it('should generate policy summary with complete data', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['accredited', 'institutional'],
        requiresAccreditation: true,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.policySummary).toBeTruthy()
      expect(wrapper.vm.policySummary).toContain('United States')
      expect(wrapper.vm.policySummary).toContain('globally')
    })

    it('should include investor types in summary', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['retail', 'accredited'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.policySummary).toContain('retail')
      expect(wrapper.vm.policySummary).toContain('accredited')
    })

    it('should include accreditation in summary when required', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['accredited'],
        requiresAccreditation: true,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.policySummary).toContain('Accreditation required')
    })

    it('should include MICA in summary when enabled', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'DE',
        issuerJurisdictionType: 'eu',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'mica',
        requiresMICACompliance: true,
        requiresSECCompliance: false,
      }
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.policySummary).toContain('MICA')
    })

    it('should include SEC in summary when enabled', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'sec',
        requiresMICACompliance: false,
        requiresSECCompliance: true,
      }
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.policySummary).toContain('SEC')
    })

    it('should show country count for country-specific distribution', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'country_specific',
        allowedCountries: ['US', 'GB', 'DE'],
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.policySummary).toContain('3 specific countries')
    })
  })

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const validation = wrapper.vm.validateForm()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some((e: any) => e.field === 'issuerCountry')).toBe(true)
      expect(validation.errors.some((e: any) => e.field === 'investorTypes')).toBe(true)
    })

    it('should validate with complete required fields', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }
      
      const validation = wrapper.vm.validateForm()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors.length).toBe(0)
    })

    it('should show validation error for empty issuer country', async () => {
      wrapper.vm.formData.issuerCountry = ''
      wrapper.vm.validateForm()
      
      expect(wrapper.vm.validationErrors.issuerCountry).toBeTruthy()
    })

    it('should show validation error for empty investor types', async () => {
      wrapper.vm.formData.investorTypes = []
      wrapper.vm.validateForm()
      
      expect(wrapper.vm.validationErrors.investorTypes).toBeTruthy()
    })

    it('should validate country_specific requires allowed countries', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'country_specific',
        allowedCountries: [],
        investorTypes: ['retail'],
        requiresAccreditation: false,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }
      
      const validation = wrapper.vm.validateForm()
      
      expect(validation.errors.some((e: any) => e.field === 'allowedCountries')).toBe(true)
    })

    it('should emit validation-change on field change', async () => {
      wrapper.vm.formData.issuerCountry = 'US'
      await wrapper.vm.handleFieldChange()
      
      expect(wrapper.emitted('validation-change')).toBeTruthy()
      const emitted = wrapper.emitted('validation-change') as any[]
      expect(emitted[emitted.length - 1][0]).toHaveProperty('isValid')
      expect(emitted[emitted.length - 1][0]).toHaveProperty('errors')
      expect(emitted[emitted.length - 1][0]).toHaveProperty('warnings')
    })
  })

  describe('Validation Warnings', () => {
    it('should warn about retail + accreditation', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['retail'],
        requiresAccreditation: true,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }
      
      const validation = wrapper.vm.validateForm()
      
      expect(validation.warnings.length).toBeGreaterThan(0)
      expect(validation.warnings.some((w: any) => w.field === 'investorTypes')).toBe(true)
      expect(validation.warnings.some((w: any) => 
        w.message.toLowerCase().includes('retail') && 
        w.message.toLowerCase().includes('accreditation')
      )).toBe(true)
    })

    it('should warn about MICA for non-EU', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'mica',
        requiresMICACompliance: true,
        requiresSECCompliance: false,
      }
      
      const validation = wrapper.vm.validateForm()
      
      expect(validation.warnings.some((w: any) => w.field === 'requiresMICACompliance')).toBe(true)
      expect(validation.warnings.some((w: any) => 
        w.message.toLowerCase().includes('mica') && 
        w.message.toLowerCase().includes('eu')
      )).toBe(true)
    })

    it('should display warnings in UI', async () => {
      wrapper.vm.formData = {
        issuerCountry: 'US',
        issuerJurisdictionType: 'us',
        distributionScope: 'global',
        investorTypes: ['retail'],
        requiresAccreditation: true,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }
      
      wrapper.vm.validateForm()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('Error Display', () => {
    it('should display critical errors in UI', async () => {
      wrapper.vm.validationErrors.issuerCountry = 'Issuer country is required'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('Issuer country is required')
    })

    it('should clear errors when field is fixed', async () => {
      wrapper.vm.formData.issuerCountry = ''
      wrapper.vm.validateForm()
      expect(wrapper.vm.validationErrors.issuerCountry).toBeTruthy()
      
      wrapper.vm.formData.issuerCountry = 'US'
      wrapper.vm.validateForm()
      expect(wrapper.vm.validationErrors.issuerCountry).toBeFalsy()
    })
  })

  describe('Props and Events', () => {
    it('should accept modelValue prop', async () => {
      const policy: JurisdictionPolicy = {
        issuerCountry: 'GB',
        issuerJurisdictionType: 'other',
        distributionScope: 'regional',
        investorTypes: ['accredited'],
        requiresAccreditation: true,
        regulatoryFramework: 'none',
        requiresMICACompliance: false,
        requiresSECCompliance: false,
      }
      
      const wrapper2 = mount(JurisdictionPolicyStep, {
        props: {
          modelValue: policy
        }
      })
      
      await wrapper2.vm.$nextTick()
      
      expect(wrapper2.vm.formData.issuerCountry).toBe('GB')
      expect(wrapper2.vm.formData.distributionScope).toBe('regional')
      expect(wrapper2.vm.formData.investorTypes).toContain('accredited')
    })

    it('should emit update:modelValue on change', async () => {
      wrapper.vm.formData.issuerCountry = 'US'
      await wrapper.vm.handleFieldChange()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emitted = wrapper.emitted('update:modelValue') as any[]
      expect(emitted[emitted.length - 1][0]).toHaveProperty('issuerCountry')
    })

    it('should emit validation-change with correct structure', async () => {
      wrapper.vm.formData.issuerCountry = 'US'
      await wrapper.vm.handleFieldChange()
      
      const emitted = wrapper.emitted('validation-change') as any[]
      const validation = emitted[emitted.length - 1][0]
      
      expect(validation).toHaveProperty('isValid')
      expect(validation).toHaveProperty('errors')
      expect(validation).toHaveProperty('warnings')
      expect(validation).toHaveProperty('canProceed')
    })

    it('should watch for external modelValue changes', async () => {
      const policy: JurisdictionPolicy = {
        issuerCountry: 'DE',
        issuerJurisdictionType: 'eu',
        distributionScope: 'global',
        investorTypes: ['institutional'],
        requiresAccreditation: false,
        regulatoryFramework: 'mica',
        requiresMICACompliance: true,
        requiresSECCompliance: false,
      }
      
      await wrapper.setProps({ modelValue: policy })
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.formData.issuerCountry).toBe('DE')
      expect(wrapper.vm.formData.requiresMICACompliance).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle selecting all investor types', async () => {
      wrapper.vm.formData.investorTypes = [
        'retail', 
        'accredited', 
        'institutional', 
        'qualified_purchaser', 
        'professional'
      ]
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.formData.investorTypes).toHaveLength(5)
    })

    it('should handle deselecting all investor types', async () => {
      wrapper.vm.formData.investorTypes = ['retail']
      await wrapper.vm.$nextTick()
      
      wrapper.vm.formData.investorTypes = []
      const validation = wrapper.vm.validateForm()
      
      expect(validation.errors.some((e: any) => e.field === 'investorTypes')).toBe(true)
    })

    it('should handle multiple regulatory frameworks', async () => {
      wrapper.vm.formData.requiresMICACompliance = true
      wrapper.vm.formData.requiresSECCompliance = true
      await wrapper.vm.$nextTick()
      
      const summary = wrapper.vm.policySummary
      // Will only show in summary if other fields are complete
      wrapper.vm.formData.issuerCountry = 'US'
      wrapper.vm.formData.investorTypes = ['institutional']
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.policySummary).toBeTruthy()
    })

    it('should handle undefined modelValue prop', () => {
      const wrapper2 = mount(JurisdictionPolicyStep, {
        props: {
          modelValue: undefined
        }
      })
      
      expect(wrapper2.vm.formData).toBeDefined()
      expect(wrapper2.vm.formData.issuerCountry).toBe('')
    })

    it('should validate on mount', async () => {
      const wrapper2 = mount(JurisdictionPolicyStep)
      await wrapper2.vm.$nextTick()
      
      expect(wrapper2.emitted('validation-change')).toBeTruthy()
    })
  })
})
