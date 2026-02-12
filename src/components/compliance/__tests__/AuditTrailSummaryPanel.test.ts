import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});
