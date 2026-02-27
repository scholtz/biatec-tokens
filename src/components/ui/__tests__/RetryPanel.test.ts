import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RetryPanel from '../RetryPanel.vue'

const defaultProps = {
  title: 'Connection Failed',
  message: 'Unable to connect to the server',
}

describe('RetryPanel', () => {
  it('should render the component', () => {
    const wrapper = mount(RetryPanel, { props: defaultProps })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display title', () => {
    const wrapper = mount(RetryPanel, { props: defaultProps })
    expect(wrapper.text()).toContain('Connection Failed')
  })

  it('should display message', () => {
    const wrapper = mount(RetryPanel, { props: defaultProps })
    expect(wrapper.text()).toContain('Unable to connect to the server')
  })

  it('should display subtitle when provided', () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, subtitle: 'Network issue detected' },
    })
    expect(wrapper.text()).toContain('Network issue detected')
  })

  it('should display user guidance when provided', () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, userGuidance: 'Check your network connection' },
    })
    expect(wrapper.text()).toContain('Check your network connection')
  })

  it('should show "Try Again" button by default', () => {
    const wrapper = mount(RetryPanel, { props: defaultProps })
    expect(wrapper.text()).toContain('Try Again')
  })

  it('should emit retry event when Retry button clicked', async () => {
    const wrapper = mount(RetryPanel, { props: defaultProps })
    const retryBtn = wrapper.find('.retry-button')
    await retryBtn.trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('should disable retry button when isRetrying is true', () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, isRetrying: true },
    })
    const retryBtn = wrapper.find('.retry-button')
    expect(retryBtn.attributes('disabled')).toBeDefined()
  })

  it('should show spinner when isRetrying', () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, isRetrying: true },
    })
    expect(wrapper.find('.button-spinner').exists()).toBe(true)
  })

  it('should not show Cancel button by default', () => {
    const wrapper = mount(RetryPanel, { props: defaultProps })
    expect(wrapper.find('.cancel-button').exists()).toBe(false)
  })

  it('should show Cancel button when showCancel is true', () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, showCancel: true },
    })
    expect(wrapper.find('.cancel-button').exists()).toBe(true)
  })

  it('should emit cancel event when Cancel button clicked', async () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, showCancel: true },
    })
    await wrapper.find('.cancel-button').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('should not show Contact Support button by default', () => {
    const wrapper = mount(RetryPanel, { props: defaultProps })
    expect(wrapper.find('.support-button').exists()).toBe(false)
  })

  it('should show Contact Support when showContactSupport is true', () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, showContactSupport: true },
    })
    expect(wrapper.find('.support-button').exists()).toBe(true)
  })

  it('should emit contact-support event', async () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, showContactSupport: true },
    })
    await wrapper.find('.support-button').trigger('click')
    expect(wrapper.emitted('contact-support')).toBeTruthy()
  })

  it('should show technical details when provided', () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, technicalDetails: 'Error: timeout at 5000ms' },
    })
    expect(wrapper.text()).toContain('Technical details')
    expect(wrapper.text()).toContain('Error: timeout at 5000ms')
  })

  it('should not show technical details when not provided', () => {
    const wrapper = mount(RetryPanel, { props: defaultProps })
    expect(wrapper.find('.retry-panel-technical').exists()).toBe(false)
  })

  it('should apply warning severity class by default', () => {
    const wrapper = mount(RetryPanel, { props: defaultProps })
    expect(wrapper.classes()).toContain('retry-panel--warning')
  })

  it('should apply error severity class', () => {
    const wrapper = mount(RetryPanel, {
      props: { ...defaultProps, severity: 'error' },
    })
    expect(wrapper.classes()).toContain('retry-panel--error')
  })

  it('should show retry strategy info when provided', () => {
    const wrapper = mount(RetryPanel, {
      props: {
        ...defaultProps,
        retryStrategy: {
          canRetryNow: true,
          currentAttempt: 2,
          maxAttempts: 5,
          retryAfterMs: 2000,
        },
      },
    })
    expect(wrapper.text()).toContain('2 of 5')
    expect(wrapper.text()).toContain('2s')
  })

  it('should show strategy warning when max attempts reached', () => {
    const wrapper = mount(RetryPanel, {
      props: {
        ...defaultProps,
        retryStrategy: {
          canRetryNow: false,
          currentAttempt: 5,
          maxAttempts: 5,
        },
      },
    })
    expect(wrapper.text()).toContain('5 of 5')
  })

  it('should format duration in milliseconds when < 1000ms', () => {
    const wrapper = mount(RetryPanel, {
      props: {
        ...defaultProps,
        retryStrategy: {
          canRetryNow: true,
          currentAttempt: 1,
          maxAttempts: 3,
          retryAfterMs: 500,
        },
      },
    })
    expect(wrapper.text()).toContain('500ms')
  })

  it('should format duration in minutes when >= 60 seconds', () => {
    const wrapper = mount(RetryPanel, {
      props: {
        ...defaultProps,
        retryStrategy: {
          canRetryNow: true,
          currentAttempt: 1,
          maxAttempts: 3,
          retryAfterMs: 90000,
        },
      },
    })
    expect(wrapper.text()).toContain('2m')
  })

  it('should show context details when provided', () => {
    const wrapper = mount(RetryPanel, {
      props: {
        ...defaultProps,
        context: { action: 'Fetch tokens', step: 'Step 2' },
      },
    })
    expect(wrapper.text()).toContain('Fetch tokens')
  })
})
