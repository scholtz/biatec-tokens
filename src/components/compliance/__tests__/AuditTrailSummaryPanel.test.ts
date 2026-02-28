import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import AuditTrailSummaryPanel from '../AuditTrailSummaryPanel.vue';

describe('AuditTrailSummaryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component header', () => {
      const wrapper = mount(AuditTrailSummaryPanel, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
      });

      expect(wrapper.find('h2').text()).toContain('Audit Trail');
      expect(wrapper.text()).toContain('Complete activity log for regulatory compliance');
    });
  });

  describe('Summary Metrics Display', () => {
    it('should display total events metric', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('Total Events');
    });

    it('should display successful events metric', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('Successful');
    });

    it('should display failed events metric', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('Failed');
    });

    it('should display last audit event information', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('Last Audit Event');
    });
  });

  describe('Export Controls', () => {
    it('should render CSV export button', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const csvButton = wrapper.find('button[aria-label="Export audit trail as CSV"]');
      expect(csvButton.exists()).toBe(true);
      expect(csvButton.text()).toContain('Export CSV');
    });

    it('should render JSON export button', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const jsonButton = wrapper.find('button[aria-label="Export audit trail as JSON"]');
      expect(jsonButton.exists()).toBe(true);
      expect(jsonButton.text()).toContain('Export JSON');
    });

    it('should render view full log button', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const viewButton = wrapper.find('button[aria-label="View full audit log"]');
      expect(viewButton.exists()).toBe(true);
      expect(viewButton.text()).toContain('View Full Log');
    });

    it('should emit viewFullAudit event when view button clicked', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const viewButton = wrapper.find('button[aria-label="View full audit log"]');
      await viewButton.trigger('click');

      expect(wrapper.emitted('viewFullAudit')).toBeTruthy();
    });

    it('should handle CSV export click', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const csvButton = wrapper.find('button[aria-label="Export audit trail as CSV"]');
      await csvButton.trigger('click');

      // Button should be disabled during export
      expect(csvButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Warnings and Alerts', () => {
    it('should display data gap warnings when present', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      // Mock data includes warnings
      expect(wrapper.text()).toContain('Data Gaps Detected');
    });
  });

  describe('Info Box', () => {
    it('should display audit trail purpose information', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('Audit Trail Purpose');
      expect(wrapper.text()).toContain('tamper-evident record');
    });
  });

  describe('Error Handling', () => {
    it('should handle data loading flow', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      // Component should gracefully handle all states
      const hasContent = wrapper.text().length > 50;
      expect(hasContent).toBe(true);
    });
  });

  describe('Empty State', () => {
    it('should display empty state template', () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      // Verify empty state exists
      expect(wrapper.html()).toContain('No Audit Data');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on export buttons', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const csvButton = wrapper.find('button[aria-label="Export audit trail as CSV"]');
      expect(csvButton.attributes('aria-label')).toBe('Export audit trail as CSV');

      const jsonButton = wrapper.find('button[aria-label="Export audit trail as JSON"]');
      expect(jsonButton.attributes('aria-label')).toBe('Export audit trail as JSON');

      const viewButton = wrapper.find('button[aria-label="View full audit log"]');
      expect(viewButton.attributes('aria-label')).toBe('View full audit log');
    });

    it('should use semantic HTML headings', () => {
      const wrapper = mount(AuditTrailSummaryPanel);

      expect(wrapper.find('h2').exists()).toBe(true);
    });
  });

  describe('Branch coverage', () => {
    it('formatTimestamp returns minutes-ago format for timestamps < 1 hour', () => {
      const wrapper = mount(AuditTrailSummaryPanel);
      const formatTimestamp = (wrapper.vm as any).$.setupState.formatTimestamp;

      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      expect(formatTimestamp(thirtyMinsAgo)).toBe('30 minutes ago');
    });

    it('formatTimestamp returns singular "1 minute ago" for exactly 1 minute', () => {
      const wrapper = mount(AuditTrailSummaryPanel);
      const formatTimestamp = (wrapper.vm as any).$.setupState.formatTimestamp;

      const oneMinAgo = new Date(Date.now() - 61 * 1000).toISOString();
      expect(formatTimestamp(oneMinAgo)).toBe('1 minute ago');
    });

    it('formatTimestamp returns days-ago format for 2-6 day old timestamps', () => {
      const wrapper = mount(AuditTrailSummaryPanel);
      const formatTimestamp = (wrapper.vm as any).$.setupState.formatTimestamp;

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimestamp(threeDaysAgo)).toBe('3 days ago');
    });

    it('formatTimestamp returns singular "1 day ago" for exactly 1 day', () => {
      const wrapper = mount(AuditTrailSummaryPanel);
      const formatTimestamp = (wrapper.vm as any).$.setupState.formatTimestamp;

      const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      expect(formatTimestamp(oneDayAgo)).toBe('1 day ago');
    });

    it('formatTimestamp returns locale date string for timestamps >= 7 days old', () => {
      const wrapper = mount(AuditTrailSummaryPanel);
      const formatTimestamp = (wrapper.vm as any).$.setupState.formatTimestamp;

      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatTimestamp(tenDaysAgo);
      expect(result).toBeTruthy();
      expect(result).not.toMatch(/days? ago/);
    });

    it('isDataStale is false when last event was recent (< 24 hours ago)', async () => {
      const wrapper = mount(AuditTrailSummaryPanel);
      await wrapper.vm.$nextTick();
      await flushPromises();

      // Mock data sets lastEventTime to 2 hours ago, so isDataStale should be false
      // "Data may be stale" warning should NOT appear
      expect(wrapper.text()).not.toContain('Data may be stale');
    });
  });
});
