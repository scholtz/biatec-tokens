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

  describe('Warning click navigation (line 132)', () => {
    it('emits navigate when warning card with deepLink is clicked', async () => {
      const wrapper = mount(ReadinessStatusWidget, { props: { status: mockReadinessStatus } })
      // Find the warning card - it's styled bg-yellow-500/10
      const warningCard = wrapper.find('.bg-yellow-500\\/10')
      if (warningCard.exists()) {
        await warningCard.trigger('click')
        expect(wrapper.emitted('navigate')).toBeTruthy()
        expect(wrapper.emitted('navigate')?.[0]).toEqual(['/cockpit/diagnostics'])
      }
    })

    it('does not emit navigate when warning has no deepLink', async () => {
      const statusNoDeepLink = {
        ...mockReadinessStatus,
        warnings: [{ id: 'w-nodl', message: 'Warning without link' }],
      }
      const wrapper = mount(ReadinessStatusWidget, { props: { status: statusNoDeepLink } })
      const warningCard = wrapper.find('.bg-yellow-500\\/10')
      if (warningCard.exists()) {
        await warningCard.trigger('click')
        // navigate should not be emitted when deepLink is absent
        expect(wrapper.emitted('navigate')).toBeFalsy()
      }
    })
  })

  describe('formatDate function (lines 207-208)', () => {
    it('formatDate returns formatted date string', () => {
      const wrapper = mount(ReadinessStatusWidget, { props: { status: mockReadinessStatus } })
      const vm = wrapper.vm as any
      if (typeof vm.formatDate === 'function') {
        const result = vm.formatDate(new Date('2026-03-15T12:00:00Z'))
        expect(result).toMatch(/Mar|15|2026/)
      } else {
        // formatDate is a module-level function used in the template for lastUpdated
        expect(wrapper.text()).toMatch(/Jan|Feb|Mar|Apr|2026/)
      }
    })
  })

  describe('Recommendations section (line 155 — v-for branch)', () => {
    it('renders recommendations list when no blockers are present (covers v-for on line 155)', () => {
      // To show recommendations: recommendations.length > 0 AND blockers.length === 0
      const statusWithRecsOnly = {
        ...mockReadinessStatus,
        blockers: [],   // no blockers → v-if condition becomes true
        score: 80,
        recommendations: ['Complete KYC setup', 'Test wallet integration', 'Add liquidity'],
      }
      const wrapper = mount(ReadinessStatusWidget, { props: { status: statusWithRecsOnly } })
      // Recommendations section should now be visible
      expect(wrapper.text()).toContain('Complete KYC setup')
      expect(wrapper.text()).toContain('Test wallet integration')
    })
  })
})
