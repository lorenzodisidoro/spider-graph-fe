import { render, screen } from '@testing-library/react';
import App from './App';

test('renders crawl form heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /launch a modern crawl workflow/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /start crawling/i })).toBeInTheDocument();
});
