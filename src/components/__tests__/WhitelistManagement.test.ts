import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import WhitelistManagement from '../WhitelistManagement.vue';
import { whitelistService } from '../../services/WhitelistService';

// Mock the whitelist service
vi.mock('../../services/WhitelistService', () => ({
  whitelistService: {
    getWhitelist: vi.fn(),
    addAddress: vi.fn(),
    removeAddress: vi.fn(),
    bulkUpload: vi.fn(),
    validateCsv: vi.fn(),
  },
  WhitelistService: vi.fn(),
}));

// Mock the toast composable
vi.mock('../../composables/useToast', () => ({
  useToast: () => ({
    toasts: { value: [] },
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('WhitelistManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component', () => {
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([]);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    expect(wrapper.find('.whitelist-management').exists()).toBe(true);
    expect(wrapper.text()).toContain('Whitelist Management');
  });

  it('should show loading state', async () => {
    vi.mocked(whitelistService.getWhitelist).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(wrapper.text()).toContain('Loading whitelist...');
  });

  it('should display whitelist entries', async () => {
    const mockEntries = [
      {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        status: 'active' as const,
        addedAt: '2024-01-15T10:00:00Z',
      },
      {
        address: 'B23456723456723456723456723456723456723456723456723456723B',
        status: 'pending' as const,
        addedAt: '2024-01-16T10:00:00Z',
      },
    ];

    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockEntries);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    const text = wrapper.text();
    expect(text).toContain('A234567234...3456723A');
    expect(text).toContain('B234567234...3456723B');
  });

  it('should show empty state when no entries', async () => {
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([]);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(wrapper.text()).toContain('No Addresses Yet');
    expect(wrapper.text()).toContain('Start by adding addresses to the whitelist');
  });

  it('should filter entries by search query', async () => {
    const mockEntries = [
      {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        status: 'active' as const,
        addedAt: '2024-01-15T10:00:00Z',
      },
      {
        address: 'B23456723456723456723456723456723456723456723456723456723B',
        status: 'active' as const,
        addedAt: '2024-01-16T10:00:00Z',
      },
    ];

    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockEntries);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Set search query
    const searchInput = wrapper.find('input[placeholder="Search addresses..."]');
    await searchInput.setValue('A234');

    const text = wrapper.text();
    expect(text).toContain('A234567234...3456723A');
    expect(text).not.toContain('B234567234...3456723B');
  });

  it('should filter entries by status', async () => {
    const mockEntries = [
      {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        status: 'active' as const,
        addedAt: '2024-01-15T10:00:00Z',
      },
      {
        address: 'B23456723456723456723456723456723456723456723456723456723B',
        status: 'pending' as const,
        addedAt: '2024-01-16T10:00:00Z',
      },
    ];

    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockEntries);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Set status filter
    const statusSelect = wrapper.find('select');
    await statusSelect.setValue('active');

    const text = wrapper.text();
    expect(text).toContain('A234567234...3456723A');
    expect(text).not.toContain('B234567234...3456723B');
  });

  it('should have add address button', async () => {
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([]);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();

    const addButton = wrapper.findAll('button').find(btn => btn.text().includes('Add Address'));
    expect(addButton).toBeTruthy();
  });

  it('should have bulk upload button', async () => {
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue([]);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();

    const bulkButton = wrapper.findAll('button').find(btn => btn.text().includes('Bulk Upload'));
    expect(bulkButton).toBeTruthy();
  });

  it('should show error state', async () => {
    vi.mocked(whitelistService.getWhitelist).mockRejectedValue(
      new Error('Failed to load whitelist')
    );

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(wrapper.text()).toContain('Failed to load whitelist');
  });

  it('should format addresses correctly', async () => {
    const mockEntries = [
      {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        status: 'active' as const,
        addedAt: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockEntries);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should show shortened address
    expect(wrapper.text()).toContain('A234567234...3456723A');
  });

  it('should display status badges correctly', async () => {
    const mockEntries = [
      {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        status: 'active' as const,
        addedAt: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockEntries);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(wrapper.text()).toContain('active');
    const badge = wrapper.find('.px-2.py-1.text-xs.font-medium.rounded-full');
    expect(badge.exists()).toBe(true);
  });

  it('should show no results when filters return empty', async () => {
    const mockEntries = [
      {
        address: 'A23456723456723456723456723456723456723456723456723456723A',
        status: 'active' as const,
        addedAt: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockEntries);

    const wrapper = mount(WhitelistManagement, {
      props: {
        tokenId: 'token123',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Search for something that doesn't exist
    const searchInput = wrapper.find('input[placeholder="Search addresses..."]');
    await searchInput.setValue('ZZZZ');

    expect(wrapper.text()).toContain('No Results Found');
  });
});
