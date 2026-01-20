import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

// Define the enum locally to avoid import issues with mocking
enum ApiHealthStatus {
  Healthy = 'healthy',
  Slow = 'slow',
  Unreachable = 'unreachable',
}

// Mock functions
const mockCheckHealth = vi.fn();
const mockStartPolling = vi.fn();
const mockStopPolling = vi.fn();

// Default mock return value
const createMockReturn = (overrides = {}) => ({
  status: ref(ApiHealthStatus.Healthy),
  isHealthy: ref(true),
  isSlow: ref(false),
  isUnreachable: ref(false),
  isChecking: ref(false),
  error: ref(null),
  lastChecked: ref(null),
  checkHealth: mockCheckHealth,
  startPolling: mockStartPolling,
  stopPolling: mockStopPolling,
  ...overrides,
});

// Mock the useApiHealth composable
vi.mock('../../composables/useApiHealth', () => ({
  useApiHealth: vi.fn(() => createMockReturn()),
  ApiHealthStatus: {
    Healthy: 'healthy',
    Slow: 'slow',
    Unreachable: 'unreachable',
  },
}));

import ApiHealthBanner from '../ApiHealthBanner.vue';
import { useApiHealth } from '../../composables/useApiHealth';

describe('ApiHealthBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock
    vi.mocked(useApiHealth).mockReturnValue(createMockReturn());
  });

  describe('Visibility', () => {
    it('should not render when API is healthy', () => {
      const wrapper = mount(ApiHealthBanner);
      
      expect(wrapper.find('[data-testid="api-health-banner"]').exists()).toBe(false);
    });

    it('should render when API is slow', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Slow),
        isHealthy: ref(false),
        isSlow: ref(true),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      expect(wrapper.find('[data-testid="api-health-banner"]').exists()).toBe(true);
    });

    it('should render when API is unreachable', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Unreachable),
        isHealthy: ref(false),
        isUnreachable: ref(true),
        error: ref('Network error'),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      expect(wrapper.find('[data-testid="api-health-banner"]').exists()).toBe(true);
    });
  });

  describe('UI States', () => {
    it('should display warning state for slow API', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Slow),
        isHealthy: ref(false),
        isSlow: ref(true),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      const banner = wrapper.find('[data-testid="api-health-banner"]');
      expect(banner.exists()).toBe(true);
      expect(banner.text()).toContain('slow');
      
      // Should have warning styling (yellow/orange)
      expect(banner.classes()).toEqual(expect.arrayContaining([
        expect.stringMatching(/yellow|orange|warning/)
      ]));
    });

    it('should display error state for unreachable API', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Unreachable),
        isHealthy: ref(false),
        isUnreachable: ref(true),
        error: ref('Network error'),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      const banner = wrapper.find('[data-testid="api-health-banner"]');
      expect(banner.exists()).toBe(true);
      expect(banner.text()).toContain('unreachable');
      
      // Should have error styling (red)
      expect(banner.classes()).toEqual(expect.arrayContaining([
        expect.stringMatching(/red|error/)
      ]));
    });

    it('should display error message when available', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Unreachable),
        isHealthy: ref(false),
        isUnreachable: ref(true),
        error: ref('Connection timeout'),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      expect(wrapper.text()).toContain('Connection timeout');
    });
  });

  describe('Retry Button', () => {
    it('should display retry button when API is unreachable', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Unreachable),
        isHealthy: ref(false),
        isUnreachable: ref(true),
        error: ref('Network error'),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      const retryButton = wrapper.find('[data-testid="retry-button"]');
      expect(retryButton.exists()).toBe(true);
    });

    it('should not display retry button when API is slow', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Slow),
        isHealthy: ref(false),
        isSlow: ref(true),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      const retryButton = wrapper.find('[data-testid="retry-button"]');
      expect(retryButton.exists()).toBe(false);
    });

    it('should call checkHealth when retry button is clicked', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Unreachable),
        isHealthy: ref(false),
        isUnreachable: ref(true),
        error: ref('Network error'),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      const retryButton = wrapper.find('[data-testid="retry-button"]');
      await retryButton.trigger('click');
      
      expect(mockCheckHealth).toHaveBeenCalledTimes(1);
    });

    it('should show loading state while checking', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Unreachable),
        isHealthy: ref(false),
        isUnreachable: ref(true),
        isChecking: ref(true),
        error: ref('Network error'),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      const retryButton = wrapper.find('[data-testid="retry-button"]');
      expect(retryButton.attributes('disabled')).toBeDefined();
      
      // Should show loading indicator
      expect(wrapper.find('.animate-spin').exists()).toBe(true);
    });
  });

  describe('Dismiss Functionality', () => {
    it('should show dismiss button', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Slow),
        isHealthy: ref(false),
        isSlow: ref(true),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      const dismissButton = wrapper.find('[data-testid="dismiss-button"]');
      expect(dismissButton.exists()).toBe(true);
    });

    it('should hide banner when dismissed', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Slow),
        isHealthy: ref(false),
        isSlow: ref(true),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      expect(wrapper.find('[data-testid="api-health-banner"]').exists()).toBe(true);
      
      const dismissButton = wrapper.find('[data-testid="dismiss-button"]');
      await dismissButton.trigger('click');
      await nextTick();
      
      expect(wrapper.find('[data-testid="api-health-banner"]').exists()).toBe(false);
    });

    it('should show banner again if status changes after dismissal', async () => {
      const statusRef = ref(ApiHealthStatus.Slow);
      const isHealthyRef = ref(false);
      const isSlowRef = ref(true);
      const isUnreachableRef = ref(false);
      
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: statusRef,
        isHealthy: isHealthyRef,
        isSlow: isSlowRef,
        isUnreachable: isUnreachableRef,
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      // Dismiss
      const dismissButton = wrapper.find('[data-testid="dismiss-button"]');
      await dismissButton.trigger('click');
      await nextTick();
      
      expect(wrapper.find('[data-testid="api-health-banner"]').exists()).toBe(false);
      
      // Status changes to unreachable
      statusRef.value = ApiHealthStatus.Unreachable;
      isSlowRef.value = false;
      isUnreachableRef.value = true;
      await nextTick();
      
      // Banner should appear again
      expect(wrapper.find('[data-testid="api-health-banner"]').exists()).toBe(true);
    });
  });

  describe('Lifecycle', () => {
    it('should start polling on mount', () => {
      mount(ApiHealthBanner);
      
      expect(mockStartPolling).toHaveBeenCalledTimes(1);
    });

    it('should stop polling on unmount', () => {
      const wrapper = mount(ApiHealthBanner);
      
      wrapper.unmount();
      
      expect(mockStopPolling).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Unreachable),
        isHealthy: ref(false),
        isUnreachable: ref(true),
        error: ref('Network error'),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      const banner = wrapper.find('[data-testid="api-health-banner"]');
      expect(banner.attributes('role')).toBe('alert');
      expect(banner.attributes('aria-live')).toBe('polite');
    });

    it('should have accessible button labels', async () => {
      vi.mocked(useApiHealth).mockReturnValue(createMockReturn({
        status: ref(ApiHealthStatus.Unreachable),
        isHealthy: ref(false),
        isUnreachable: ref(true),
        error: ref('Network error'),
      }));

      const wrapper = mount(ApiHealthBanner);
      await nextTick();
      
      const retryButton = wrapper.find('[data-testid="retry-button"]');
      expect(retryButton.attributes('aria-label')).toBeTruthy();
      
      const dismissButton = wrapper.find('[data-testid="dismiss-button"]');
      expect(dismissButton.attributes('aria-label')).toBeTruthy();
    });
  });
});
