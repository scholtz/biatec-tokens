import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios module
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

const mockedAxios = axios as any;

// Import after mocking
import { BiatecTokensApiClient } from '../BiatecTokensApiClient';

describe('BiatecTokensApiClient', () => {
  let client: BiatecTokensApiClient;
  const mockBaseURL = 'http://localhost:5000/api';

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset the mock implementation
    const mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };
    
    mockedAxios.create = vi.fn(() => mockAxiosInstance);
    
    // Set environment variable for testing
    import.meta.env.VITE_API_BASE_URL = mockBaseURL;
  });

  afterEach(() => {
    delete import.meta.env.VITE_API_BASE_URL;
  });

  describe('Initialization', () => {
    it('should initialize with base URL from environment', () => {
      client = new BiatecTokensApiClient();
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: mockBaseURL,
        })
      );
    });

    it('should initialize with default base URL when env var is missing', () => {
      delete import.meta.env.VITE_API_BASE_URL;
      
      client = new BiatecTokensApiClient();
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:5000/api',
        })
      );
    });

    it('should initialize with custom timeout', () => {
      client = new BiatecTokensApiClient();
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        })
      );
    });

    it('should initialize with proper headers', () => {
      client = new BiatecTokensApiClient();
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Health Check', () => {
    it('should successfully check health status', async () => {
      const mockResponse = { data: { status: 'healthy', timestamp: new Date().toISOString() } };
      const mockGet = vi.fn().mockResolvedValue(mockResponse);
      
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });
      
      client = new BiatecTokensApiClient();
      const result = await client.healthCheck();
      
      expect(mockGet).toHaveBeenCalledWith('/health', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when health check fails', async () => {
      const mockError = new Error('Network error');
      const mockGet = vi.fn().mockRejectedValue(mockError);
      
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });
      
      client = new BiatecTokensApiClient();
      
      await expect(client.healthCheck()).rejects.toThrow();
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      const mockInstance = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      };
      
      mockedAxios.create.mockReturnValue(mockInstance);
      client = new BiatecTokensApiClient();
    });

    it('should perform GET request', async () => {
      const mockData = { id: 1, name: 'Test Token' };
      const mockGet = vi.fn().mockResolvedValue({ data: mockData });
      (client as any).axiosInstance.get = mockGet;
      
      const result = await client.get('/tokens/1');
      
      expect(mockGet).toHaveBeenCalledWith('/tokens/1', undefined);
      expect(result).toEqual(mockData);
    });

    it('should perform POST request', async () => {
      const mockPayload = { name: 'New Token', symbol: 'NTK' };
      const mockResponse = { id: 1, ...mockPayload };
      const mockPost = vi.fn().mockResolvedValue({ data: mockResponse });
      (client as any).axiosInstance.post = mockPost;
      
      const result = await client.post('/tokens', mockPayload);
      
      expect(mockPost).toHaveBeenCalledWith('/tokens', mockPayload, undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should perform PUT request', async () => {
      const mockPayload = { name: 'Updated Token' };
      const mockResponse = { id: 1, ...mockPayload };
      const mockPut = vi.fn().mockResolvedValue({ data: mockResponse });
      (client as any).axiosInstance.put = mockPut;
      
      const result = await client.put('/tokens/1', mockPayload);
      
      expect(mockPut).toHaveBeenCalledWith('/tokens/1', mockPayload, undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should perform DELETE request', async () => {
      const mockDelete = vi.fn().mockResolvedValue({ data: { success: true } });
      (client as any).axiosInstance.delete = mockDelete;
      
      const result = await client.delete('/tokens/1');
      
      expect(mockDelete).toHaveBeenCalledWith('/tokens/1', undefined);
      expect(result).toEqual({ success: true });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      const mockInstance = {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      };
      
      mockedAxios.create.mockReturnValue(mockInstance);
      client = new BiatecTokensApiClient();
    });

    it('should handle 404 errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };
      const mockGet = vi.fn().mockRejectedValue(mockError);
      (client as any).axiosInstance.get = mockGet;
      
      await expect(client.get('/tokens/999')).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 404,
        }),
      });
    });

    it('should handle 500 errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      const mockGet = vi.fn().mockRejectedValue(mockError);
      (client as any).axiosInstance.get = mockGet;
      
      await expect(client.get('/tokens')).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 500,
        }),
      });
    });

    it('should handle network timeout', async () => {
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };
      const mockGet = vi.fn().mockRejectedValue(mockError);
      (client as any).axiosInstance.get = mockGet;
      
      await expect(client.get('/tokens')).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network errors', async () => {
      const mockError = {
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED',
      };
      const mockGet = vi.fn().mockRejectedValue(mockError);
      (client as any).axiosInstance.get = mockGet;
      
      await expect(client.get('/tokens')).rejects.toMatchObject({
        code: 'ECONNREFUSED',
      });
    });
  });

  describe('Request Configuration', () => {
    beforeEach(() => {
      const mockInstance = {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      };
      
      mockedAxios.create.mockReturnValue(mockInstance);
      client = new BiatecTokensApiClient();
    });

    it('should allow custom headers in requests', async () => {
      const customHeaders = { 'X-Custom-Header': 'test-value' };
      const mockGet = vi.fn().mockResolvedValue({ data: {} });
      (client as any).axiosInstance.get = mockGet;
      
      await client.get('/tokens', { headers: customHeaders });
      
      expect(mockGet).toHaveBeenCalledWith('/tokens', expect.objectContaining({
        headers: customHeaders,
      }));
    });

    it('should allow custom timeout in requests', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: {} });
      (client as any).axiosInstance.get = mockGet;
      
      await client.get('/tokens', { timeout: 5000 });
      
      expect(mockGet).toHaveBeenCalledWith('/tokens', expect.objectContaining({
        timeout: 5000,
      }));
    });
  });
});
