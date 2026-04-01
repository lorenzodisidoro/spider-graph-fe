import { MAX_PAGES_TO_EXPORT } from '../constants.js';

export function ResultsView({
  crawlResult,
  maxDepth,
  onExportPdf,
  onReset,
  isExportingPdf,
  pageSelection,
}) {
  const resultNodes = crawlResult?.nodes ?? [];
  const selectedCount = pageSelection.getSelectedCount();
  const hasReachedLimit = pageSelection.hasReachedLimit();

  return (
    <main className="results-shell">
      <section className="results-hero">
        <div>
          <span className="eyebrow">Crawl completed</span>
          <h1>Indexed pages</h1>
          <p>
            The crawler found <strong>{crawlResult.nodeCount}</strong> pages starting from{' '}
            <a href={crawlResult.startUrl} target="_blank" rel="noreferrer">
              {crawlResult.startUrl}
            </a>
            .
          </p>
        </div>

        <div className="results-side-panels">
          <div className="results-summary">
            <h2 className="panel-title">Summary</h2>
            <div>
              <span className="summary-label">Mode</span>
              <strong>{crawlResult.mode}</strong>
            </div>
            <div>
              <span className="summary-label">Depth</span>
              <strong>{maxDepth}</strong>
            </div>
            <div>
              <span className="summary-label">Pages</span>
              <strong>{crawlResult.nodeCount}</strong>
            </div>
            <div>
              <span className="summary-label">Selected for export</span>
              <strong>{selectedCount}/{MAX_PAGES_TO_EXPORT}</strong>
            </div>
          </div>

          <div className="results-actions-card">
            <h2 className="panel-title">Actions</h2>
            <div className="results-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={onExportPdf}
                disabled={isExportingPdf || selectedCount === 0}
              >
                {isExportingPdf ? 'Generating PDF...' : `Export PDF (${selectedCount})`}
              </button>
              <button 
                className="secondary-button" 
                type="button" 
                onClick={pageSelection.selectAllPages}
                disabled={selectedCount === MAX_PAGES_TO_EXPORT}
              >
                Select all
              </button>
              <button 
                className="secondary-button tertiary-button" 
                type="button" 
                onClick={pageSelection.clearSelection}
                disabled={selectedCount === 0}
              >
                Clear selection
              </button>
              <button className="secondary-button tertiary-button" type="button" onClick={onReset}>
                Start another crawl
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="results-list" aria-label="Indexed pages">
        {resultNodes.length === 0 ? (
          <article className="result-card empty-state">
            <h2>No pages returned</h2>
            <p>The crawl completed successfully, but the API returned an empty index.</p>
          </article>
        ) : (
          resultNodes.map((node, index) => {
            const pageTitle =
              node.title?.trim() || new URL(node.url).hostname.replace(/^www\./, '');
            const isSelected = pageSelection.isPageSelected(index);
            const canSelect = !hasReachedLimit || isSelected;

            return (
              <article 
                className={`result-card ${isSelected ? 'selected' : ''}`}
                key={`${node.url}-${index}`}
                style={{ opacity: canSelect ? 1 : 0.5 }}
              >
                <label style={{ display: 'flex', alignItems: 'center', cursor: canSelect ? 'pointer' : 'not-allowed', width: '100%' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => pageSelection.togglePageSelection(index)}
                    disabled={!canSelect}
                    style={{ marginRight: '12px', cursor: canSelect ? 'pointer' : 'not-allowed' }}
                  />
                  <div className="result-content" style={{ flex: 1 }}>
                    <div className="result-index">{String(index + 1).padStart(2, '0')}</div>
                    <div className="result-copy">
                      <h2>{pageTitle}</h2>
                      <a href={node.url} target="_blank" rel="noreferrer">
                        {node.url}
                      </a>
                    </div>
                  </div>
                </label>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
