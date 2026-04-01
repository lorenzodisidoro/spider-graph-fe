export function LoadingPanel({ progress, activeMode, maxDepth }) {
  return (
    <section className="loading-panel" aria-live="polite">
      <div className="loading-grid" />
      <div className="loading-card">
        <span className="eyebrow">Crawler in progress</span>
        <h2>Building the page index</h2>
        <p>
          The request is running through the <strong>{activeMode.title}</strong> pipeline at depth{' '}
          <strong>{maxDepth}</strong>.
        </p>

        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="progress-meta">
          <span>{progress}%</span>
          <span>Reading pages and assembling results</span>
        </div>
      </div>
    </section>
  );
}
