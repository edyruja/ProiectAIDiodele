import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardAML from './DashboardAML';

// Mock NetworkGraph to avoid ReactFlow DOM measurement issues in jsdom
vi.mock('./components/NetworkGraph', () => ({
  default: () => <div data-testid="network-graph-mock" />,
}));

// Mock global fetch
globalThis.fetch = vi.fn();

describe('DashboardAML Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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

  it('Test 2: Simulate submitting the form with mock data and verify UI eventually displays AML Risk Score and Explanation', async () => {
    vi.useFakeTimers(); // Enable fake timers for this test

    const taskId = 'mock-task-123';
    const mockStatusResponse = {
      status: 'SUCCESS',
      result: {
        analysis: {
          risk_score: '85',
          risk_level: 'High Risk',
          chain_of_thought: 'The company operates in a high-risk jurisdiction.'
        },
        company_data: {
          name: 'TEST COMPANY LLC'
        }
      }
    };

    // First call: POST /analyze-company → returns task_id
    // Second call: GET /analysis-status/:id → returns SUCCESS with analysis
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ task_id: taskId }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStatusResponse });

    render(<DashboardAML />);

    const inputField = screen.getByPlaceholderText(/analyze company/i);
    const submitButton = screen.getByRole('button', { name: /analyze/i });

    // Simulate user input and submit
    fireEvent.change(inputField, { target: { value: 'Test Company LLC' } });
    fireEvent.click(submitButton);

    // Verify the POST fetch was called
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Advance timers to trigger the polling.
    // Assuming the polling interval is 2000ms (2 seconds) based on typical implementation.
    // We need to advance enough time for the polling to happen and the second fetch to resolve.
    vi.advanceTimersByTime(2500); // Advance by 2.5 seconds, allowing for one poll cycle.

    // Verify the UI displays the required sections after polling resolves
    // No need for await waitFor anymore, as timers are advanced.
    expect(screen.getByText(/AML Risk Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Explanation \(Chain of Thought\)/i)).toBeInTheDocument();
    expect(screen.getByText(/85/i)).toBeInTheDocument();

    vi.useRealTimers(); // Restore real timers after this test
  });
});
