import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardAML from './DashboardAML';

// Mock NetworkGraph to avoid ReactFlow DOM measurement issues in jsdom
vi.mock('./components/NetworkGraph', () => ({
  default: () => <div data-testid="network-graph-mock" />,
}));

// Mock global fetch
global.fetch = vi.fn();

describe('DashboardAML Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('Test 1: Verify that an input form exists containing a text field to enter a "company name" and a submit button', () => {
    render(<DashboardAML />);
    
    // Check for input field
    const inputField = screen.getByPlaceholderText(/company name/i);
    expect(inputField).toBeInTheDocument();
    
    // Check for submit button
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('Test 2: Simulate submitting the form with mock data and verify UI eventually displays AML Risk Score and Explanation', async () => {
    // In sync mode (VITE_SYNC_MODE=true), a single fetch is made to /analyze-company-sync
    // and the result is returned directly — no polling loop needed.
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'SUCCESS',
        result: {
          analysis: {
            company_name: 'Test Company LLC',
            risk_score: 75,
            risk_level: 'HIGH',
            chain_of_thought: 'The company operates in a high-risk jurisdiction.',
            recommended_action: 'Enhanced due-diligence',
          },
          company_data: {
            name: 'Test Company LLC',
            registration_number: '12345678',
            country: 'Romania',
            directors: [],
          },
        },
      }),
    });

    render(<DashboardAML />);

    const inputField = screen.getByPlaceholderText(/company name/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    // Simulate user input and submit
    fireEvent.change(inputField, { target: { value: 'Test Company LLC' } });
    fireEvent.click(submitButton);

    // Verify fetch was called once with the sync endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/analyze-company-sync',
      expect.objectContaining({ method: 'POST' })
    );

    // Verify the UI displays the required sections
    await waitFor(() => {
      expect(screen.getByText(/AML Risk Score/i)).toBeInTheDocument();
      expect(screen.getByText(/Explanation \(Chain of Thought\)/i)).toBeInTheDocument();
    });
  });
});
