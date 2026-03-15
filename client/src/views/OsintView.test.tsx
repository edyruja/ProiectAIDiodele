import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OsintView from './OsintView';

vi.mock('../TopBar', () => ({
  default: ({ children }: { children?: any }) => (
    <div data-testid="topbar-mock">{children}</div>
  ),
}));

describe('OsintView mock-data search', () => {
  it('renders all mock records before search', () => {
    render(<OsintView />);

    expect(screen.getByText('NEXUS TRADING CORP')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Global Ventures LLC')).toBeInTheDocument();
    expect(screen.getByText('Swiss Bank Sub-Account')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('filters records in real time while typing in search input', () => {
    render(<OsintView />);

    const input = screen.getByTestId('osint-search-input');
    fireEvent.change(input, { target: { value: 'nexus' } });

    expect(screen.getByText('NEXUS TRADING CORP')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('searches by findings text and not only entity name', () => {
    render(<OsintView />);

    const input = screen.getByTestId('osint-search-input');
    fireEvent.change(input, { target: { value: 'pep' } });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('NEXUS TRADING CORP')).not.toBeInTheDocument();
  });

  it('shows empty-state fallback when nothing matches', () => {
    render(<OsintView />);

    const input = screen.getByTestId('osint-search-input');
    fireEvent.change(input, { target: { value: 'this-should-not-match-anything' } });

    expect(screen.getByText(/No intelligence records found matching your search/i)).toBeInTheDocument();
    expect(screen.getByText(/Nicio cheltuiala gasita/i)).toBeInTheDocument();
  });
});
