/**
 * Retrieves valid cached data from localStorage if it hasn't expired.
 * @param {string} key - The localStorage key
 * @param {number} expiryMinutes - How long the cache is valid for in minutes
 * @returns {any|null} The cached data or null if missing/expired
 */
export const getCachedData = (key, expiryMinutes = 15) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
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
 * @param {string} key - The localStorage key
 * @param {any} data - The data to store
 */
export const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.error(`Error saving cache for ${key}:`, error);
  }
};
