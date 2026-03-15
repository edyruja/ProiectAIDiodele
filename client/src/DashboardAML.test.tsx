import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardAML from './DashboardAML';

// Mock NetworkGraph to avoid ReactFlow DOM measurement issues in jsdom
vi.mock('./components/NetworkGraph', () => ({
  default: () => <div data-testid="network-graph-mock" />,
}));

// Mock global fetch
globalThis.fetch = vi.fn();

describe('DashboardAML Component', () => {
  const mockCompany = {
    id: 101,
    company_name: 'TEST COMPANY LLC',
    risk_score: 85,
    risk_label: 'HIGH',
    risk_explanation: 'The company operates in a high-risk jurisdiction.',
    country: 'RO',
    registration_number: 'RO123456',
    directors: ['Alice Johnson'],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    (global.fetch as any).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('query=')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ count: 1, items: [mockCompany] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ count: 1, items: [mockCompany] }),
      });
    });
  });

  it('Test 1: Verify that an input form exists containing a text field to enter a "company name" and a submit button', () => {
    render(<DashboardAML />);
    
    // Check for input field – the actual placeholder is "Analyze company..."
    const inputField = screen.getByPlaceholderText(/analyze company/i);
    expect(inputField).toBeInTheDocument();
    
    // Check for submit button – the actual button text is "Analyze"
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('Test 2: Simulate submitting the form with mock data and verify UI displays AML Risk Score and mock explanation', async () => {

    render(<DashboardAML />);

    const inputField = screen.getByPlaceholderText(/analyze company/i);
    const submitButton = screen.getByRole('button', { name: /analyze/i });

    // Simulate user input and submit
    fireEvent.change(inputField, { target: { value: 'Test Company LLC' } });
    fireEvent.click(submitButton);

    // Verify request was sent.
    expect(global.fetch).toHaveBeenCalled();

    // Verify the UI displays the result sections used by the current implementation.
    expect(await screen.findByText(/AML Risk Score/i)).toBeInTheDocument();
    expect(await screen.findByText(/ANALYTIC REASONING/i)).toBeInTheDocument();
    expect(await screen.findByText(/85/i)).toBeInTheDocument();
    expect(await screen.findByText(/high-risk jurisdiction/i)).toBeInTheDocument();
  });

  it('Test 3: Shows a mock-data not found message instead of defaulting to another company', async () => {
    (global.fetch as any).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('query=')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ count: 0, items: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ count: 1, items: [mockCompany] }),
      });
    });

    render(<DashboardAML />);

    const inputField = screen.getByPlaceholderText(/analyze company/i);
    const submitButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(inputField, { target: { value: 'Unknown Co XYZ' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/was not found in mock data/i)).toBeInTheDocument();
  });
});
