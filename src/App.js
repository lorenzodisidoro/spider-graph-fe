import { useEffect } from 'react';
import './App.css';

import { useFormState } from './hooks/useFormState.js';
import { useProgressTracking } from './hooks/useProgressTracking.js';
import { useCrawlSubmit } from './hooks/useCrawlSubmit.js';
import { usePdfExport } from './hooks/usePdfExport.js';
import { usePageSelection } from './hooks/usePageSelection.js';
import { initializeCompressionLibraries } from './utils/initCompression.js';

import { HeroLayout } from './components/HeroLayout.js';
import { LoadingPanel } from './components/LoadingPanel.js';
import { ResultsView } from './components/ResultsView.js';
import { PdfExportProgress } from './components/PdfExportProgress.js';

function App() {
  const { form, handleInputChange, getActiveMode } = useFormState();
  const { isSubmitting, error, crawlResult, handleSubmit, completeCrawl, resetCrawl } = useCrawlSubmit();
  const { progress, resetProgress, completeProgress } = useProgressTracking(isSubmitting);
  const { isExportingPdf, pdfExportProgress, handleExportPdf } = usePdfExport();
  const pageSelection = usePageSelection(crawlResult?.nodes?.length ?? 0);

  const activeMode = getActiveMode();

  // Initialize compression libraries on component mount
  useEffect(() => {
    initializeCompressionLibraries();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    resetProgress();

    try {
      completeProgress();
      const payload = await handleSubmit(event, form, activeMode);
      window.setTimeout(() => {
        completeCrawl(payload);
        pageSelection.clearSelection(); // Reset page selection for new crawl
      }, 250);
    } catch (error) {
      resetProgress();
    }
  };

  const onReset = () => {
    resetCrawl();
    resetProgress();
    pageSelection.clearSelection();
  };

  const onExportPdf = () => {
    handleExportPdf(crawlResult, form.maxDepth, pageSelection.selectedPageIndices, () => {
      // Error handling
    });
  };

  return (
    <div className="app-shell">
      <PdfExportProgress 
        isVisible={isExportingPdf} 
        progress={pdfExportProgress}
        isComplete={pdfExportProgress === 100}
      />
      
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      {isSubmitting ? (
        <LoadingPanel progress={progress} activeMode={activeMode} maxDepth={form.maxDepth} />
      ) : crawlResult ? (
        <ResultsView
          crawlResult={crawlResult}
          maxDepth={form.maxDepth}
          onExportPdf={onExportPdf}
          onReset={onReset}
          isExportingPdf={isExportingPdf}
          pageSelection={pageSelection}
        />
      ) : (
        <HeroLayout
          form={form}
          onInputChange={handleInputChange}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </div>
  );
}

export default App;
