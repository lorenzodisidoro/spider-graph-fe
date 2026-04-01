import { CrawlForm } from './CrawlForm.js';

export function HeroLayout({ form, onInputChange, onSubmit, isSubmitting, error }) {
  return (
    <main className="hero-layout">
      <section className="hero-copy">
        <span className="eyebrow">Spider Graph Console</span>
        <h1>Launch a modern crawl workflow from a single command bar.</h1>
        <p>
          Start from any absolute URL, choose the traversal strategy and depth, then inspect the
          indexed page titles returned by the crawler.
        </p>

        {/* Feature highlights row with decorative pills 
        <div className="feature-ribbon" aria-hidden="true">
          <div className="feature-pill">
            <span className="feature-dot" />
            Local API orchestration
          </div>
          <div className="feature-pill">
            <span className="feature-dot" />
            Ordered or optimized runs
          </div>
          <div className="feature-pill">
            <span className="feature-dot" />
            Immediate page index
          </div>
        </div>*/}

      </section>

      <section className="control-panel">
        <div className="panel-glow" />
        <div className="panel-header">
          <span className="eyebrow">New crawl</span>
          <h2>Configure the request</h2>
        </div>

        <CrawlForm
          form={form}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      </section>
    </main>
  );
}
