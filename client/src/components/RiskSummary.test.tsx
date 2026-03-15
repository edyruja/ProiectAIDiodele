/**
 * test_risk_summary_aml.test.tsx
 *
 * Cycle 3 RED – Vitest tests asserting that RiskSummary component displays:
 *   - Sanctions & PEP badges
 *   - Revenue and average monthly spend
 *
 * These tests fail (RED) until RiskSummary.tsx is updated to accept and
 * render the new AML financial fields.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskSummary } from './RiskSummary';

// Minimal base props satisfying the current interface
const baseProps = {
  riskScore: 45,
  riskLevel: 'MEDIUM',
};

describe('RiskSummary – Cycle 3 AML Financial Fields', () => {
  it('shows a sanctions badge when sanctions_hit is true', () => {
    render(
      <RiskSummary
        {...baseProps}
        sanctionsHit={true}
        pepExposure={false}
      />
    );
    expect(screen.getByTestId('sanctions-badge')).toBeInTheDocument();
  });

  it('does NOT show a sanctions badge when sanctions_hit is false', () => {
    render(
      <RiskSummary
        {...baseProps}
        sanctionsHit={false}
        pepExposure={false}
      />
    );
    expect(screen.queryByTestId('sanctions-badge')).not.toBeInTheDocument();
  });

  it('shows a PEP exposure badge when pep_exposure is true', () => {
    render(
      <RiskSummary
        {...baseProps}
        sanctionsHit={false}
        pepExposure={true}
      />
    );
    expect(screen.getByTestId('pep-badge')).toBeInTheDocument();
  });

  it('renders the revenue value formatted with $', () => {
    render(
      <RiskSummary
        {...baseProps}
        revenue={1500000}
      />
    );
    // Should display something like "$1,500,000"
    expect(screen.getByTestId('revenue-value')).toBeInTheDocument();
    expect(screen.getByTestId('revenue-value').textContent).toContain('$');
  });

  it('renders average monthly spend value', () => {
    render(
      <RiskSummary
        {...baseProps}
        averageMonthlySpend={62500}
      />
    );
    expect(screen.getByTestId('monthly-spend-value')).toBeInTheDocument();
    expect(screen.getByTestId('monthly-spend-value').textContent).toContain('$');
  });
});
