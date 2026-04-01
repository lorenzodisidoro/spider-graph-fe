import { useState } from 'react';
import {
  buildPdfMarkup,
  waitForPdfRender,
  appendCanvasToPdf,
  buildExportFileName,
} from '../utils/pdfGeneration.js';

export function usePdfExport() {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportProgress, setPdfExportProgress] = useState(0);

  const handleExportPdf = async (crawlResult, maxDepth, selectedPageIndices, setError) => {
    if (!crawlResult || isExportingPdf || selectedPageIndices.size === 0) {
      return;
    }

    setError('');
    setIsExportingPdf(true);
    setPdfExportProgress(10);

    let exportRoot = null;

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      setPdfExportProgress(20);

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
      // Pass selected page indices to buildPdfMarkup
      exportRoot.innerHTML = buildPdfMarkup(crawlResult, maxDepth, selectedPageIndices);
      document.body.appendChild(exportRoot);

      await waitForPdfRender();

      setPdfExportProgress(30);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfSections = Array.from(exportRoot.querySelectorAll('.pdf-export-section'));
      let isFirstSection = true;
      let sectionsProcessed = 0;

      if (pdfSections.length === 0) {
        throw new Error('No PDF sections found to export. Check that content is being loaded correctly.');
      }

      for (const section of pdfSections) {
        // Ensure section is visible before capturing
        if (section.offsetHeight === 0 || section.offsetWidth === 0) {
          console.warn('PDF section has zero dimensions, skipping');
          continue;
        }

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#f8f8f4',
          windowWidth: 1024,
          logging: false,
        });

        // Verify canvas has content
        if (canvas.width === 0 || canvas.height === 0) {
          console.warn('Canvas has zero dimensions for section:', section);
          continue;
        }

        // Don't add a page if it's the very first section - appendCanvasToPdf will handle it
        if (!isFirstSection) {
          pdf.addPage();
        }

        // Pass isFirstPage flag so appendCanvasToPdf knows whether to add an initial page
        appendCanvasToPdf(pdf, canvas, isFirstSection);
        isFirstSection = false;

        // Update progress
        sectionsProcessed++;
        const progress = 30 + (sectionsProcessed / pdfSections.length) * 60;
        setPdfExportProgress(Math.floor(progress));
      }

      setPdfExportProgress(95);
      pdf.save(buildExportFileName(crawlResult.startUrl));
      
      setPdfExportProgress(100);
    } catch (exportError) {
      console.error('PDF export error:', exportError);
      setError(
        exportError instanceof Error
          ? exportError.message
          : 'The visual PDF export could not be completed.'
      );
      setPdfExportProgress(0);
    } finally {
      if (exportRoot?.parentNode) {
        exportRoot.parentNode.removeChild(exportRoot);
      }
      
      // Use a delayed reset to show 100% state
      window.setTimeout(() => {
        setIsExportingPdf(false);
        setPdfExportProgress(0);
      }, 1500);
      
    }
  };

  return {
    isExportingPdf,
    pdfExportProgress,
    handleExportPdf,
  };
}
