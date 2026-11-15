/**
 * Reads a File object and returns its contents as a Base64 string.
 * @param file 
 * @returns Base64 data (without the data URL prefix)
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const base64Data = result.split(',')[1] || '';
        resolve(base64Data);
      } else {
        reject(new Error('Failed to read file as base64 string'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Reads a File object and returns its contents as a text string.
 * @param file 
 * @returns 
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text string'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};
