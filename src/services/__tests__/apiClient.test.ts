import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the generated ApiClient module before any imports
vi.mock('../../generated/ApiClient', () => {
  // Use a regular function (not arrow) so `new` works
  function MockApi(this: any, _config: unknown) {
    this.instance = {
      get: vi.fn().mockResolvedValue({ data: { status: 'ok', timestamp: '2026-01-01T00:00:00Z' } }),
    };
  }
  return { Api: MockApi };
});

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('getApiClient', () => {
    it('returns a non-null client object', async () => {
      const { getApiClient } = await import('../apiClient');
      const client = getApiClient();
      expect(client).toBeDefined();
      expect(client).not.toBeNull();
    });

    it('returns the same singleton on repeated calls', async () => {
      const { getApiClient } = await import('../apiClient');
      const first = getApiClient();
      const second = getApiClient();
      expect(first).toBe(second);
    });

    it('attaches a .get() compatibility method to the client', async () => {
      const { getApiClient } = await import('../apiClient');
      const client = getApiClient() as any;
      expect(typeof client.get).toBe('function');
    });

    it('.get() compatibility method calls instance.get internally', async () => {
      const { getApiClient } = await import('../apiClient');
      const client = getApiClient() as any;
      await client.get('/test-url');
      expect((client as any).instance.get).toHaveBeenCalledWith('/test-url');
    });
  });

  describe('apiClient module-level export', () => {
    it('exports a non-null apiClient constant', async () => {
      const { apiClient } = await import('../apiClient');
      expect(apiClient).toBeDefined();
      expect(apiClient).not.toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('returns an object with status and timestamp properties', async () => {
      const { healthCheck } = await import('../apiClient');
      const result = await healthCheck();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
    });

    it('status value comes from /health endpoint response', async () => {
      const { healthCheck } = await import('../apiClient');
      const result = await healthCheck();
      expect(result.status).toBe('ok');
    });
  });
});
