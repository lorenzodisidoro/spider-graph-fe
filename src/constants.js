export const DEPTH_OPTIONS = [
  { value: 0, label: 'Low', description: 'A precise first layer for a fast overview.' },
  { value: 1, label: 'Medium', description: 'Balanced crawl depth for broader indexing.' },
  { value: 2, label: 'Deep', description: 'Wider discovery with a denser page map.' },
];

export const MODE_OPTIONS = [
  {
    value: 'sync',
    endpoint: '/api/crawls/sync',
    badge: 'Ordered',
    title: 'Synchronous crawl',
    description: 'Non-optimized but ordered traversal.',
  },
  {
    value: 'async',
    endpoint: '/api/crawls/async',
    badge: 'Optimized',
    title: 'Asynchronous crawl',
    description: 'Optimized but non-ordered traversal.',
  },
];

export const INITIAL_FORM = {
  startUrl: '',
  maxDepth: 0,
  mode: 'sync',
};

// Maximum number of pages allowed for PDF export
export const MAX_PAGES_TO_EXPORT = 10;

// Backend configuration
export const BACKEND_CONFIG = {
  url: 'http://localhost:8080',
  timeout: 10000, // 10 seconds
};
