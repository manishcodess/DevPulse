/**
 * Extracts a username from a URL or plain string input.
 * Handles GitHub URLs (github.com/user), LeetCode URLs (leetcode.com/u/user), 
 * and plain usernames.
 * @param input - A URL or username string
 * @returns The extracted username
 */
export const extractUsername = (input: string | undefined | null): string => {
  if (!input) return '';
  let val = input.trim();
  try {
    const url = new URL(val);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (url.hostname.includes('leetcode.com')) {
       if (pathParts[0] === 'u') return pathParts[1] || '';
       return pathParts[0] || '';
    }
    if (url.hostname.includes('github.com')) {
       return pathParts[0] || '';
    }
  } catch {
    // Not a valid URL, fallback to parsing it as a string
  }
  
  val = val.split('?')[0].split('#')[0];
  if (val.endsWith('/')) val = val.slice(0, -1);
  const parts = val.split('/');
  return parts[parts.length - 1] || '';
};

