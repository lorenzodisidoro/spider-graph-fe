import {
  normalizePlainText,
  compactWhitespace,
  extractUsefulTextFromJson,
} from './textProcessing.js';
import { decompressIfGzipped } from './compression.js';

function extractHtmlFromJsonString(rawText) {
  const trimmed = rawText.trim();

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return '';
  }

  try {
    const parsed = JSON.parse(trimmed);
    let htmlCandidate = '';

    const visit = (value, key = '') => {
      if (htmlCandidate || value == null) {
        return;
      }

      if (typeof value === 'string') {
        const lowerKey = key.toLowerCase();
        if (
          (lowerKey.includes('html') || lowerKey.includes('markup') || lowerKey.includes('content')) &&
          /<\/?[a-z][\s\S]*>/i.test(value)
        ) {
          htmlCandidate = value;
        }
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => visit(item, key));
        return;
      }

      if (typeof value === 'object') {
        Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey));
      }
    };

    visit(parsed);
    return htmlCandidate;
  } catch {
    return '';
  }
}

function extractHtmlFromNextData(nextDataContent) {
  try {
    const nextData = JSON.parse(nextDataContent);
    const pageProps = nextData?.props?.pageProps;
    const writeApiContent = pageProps?.postDataFromWriteApi?.post_content;

    if (typeof writeApiContent === 'string' && writeApiContent.trim()) {
      return writeApiContent;
    }

    const articleContentArray = pageProps?.articleContentArray;
    if (Array.isArray(articleContentArray) && articleContentArray.length > 0) {
      return articleContentArray
        .filter((item) => typeof item === 'string' && item.trim() && !item.includes('__COMP_PRACTICE_BANNER__'))
        .join('');
    }

    return '';
  } catch {
    return '';
  }
}

function extractRelevantHtmlFragment(html) {
  if (typeof window === 'undefined' || !window.DOMParser) {
    return '';
  }

  try {
    const parser = new window.DOMParser();
    const documentNode = parser.parseFromString(html, 'text/html');

    const nextDataContent = documentNode.querySelector('#__NEXT_DATA__')?.textContent;
    if (nextDataContent) {
      const nextDataHtml = extractHtmlFromNextData(nextDataContent);
      if (nextDataHtml) {
        return nextDataHtml;
      }
    }

    const articleSelectors = [
      '.MainArticleContent_articleMainContentCss__b_1_R .text',
      '.article--viewer_content .text',
      '.article--viewer_content .content',
      'article .text',
      'main article',
      'article',
    ];

    for (const selector of articleSelectors) {
      const element = documentNode.querySelector(selector);
      if (element) {
        return element.innerHTML.trim();
      }
    }

    return '';
  } catch {
    return '';
  }
}

function sanitizeHtmlForPdf(html) {
  if (typeof window === 'undefined' || !window.DOMParser) {
    const { convertPlainTextToHtml } = require('./textProcessing.js');
    return convertPlainTextToHtml(normalizePlainText(html));
  }

  try {
    const parser = new window.DOMParser();
    const documentNode = parser.parseFromString(html, 'text/html');

    // Remove only truly unwanted elements: scripts, iframes, and user forms
    documentNode.querySelectorAll('script, noscript, iframe, form').forEach((node) => node.remove());
    
    // Remove style and meta tags
    documentNode.querySelectorAll('style, link[rel="stylesheet"], meta').forEach((node) => node.remove());
    
    // Remove navigation elements only if they have specific ARIA roles or classes
    documentNode.querySelectorAll('[role="navigation"], [aria-label*="nav"], nav').forEach((node) => node.remove());

    // Clean up event handlers
    documentNode.querySelectorAll('*').forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        const attributeName = attribute.name.toLowerCase();
        if (attributeName.startsWith('on')) {
          element.removeAttribute(attribute.name);
        }
      });
    });

    const { convertPlainTextToHtml } = require('./textProcessing.js');
    
    // Return body innerHTML if present, otherwise try to use the whole parsed content
    if (documentNode.body && documentNode.body.innerHTML && documentNode.body.innerHTML.trim()) {
      return documentNode.body.innerHTML;
    }
    
    // Fallback: return the entire documentElement innerHTML
    if (documentNode.documentElement && documentNode.documentElement.innerHTML && documentNode.documentElement.innerHTML.trim()) {
      return documentNode.documentElement.innerHTML;
    }
    
    return convertPlainTextToHtml(normalizePlainText(html));
  } catch {
    const { convertPlainTextToHtml } = require('./textProcessing.js');
    return convertPlainTextToHtml(normalizePlainText(html));
  }
}

function normalizePageText(rawText) {
  const fallback = 'No extracted text was returned for this page.';

  if (!rawText?.trim()) {
    return fallback;
  }

  // Decompress if the text is Base64+GZIP encoded
  const decompressedText = decompressIfGzipped(rawText);

  const jsonCandidate = extractUsefulTextFromJson(decompressedText);

  if (jsonCandidate !== null) {
    return jsonCandidate || fallback;
  }

  if (!decompressedText.includes('<') || typeof window === 'undefined' || !window.DOMParser) {
    return normalizePlainText(decompressedText);
  }

  try {
    const parser = new window.DOMParser();
    const documentNode = parser.parseFromString(`<div>${decompressedText}</div>`, 'text/html');
    const root = documentNode.body.firstElementChild;

    if (!root) {
      return normalizePlainText(decompressedText);
    }

    const chunks = [];

    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = compactWhitespace(node.textContent || '');
        if (text) {
          chunks.push(text);
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const tagName = node.tagName.toLowerCase();

      if (tagName === 'br') {
        chunks.push('\n');
        return;
      }

      if (['p', 'div', 'section', 'article', 'header', 'footer'].includes(tagName)) {
        node.childNodes.forEach(walk);
        chunks.push('\n\n');
        return;
      }

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        const text = compactWhitespace(node.textContent || '');
        if (text) {
          chunks.push(`${text}\n\n`);
        }
        return;
      }

      if (tagName === 'li') {
        const text = compactWhitespace(node.textContent || '');
        if (text) {
          chunks.push(`• ${text}\n`);
        }
        return;
      }

      if (['ul', 'ol'].includes(tagName)) {
        node.childNodes.forEach(walk);
        chunks.push('\n');
        return;
      }

      node.childNodes.forEach(walk);
    };

    root.childNodes.forEach(walk);

    const normalized = chunks.join('');
    return normalizePlainText(normalized) || fallback;
  } catch {
    return normalizePlainText(decompressedText) || fallback;
  }
}

export {
  extractHtmlFromJsonString,
  extractHtmlFromNextData,
  extractRelevantHtmlFragment,
  sanitizeHtmlForPdf,
  normalizePageText,
};
