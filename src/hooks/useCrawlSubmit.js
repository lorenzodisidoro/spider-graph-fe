import { useState } from 'react';
import { BACKEND_CONFIG } from '../constants.js';

export function useCrawlSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [crawlResult, setCrawlResult] = useState(null);

  const handleSubmit = async (event, form, activeMode) => {
    event.preventDefault();
    setError('');

    try {
      const normalizedUrl = new URL(form.startUrl).toString();
      setIsSubmitting(true);

      // Calculate urlPrefix from the startUrl (domain + path up to first meaningful segment)
      const urlObj = new URL(normalizedUrl);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      // Take domain + first path segment, or just domain if no path
      const urlPrefix = pathParts.length > 0 
        ? `${urlObj.protocol}//${urlObj.hostname}/${pathParts[0]}/`
        : `${urlObj.protocol}//${urlObj.hostname}/`;

      const requestPayload = {
        startUrl: normalizedUrl,
        maxDepth: form.maxDepth,
        timeout: 5000,
        requestDelay: 250,
        userAgent: "SpiderGraphApi/1.0",
        verifyHost: true,
        urlPrefix: urlPrefix
      };

      console.log("Making request to:", BACKEND_CONFIG.url + activeMode.endpoint);
      console.log("Request payload:", requestPayload);

      const response = await fetch(BACKEND_CONFIG.url + activeMode.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return payload;
    } catch (submissionError) {
      setIsSubmitting(false);
      
      let errorMessage = 'Unexpected error while starting the crawl.';
      
      if (submissionError instanceof TypeError) {
        // Network error or CORS issue
        const backendUrl = process.env.NODE_ENV === 'development' ? 'proxy (http://localhost:8080)' : BACKEND_CONFIG.url;
        errorMessage = `Cannot connect to backend at ${backendUrl}. This could be due to:\n\n` +
          `• Backend server not running\n` +
          `• ${process.env.NODE_ENV === 'development' ? 'Proxy configuration issue' : 'CORS not configured (works in Postman but not in browser)'}\n` +
          `• Wrong backend URL\n` +
          `• Firewall or network issues\n\n` +
          `Please check the browser console for more details.\n\n` +
          `${process.env.NODE_ENV === 'development' ? 'The proxy in package.json should handle CORS automatically.' : 'Quick fix for development: Add "proxy": "http://localhost:8080" to your package.json'}`;
      } else if (submissionError.message) {
        errorMessage = submissionError.message;
      }
      
      console.error('Crawl submission error:', submissionError);
      setError(errorMessage);
      throw submissionError;
    }
  };

  const completeCrawl = (payload) => {
    setCrawlResult(payload);
    setIsSubmitting(false);
  };

  const resetCrawl = () => {
    setCrawlResult(null);
    setError('');
  };

  return {
    isSubmitting,
    error,
    crawlResult,
    handleSubmit,
    completeCrawl,
    resetCrawl,
  };
}
