import { DEPTH_OPTIONS, MODE_OPTIONS } from '../constants.js';

export function CrawlForm({ form, onInputChange, onSubmit, isSubmitting, error }) {
  return (
    <form className="crawl-form" onSubmit={onSubmit}>
      <label className="field-group" htmlFor="startUrl">
        <span>Starting URL</span>
        <input
          id="startUrl"
          name="startUrl"
          type="url"
          placeholder="https://example.com"
          value={form.startUrl}
          onChange={onInputChange}
          required
        />
      </label>

      <fieldset className="field-group">
        <legend>Crawl mode</legend>
        <div className="mode-grid">
          {MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`choice-card ${form.mode === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="mode"
                value={option.value}
                checked={form.mode === option.value}
                onChange={onInputChange}
              />
              <span className="choice-badge">{option.badge}</span>
              <strong>{option.title}</strong>
              <small>{option.description}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>Crawl depth</legend>
        <div className="depth-grid">
          {DEPTH_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`choice-card ${form.maxDepth === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="maxDepth"
                value={option.value}
                checked={form.maxDepth === option.value}
                onChange={onInputChange}
              />
              <strong>
                {option.value} - {option.label}
              </strong>
              <small>{option.description}</small>
            </label>
          ))}
        </div>
      </fieldset>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Crawling...' : 'Start crawling'}
      </button>
    </form>
  );
}
