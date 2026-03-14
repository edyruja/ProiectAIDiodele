import React, { useState } from 'react';
import FinancialOverview from './FinancialOverview';
import AnalystReasoning from './AnalystReasoning';
import TransactionAnalytics from './TransactionAnalytics';
import NeedWantSave from './NeedWantSave';
import SpendingInsights from './SpendingInsights';
import TopBar from './TopBar';

interface AnalysisResult {
  risk_score: string;
  chain_of_thought: string;
}

const getRiskLevel = (riskScore: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  const lower = riskScore.toLowerCase();
  if (lower.includes('high')) return 'HIGH';
  if (lower.includes('medium')) return 'MEDIUM';
  return 'LOW';
};

const DashboardAML: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [submittedName, setSubmittedName] = useState('NEXUS TRADING CORP');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJSON, setShowJSON] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowJSON(false);
    try {
      const response = await fetch('/analyze-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName }),
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setResult(data);
      setSubmittedName(companyName.toUpperCase());
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const riskLevel = result ? getRiskLevel(result.risk_score) : 'HIGH';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Bar — includes the search form */}
      <TopBar
        entityName={submittedName}
        riskLevel={riskLevel}
        onViewJSON={() => setShowJSON(v => !v)}
      >
        {/* The form is embedded in TopBar children so tests can find it */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '8px' }}
        >
          <div style={{ position: 'relative' }}>
            <svg
              style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#9ca3af' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Enter company name..."
              required
              style={{
                paddingLeft: '32px',
                paddingRight: '12px',
                paddingTop: '7px',
                paddingBottom: '7px',
                border: '1px solid #e4e9f2',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#374151',
                outline: 'none',
                width: '220px',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#93c5fd' : '#3b82f6',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.15s',
            }}
          >
            {loading ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Processing...
              </>
            ) : 'Submit'}
          </button>
        </form>
      </TopBar>

      {/* Error Banner */}
      {error && (
        <div style={{
          margin: '12px 24px 0',
          padding: '10px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {error}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }} className="scrollbar-thin">
        {/* Financial Overview */}
        <div style={{ marginBottom: '20px' }}>
          <FinancialOverview />
        </div>

        {/* Middle Row: Analyst | Transaction Analytics | NWS + Spending */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: '16px', marginBottom: '20px', alignItems: 'start' }}>
          {/* Analyst Reasoning */}
          <AnalystReasoning chainOfThought={result?.chain_of_thought} />

          {/* Transaction Analytics */}
          <TransactionAnalytics />

          {/* Right Column: Need-Want-Save + Spending Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <NeedWantSave />
            <SpendingInsights />
          </div>
        </div>

        {/* Results Section (from backend, revealed after submit) */}
        {result && (
          <div
            className="slide-in"
            style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e4e9f2',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e4e9f2',
              background: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#374151' }}>
                Analysis Results
              </h2>
              <div style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                background: riskLevel === 'HIGH' ? '#fef2f2' : riskLevel === 'MEDIUM' ? '#fffbeb' : '#f0fdf4',
                color: riskLevel === 'HIGH' ? '#dc2626' : riskLevel === 'MEDIUM' ? '#d97706' : '#16a34a',
                border: `1px solid ${riskLevel === 'HIGH' ? '#fecaca' : riskLevel === 'MEDIUM' ? '#fde68a' : '#bbf7d0'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: riskLevel === 'HIGH' ? '#ef4444' : riskLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e',
                  animation: 'status-pulse 1.5s infinite',
                  display: 'inline-block',
                }} />
                {result.risk_score}
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  AML Risk Score
                </h3>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f1117' }}>
                  {result.risk_score}
                </p>
              </div>
              <div>
                <h3 style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Explanation (Chain of Thought)
                </h3>
                <div style={{
                  background: '#1a2235',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #2a3a52',
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#c8d3e6', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.7 }}>
                    {result.chain_of_thought}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Raw JSON Modal */}
        {showJSON && result && (
          <div
            className="slide-in"
            style={{
              marginTop: '16px',
              background: '#1a2235',
              borderRadius: '12px',
              border: '1px solid #2a3a52',
              padding: '16px 20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', marginBottom: '10px', letterSpacing: '0.1em' }}>
              RAW JSON OUTPUT
            </div>
            <pre style={{ margin: 0, color: '#c8d3e6', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6, overflowX: 'auto' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DashboardAML;
