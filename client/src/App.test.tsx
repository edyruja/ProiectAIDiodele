import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import React from 'react';

// Mock NetworkGraph to prevent ReactFlow DOM measurement issues in jsdom
vi.mock('./components/NetworkGraph', () => ({
  default: () => <div data-testid="network-graph-mock" />,
}));


describe('App Component', () => {
  it('renders without crashing', () => {
    expect(() => render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )).not.toThrow();
  });
});
