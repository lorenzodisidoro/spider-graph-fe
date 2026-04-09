import { useState } from 'react';
import {
  buildPdfMarkup,
  buildExportFileName,
} from '../utils/pdfGeneration.js';
import { decompressGzipBase64 } from '../utils/compression.js';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async (format, crawlResult, maxDepth, selectedPageIndices, setError) => {
    if (!crawlResult || isExporting || selectedPageIndices.size === 0) {
      return;
    }

    setError('');
    setIsExporting(true);
    setExportProgress(10);

    try {
      if (format === 'pdf') {
        await exportPdf(crawlResult, maxDepth, selectedPageIndices);
      } else {
        await exportText(format, crawlResult, selectedPageIndices);
      }
    } catch (error) {
      setError(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportPdf = async (crawlResult, maxDepth, selectedPageIndices) => {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    setExportProgress(20);

    let exportRoot = null;

    try {
      exportRoot = document.createElement('div');
      exportRoot.setAttribute('aria-hidden', 'true');
      exportRoot.style.position = 'fixed';
      exportRoot.style.top = '0';
      exportRoot.style.left = '0';
      exportRoot.style.width = '1024px';
      exportRoot.style.maxWidth = '1024px';
      exportRoot.style.opacity = '1';
      exportRoot.style.pointerEvents = 'none';
      exportRoot.style.zIndex = '9999';
      exportRoot.style.overflow = 'hidden';
      exportRoot.style.visibility = 'visible';
      exportRoot.style.transform = 'translateX(0)';
      exportRoot.style.clipPath = 'inset(0)';
      exportRoot.style.background = '#f8f8f4';
      exportRoot.style.color = '#0f1724';
      exportRoot.innerHTML = buildPdfMarkup(crawlResult, maxDepth, selectedPageIndices);
      document.body.appendChild(exportRoot);

      setExportProgress(40);

      const canvas = await html2canvas(exportRoot, {
        width: 1024,
        height: exportRoot.scrollHeight,
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });

      setExportProgress(60);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      setExportProgress(80);

      const fileName = buildExportFileName(crawlResult.startUrl, 'pdf');
      pdf.save(fileName);

      setExportProgress(100);
    } finally {
      if (exportRoot) {
        document.body.removeChild(exportRoot);
      }
    }
  };

  const exportText = async (format, crawlResult, selectedPageIndices) => {
    setExportProgress(20);

    const selectedNodes = Array.from(selectedPageIndices).map(index => crawlResult.nodes[index]);
    let content = '';

    for (const node of selectedNodes) {
      const title = node.title?.trim() || new URL(node.url).hostname.replace(/^www\./, '');
      const text = decompressGzipBase64(node.text) || 'No text available';
      content += `Title: ${title}\nURL: ${node.url}\n\n${text}\n\n---\n\n`;
    }

    setExportProgress(60);

    let blob;
    let fileName = buildExportFileName(crawlResult.startUrl, format);

    if (format === 'txt') {
      blob = new Blob([content], { type: 'text/plain' });
    } else if (format === 'docx') {
      const { Document, Packer, Paragraph, TextRun } = await import('docx');

      const doc = new Document({
        sections: [{
          properties: {},
          children: content.split('\n').map(line => 
            new Paragraph({
              children: [new TextRun(line)],
            })
          ),
        }],
      });

      blob = await Packer.toBlob(doc);
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportProgress(100);
  };

  return {
    isExporting,
    exportProgress,
    handleExport,
  };
}