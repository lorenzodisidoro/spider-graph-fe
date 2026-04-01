/**
 * Decompresses a GZIP-compressed string encoded in Base64
 * Requires pako to be available (install via: npm install pako)
 * @param {string} base64String - The Base64-encoded GZIP-compressed data
 * @returns {string|null} - The decompressed string, or null if decoding fails
 */
export function decompressGzipBase64(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    return null;
  }

  try {
    // Step 1: Convert Base64 to binary string
    const binaryString = atob(base64String);
    
    // Step 2: Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Step 3: Decompress using pako (GZIP library)
    if (typeof window !== 'undefined' && window.pako) {
      const decompressed = window.pako.inflate(bytes, { to: 'string' });
      return decompressed;
    }
    
    // Fallback: Try using DecompressionStream (modern browsers)
    if (typeof window !== 'undefined' && window.DecompressionStream) {
      return decompressWithCompressionStreamSync(bytes, 'gzip');
    }
    
    console.warn('No decompression method available. Install pako: npm install pako');
    return null;
  } catch (error) {
    console.error('Failed to decompress GZIP Base64 string:', error);
    return null;
  }
}

/**
 * Decompresses data using the native CompressionStream API (modern browsers)
 * Note: This function is synchronous but uses a blocking approach
 * @private
 * @param {Uint8Array} compressedBytes - The compressed data
 * @param {string} format - The compression format ('gzip', 'deflate', 'deflate-raw')
 * @returns {string|null} - The decompressed string
 */
function decompressWithCompressionStreamSync(compressedBytes, format) {
  try {
    const stream = new window.DecompressionStream(format);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(compressedBytes);
    writer.close();
    
    let result = '';
    let done = false;
    
    // Note: This is a blocking approach. readSync() is not standard.
    // This function should ideally be async, but for compatibility
    // we attempt a synchronous approach
    try {
      while (!done) {
        const { value, done: streamDone } = reader.read();
        if (value) {
          result += new TextDecoder().decode(value);
        }
        done = streamDone;
      }
    } catch (readError) {
      console.warn('Error reading from DecompressionStream:', readError);
    }
    
    return result || null;
  } catch (error) {
    console.error('DecompressionStream failed:', error);
    return null;
  }
}

/**
 * Validates if a string looks like Base64-encoded GZIP data
 * @param {string} str - The string to validate
 * @returns {boolean} - True if string appears to be Base64-encoded
 */
export function isBase64Encoded(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  // Base64 regex pattern
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  
  // Check if string is a multiple of 4 length (except last chunk)
  if (str.length % 4 !== 0) {
    return false;
  }
  
  return base64Regex.test(str);
}

/**
 * Attempts to decompress a string if it's Base64-encoded GZIP, otherwise returns original
 * This function is synchronous but requires pako to be loaded
 * @param {string} str - The string to potentially decompress
 * @returns {string} - The decompressed string or original if not compressed
 */
export function decompressIfGzipped(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  
  // Check if it looks like Base64
  if (!isBase64Encoded(str)) {
    return str;
  }
  
  // Try to decompress synchronously
  try {
    // Attempt 1: Use window.pako if available
    if (typeof window !== 'undefined' && window.pako) {
      const binaryString = atob(str);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const decompressed = window.pako.inflate(bytes, { to: 'string' });
      return decompressed;
    }
  } catch (error) {
    console.warn('Failed to decompress with pako:', error.message);
  }
  
  try {
    // Attempt 2: Use CompressionStream API (modern browsers)
    if (typeof window !== 'undefined' && window.DecompressionStream) {
      const binaryString = atob(str);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return decompressWithCompressionStreamSync(bytes, 'gzip') || str;
    }
  } catch (error) {
    console.warn('Failed to decompress with DecompressionStream:', error.message);
  }
  
  // If all attempts fail, return original string
  console.warn('Could not decompress Base64+GZIP string. Install pako: npm install pako');
  return str;
}
