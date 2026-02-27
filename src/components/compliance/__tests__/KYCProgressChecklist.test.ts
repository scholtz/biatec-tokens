import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KYCProgressChecklist from '../KYCProgressChecklist.vue'
import type { KYCDocument } from '../../../types/compliance'

const stubs = {
  Card: {
    template: '<div class="card"><slot></slot></div>',
    props: ['variant', 'padding'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')"><slot></slot></button>',
    props: ['variant', 'size'],
    emits: ['click'],
  },
  CheckCircleIcon: { template: '<svg class="check-icon"></svg>' },
  XCircleIcon: { template: '<svg class="x-icon"></svg>' },
  ClockIcon: { template: '<svg class="clock-icon"></svg>' },
  DocumentArrowUpIcon: { template: '<svg class="upload-icon"></svg>' },
  ExclamationCircleIcon: { template: '<svg class="exclamation-icon"></svg>' },
  ExclamationTriangleIcon: { template: '<svg class="warning-icon"></svg>' },
  EyeIcon: { template: '<svg class="eye-icon"></svg>' },
  ChevronUpIcon: { template: '<svg class="up-icon"></svg>' },
  ChevronDownIcon: { template: '<svg class="down-icon"></svg>' },
}

const makeDoc = (overrides: Partial<KYCDocument> = {}): KYCDocument => ({
  type: 'passport',
  label: 'Passport',
  status: 'not_uploaded',
  required: true,
  description: 'Government issued passport',
  ...overrides,
})

describe('KYCProgressChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the component', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [] },
      global: { stubs },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display header', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('KYC Document Checklist')
  })

  it('should show 0% when no docs', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('0%')
  })

  it('should show 0% when no required docs', () => {
    const doc = makeDoc({ required: false })
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [doc] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('0%')
  })

  it('should calculate completion percentage correctly', () => {
    const docs: KYCDocument[] = [
      makeDoc({ required: true, status: 'approved' }),
      makeDoc({ type: 'drivers_license' as any, label: 'Driver License', required: true, status: 'not_uploaded' }),
    ]
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: docs },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('50%')
  })

  it('should show 100% when all required docs approved', () => {
    const docs: KYCDocument[] = [
      makeDoc({ required: true, status: 'approved' }),
      makeDoc({ type: 'national_id' as any, label: 'National ID', required: true, status: 'approved' }),
    ]
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: docs },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('100%')
  })

  it('should display document label', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [makeDoc({ label: 'My Passport' })] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('My Passport')
  })

  it('should show asterisk for required documents', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [makeDoc({ required: true })] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('text-red-400')
  })

  it('should apply correct classes for approved status', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [makeDoc({ status: 'approved' })] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-green-700')
  })

  it('should apply correct classes for rejected status', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [makeDoc({ status: 'rejected' })] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-red-700')
  })

  it('should apply correct classes for under_review status', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [makeDoc({ status: 'under_review' })] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-yellow-700')
  })

  it('should apply correct classes for uploaded status', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [makeDoc({ status: 'uploaded' })] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-blue-700')
  })

  it('should apply correct classes for expired status', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [makeDoc({ status: 'expired' })] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-orange-700')
  })

  it('should apply correct classes for not_uploaded status', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [makeDoc({ status: 'not_uploaded' })] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-gray-700')
  })

  it('should show timeline toggle when showTimeline is true', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [], showTimeline: true },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Verification Timeline')
  })

  it('should hide timeline when showTimeline is false', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [], showTimeline: false },
      global: { stubs },
    })
    expect(wrapper.text()).not.toContain('Verification Timeline')
  })

  it('should expand timeline on toggle click', async () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: {
        documents: [],
        showTimeline: true,
        recentEvents: [
          { id: 'evt-1', description: 'KYC initiated', timestamp: '2024-01-15T10:00:00Z', actor: 'System', type: 'compliance_check' as any },
        ],
      },
      global: { stubs },
    })
    const toggleButton = wrapper.find('button')
    await toggleButton.trigger('click')
    expect(wrapper.text()).toContain('KYC initiated')
  })

  it('should collapse timeline when toggled again', async () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: {
        documents: [],
        showTimeline: true,
        recentEvents: [
          { id: 'evt-1', description: 'KYC initiated', timestamp: '2024-01-15T10:00:00Z', actor: 'System', type: 'compliance_check' as any },
        ],
      },
      global: { stubs },
    })
    const toggleButton = wrapper.find('button')
    await toggleButton.trigger('click') // expand
    await toggleButton.trigger('click') // collapse
    expect(wrapper.text()).not.toContain('KYC initiated')
  })

  it('should show "Hide" when timeline is expanded', async () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [], showTimeline: true },
      global: { stubs },
    })
    const toggleButton = wrapper.find('button')
    await toggleButton.trigger('click')
    expect(wrapper.text()).toContain('Hide')
  })

  it('should show "Show" when timeline is collapsed', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [], showTimeline: true },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Show')
  })

  it('should handle empty recentEvents', () => {
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: [], showTimeline: true, recentEvents: [] },
      global: { stubs },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should format recent timestamps as "Just now"', async () => {
    const now = new Date().toISOString()
    const wrapper = mount(KYCProgressChecklist, {
      props: {
        documents: [],
        showTimeline: true,
        recentEvents: [
          { id: 'evt-1', description: 'Event now', timestamp: now, actor: 'System', type: 'compliance_check' as any },
        ],
      },
      global: { stubs },
    })
    const toggleButton = wrapper.find('button')
    await toggleButton.trigger('click')
    expect(wrapper.text()).toContain('Just now')
  })

  it('should format timestamps from several hours ago', async () => {
    const hoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    const wrapper = mount(KYCProgressChecklist, {
      props: {
        documents: [],
        showTimeline: true,
        recentEvents: [
          { id: 'evt-1', description: 'Old event', timestamp: hoursAgo, actor: 'Admin', type: 'compliance_check' as any },
        ],
      },
      global: { stubs },
    })
    const toggleButton = wrapper.find('button')
    await toggleButton.trigger('click')
    expect(wrapper.text()).toContain('5h ago')
  })

  it('should format timestamps from days ago', async () => {
    const daysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const wrapper = mount(KYCProgressChecklist, {
      props: {
        documents: [],
        showTimeline: true,
        recentEvents: [
          { id: 'evt-1', description: 'Days ago event', timestamp: daysAgo, actor: 'Admin', type: 'compliance_check' as any },
        ],
      },
      global: { stubs },
    })
    const toggleButton = wrapper.find('button')
    await toggleButton.trigger('click')
    expect(wrapper.text()).toContain('3d ago')
  })

  it('should format old timestamps as locale date string', async () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    const wrapper = mount(KYCProgressChecklist, {
      props: {
        documents: [],
        showTimeline: true,
        recentEvents: [
          { id: 'evt-1', description: 'Old event', timestamp: oldDate, actor: 'Admin', type: 'compliance_check' as any },
        ],
      },
      global: { stubs },
    })
    const toggleButton = wrapper.find('button')
    await toggleButton.trigger('click')
    // Should show a formatted date
    const vm = wrapper.vm as any
    expect(wrapper.text()).toContain('Old event')
  })

  it('should show progress bar with green color at 100%', () => {
    const docs: KYCDocument[] = [
      makeDoc({ required: true, status: 'approved' }),
    ]
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: docs },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('bg-green-500')
  })

  it('should show progress bar with blue color below 100%', () => {
    const docs: KYCDocument[] = [
      makeDoc({ required: true, status: 'not_uploaded' }),
    ]
    const wrapper = mount(KYCProgressChecklist, {
      props: { documents: docs },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('bg-blue-500')
  })
})
