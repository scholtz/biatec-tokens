import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReadinessScoreCard from '../ReadinessScoreCard.vue'

const baseScore = {
  overallScore: 75,
  requiredStepsComplete: 3,
  totalRequiredSteps: 5,
  optionalStepsComplete: 1,
  totalOptionalSteps: 3,
  blockers: [],
  warnings: [],
  recommendations: [],
}

function mountCard(scoreOverrides = {}, currentStep = 0, totalSteps = 5) {
  return mount(ReadinessScoreCard, {
    props: {
      score: { ...baseScore, ...scoreOverrides },
      currentStep,
      totalSteps,
    },
  })
}

describe('ReadinessScoreCard', () => {
  it('renders the score', () => {
    const w = mountCard({ overallScore: 75 })
    expect(w.text()).toContain('75')
  })

  it('shows required steps', () => {
    const w = mountCard({ requiredStepsComplete: 3, totalRequiredSteps: 5 })
    expect(w.text()).toContain('3 / 5')
  })

  it('shows current step', () => {
    const w = mountCard({}, 2, 7)
    expect(w.text()).toContain('3 / 7')
  })

  it('applies green color for score >= 80', () => {
    const w = mountCard({ overallScore: 80 })
    expect(w.html()).toContain('text-green-500')
  })

  it('applies yellow color for score >= 60 and < 80', () => {
    const w = mountCard({ overallScore: 65 })
    expect(w.html()).toContain('text-yellow-500')
  })

  it('applies red color for score < 60', () => {
    const w = mountCard({ overallScore: 50 })
    expect(w.html()).toContain('text-red-500')
  })

  it('renders readiness score heading', () => {
    const w = mountCard()
    expect(w.text()).toContain('Readiness Score')
  })
})
