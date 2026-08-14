import { API_BASE_URL } from '../config';

/**
 * A wrapper around native fetch that handles network errors
 * and normalizes backend error responses into thrown Error objects.
 * 
 * @param {string} endpoint - The API endpoint path (e.g. '/auth/login').
 * @param {RequestInit} options - Standard fetch options (method, headers, body, etc.).
 * @returns {Promise<Response>} The raw fetch Response if successful.
 */
export async function apiFetch(endpoint, options = {}) {
  let url = endpoint;
  if (!endpoint.startsWith('http')) {
    url = endpoint.startsWith(API_BASE_URL) ? endpoint : `${API_BASE_URL}${endpoint}`;
  }
  
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    // If fetch throws, it's almost always a network error (like CORS or server offline)
    console.error(`[apiFetch] Network Error on ${url}:`, error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Network Error: Cannot connect to the server. Please ensure the backend is running.");
    }
    throw new Error(`Network Error: ${error.message}`);
  }

  // If the request went through but returned an error status code
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    
    // Attempt to parse JSON to see if backend provided a specific error message
    try {
      // Clone response so we don't consume the stream if caller needs it later (though they shouldn't on error)
      const data = await response.clone().json();
      if (data && data.error) {
        errorMessage = data.error;
      }
    } catch (parseError) {
      // Not a JSON response, fallback to text if possible, else stick to HTTP Error string
      try {
        const text = await response.clone().text();
        if (text) errorMessage = `Server Error (${response.status}): ${text.substring(0, 100)}`;
      } catch (e) {
        // Ignore
      }
    }

    console.error(`[apiFetch] Error on ${url}:`, errorMessage);
    throw new Error(errorMessage);
  }

  return response;
}
