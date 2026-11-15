/**
 * Retrieves valid cached data from localStorage if it hasn't expired.
 * @param key - The localStorage key
 * @param expiryMinutes - How long the cache is valid for in minutes
 * @returns The cached data or null if missing/expired
 */
export const getCachedData = <T = unknown>(key: string, expiryMinutes = 15): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached) as { data: T; timestamp: number };
    if (Date.now() - timestamp < expiryMinutes * 60 * 1000) {
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error);
    return null;
  }
};

/**
 * Saves data to localStorage with a timestamp for expiration checking.
 * @param key - The localStorage key
 * @param data - The data to store
 */
export const setCachedData = <T = unknown>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.error(`Error saving cache for ${key}:`, error);
  }
};

