import { useMemo, useState } from 'react';
import { MAX_PAGES_TO_EXPORT } from '../constants.js';

export function ResultsView({
  crawlResult,
  maxDepth,
  onExportPdf,
  onReset,
  isExportingPdf,
  pageSelection,
}) {
  const [viewMode, setViewMode] = useState('list');
  const resultNodes = crawlResult?.nodes ?? [];
  const selectedCount = pageSelection.getSelectedCount();
  const hasReachedLimit = pageSelection.hasReachedLimit();

  const nodePositions = useMemo(() => {
    if (!resultNodes.length) {
      return { nodePositions: [], edgePositions: [] };
    }

    const urlToIndex = new Map(resultNodes.map((node, index) => [node.url, index]));

    const graphNodes = resultNodes.map((node, index) => ({
      id: index,
      title: node.title?.trim() || new URL(node.url).hostname.replace(/^www\./, ''),
      url: node.url,
    }));

    const graphEdges = [];
    graphNodes.forEach((node) => {
      const outgoingUrls = resultNodes[node.id].outgoingUrls || resultNodes[node.id].outgoing || [];
      outgoingUrls.forEach((destinationUrl) => {
        const targetIndex = urlToIndex.get(destinationUrl);
        if (targetIndex !== undefined) {
          graphEdges.push({ from: node.id, to: targetIndex });
        }
      });
    });

    const total = graphNodes.length;
    const svgWidth = 950;
    const svgHeight = 550;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const radius = Math.max(90, Math.min(220, total * 13));

    const nodePositions = graphNodes.map((node, index) => {
      const angle = (index / total) * Math.PI * 2;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    const edgePositions = graphEdges.map((edge) => ({
      ...edge,
      from: nodePositions[edge.from],
      to: nodePositions[edge.to],
    }));

    return { nodePositions, edgePositions };
  }, [resultNodes]);


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

      <section className="results-view-mode">
        <button
          className={`secondary-button view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
          type="button"
          onClick={() => setViewMode('list')}
        >
          List view
        </button>
        <button
          className={`secondary-button view-mode-button ${viewMode === 'graph' ? 'active' : ''}`}
          type="button"
          onClick={() => setViewMode('graph')}
          disabled={resultNodes.length === 0}
        >
          Graph view
        </button>
      </section>

      {viewMode === 'list' ? (
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
      ) : (
        <section className="results-graph" aria-label="Indexed pages as graph">
          {resultNodes.length === 0 ? (
            <article className="result-card empty-state">
              <h2>No pages returned</h2>
              <p>The crawl completed successfully, but the API returned an empty index.</p>
            </article>
          ) : (
            <div className="graph-container">
              <svg viewBox="0 0 950 550" width="100%" height="100%" role="img" aria-label="Crawl graph visualization">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="15" refY="3.5" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L10,3.5 L0,7" fill="#66b2ff" />
                  </marker>
                </defs>

                {nodePositions.edgePositions.map((edge, idx) => (
                  <line
                    key={`edge-${idx}`}
                    x1={edge.from.x}
                    y1={edge.from.y}
                    x2={edge.to.x}
                    y2={edge.to.y}
                    stroke="rgba(102, 178, 255, 0.6)"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                  />
                ))}

                {nodePositions.nodePositions.map((node) => (
                  <g key={`node-${node.id}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="16"
                      fill="#1e73df"
                      stroke="#7ab5ff"
                      strokeWidth="2"
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#ffffff"
                      fontWeight="700"
                    >
                      {String(node.id + 1)}
                    </text>
                    <title>{`${node.title} (${node.url})`}</title>
                  </g>
                ))}
              </svg>

              <div className="graph-legend">
                <p>
                  Here nodes are numbered by position. Hover a node to see URL detail. Edges are outgoing links.
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
