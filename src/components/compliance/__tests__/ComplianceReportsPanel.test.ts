import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ComplianceReportsPanel from '../ComplianceReportsPanel.vue';

describe('ComplianceReportsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component header', () => {
      const wrapper = mount(ComplianceReportsPanel, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
      });

      expect(wrapper.find('h2').text()).toContain('Compliance Reports');
      expect(wrapper.text()).toContain('Regulatory reports and compliance documentation');
    });

    it('should render generate report button', () => {
      const wrapper = mount(ComplianceReportsPanel);

      const generateButton = wrapper.find('button[aria-label="Generate new compliance report"]');
      expect(generateButton.exists()).toBe(true);
      expect(generateButton.text()).toContain('Generate Report');
    });
  });

  describe('Reports List Display', () => {
    it('should display reports after loading', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('Q1 2026 Compliance Report');
    });

    it('should display report metadata', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      // Check for date, format badges
      expect(wrapper.text()).toMatch(/PDF|JSON|CSV/);
    });

    it('should display download buttons for available reports', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const downloadButtons = wrapper.findAll('button').filter(btn => 
        btn.text().includes('Download')
      );
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Report Status States', () => {
    it('should display generating status for in-progress reports', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('Generating');
    });

    it('should display failed status for failed reports', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('Failed');
    });

    it('should show error message for failed reports', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('Insufficient data');
    });

    it('should have retry button for failed reports', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const html = wrapper.html();
      expect(html).toContain('Retry Generation');
    });
  });

  describe('Report Generation', () => {
    it('should handle generate report button click', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const generateButton = wrapper.find('button[aria-label="Generate new compliance report"]');
      await generateButton.trigger('click');

      // Button should be disabled during generation
      expect(generateButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Report Types', () => {
    it('should display different report type icons', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      // Verify icons exist
      const icons = wrapper.findAll('.pi-calendar, .pi-chart-bar, .pi-file-check');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should display empty state template', () => {
      const wrapper = mount(ComplianceReportsPanel);

      expect(wrapper.html()).toContain('No Reports Available');
    });

    it('should have generate button in empty state', () => {
      const wrapper = mount(ComplianceReportsPanel);

      expect(wrapper.html()).toContain('Generate First Report');
    });
  });

  describe('Error Handling', () => {
    it('should handle data loading flow', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      // Component should gracefully handle all states
      const hasContent = wrapper.text().length > 50;
      expect(hasContent).toBe(true);
    });
  });

  describe('Info Box', () => {
    it('should display compliance reports information', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(wrapper.text()).toContain('About Compliance Reports');
      expect(wrapper.text()).toContain('comprehensive documentation');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      const wrapper = mount(ComplianceReportsPanel);

      const generateButton = wrapper.find('button[aria-label="Generate new compliance report"]');
      expect(generateButton.attributes('aria-label')).toBe('Generate new compliance report');
    });

    it('should use semantic HTML headings', () => {
      const wrapper = mount(ComplianceReportsPanel);

      expect(wrapper.find('h2').exists()).toBe(true);
    });
  });

  describe('Report Interactions', () => {
    it('should handle download button click', async () => {
      const wrapper = mount(ComplianceReportsPanel);

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 700));

      const downloadButtons = wrapper.findAll('button').filter(btn => 
        btn.text().includes('Download')
      );
      
      if (downloadButtons.length > 0) {
        await downloadButtons[0].trigger('click');
        // Button should be disabled during download
        expect(downloadButtons[0].attributes('disabled')).toBeDefined();
      }
    });
  });

  describe('Branch coverage - computed methods', () => {
    let wrapper: ReturnType<typeof mount>;

    beforeEach(() => {
      wrapper = mount(ComplianceReportsPanel);
    });

    describe('reportIconClass', () => {
      it('should return green class for annual type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIconClass('annual')).toContain('green');
      });

      it('should return yellow class for on_demand type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIconClass('on_demand')).toContain('yellow');
      });

      it('should return gray class for unknown type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIconClass('unknown_type')).toContain('gray');
      });

      it('should return blue class for monthly type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIconClass('monthly')).toContain('blue');
      });

      it('should return purple class for quarterly type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIconClass('quarterly')).toContain('purple');
      });
    });

    describe('reportIcon', () => {
      it('should return calendar icon for monthly type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIcon('monthly')).toBe('pi-calendar');
      });

      it('should return chart-bar icon for quarterly type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIcon('quarterly')).toBe('pi-chart-bar');
      });

      it('should return calendar-times icon for annual type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIcon('annual')).toBe('pi-calendar-times');
      });

      it('should return file-check icon for on_demand type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIcon('on_demand')).toBe('pi-file-check');
      });

      it('should return default file icon for unknown type', () => {
        const vm = wrapper.vm as any;
        expect(vm.reportIcon('unknown_type')).toBe('pi-file');
      });
    });

    describe('formatBadgeClass', () => {
      it('should return green class for csv format', () => {
        const vm = wrapper.vm as any;
        expect(vm.formatBadgeClass('csv')).toContain('green');
      });

      it('should return gray class for unknown format', () => {
        const vm = wrapper.vm as any;
        expect(vm.formatBadgeClass('unknown_format')).toContain('gray');
      });
    });

    describe('formatTimestamp', () => {
      it('should return Yesterday for a timestamp 36 hours ago', () => {
        const vm = wrapper.vm as any;
        // 36 hours → diffDays = Math.floor(1.5) = 1 → 'Yesterday', stable regardless of clock time
        const ts = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
        expect(vm.formatTimestamp(ts)).toBe('Yesterday');
      });
    });
  });
});
