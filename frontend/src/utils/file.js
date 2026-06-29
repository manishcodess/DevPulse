/**
 * Reads a File object and returns its contents as a Base64 string.
 * @param {File} file 
 * @returns {Promise<string>} Base64 data (without the data URL prefix)
 */
export const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Reads a File object and returns its contents as a text string.
 * @param {File} file 
 * @returns {Promise<string>} 
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};
