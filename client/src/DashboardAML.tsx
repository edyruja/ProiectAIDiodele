import React, { useState, useEffect } from 'react';
import NetworkGraph from './components/NetworkGraph';
import FinancialOverview from './FinancialOverview';
import TransactionAnalytics from './TransactionAnalytics';
import NeedWantSave from './NeedWantSave';
import SpendingInsights from './SpendingInsights';
import TopBar from './TopBar';

// New Shadcn Components
import { SearchForm } from './components/SearchForm';
import { RiskSummary } from './components/RiskSummary';
import { ReasoningView } from './components/ReasoningView';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Network } from 'lucide-react';

interface AnalysisResult {
  risk_score: string;
  risk_level?: string;
  risk_label?: string;
  chain_of_thought?: string;
  risk_explanation?: string;
  recommended_action?: string;
  company_name?: string;
  registration_number?: string;
  country?: string;
  industry?: string;
  incorporation_date?: string;
  sanctions_hit?: boolean;
  pep_exposure?: boolean;
  directors?: string[];
  address?: string;
}

const getRiskLevel = (riskScore: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  const lower = riskScore.toLowerCase();
  if (lower.includes('high')) return 'HIGH';
  if (lower.includes('medium')) return 'MEDIUM';
  return 'LOW';
};

const DashboardAML: React.FC = () => {
  const [submittedName, setSubmittedName] = useState('NEXUS TRADING CORP');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
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

  const syncMode = import.meta.env.VITE_SYNC_MODE === 'true';

  const handleSearch = async (companyName: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCompanyData(null);

    try {
      if (syncMode) {
        setStatus('PROCESSING');
        const response = await fetch('http://localhost:8000/analyze-company-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_name: companyName })
        });
        if (!response.ok) throw new Error('Failed to run analysis');
        const data = await response.json();
        setResult(data.result.analysis);
        setCompanyData(data.result.company_data);
        setSubmittedName(companyName.toUpperCase());
        setStatus('SUCCESS');
        setLoading(false);
      } else {
        const response = await fetch('http://localhost:8000/analyze-company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_name: companyName })
        });
        if (!response.ok) throw new Error('Failed to start analysis');
        const data = await response.json();
        
        if (data.cached_data) {
          // Fast-path: we got data back from SQLite directly!
          setResult(data.cached_data);
          setCompanyData(data.cached_data);
          setSubmittedName(companyName.toUpperCase());
          setStatus('SUCCESS');
          setLoading(false);
          return;
        }

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
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top Bar Navigation */}
      <TopBar
        entityName={submittedName}
        riskLevel={riskLevel}
      >
        <div className="ml-4 w-full max-w-sm">
           <SearchForm onSearch={handleSearch} isLoading={loading} status={status} />
        </div>
      </TopBar>

      {/* Error Banner */}
      {error && (
        <div className="m-4 mx-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md flex items-start">
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {/* Main Content Dashboard */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {/* Legacy Financial Overview Component */}
        <div className="mb-6">
          <FinancialOverview 
             companyName={result?.company_name || submittedName} 
             riskScore={result?.risk_score ? Number(result.risk_score) : undefined} 
          />
        </div>

        {/* --- SHADCN BENTO GRID LAYOUT --- */}
        {result && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
            {/* Top Row: Risk Identity */}
            <RiskSummary 
               riskScore={Number(result.risk_score) || 0}
               riskLevel={result.risk_label || riskLevel}
               recommendedAction={result.recommended_action}
               registrationDetails={{
                 number: result.registration_number || companyData?.registration_number,
                 country: result.country || companyData?.country,
                 industry: result.industry || companyData?.industry,
                 incorporationDate: result.incorporation_date || companyData?.incorporation_date
               }}
               trustScore={Math.round((1 - (Number(result.risk_score) || 0)) * 100)}
               sanctionsHit={result.sanctions_hit ?? companyData?.sanctions_hit}
               pepExposure={result.pep_exposure ?? companyData?.pep_exposure}
            />

            {/* Middle Row: Network Graph & Reasoning */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Network Graph spans 2 columns */}
              <Card className="lg:col-span-2 shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-100 bg-white">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center">
                    <Network className="w-4 h-4 mr-2" />
                    Network Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[400px] bg-slate-50 relative">
                  <NetworkGraph 
                    companyName={result.company_name || companyData?.name} 
                    directors={result.directors || companyData?.directors}
                    address={result.address || companyData?.address}
                  />
                </CardContent>
              </Card>

              {/* Reasoning Card spans 1 column */}
              <div className="lg:col-span-1 h-[400px]">
                <ReasoningView chainOfThought={result.risk_explanation || result.chain_of_thought || ''} />
              </div>
            </div>
          </div>
        )}

        {/* Analytics (Legacy Components) */}
        {!result && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
             <TransactionAnalytics />
             <div className="flex flex-col gap-6">
               <NeedWantSave />
               <SpendingInsights />
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAML;
