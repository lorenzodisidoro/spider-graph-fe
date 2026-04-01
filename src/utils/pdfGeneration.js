import { escapeHtml, convertPlainTextToHtml } from './textProcessing.js';
import { normalizePageText, sanitizeHtmlForPdf } from './htmlParsing.js';
import { decompressIfGzipped } from './compression.js';

function buildExportFileName(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').replaceAll('.', '-');
    return `spider-graph-${hostname}.pdf`;
  } catch {
    return 'spider-graph-export.pdf';
  }
}

function extractBodyFromHtml(html) {
  // Try to extract body content from a full HTML document
  try {
    if (typeof window !== 'undefined' && window.DOMParser) {
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const body = doc.body;
      
      // Extract body content if present and non-empty
      if (body && body.innerHTML && body.innerHTML.trim()) {
        return body.innerHTML;
      }
    }
  } catch (e) {
    console.warn('Failed to extract body content:', e);
  }
  
  return html;
}

function getNodePdfBody(node) {
  const htmlCandidate = extractPageHtml(node);

  if (htmlCandidate) {
    // Extract body if it's a full HTML document, then sanitize lightly
    const bodyContent = extractBodyFromHtml(htmlCandidate);
    return sanitizeHtmlForPdf(bodyContent);
  }

  return convertPlainTextToHtml(normalizePageText(node.text));
}

function extractPageHtml(node) {
  // Priority 1: Focus on extracting the main 'html' field (Base64+GZIP compressed)
  if (typeof node.html === 'string' && node.html.trim()) {
    try {
      const decompressed = decompressIfGzipped(node.html);
      if (decompressed && decompressed.trim()) {
        // Log for debugging
        const contentLength = decompressed.length;
        const isFullDoc = decompressed.toLowerCase().includes('</body>') || decompressed.toLowerCase().includes('<body');
        console.log('Extracted HTML from node.html:', { contentLength, isFullDoc });
        
        return decompressed;
      }
    } catch (e) {
      console.warn('Error extracting HTML from node.html:', e);
    }
  }

  // Priority 2: Try other HTML field names
  const htmlFields = [
    node.contentHtml,
    node.rawHtml,
    node.pageHtml,
    node.documentHtml,
  ];

  const foundField = htmlFields.find((value) => typeof value === 'string' && value.trim());

  if (foundField) {
    const decompressed = decompressIfGzipped(foundField);
    const { extractRelevantHtmlFragment } = require('./htmlParsing.js');
    return extractRelevantHtmlFragment(decompressed) || decompressed;
  }

  // Priority 3: Try to extract HTML from 'text' field
  if (typeof node.text === 'string') {
    const decompressed = decompressIfGzipped(node.text);
    
    const { extractHtmlFromJsonString } = require('./htmlParsing.js');
    const nestedHtml = extractHtmlFromJsonString(decompressed);
    if (nestedHtml) {
      const { extractRelevantHtmlFragment } = require('./htmlParsing.js');
      return extractRelevantHtmlFragment(nestedHtml) || nestedHtml;
    }
  }

  // Priority 4: Check if text contains HTML tags
  if (typeof node.text === 'string' && /<\/?[a-z][\s\S]*>/i.test(node.text)) {
    const decompressed = decompressIfGzipped(node.text);
    const { extractRelevantHtmlFragment } = require('./htmlParsing.js');
    return extractRelevantHtmlFragment(decompressed) || decompressed;
  }

  return '';
}

function buildPdfMarkup(crawlResult, maxDepth, selectedPageIndices) {
  const pageSections = crawlResult.nodes
    .map((node, index) => {
      // Only include pages that are selected
      if (!selectedPageIndices.has(index)) {
        return '';
      }

      const pageTitle = escapeHtml(node.title?.trim() || node.url);
      const pageUrl = escapeHtml(node.url);
      const pageBody = getNodePdfBody(node);

      return `
        <section class="pdf-page-card pdf-export-section">
          <div class="pdf-page-index">${String(index + 1).padStart(2, '0')}</div>
          <h2 class="pdf-page-title">${pageTitle}</h2>
          <a class="pdf-page-link" href="${pageUrl}">${pageUrl}</a>
          <div class="pdf-page-body">
            ${pageBody}
          </div>
        </section>
      `;
    })
    .join('');

  return `
    <div class="pdf-export-root">
      <style>
        .pdf-export-root {
          padding: 40px;
          background: #f8f8f4;
          color: #0f1724;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
          line-height: 1.55;
        }
        .pdf-export-root * {
          box-sizing: border-box;
        }
        .pdf-export-root img,
        .pdf-export-root svg,
        .pdf-export-root video,
        .pdf-export-root iframe,
        .pdf-export-root script,
        .pdf-export-root style,
        .pdf-export-root noscript {
          max-width: 100%;
        }
        .pdf-export-hero {
          margin-bottom: 24px;
          padding: 28px;
          border: 1px solid #dbe5f0;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(249, 198, 115, 0.14), rgba(122, 181, 255, 0.08));
        }
        .pdf-eyebrow {
          display: inline-block;
          margin-bottom: 10px;
          color: #9a5b11;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .pdf-export-title {
          margin: 0 0 12px;
          font-size: 34px;
          line-height: 1;
        }
        .pdf-export-meta {
          margin: 6px 0;
          color: #405065;
          font-size: 14px;
        }
        .pdf-page-card {
          margin-bottom: 20px;
          padding: 24px;
          border: 1px solid #dbe5f0;
          border-radius: 24px;
          background: #ffffff;
          page-break-inside: avoid;
        }
        .pdf-page-index {
          margin-bottom: 10px;
          color: #9a5b11;
          font-size: 18px;
          font-weight: 800;
        }
        .pdf-page-title {
          margin: 0 0 10px;
          font-size: 24px;
          line-height: 1.15;
        }
        .pdf-page-link {
          display: inline-block;
          margin-bottom: 16px;
          color: #2f5fa7;
          word-break: break-word;
          text-decoration: none;
        }
        .pdf-page-body {
          color: #0f1724;
          font-size: 14px;
        }
        .pdf-page-body h1,
        .pdf-page-body h2,
        .pdf-page-body h3,
        .pdf-page-body h4,
        .pdf-page-body h5,
        .pdf-page-body h6 {
          margin-top: 1.2em;
          margin-bottom: 0.45em;
          line-height: 1.2;
        }
        .pdf-page-body p,
        .pdf-page-body ul,
        .pdf-page-body ol,
        .pdf-page-body table,
        .pdf-page-body pre,
        .pdf-page-body blockquote {
          margin-top: 0;
          margin-bottom: 1em;
        }
        .pdf-page-body ul,
        .pdf-page-body ol {
          padding-left: 1.5em;
        }
        .pdf-page-body table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .pdf-page-body th,
        .pdf-page-body td {
          padding: 8px 10px;
          border: 1px solid #dbe5f0;
          text-align: left;
          vertical-align: top;
        }
        .pdf-page-body th {
          background: #eef4fb;
        }
        .pdf-page-body pre,
        .pdf-page-body code {
          font-family: "SFMono-Regular", Consolas, monospace;
        }
        .pdf-page-body pre {
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          padding: 14px;
          border-radius: 16px;
          background: #0f1724;
          color: #f8fafc;
        }
        .pdf-page-body blockquote {
          padding: 12px 16px;
          border-left: 4px solid #f9c673;
          background: #fff6e8;
          color: #4a5568;
        }
        .pdf-page-body a {
          color: #2f5fa7;
        }
      </style>
      <section class="pdf-export-hero pdf-export-section">
        <span class="pdf-eyebrow">Spider Graph Export</span>
        <h1 class="pdf-export-title">Crawl document</h1>
        <p class="pdf-export-meta"><strong>Start URL:</strong> ${escapeHtml(crawlResult.startUrl)}</p>
        <p class="pdf-export-meta"><strong>Mode:</strong> ${escapeHtml(crawlResult.mode)}</p>
        <p class="pdf-export-meta"><strong>Depth:</strong> ${escapeHtml(String(maxDepth))}</p>
        <p class="pdf-export-meta"><strong>Pages:</strong> ${escapeHtml(String(crawlResult.nodeCount))}</p>
      </section>
      ${pageSections}
    </div>
  `;
}

function waitForPdfRender() {
  return new Promise((resolve) => {
    // Wait for multiple animation frames plus a small delay
    // to ensure CSS, images, and layout are fully complete
    let frameCount = 0;
    const checkRender = () => {
      frameCount++;
      if (frameCount < 5) {
        window.requestAnimationFrame(checkRender);
      } else {
        // Additional delay for complex layouts
        setTimeout(resolve, 300);
      }
    };
    window.requestAnimationFrame(checkRender);
  });
}

function appendCanvasToPdf(pdf, canvas, isFirstPage = true) {
  // Safety checks
  if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
    console.error('Invalid canvas provided to appendCanvasToPdf');
    return;
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 5; // margin in mm
  const availableWidth = pageWidth - (margin * 2);
  const availableHeight = pageHeight - (margin * 2);
  
  // Calculate how many pixels of the canvas fit in one page
  // availableWidth mm should display at canvas.width px, so:
  // 1 mm = canvas.width / availableWidth px
  // availableHeight mm = availableHeight * (canvas.width / availableWidth) px
  // Validate dimensions
  if (availableWidth <= 0 || availableHeight <= 0) {
    console.error("Invalid PDF page dimensions");
    return;
  }
  
  const pixelsPerMm = canvas.width / availableWidth;
  const canvasPixelsPerPage = Math.floor(availableHeight * pixelsPerMm);
  
  // Start position in canvas (in pixels)
  let canvasPixelY = 0;
  let isFirstImageOnPdf = isFirstPage;

  while (canvasPixelY < canvas.height) {
    // Add new page:
    // - NOT for the very first image if it's the first page overall
    // - YES for all subsequent images, even in the first section
    if (!isFirstImageOnPdf) {
      pdf.addPage();
    }

    // Calculate pixel height for this page (with safety check)
    const canvasPixelHeight = Math.min(
      canvasPixelsPerPage,
      canvas.height - canvasPixelY
    );
    
    // Safety check to avoid infinite loops
    if (canvasPixelHeight <= 0) {
      break;
    }

    // Create a temporary canvas for this page
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = canvasPixelHeight;

    const ctx = pageCanvas.getContext('2d');
    if (ctx) {
      // Draw the portion of the original canvas for this page
      ctx.drawImage(
        canvas,
        0, canvasPixelY,              // source position
        canvas.width, canvasPixelHeight, // source dimensions
        0, 0,                          // destination position  
        canvas.width, canvasPixelHeight  // destination dimensions
      );
    }

    // Convert to image and add to PDF
    const pageImageData = pageCanvas.toDataURL('image/png');
    const displayHeight = (canvasPixelHeight * availableWidth) / canvas.width;

    pdf.addImage(
      pageImageData,
      'PNG',
      margin,
      margin,
      availableWidth,
      displayHeight
    );

    canvasPixelY += canvasPixelsPerPage;
    isFirstImageOnPdf = false;
  }
}

export {
  buildExportFileName,
  getNodePdfBody,
  buildPdfMarkup,
  waitForPdfRender,
  appendCanvasToPdf,
};
