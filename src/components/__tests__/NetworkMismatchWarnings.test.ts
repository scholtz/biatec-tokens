import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NetworkMismatchWarnings from '../NetworkMismatchWarnings.vue'
import type { NetworkMismatchWarning } from '../../composables/useNetworkValidation'

describe('NetworkMismatchWarnings Component', () => {
  const createWrapper = (warnings: NetworkMismatchWarning[] = []) => {
    return mount(NetworkMismatchWarnings, {
      props: { warnings },
    })
  }

  it('should render nothing when no warnings', () => {
    const wrapper = createWrapper([])
    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('should render error warning with correct styling', () => {
    const warnings: NetworkMismatchWarning[] = [
      {
        severity: 'error',
        title: 'Network Mismatch',
        message: 'ERC20 tokens require an EVM network',
        actionRequired: true,
        suggestedAction: 'Switch to Ethereum',
      },
    ]

    const wrapper = createWrapper(warnings)
    
    expect(wrapper.find('.pi-times-circle').exists()).toBe(true)
    expect(wrapper.text()).toContain('Network Mismatch')
    expect(wrapper.text()).toContain('ERC20 tokens require an EVM network')
    expect(wrapper.text()).toContain('Action Required')
    expect(wrapper.text()).toContain('Switch to Ethereum')
  })

  it('should render warning with correct styling', () => {
    const warnings: NetworkMismatchWarning[] = [
      {
        severity: 'warning',
        title: 'Compliance Warning',
        message: 'Missing compliance metadata',
        actionRequired: false,
      },
    ]

    const wrapper = createWrapper(warnings)
    
    expect(wrapper.find('.pi-exclamation-triangle').exists()).toBe(true)
    expect(wrapper.text()).toContain('Compliance Warning')
    expect(wrapper.text()).not.toContain('Action Required')
  })

  it('should render info message with correct styling', () => {
    const warnings: NetworkMismatchWarning[] = [
      {
        severity: 'info',
        title: 'Testnet Notice',
        message: 'You are using a test network',
        actionRequired: false,
      },
    ]

    const wrapper = createWrapper(warnings)
    
    expect(wrapper.find('.pi-info-circle').exists()).toBe(true)
    expect(wrapper.text()).toContain('Testnet Notice')
  })

  it('should render multiple warnings', () => {
    const warnings: NetworkMismatchWarning[] = [
      {
        severity: 'error',
        title: 'Error 1',
        message: 'Error message',
        actionRequired: true,
      },
      {
        severity: 'warning',
        title: 'Warning 1',
        message: 'Warning message',
        actionRequired: false,
      },
    ]

    const wrapper = createWrapper(warnings)
    
    expect(wrapper.text()).toContain('Error 1')
    expect(wrapper.text()).toContain('Warning 1')
    expect(wrapper.findAll('[class*="p-4"]').length).toBe(2)
  })

  it('should show action required badge when needed', () => {
    const warnings: NetworkMismatchWarning[] = [
      {
        severity: 'error',
        title: 'Critical Issue',
        message: 'Action is required',
        actionRequired: true,
      },
    ]

    const wrapper = createWrapper(warnings)
    expect(wrapper.text()).toContain('Action Required')
  })

  it('should not show action required badge when not needed', () => {
    const warnings: NetworkMismatchWarning[] = [
      {
        severity: 'warning',
        title: 'Optional Warning',
        message: 'No action required',
        actionRequired: false,
      },
    ]

    const wrapper = createWrapper(warnings)
    expect(wrapper.text()).not.toContain('Action Required')
  })

  it('should show suggested action when provided', () => {
    const warnings: NetworkMismatchWarning[] = [
      {
        severity: 'error',
        title: 'Issue',
        message: 'Problem description',
        actionRequired: true,
        suggestedAction: 'Do this to fix',
      },
    ]

    const wrapper = createWrapper(warnings)
    expect(wrapper.text()).toContain('Do this to fix')
  })

  it('should not show suggested action when not provided', () => {
    const warnings: NetworkMismatchWarning[] = [
      {
        severity: 'warning',
        title: 'Issue',
        message: 'Problem description',
        actionRequired: false,
      },
    ]

    const wrapper = createWrapper(warnings)
    expect(wrapper.find('.pi-arrow-right').exists()).toBe(false)
  })
})
