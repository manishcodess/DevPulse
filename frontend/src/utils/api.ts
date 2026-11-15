import { API_BASE_URL } from '../config';

/**
 * A wrapper around native fetch that handles network errors
 * and normalizes backend error responses into thrown Error objects.
 * 
 * @param endpoint - The API endpoint path (e.g. '/auth/login').
 * @param options - Standard fetch options (method, headers, body, etc.).
 * @returns The raw fetch Response if successful.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  let url = endpoint;
  if (!endpoint.startsWith('http')) {
    url = endpoint.startsWith(API_BASE_URL) ? endpoint : `${API_BASE_URL}${endpoint}`;
  }
  
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[apiFetch] Network Error on ${url}:`, err);
    if (err?.message?.includes('Failed to fetch')) {
      throw new Error("Network Error: Cannot connect to the server. Please ensure the backend is running.");
    }
    throw new Error(`Network Error: ${err?.message || 'Unknown network error'}`);
  }

  // If the request went through but returned an error status code
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    
    // Attempt to parse JSON to see if backend provided a specific error message
    try {
      const data = await response.clone().json();
      if (data && data.error) {
        errorMessage = data.error;
      }
    } catch {
      try {
        const text = await response.clone().text();
        if (text) errorMessage = `Server Error (${response.status}): ${text.substring(0, 100)}`;
      } catch {
        // Ignore
      }
    }

    console.error(`[apiFetch] Error on ${url}:`, errorMessage);
    throw new Error(errorMessage);
  }

  return response;
}
