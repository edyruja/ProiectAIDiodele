import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardAML from './DashboardAML';

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
    const mockResponse = {
      risk_score: 'High Risk',
      chain_of_thought: 'The company operates in a high-risk jurisdiction.'
    };

    // Setup the fetch mock to return our dummy JSON response matching API contract
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<DashboardAML />);
    
    const inputField = screen.getByPlaceholderText(/company name/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    // Simulate user input and submit
    fireEvent.change(inputField, { target: { value: 'Test Company LLC' } });
    fireEvent.click(submitButton);

    // Verify fetch was called once
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Verify the UI displays the required sections
    await waitFor(() => {
      expect(screen.getByText(/AML Risk Score/i)).toBeInTheDocument();
      expect(screen.getByText(/Explanation \(Chain of Thought\)/i)).toBeInTheDocument();
    });
  });
});
