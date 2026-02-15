/**
 * Unit tests for ReadinessScoreCard component
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReadinessScoreCard from './ReadinessScoreCard.vue'

describe('ReadinessScoreCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render with score object', () => {
    const wrapper = mount(ReadinessScoreCard, {
      props: {
        score: {
          overallScore: 75,
          requiredStepsComplete: 3,
          totalRequiredSteps: 4,
          optionalStepsComplete: 1,
          totalOptionalSteps: 2,
          blockers: [],
          warnings: [],
          recommendations: [],
        },
        currentStep: 2,
        totalSteps: 6,
      },
    })
    expect(wrapper.text()).toContain('75')
  })

  it('should display required steps progress', () => {
    const wrapper = mount(ReadinessScoreCard, {
      props: {
        score: {
          overallScore: 50,
          requiredStepsComplete: 2,
          totalRequiredSteps: 4,
          optionalStepsComplete: 0,
          totalOptionalSteps: 2,
          blockers: [],
          warnings: [],
          recommendations: [],
        },
        currentStep: 1,
        totalSteps: 6,
      },
    })
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('4')
  })

  it('should display blockers when provided', () => {
    const wrapper = mount(ReadinessScoreCard, {
      props: {
        score: {
          overallScore: 40,
          requiredStepsComplete: 2,
          totalRequiredSteps: 4,
          optionalStepsComplete: 0,
          totalOptionalSteps: 2,
          blockers: ['Missing organization name', 'Missing jurisdiction'],
          warnings: [],
          recommendations: [],
        },
        currentStep: 0,
        totalSteps: 6,
      },
    })
    expect(wrapper.text()).toContain('Missing organization name')
    expect(wrapper.text()).toContain('Blockers (2)')
  })

  it('should display warnings when provided', () => {
    const wrapper = mount(ReadinessScoreCard, {
      props: {
        score: {
          overallScore: 70,
          requiredStepsComplete: 4,
          totalRequiredSteps: 4,
          optionalStepsComplete: 0,
          totalOptionalSteps: 2,
          blockers: [],
          warnings: ['Registration number recommended'],
          recommendations: [],
        },
        currentStep: 3,
        totalSteps: 6,
      },
    })
    expect(wrapper.text()).toContain('Registration number recommended')
    expect(wrapper.text()).toContain('Warnings (1)')
  })

  it('should display recommendations when provided', () => {
    const wrapper = mount(ReadinessScoreCard, {
      props: {
        score: {
          overallScore: 85,
          requiredStepsComplete: 4,
          totalRequiredSteps: 4,
          optionalStepsComplete: 1,
          totalOptionalSteps: 2,
          blockers: [],
          warnings: [],
          recommendations: ['Complete economics settings'],
        },
        currentStep: 4,
        totalSteps: 6,
      },
    })
    expect(wrapper.text()).toContain('Complete economics settings')
    expect(wrapper.text()).toContain('Recommendations')
  })

  it('should show current step progress', () => {
    const wrapper = mount(ReadinessScoreCard, {
      props: {
        score: {
          overallScore: 60,
          requiredStepsComplete: 3,
          totalRequiredSteps: 4,
          optionalStepsComplete: 0,
          totalOptionalSteps: 2,
          blockers: [],
          warnings: [],
          recommendations: [],
        },
        currentStep: 2,
        totalSteps: 6,
      },
    })
    expect(wrapper.text()).toContain('3 / 6')
  })

  it('should render headings for accessibility', () => {
    const wrapper = mount(ReadinessScoreCard, {
      props: {
        score: {
          overallScore: 75,
          requiredStepsComplete: 3,
          totalRequiredSteps: 4,
          optionalStepsComplete: 1,
          totalOptionalSteps: 2,
          blockers: [],
          warnings: [],
          recommendations: [],
        },
        currentStep: 2,
        totalSteps: 6,
      },
    })
    expect(wrapper.find('h3').text()).toBe('Readiness Score')
  })
})
