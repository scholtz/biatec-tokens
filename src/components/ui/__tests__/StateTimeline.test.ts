import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import StateTimeline from '../StateTimeline.vue';
import type { TimelineItem } from '../StateTimeline.vue';

describe('StateTimeline', () => {
  const mockTimelineItems: TimelineItem[] = [
    {
      id: 'step-1',
      title: 'Authentication',
      message: 'User signed in successfully',
      userGuidance: 'You are now authenticated',
      timestamp: '2024-01-01T00:00:00.000Z',
      status: 'success',
    },
    {
      id: 'step-2',
      title: 'Token Parameters',
      message: 'Configuring token parameters',
      timestamp: '2024-01-01T00:01:00.000Z',
      status: 'in-progress',
      isCurrent: true,
    },
    {
      id: 'step-3',
      title: 'Deployment',
      message: 'Waiting for deployment',
      nextAction: 'Complete token parameters to proceed',
      timestamp: '2024-01-01T00:02:00.000Z',
      status: 'pending',
    },
  ];

  describe('Component Rendering', () => {
    it('should render timeline with title', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Token Creation Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      expect(wrapper.find('.timeline-title').text()).toBe('Token Creation Timeline');
    });

    it('should render subtitle when provided', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          subtitle: 'Track your progress',
          timelineItems: mockTimelineItems,
        },
      });
      
      expect(wrapper.find('.timeline-subtitle').text()).toBe('Track your progress');
    });

    it('should render all timeline items', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      const items = wrapper.findAll('.timeline-item');
      expect(items).toHaveLength(3);
    });

    it('should render item titles and messages', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      expect(wrapper.text()).toContain('Authentication');
      expect(wrapper.text()).toContain('User signed in successfully');
      expect(wrapper.text()).toContain('Token Parameters');
      expect(wrapper.text()).toContain('Configuring token parameters');
    });
  });

  describe('Timeline Item Status', () => {
    it('should apply correct status classes', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      const items = wrapper.findAll('.timeline-item');
      expect(items[0].classes()).toContain('timeline-item--success');
      expect(items[1].classes()).toContain('timeline-item--in-progress');
      expect(items[2].classes()).toContain('timeline-item--pending');
    });

    it('should mark current item with special class', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      const items = wrapper.findAll('.timeline-item');
      expect(items[1].classes()).toContain('timeline-item--current');
    });
  });

  describe('User Guidance and Actions', () => {
    it('should render user guidance when provided', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      expect(wrapper.text()).toContain('You are now authenticated');
    });

    it('should render next action when provided', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      expect(wrapper.text()).toContain('Complete token parameters to proceed');
    });

    it('should not render guidance section when not provided', () => {
      const items: TimelineItem[] = [
        {
          id: 'test',
          title: 'Test',
          message: 'Test message',
          timestamp: '2024-01-01T00:00:00.000Z',
          status: 'success',
        },
      ];
      
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: items,
        },
      });
      
      expect(wrapper.find('.timeline-step-guidance').exists()).toBe(false);
    });
  });

  describe('Technical Details', () => {
    it('should show toggle button when technical details exist', () => {
      const items: TimelineItem[] = [
        {
          id: 'test',
          title: 'Test',
          message: 'Test message',
          timestamp: '2024-01-01T00:00:00.000Z',
          status: 'error',
          technicalDetails: 'Error code: 500',
        },
      ];
      
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: items,
        },
      });
      
      expect(wrapper.find('.timeline-toggle-details').exists()).toBe(true);
    });

    it('should toggle technical details visibility', async () => {
      const items: TimelineItem[] = [
        {
          id: 'test',
          title: 'Test',
          message: 'Test message',
          timestamp: '2024-01-01T00:00:00.000Z',
          status: 'error',
          technicalDetails: 'Error code: 500',
        },
      ];
      
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: items,
        },
      });
      
      expect(wrapper.find('.timeline-technical-details').exists()).toBe(false);
      
      await wrapper.find('.timeline-toggle-details').trigger('click');
      await wrapper.vm.$nextTick();
      
      expect(wrapper.find('.timeline-technical-details').exists()).toBe(true);
      expect(wrapper.text()).toContain('Error code: 500');
    });

    it('should not show toggle when no technical details', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      expect(wrapper.findAll('.timeline-toggle-details')).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      const timeline = wrapper.find('.state-timeline');
      expect(timeline.attributes('role')).toBe('region');
      expect(timeline.attributes('aria-label')).toBe('Execution timeline');
    });

    it('should have ARIA labels for timeline items', () => {
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: mockTimelineItems,
        },
      });
      
      const items = wrapper.findAll('.timeline-item');
      expect(items[0].attributes('role')).toBe('article');
      expect(items[0].attributes('aria-label')).toContain('Authentication');
      expect(items[0].attributes('aria-label')).toContain('success');
    });

    it('should have aria-expanded on toggle button', async () => {
      const items: TimelineItem[] = [
        {
          id: 'test',
          title: 'Test',
          message: 'Test message',
          timestamp: '2024-01-01T00:00:00.000Z',
          status: 'error',
          technicalDetails: 'Error details',
        },
      ];
      
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: items,
        },
      });
      
      const toggle = wrapper.find('.timeline-toggle-details');
      expect(toggle.attributes('aria-expanded')).toBe('false');
      
      await toggle.trigger('click');
      await wrapper.vm.$nextTick();
      
      const toggleAfter = wrapper.find('.timeline-toggle-details');
      expect(toggleAfter.attributes('aria-expanded')).toBe('true');
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format recent timestamps correctly', () => {
      const now = new Date();
      const items: TimelineItem[] = [
        {
          id: 'test',
          title: 'Test',
          message: 'Test message',
          timestamp: now.toISOString(),
          status: 'success',
        },
      ];
      
      const wrapper = mount(StateTimeline, {
        props: {
          title: 'Timeline',
          timelineItems: items,
        },
      });
      
      expect(wrapper.find('.timeline-step-timestamp').text()).toBe('Just now');
    });
  });
});
