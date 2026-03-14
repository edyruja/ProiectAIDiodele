import React, { useState, useEffect } from 'react';
import NetworkGraph from './components/NetworkGraph';

interface AnalysisResult {
    company_name: string;
    risk_score: number;
    risk_level: string;
    chain_of_thought: string;
    recommended_action: string;
}

interface CompanyData {
    name: string;
    registration_number?: string;
    country?: string;
    status?: string;
    address?: string;
    directors?: string[];
}

const DashboardAML: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Polling effect for Celery task status
  useEffect(() => {
    let interval: NodeJS.Timeout;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/analyze-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName })
      });
      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }
      const data = await response.json();
      setTaskId(data.task_id);
      setStatus('PENDING');
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
        <h1 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight">AML Compliance Dashboard</h1>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {status || 'Processing...'}
              </>
            ) : 'Submit'}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md flex items-start">
            <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
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
              {result.risk_level}
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
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-4m0 0l4 4m-4-4v12" /></svg>
                Network Visualization
              </h3>
              <NetworkGraph 
                companyName={companyData?.name || result.company_name} 
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
    </div>
  );
};

export default DashboardAML;
