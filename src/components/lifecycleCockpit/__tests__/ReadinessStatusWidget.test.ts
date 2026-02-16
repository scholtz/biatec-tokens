/**
 * ReadinessStatusWidget Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReadinessStatusWidget from '../ReadinessStatusWidget.vue'
import type { ReadinessStatus } from '../../../types/lifecycleCockpit'

describe('ReadinessStatusWidget', () => {
  const mockReadinessStatus: ReadinessStatus = {
    overallScore: 75,
    isLaunchReady: false,
    blockers: [
      {
        id: 'blocker-1',
        category: 'compliance',
        title: 'KYC Provider Not Configured',
        description: 'A KYC provider must be configured',
        impact: 'Cannot launch token',
        deepLink: '/compliance/setup',
        evidenceRequired: true,
        createdAt: new Date(),
      },
    ],
    warnings: [
      {
        id: 'warning-1',
        category: 'wallet',
        title: 'Limited Wallet Compatibility',
        description: 'Only 2 of 5 major wallets',
        recommendation: 'Add support for more wallets',
        deepLink: '/cockpit/diagnostics',
        createdAt: new Date(),
      },
    ],
    recommendations: ['Complete KYC setup', 'Test wallet integration'],
    lastUpdated: new Date(),
  }

  describe('Component Rendering', () => {
    it('should render with readiness status', () => {
      const wrapper = mount(ReadinessStatusWidget, {
        props: {
          status: mockReadinessStatus,
        },
      })
      
      expect(wrapper.text()).toContain('Launch Readiness')
      expect(wrapper.text()).toContain('75')
    })

    it('should show loading state when status is null', () => {
      const wrapper = mount(ReadinessStatusWidget, {
        props: {
          status: null,
        },
      })
      
      expect(wrapper.text()).toContain('Loading readiness data')
    })

    it('should display correct badge for ready status', () => {
      const readyStatus: ReadinessStatus = {
        ...mockReadinessStatus,
        isLaunchReady: true,
      }
      
      const wrapper = mount(ReadinessStatusWidget, {
        props: {
          status: readyStatus,
        },
      })
      
      expect(wrapper.text()).toContain('Ready')
    })

    it('should display correct badge for in-progress status', () => {
      const wrapper = mount(ReadinessStatusWidget, {
        props: {
          status: mockReadinessStatus,
        },
      })
      
      expect(wrapper.text()).toContain('In Progress')
    })

    it('should show blocker count', () => {
      const wrapper = mount(ReadinessStatusWidget, {
        props: {
          status: mockReadinessStatus,
        },
      })
      
      expect(wrapper.text()).toContain('Blockers (1)')
    })

    it('should show warning count', () => {
      const wrapper = mount(ReadinessStatusWidget, {
        props: {
          status: mockReadinessStatus,
        },
      })
      
      expect(wrapper.text()).toContain('Warnings (1)')
    })
  })

  describe('Readiness Score Display', () => {
    it('should display score correctly', () => {
      const wrapper = mount(ReadinessStatusWidget, {
        props: {
          status: mockReadinessStatus,
        },
      })
      
      expect(wrapper.text()).toContain('75')
      expect(wrapper.text()).toContain('Fair')
    })

    it('should show excellent for scores >= 90', () => {
      const highScore: ReadinessStatus = { ...mockReadinessStatus, overallScore: 95 }
      const wrapper = mount(ReadinessStatusWidget, { props: { status: highScore } })
      expect(wrapper.text()).toContain('Excellent')
    })

    it('should show good for scores 80-89', () => {
      const goodScore: ReadinessStatus = { ...mockReadinessStatus, overallScore: 85 }
      const wrapper = mount(ReadinessStatusWidget, { props: { status: goodScore } })
      expect(wrapper.text()).toContain('Good')
    })

    it('should show fair for scores 70-79', () => {
      const fairScore: ReadinessStatus = { ...mockReadinessStatus, overallScore: 75 }
      const wrapper = mount(ReadinessStatusWidget, { props: { status: fairScore } })
      expect(wrapper.text()).toContain('Fair')
    })

    it('should show needs work for scores 60-69', () => {
      const needsWork: ReadinessStatus = { ...mockReadinessStatus, overallScore: 65 }
      const wrapper = mount(ReadinessStatusWidget, { props: { status: needsWork } })
      expect(wrapper.text()).toContain('Needs Work')
    })

    it('should show critical for scores < 60', () => {
      const critical: ReadinessStatus = { ...mockReadinessStatus, overallScore: 50 }
      const wrapper = mount(ReadinessStatusWidget, { props: { status: critical } })
      expect(wrapper.text()).toContain('Critical')
    })
  })

  describe('Navigation Events', () => {
    it('should emit navigate event on blocker click', async () => {
      const wrapper = mount(ReadinessStatusWidget, {
        props: {
          status: mockReadinessStatus,
        },
      })
      
      const blocker = wrapper.find('.bg-red-500\\/10')
      await blocker.trigger('click')
      
      expect(wrapper.emitted('navigate')).toBeTruthy()
      expect(wrapper.emitted('navigate')?.[0]).toEqual(['/compliance/setup'])
    })
  })
})
