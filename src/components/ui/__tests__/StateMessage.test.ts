import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StateMessage from '../StateMessage.vue'
import type { DeterministicState } from '../../../utils/deterministicStateManager'

const makeState = (overrides: Partial<DeterministicState> = {}): DeterministicState => ({
  type: 'loading',
  message: 'Loading data...',
  ...overrides,
})

describe('StateMessage', () => {
  it('should render the component', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState() },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display message text', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ message: 'Loading data...' }) },
    })
    expect(wrapper.text()).toContain('Loading data...')
  })

  it('should show "Loading" title for loading state', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'loading' }) },
    })
    expect(wrapper.text()).toContain('Loading')
  })

  it('should show "No Data" title for empty state', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'empty', message: 'Nothing here' }) },
    })
    expect(wrapper.text()).toContain('No Data')
  })

  it('should show "Success" title for success state', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'success', message: 'Done!' }) },
    })
    expect(wrapper.text()).toContain('Success')
  })

  it('should show "Partial Success" title for partial-failure state', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'partial-failure', message: 'Some items failed' }) },
    })
    expect(wrapper.text()).toContain('Partial Success')
  })

  it('should show "Temporary Issue" title for retryable-failure state', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'retryable-failure', message: 'Try again' }) },
    })
    expect(wrapper.text()).toContain('Temporary Issue')
  })

  it('should show "Error" title for fatal-error state', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'fatal-error', message: 'Fatal failure' }) },
    })
    expect(wrapper.text()).toContain('Error')
  })

  it('should apply loading state class', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'loading' }) },
    })
    expect(wrapper.classes()).toContain('state-message--loading')
  })

  it('should apply empty state class', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'empty', message: 'None' }) },
    })
    expect(wrapper.classes()).toContain('state-message--empty')
  })

  it('should apply compact class when compact prop is true', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState(), compact: true },
    })
    expect(wrapper.classes()).toContain('state-message--compact')
  })

  it('should not apply compact class by default', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState() },
    })
    expect(wrapper.classes()).not.toContain('state-message--compact')
  })

  it('should have assertive aria-live for fatal-error', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'fatal-error', message: 'Fatal' }) },
    })
    expect(wrapper.attributes('aria-live')).toBe('assertive')
  })

  it('should have assertive aria-live for retryable-failure', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'retryable-failure', message: 'Retry' }) },
    })
    expect(wrapper.attributes('aria-live')).toBe('assertive')
  })

  it('should have polite aria-live for non-error states', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState({ type: 'success', message: 'OK' }) },
    })
    expect(wrapper.attributes('aria-live')).toBe('polite')
  })

  it('should show user guidance when provided', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeState({ userGuidance: 'Please refresh the page' }),
      },
    })
    expect(wrapper.text()).toContain('Please refresh the page')
  })

  it('should not show user guidance when not provided', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState() },
    })
    expect(wrapper.find('.state-message-guidance').exists()).toBe(false)
  })

  it('should show next action when provided', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeState({ nextAction: 'Click here to continue' }),
      },
    })
    expect(wrapper.text()).toContain('Next step:')
    expect(wrapper.text()).toContain('Click here to continue')
  })

  it('should show technical details summary when provided', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeState({ technicalDetails: 'Error stack trace here' }),
      },
    })
    expect(wrapper.text()).toContain('Technical details')
    expect(wrapper.text()).toContain('Error stack trace here')
  })

  it('should not show technical details when not provided', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState() },
    })
    expect(wrapper.find('.state-message-details').exists()).toBe(false)
  })

  it('should show timestamp when provided and not compact', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeState({ timestamp: '2024-01-15T10:00:00Z' }),
        compact: false,
      },
    })
    expect(wrapper.find('.state-message-timestamp').exists()).toBe(true)
  })

  it('should not show timestamp in compact mode', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeState({ timestamp: '2024-01-15T10:00:00Z' }),
        compact: true,
      },
    })
    expect(wrapper.find('.state-message-timestamp').exists()).toBe(false)
  })

  it('should show retry info when retryStrategy.canRetryNow is true', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeState({
          type: 'retryable-failure',
          message: 'Retry needed',
          retryStrategy: {
            canRetryNow: true,
            currentAttempt: 2,
            maxAttempts: 3,
            retryAfterMs: 5000,
          },
        }),
      },
    })
    expect(wrapper.text()).toContain('Attempt 2 of 3')
    expect(wrapper.text()).toContain('5s before retry')
  })

  it('should not show retry info when canRetryNow is false', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeState({
          retryStrategy: { canRetryNow: false, currentAttempt: 1, maxAttempts: 3 },
        }),
      },
    })
    expect(wrapper.find('.state-message-retry').exists()).toBe(false)
  })

  it('should render role="alert"', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeState() },
    })
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('should handle invalid timestamp gracefully', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeState({ timestamp: 'invalid-date' }),
        compact: false,
      },
    })
    // Should not throw
    expect(wrapper.exists()).toBe(true)
  })
})
