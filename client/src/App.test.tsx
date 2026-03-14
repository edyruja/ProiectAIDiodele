import { render } from '@testing-library/react';
import App from './App';
import React from 'react';

describe('App Component', () => {
  it('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
