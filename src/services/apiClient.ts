import { Api } from "../generated/ApiClient";

let defaultApiClient: Api<unknown> | null = null;

export const getApiClient = (): Api<unknown> => {
  if (!defaultApiClient) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || "https://api.tokens.biatec.io";
    const api = new Api({
      baseURL,
    });
    // Add get method for compatibility
    (api as any).get = async (url: string) => {
      return api.instance.get(url);
    };
    defaultApiClient = api;
  }
  return defaultApiClient;
};

export const apiClient = getApiClient();

// Add healthCheck method for compatibility
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const client = getApiClient();
  const response = await client.instance.get("/health");
  return response.data;
};
