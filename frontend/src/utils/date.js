/**
 * Returns today's date as a string in YYYY-MM-DD format.
 * @returns {string}
 */
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Returns yesterday's date as a string in YYYY-MM-DD format.
 * @returns {string}
 */
export const getYesterdayString = () => {
  const yesterday = new Date(Date.now() - 86400000);
  return yesterday.toISOString().split('T')[0];
};
