import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

/**
 * API Client for BiatecTokensApi backend
 *
 * Provides type-safe HTTP methods for communicating with the backend API.
 * Handles configuration, error handling, and request/response interceptors.
 */
export class BiatecTokensApiClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  /**
   * Creates a new instance of the API client
   * @param baseURL - Optional base URL override (defaults to environment variable or localhost)
   */
  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  /**
   * Sets up request and response interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Log request in development mode
        if (import.meta.env.DEV) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log response in development mode
        if (import.meta.env.DEV) {
          console.log(`[API Response] ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error: AxiosError) => {
        // Log error in development mode
        if (import.meta.env.DEV) {
          console.error("[API Error]", error.message);
          if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Performs a GET request
   * @param url - The endpoint URL
   * @param config - Optional axios request configuration
   * @returns Promise with the response data
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * Performs a POST request
   * @param url - The endpoint URL
   * @param data - The request payload
   * @param config - Optional axios request configuration
   * @returns Promise with the response data
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Performs a PUT request
   * @param url - The endpoint URL
   * @param data - The request payload
   * @param config - Optional axios request configuration
   * @returns Promise with the response data
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Performs a DELETE request
   * @param url - The endpoint URL
   * @param config - Optional axios request configuration
   * @returns Promise with the response data
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Health check endpoint to verify API connectivity
   * @returns Promise with health status
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get("/health");
  }

  /**
   * Gets the base URL of the API client
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

/**
 * Default instance of the API client
 * Can be imported and used directly throughout the application
 *
 * Note: Created lazily to support testing
 */
let defaultClient: BiatecTokensApiClient | null = null;

export const getApiClient = (): BiatecTokensApiClient => {
  if (!defaultClient) {
    defaultClient = new BiatecTokensApiClient();
  }
  return defaultClient;
};

export const apiClient = getApiClient();
