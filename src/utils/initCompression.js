/**
 * Initialize compression dependencies
 * This file loads pako and makes it available for compression utilities
 */

export async function initializeCompressionLibraries() {
  try {
    // Try to load pako from global scope first
    if (typeof window !== 'undefined' && window.pako) {
      console.debug('pako already available globally');
      return;
    }

    // Try to import pako as module
    if (typeof window !== 'undefined') {
      try {
        const pako = await import('pako');
        window.pako = pako;
        console.debug('pako loaded successfully via npm module');
      } catch (error) {
        console.warn('pako not available as npm module. Install with: npm install pako');
        console.warn('Compression will fall back to browser DecompressionStream API if available');
      }
    }
  } catch (error) {
    console.error('Error initializing compression libraries:', error);
  }
}
