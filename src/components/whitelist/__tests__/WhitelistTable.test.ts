import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import WhitelistTable from '../WhitelistTable.vue';
import type { WhitelistEntry } from '../../../types/whitelist';

const mockEntry: WhitelistEntry = {
  id: 'e1',
  name: 'John Doe',
  email: 'john@example.com',
  entityType: 'individual',
  status: 'approved',
  jurisdictionCode: 'US',
  jurisdictionName: 'United States',
  riskLevel: 'low',
  kycStatus: 'verified',
  accreditationStatus: 'not_required',
  documentationComplete: true,
  documentsUploaded: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  createdBy: 'admin',
  auditTrail: [],
};

const pendingEntry: WhitelistEntry = { ...mockEntry, id: 'e2', status: 'pending', name: 'Jane Smith', email: 'jane@example.com' };

function mountTable(storeOverrides = {}, props = {}) {
  return mount(WhitelistTable, {
    props,
    global: {
      stubs: { Badge: { template: '<span><slot /></span>' } },
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            whitelist: {
              entries: [],
              isLoading: false,
              pagination: { page: 1, perPage: 20, total: 0, totalPages: 1 },
              filters: { sortBy: undefined, sortOrder: 'asc' },
              ...storeOverrides,
            },
          },
        }),
      ],
    },
  });
}

describe('WhitelistTable', () => {
  describe('loading state', () => {
    it('shows loading indicator when isLoading is true', () => {
      const wrapper = mountTable({ isLoading: true });
      expect(wrapper.text()).toContain('Loading whitelist entries');
    });

    it('does not show entries when loading', () => {
      const wrapper = mountTable({ isLoading: true, entries: [mockEntry] });
      expect(wrapper.text()).not.toContain('John Doe');
    });
  });

  describe('empty state', () => {
    it('shows empty state message when no entries', () => {
      const wrapper = mountTable({ entries: [] });
      expect(wrapper.text()).toContain('No whitelist entries found');
    });
  });

  describe('entries rendering', () => {
    it('renders entry name and email', () => {
      const wrapper = mountTable({ entries: [mockEntry] });
      expect(wrapper.text()).toContain('John Doe');
      expect(wrapper.text()).toContain('john@example.com');
    });

    it('renders organization name when present', () => {
      const entry = { ...mockEntry, organizationName: 'Acme Corp' };
      const wrapper = mountTable({ entries: [entry] });
      expect(wrapper.text()).toContain('Acme Corp');
    });

    it('renders dash when no organization name', () => {
      const wrapper = mountTable({ entries: [mockEntry] });
      expect(wrapper.text()).toContain('-');
    });

    it('renders jurisdiction name', () => {
      const wrapper = mountTable({ entries: [mockEntry] });
      expect(wrapper.text()).toContain('United States');
    });
  });

  describe('approve/reject buttons', () => {
    it('shows approve button for pending entries', () => {
      const wrapper = mountTable({ entries: [pendingEntry] });
      const approveBtn = wrapper.find('button[title="Approve"]');
      expect(approveBtn.exists()).toBe(true);
    });

    it('shows reject button for pending entries', () => {
      const wrapper = mountTable({ entries: [pendingEntry] });
      const rejectBtn = wrapper.find('button[title="Reject"]');
      expect(rejectBtn.exists()).toBe(true);
    });

    it('does not show approve button for approved entries', () => {
      const wrapper = mountTable({ entries: [mockEntry] });
      expect(wrapper.find('button[title="Approve"]').exists()).toBe(false);
    });

    it('emits approve event when approve button clicked', async () => {
      const wrapper = mountTable({ entries: [pendingEntry] });
      await wrapper.find('button[title="Approve"]').trigger('click');
      expect(wrapper.emitted('approve')).toBeTruthy();
      expect(wrapper.emitted('approve')![0][0]).toEqual(pendingEntry);
    });

    it('emits reject event when reject button clicked', async () => {
      const wrapper = mountTable({ entries: [pendingEntry] });
      await wrapper.find('button[title="Reject"]').trigger('click');
      expect(wrapper.emitted('reject')).toBeTruthy();
    });

    it('emits view-details event when view button clicked', async () => {
      const wrapper = mountTable({ entries: [mockEntry] });
      await wrapper.find('button[title="View Details"]').trigger('click');
      expect(wrapper.emitted('view-details')).toBeTruthy();
      expect(wrapper.emitted('view-details')![0][0]).toEqual(mockEntry);
    });
  });

  describe('filters panel', () => {
    it('toggles filter panel on button click', async () => {
      const wrapper = mountTable();
      const vm = wrapper.vm as any;
      expect(vm.showFilters).toBe(false);
      await wrapper.find('button').trigger('click');
      await wrapper.vm.$nextTick();
      expect(vm.showFilters).toBe(true);
    });

    it('shows active filter count badge when filters applied', async () => {
      const wrapper = mountTable();
      const vm = wrapper.vm as any;
      vm.searchQuery = 'test';
      await wrapper.vm.$nextTick();
      expect(vm.activeFilterCount).toBeGreaterThan(0);
    });
  });

  describe('conflict highlighting', () => {
    it('shows conflict badge for entries in conflicts prop', () => {
      const wrapper = mountTable({ entries: [mockEntry] }, { conflicts: ['e1'] });
      const vm = wrapper.vm as any;
      expect(vm.hasConflict('e1')).toBe(true);
    });

    it('returns false for entries not in conflicts', () => {
      const wrapper = mountTable({ entries: [mockEntry] }, { conflicts: ['other-id'] });
      const vm = wrapper.vm as any;
      expect(vm.hasConflict('e1')).toBe(false);
    });

    it('returns false when conflicts prop is undefined', () => {
      const wrapper = mountTable({ entries: [mockEntry] });
      const vm = wrapper.vm as any;
      expect(vm.hasConflict('e1')).toBe(false);
    });
  });

  describe('getStatusVariant', () => {
    it('returns success for approved', () => {
      const wrapper = mountTable();
      const vm = wrapper.vm as any;
      expect(vm.getStatusVariant('approved')).toBe('success');
    });

    it('returns warning for pending', () => {
      const wrapper = mountTable();
      const vm = wrapper.vm as any;
      expect(vm.getStatusVariant('pending')).toBe('warning');
    });

    it('returns warning for under_review', () => {
      const wrapper = mountTable();
      const vm = wrapper.vm as any;
      expect(vm.getStatusVariant('under_review')).toBe('warning');
    });

    it('returns error for rejected', () => {
      const wrapper = mountTable();
      const vm = wrapper.vm as any;
      expect(vm.getStatusVariant('rejected')).toBe('error');
    });

    it('returns error for expired', () => {
      const wrapper = mountTable();
      const vm = wrapper.vm as any;
      expect(vm.getStatusVariant('expired')).toBe('error');
    });

    it('returns default for unknown status', () => {
      const wrapper = mountTable();
      const vm = wrapper.vm as any;
      expect(vm.getStatusVariant('unknown' as any)).toBe('default');
    });
  });

  describe('getRiskVariant', () => {
    it('returns success for low', () => {
      const wrapper = mountTable();
      expect((wrapper.vm as any).getRiskVariant('low')).toBe('success');
    });

    it('returns warning for medium', () => {
      const wrapper = mountTable();
      expect((wrapper.vm as any).getRiskVariant('medium')).toBe('warning');
    });

    it('returns error for high', () => {
      const wrapper = mountTable();
      expect((wrapper.vm as any).getRiskVariant('high')).toBe('error');
    });

    it('returns error for critical', () => {
      const wrapper = mountTable();
      expect((wrapper.vm as any).getRiskVariant('critical')).toBe('error');
    });
  });

  describe('formatStatus', () => {
    it('formats approved status', () => {
      const wrapper = mountTable();
      expect((wrapper.vm as any).formatStatus('approved')).toBe('Approved');
    });

    it('formats under_review status', () => {
      const wrapper = mountTable();
      expect((wrapper.vm as any).formatStatus('under_review')).toBe('Under Review');
    });
  });

  describe('formatRiskLevel', () => {
    it('formats low risk', () => {
      const wrapper = mountTable();
      expect((wrapper.vm as any).formatRiskLevel('low')).toBe('Low');
    });

    it('formats critical risk', () => {
      const wrapper = mountTable();
      expect((wrapper.vm as any).formatRiskLevel('critical')).toBe('Critical');
    });
  });

  describe('formatDate', () => {
    it('formats a date string to human-readable format', () => {
      const wrapper = mountTable();
      const result = (wrapper.vm as any).formatDate('2024-06-01T00:00:00Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getSortIcon', () => {
    it('returns unsorted icon for field not being sorted', () => {
      const wrapper = mountTable({ filters: { sortBy: 'name', sortOrder: 'asc' } });
      const icon = (wrapper.vm as any).getSortIcon('status');
      expect(icon).toContain('pi-sort-alt');
    });

    it('returns asc icon for ascending sort', () => {
      const wrapper = mountTable({ filters: { sortBy: 'name', sortOrder: 'asc' } });
      const icon = (wrapper.vm as any).getSortIcon('name');
      expect(icon).toContain('pi-sort-amount-up-alt');
    });

    it('returns desc icon for descending sort', () => {
      const wrapper = mountTable({ filters: { sortBy: 'name', sortOrder: 'desc' } });
      const icon = (wrapper.vm as any).getSortIcon('name');
      expect(icon).toContain('pi-sort-amount-down');
    });
  });

  describe('pagination', () => {
    it('does not show pagination when only one page', () => {
      const wrapper = mountTable({ pagination: { page: 1, perPage: 20, total: 5, totalPages: 1 } });
      expect(wrapper.text()).not.toContain('Page 1 of');
    });

    it('shows pagination when multiple pages', () => {
      const wrapper = mountTable({ pagination: { page: 1, perPage: 20, total: 100, totalPages: 5 } });
      expect(wrapper.text()).toContain('Page 1 of 5');
    });
  });
});
