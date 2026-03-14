import React, { useState, useEffect } from 'react';
import NetworkGraph from './components/NetworkGraph';
import FinancialOverview from './FinancialOverview';
import AnalystReasoning from './AnalystReasoning';
import TransactionAnalytics from './TransactionAnalytics';
import NeedWantSave from './NeedWantSave';
import SpendingInsights from './SpendingInsights';
import TopBar from './TopBar';

interface AnalysisResult {
  risk_score: string;
  risk_level: string;
  chain_of_thought: string;
  recommended_action?: string;
  company_name?: string;
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
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showJSON, setShowJSON] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  // Polling effect for Celery task status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (taskId && loading) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:8000/analysis-status/${taskId}`);
          if (!response.ok) throw new Error('Failed to poll status');
          
          const data = await response.json();
          setStatus(data.status);

          if (data.status === 'SUCCESS') {
            setResult(data.result.analysis);
            setCompanyData(data.result.company_data);
            setLoading(false);
            setTaskId(null);
            clearInterval(interval);
          } else if (data.status === 'FAILURE') {
            setError(data.error || 'Task failed on backend');
            setLoading(false);
            setTaskId(null);
            clearInterval(interval);
          }
        } catch (err: any) {
          setError(err.message);
          setLoading(false);
          clearInterval(interval);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => clearInterval(interval);
  }, [taskId, loading]);

  // Set VITE_SYNC_MODE=true in .env.local to bypass Redis/Celery for local dev
  const syncMode = import.meta.env.VITE_SYNC_MODE === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setCompanyData(null);
    setShowJSON(false);

    try {
      if (syncMode) {
        // ── SYNC MODE ── no Redis/Celery needed, result comes back directly
        setStatus('PROCESSING');
        const response = await fetch('http://localhost:8000/analyze-company-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_name: companyName })
        });
        if (!response.ok) throw new Error('Failed to run analysis');
        const data = await response.json();
        // Shape: { status: 'SUCCESS', result: { analysis, company_data } }
        setResult(data.result.analysis);
        setCompanyData(data.result.company_data);
        setSubmittedName(companyName.toUpperCase());
        setStatus('SUCCESS');
        setLoading(false);
      } else {
        // ── ASYNC MODE ── requires Redis + Celery worker running
        const response = await fetch('http://localhost:8000/analyze-company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_name: companyName })
        });
        if (!response.ok) throw new Error('Failed to start analysis');
        const data = await response.json();
        setTaskId(data.task_id);
        setSubmittedName(companyName.toUpperCase());
        setStatus('PENDING');
      }

    } catch (err: any) {
      setError(err.message || 'Unknown error');
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
                {status || 'Processing...'}
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

      {result && (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Analysis Results
            </h2>
            <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
              result.risk_level === 'HIGH' || result.risk_level === 'CRITICAL'
                ? 'bg-red-100 text-red-700 border border-red-200 shadow-sm' 
                : result.risk_level === 'MEDIUM'
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm'
                : 'bg-green-100 text-green-700 border border-green-200 shadow-sm'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                result.risk_level === 'HIGH' || result.risk_level === 'CRITICAL' ? 'bg-red-500' 
                : result.risk_level === 'MEDIUM' ? 'bg-yellow-500'
                : 'bg-green-500'
              }`}></span>
              {result.risk_level || result.risk_score}
            </div>
          </div>
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  AML Risk Score
                </h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-gray-900">{result.risk_score}</p>
                  <p className="text-gray-400 font-medium">/ 100</p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Registration Details
                </h3>
                <p className="text-sm font-medium text-slate-700">{companyData?.registration_number || 'N/A'}</p>
                <p className="text-xs text-slate-500">{companyData?.country || 'Unknown Location'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Recommended Action
              </h3>
              <p className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 inline-block">{(result as any).recommended_action}</p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-4m0 0l4 4m-4-4v12" /></svg>
                Network Visualization
              </h3>
              <NetworkGraph 
                companyName={companyData?.name || (result as any).company_name} 
                directors={companyData?.directors}
                address={companyData?.address}
              />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Explanation (Chain of Thought)
              </h3>
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 shadow-inner">
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-mono text-sm">
                  {result.chain_of_thought}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes status-pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>

    </div>
  );
};

export default DashboardAML;
