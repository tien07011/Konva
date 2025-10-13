import { render, screen } from '@testing-library/react';

// Mock react-konva for Jest (ESM package that Jest may not resolve by default)
jest.mock('react-konva', () => ({
  Stage: () => null,
  Layer: () => null,
  Circle: () => null,
  Rect: () => null,
  Text: () => null,
  Ellipse: () => null,
  Line: () => null,
  Arrow: () => null,
  Transformer: () => null,
  RegularPolygon: () => null,
  Star: () => null,
}), { virtual: true });

import App from './App';

test('renders Export JSON button', () => {
  render(<App />);
  const btn = screen.getByText(/Export JSON/i);
  expect(btn).toBeInTheDocument();
});
