import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MetadataStep from '../MetadataStep.vue'
import { useTokenDraftStore } from '../../../../stores/tokenDraft'

describe('MetadataStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Component Rendering', () => {
    it('should render the metadata step with title', () => {
      const wrapper = mount(MetadataStep)
      expect(wrapper.find('h4').text()).toContain('Metadata Input Method')
    })

    it('should show guided form by default', () => {
      const wrapper = mount(MetadataStep)
      // Check that the image URL input is visible (part of guided form)
      const imageUrlInput = wrapper.find('input#image-url')
      expect(imageUrlInput.exists()).toBe(true)
    })

    it('should show JSON editor option', () => {
      const wrapper = mount(MetadataStep)
      const jsonButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('JSON Editor')
      )
      expect(jsonButton).toBeDefined()
    })
  })

  describe('Input Mode Toggle', () => {
    it('should toggle between guided and JSON modes', async () => {
      const wrapper = mount(MetadataStep)
      
      // Initially in guided mode
      expect(wrapper.vm.inputMode).toBe('guided')
      
      // Find and click JSON editor button
      const buttons = wrapper.findAll('button')
      const jsonButton = buttons.find(btn => btn.text().includes('JSON Editor'))
      await jsonButton?.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.inputMode).toBe('json')
    })

    it('should show guided form fields when in guided mode', () => {
      const wrapper = mount(MetadataStep)
      const imageUrlInput = wrapper.find('input#image-url')
      expect(imageUrlInput.exists()).toBe(true)
    })

    it('should show JSON textarea when in JSON mode', async () => {
      const wrapper = mount(MetadataStep)
      
      // Switch to JSON mode
      const buttons = wrapper.findAll('button')
      const jsonButton = buttons.find(btn => btn.text().includes('JSON Editor'))
      await jsonButton?.trigger('click')
      await wrapper.vm.$nextTick()
      
      const jsonTextarea = wrapper.find('textarea#json-input')
      expect(jsonTextarea.exists()).toBe(true)
    })
  })

  describe('Guided Form Validation', () => {
    it('should validate image URL format', async () => {
      const wrapper = mount(MetadataStep)
      
      // Fill invalid image URL
      const imageInput = wrapper.find('input#image-url')
      await imageInput.setValue('not-a-url')
      await imageInput.trigger('blur')
      
      // Validate
      wrapper.vm.validateAll()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.fieldErrors.imageUrl).toBeTruthy()
    })

    it('should validate external URL format', async () => {
      const wrapper = mount(MetadataStep)
      
      // Fill invalid URL
      const urlInput = wrapper.find('input#external-url')
      await urlInput.setValue('invalid-url')
      await urlInput.trigger('blur')
      
      // Validate
      wrapper.vm.validateAll()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.fieldErrors.url).toBeTruthy()
    })

    it('should validate description length', async () => {
      const wrapper = mount(MetadataStep)
      
      // Fill description over 1000 characters
      const longDescription = 'a'.repeat(1001)
      const descTextarea = wrapper.find('textarea#token-description')
      await descTextarea.setValue(longDescription)
      
      // Validate
      wrapper.vm.validateAll()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.fieldErrors.description).toBeTruthy()
    })

    it('should accept valid image URLs', async () => {
      const wrapper = mount(MetadataStep)
      
      const validUrls = [
        'https://example.com/image.png',
        'https://example.com/image.jpg',
        'https://example.com/image.svg',
      ]
      
      for (const url of validUrls) {
        const imageInput = wrapper.find('input#image-url')
        await imageInput.setValue(url)
        
        wrapper.vm.validateAll()
        await wrapper.vm.$nextTick()
        
        expect(wrapper.vm.fieldErrors.imageUrl).toBeFalsy()
      }
    })
  })

  describe('Custom Attributes', () => {
    it('should add new attribute', async () => {
      const wrapper = mount(MetadataStep)
      
      const initialCount = wrapper.vm.formData.attributes.length
      
      // Find and click add button
      const addButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Add Attribute')
      )
      await addButton?.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.formData.attributes.length).toBe(initialCount + 1)
    })

    it('should remove attribute', async () => {
      const wrapper = mount(MetadataStep)
      
      // Add two attributes
      wrapper.vm.formData.attributes = [
        { trait_type: 'Color', value: 'Blue' },
        { trait_type: 'Size', value: 'Large' }
      ]
      await wrapper.vm.$nextTick()
      
      // Remove first attribute
      wrapper.vm.removeAttribute(0)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.formData.attributes.length).toBe(1)
      expect(wrapper.vm.formData.attributes[0].trait_type).toBe('Size')
    })

    it('should validate attribute pairs', async () => {
      const wrapper = mount(MetadataStep)
      
      // Add attribute with only key
      wrapper.vm.formData.attributes = [
        { trait_type: 'Color', value: '' }
      ]
      await wrapper.vm.$nextTick()
      
      wrapper.vm.validateAll()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.attributeErrors[0]?.value).toBeTruthy()
    })
  })

  describe('JSON Mode Validation', () => {
    it('should validate JSON syntax', async () => {
      const wrapper = mount(MetadataStep)
      
      // Switch to JSON mode
      const buttons = wrapper.findAll('button')
      const jsonButton = buttons.find(btn => btn.text().includes('JSON Editor'))
      await jsonButton?.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Enter invalid JSON
      const jsonTextarea = wrapper.find('textarea#json-input')
      await jsonTextarea.setValue('{ invalid json }')
      wrapper.vm.validateJson()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.jsonError).toBeTruthy()
      expect(wrapper.vm.jsonValid).toBe(false)
    })

    it('should accept valid JSON', async () => {
      const wrapper = mount(MetadataStep)
      
      // Switch to JSON mode
      const buttons = wrapper.findAll('button')
      const jsonButton = buttons.find(btn => btn.text().includes('JSON Editor'))
      await jsonButton?.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Enter valid JSON
      const validJson = JSON.stringify({
        name: 'Test Token',
        description: 'Test description',
        image: 'https://example.com/image.png'
      })
      
      const jsonTextarea = wrapper.find('textarea#json-input')
      await jsonTextarea.setValue(validJson)
      wrapper.vm.validateJson()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.jsonError).toBe('')
      expect(wrapper.vm.jsonValid).toBe(true)
    })

    it('should reject non-object JSON', async () => {
      const wrapper = mount(MetadataStep)
      
      // Switch to JSON mode
      const buttons = wrapper.findAll('button')
      const jsonButton = buttons.find(btn => btn.text().includes('JSON Editor'))
      await jsonButton?.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Enter array instead of object
      const jsonTextarea = wrapper.find('textarea#json-input')
      await jsonTextarea.setValue('["not", "an", "object"]')
      wrapper.vm.validateJson()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.jsonError).toContain('must be a JSON object')
      expect(wrapper.vm.jsonValid).toBe(false)
    })
  })

  describe('Metadata Preview', () => {
    it('should generate metadata preview from guided form', async () => {
      const wrapper = mount(MetadataStep)
      const draftStore = useTokenDraftStore()
      
      // Set token draft data
      draftStore.currentDraft = {
        name: 'Test Token',
        symbol: 'TEST',
        description: '',
        supply: null,
        decimals: 0,
        imageUrl: '',
        attributes: []
      }
      
      // Fill in metadata
      wrapper.vm.formData.description = 'Test description'
      wrapper.vm.formData.imageUrl = 'https://example.com/image.png'
      wrapper.vm.formData.url = 'https://example.com'
      await wrapper.vm.$nextTick()
      
      const preview = JSON.parse(wrapper.vm.metadataPreview)
      
      expect(preview.name).toBe('Test Token')
      expect(preview.symbol).toBe('TEST')
      expect(preview.description).toBe('Test description')
      expect(preview.image).toBe('https://example.com/image.png')
      expect(preview.external_url).toBe('https://example.com')
    })

    it('should include attributes in preview', async () => {
      const wrapper = mount(MetadataStep)
      const draftStore = useTokenDraftStore()
      
      draftStore.currentDraft = {
        name: 'Test Token',
        symbol: 'TEST',
        description: '',
        supply: null,
        decimals: 0,
        imageUrl: '',
        attributes: []
      }
      
      wrapper.vm.formData.attributes = [
        { trait_type: 'Color', value: 'Blue' },
        { trait_type: 'Size', value: 'Large' }
      ]
      await wrapper.vm.$nextTick()
      
      const preview = JSON.parse(wrapper.vm.metadataPreview)
      
      expect(preview.attributes).toHaveLength(2)
      expect(preview.attributes[0].trait_type).toBe('Color')
      expect(preview.attributes[1].value).toBe('Large')
    })

    it('should filter out empty attributes', async () => {
      const wrapper = mount(MetadataStep)
      const draftStore = useTokenDraftStore()
      
      draftStore.currentDraft = {
        name: 'Test Token',
        symbol: 'TEST',
        description: '',
        supply: null,
        decimals: 0,
        imageUrl: '',
        attributes: []
      }
      
      wrapper.vm.formData.attributes = [
        { trait_type: 'Color', value: 'Blue' },
        { trait_type: '', value: '' },
        { trait_type: 'Size', value: '' }
      ]
      await wrapper.vm.$nextTick()
      
      const preview = JSON.parse(wrapper.vm.metadataPreview)
      
      expect(preview.attributes).toHaveLength(1)
      expect(preview.attributes[0].trait_type).toBe('Color')
    })
  })

  describe('Draft Store Integration', () => {
    it('should load data from draft store on mount', () => {
      const draftStore = useTokenDraftStore()
      
      draftStore.currentDraft = {
        name: 'Test',
        symbol: 'TEST',
        description: 'Test description',
        imageUrl: 'https://example.com/image.png',
        url: 'https://example.com',
        supply: null,
        decimals: 0,
        attributes: [{ trait_type: 'Color', value: 'Blue' }]
      }
      
      const wrapper = mount(MetadataStep)
      
      expect(wrapper.vm.formData.description).toBe('Test description')
      expect(wrapper.vm.formData.imageUrl).toBe('https://example.com/image.png')
      expect(wrapper.vm.formData.url).toBe('https://example.com')
      expect(wrapper.vm.formData.attributes).toHaveLength(1)
    })

    it('should save to draft store when data changes', async () => {
      const wrapper = mount(MetadataStep)
      const draftStore = useTokenDraftStore()
      
      draftStore.currentDraft = {
        name: 'Test',
        symbol: 'TEST',
        description: '',
        supply: null,
        decimals: 0,
        imageUrl: '',
        attributes: []
      }
      
      // Mock saveDraft
      const saveDraftSpy = vi.spyOn(draftStore, 'saveDraft')
      
      // Change form data
      wrapper.vm.formData.description = 'Updated description'
      await wrapper.vm.$nextTick()
      
      // Wait for watch to trigger
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(saveDraftSpy).toHaveBeenCalled()
    })
  })

  describe('Step Validation Interface', () => {
    it('should expose isValid computed property', () => {
      const wrapper = mount(MetadataStep)
      expect(wrapper.vm.isValid).toBeDefined()
    })

    it('should expose validateAll method', () => {
      const wrapper = mount(MetadataStep)
      expect(typeof wrapper.vm.validateAll).toBe('function')
    })

    it('should return true for valid metadata in guided mode', () => {
      const wrapper = mount(MetadataStep)
      
      wrapper.vm.formData.description = 'Valid description'
      
      const result = wrapper.vm.validateAll()
      expect(result).toBe(true)
    })

    it('should return false without metadata', () => {
      const wrapper = mount(MetadataStep)
      
      wrapper.vm.formData.description = ''
      wrapper.vm.formData.imageUrl = ''
      
      const result = wrapper.vm.validateAll()
      expect(result).toBe(false)
    })

    it('should return true for valid JSON in JSON mode', async () => {
      const wrapper = mount(MetadataStep)
      
      // Switch to JSON mode
      const buttons = wrapper.findAll('button')
      const jsonButton = buttons.find(btn => btn.text().includes('JSON Editor'))
      await jsonButton?.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Set valid JSON
      wrapper.vm.jsonInput = JSON.stringify({ name: 'Test', description: 'Test' })
      wrapper.vm.validateJson()
      
      const result = wrapper.vm.validateAll()
      expect(result).toBe(true)
    })
  })

  describe('Copy Metadata', () => {
    it('should copy metadata to clipboard', async () => {
      const wrapper = mount(MetadataStep)
      
      // Mock clipboard API
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock
        },
        writable: true,
        configurable: true
      })
      
      wrapper.vm.formData.description = 'Test description'
      await wrapper.vm.$nextTick()
      
      await wrapper.vm.copyMetadata()
      
      expect(writeTextMock).toHaveBeenCalledWith(wrapper.vm.metadataPreview)
    })

    it('should handle clipboard errors gracefully', async () => {
      const wrapper = mount(MetadataStep)
      
      // Mock failing clipboard API
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'))
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock
        },
        writable: true,
        configurable: true
      })
      
      // Should not throw
      await expect(wrapper.vm.copyMetadata()).resolves.not.toThrow()
    })
  })
})
