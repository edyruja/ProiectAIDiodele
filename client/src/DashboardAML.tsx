import React, { useEffect, useMemo, useState } from 'react';
import NetworkGraph from './components/NetworkGraph';
import FinancialOverview from './FinancialOverview';
import TransactionAnalytics from './TransactionAnalytics';
import NeedWantSave from './NeedWantSave';
import SpendingInsights from './SpendingInsights';
import TopBar from './TopBar';
import { SearchForm } from './components/SearchForm';
import { RiskSummary } from './components/RiskSummary';
import { ReasoningView } from './components/ReasoningView';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Network } from 'lucide-react';
import { writeSelectedCompanyState } from './lib/selectedCompany';

interface AnalysisResult {
  risk_score: string;
  risk_level: string;
  chain_of_thought: string;
  recommended_action?: string;
  company_name?: string;
}

interface CompanyRecord {
  id: number;
  company_name: string;
  registration_number?: string;
  country?: string;
  risk_score?: number;
  risk_label?: string;
  risk_explanation?: string;
  address?: string;
  directors?: string[];
  sanctions_hit?: boolean;
  pep_exposure?: boolean;
  revenue?: number;
  average_monthly_spend?: number;
  expense_categories?: Record<string, number>;
  budget_breakdown?: {
    need?: number;
    want?: number;
    save?: number;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getRiskLevel = (riskScore: any): 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (riskScore == null) return 'LOW';
  const score = parseInt(riskScore, 10);
  if (!isNaN(score)) {
    if (score > 70) return 'HIGH';
    if (score > 30) return 'MEDIUM';
    return 'LOW';
  }

  const val = String(riskScore).toLowerCase();
  if (val.includes('high')) return 'HIGH';
  if (val.includes('medium')) return 'MEDIUM';
  return 'LOW';
};

const DashboardAML: React.FC = () => {
  const [submittedName, setSubmittedName] = useState('CUSTOMER DASHBOARD');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<CompanyRecord | null>(null);
  const [mockCompanies, setMockCompanies] = useState<CompanyRecord[]>([]);

  const buildResultFromCompany = (company: CompanyRecord): AnalysisResult => {
    const scoreRaw = company.risk_score ?? 0;
    const normalizedScore = scoreRaw <= 1 ? Math.round(scoreRaw * 100) : Math.round(scoreRaw);
    const directorsCount = Array.isArray(company.directors) ? company.directors.length : 0;
    const riskNarrative = company.risk_explanation || 'No explicit risk explanation available.';
    return {
      company_name: company.company_name,
      risk_score: String(normalizedScore),
      risk_level: company.risk_label || getRiskLevel(normalizedScore),
      chain_of_thought: [
        'Source: Database mock profile (no LLM call required).',
        `Company: ${company.company_name}`,
        `Country: ${company.country || 'Unknown'}`,
        `Registration: ${company.registration_number || 'N/A'}`,
        `Directors observed: ${directorsCount}`,
        '',
        `Risk rationale: ${riskNarrative}`,
      ].join('\n'),
      recommended_action:
        normalizedScore > 70
          ? 'Enhanced due-diligence'
          : normalizedScore > 30
            ? 'Standard review'
            : 'Monitor',
    };
  };

  const applyCompanySelection = (company: CompanyRecord) => {
    setCompanyData(company);
    setResult(buildResultFromCompany(company));
    setSubmittedName(company.company_name.toUpperCase());
    writeSelectedCompanyState({ id: company.id, name: company.company_name });
  };

  const fetchMockCompanies = async (): Promise<CompanyRecord[]> => {
    const response = await fetch(`${API_BASE}/mock-companies?limit=50`);
    if (!response.ok) {
      throw new Error('Failed to fetch mock companies from database');
    }
    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    setMockCompanies(items);
    return items;
  };

  const ensureMockCompaniesLoaded = async (): Promise<CompanyRecord[]> => {
    if (mockCompanies.length > 0) {
      return mockCompanies;
    }
    return fetchMockCompanies();
  };

  const findCompanyByNameFromDb = async (companyName: string): Promise<CompanyRecord[]> => {
    const response = await fetch(
      `${API_BASE}/mock-companies?limit=25&query=${encodeURIComponent(companyName.trim())}`,
    );
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return items as CompanyRecord[];
  };

  const findBestMatch = (companies: CompanyRecord[], query: string): CompanyRecord | null => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const exact = companies.find((company) => company.company_name.toLowerCase() === normalized);
    if (exact) {
      return exact;
    }

    const startsWith = companies.find((company) => company.company_name.toLowerCase().startsWith(normalized));
    if (startsWith) {
      return startsWith;
    }

    const includes = companies.find((company) => company.company_name.toLowerCase().includes(normalized));
    return includes || null;
  };

  useEffect(() => {
    // Start from a neutral state so previous sessions do not force a default company.
    writeSelectedCompanyState({ id: null, name: null });

    fetchMockCompanies()
      .then(() => {
        // Data loaded; wait for explicit user Analyze action.
      })
      .catch(() => {
        // Keep silent; user can still manually analyze by searching mock companies.
      });
  }, []);

  const handleSearch = async (companyName: string) => {
    if (!companyName.trim()) return;

    const normalizedName = companyName.trim();
    setLoading(true);
    setError(null);
    setStatus('SEARCHING_DB');
    setSubmittedName(normalizedName.toUpperCase());
    writeSelectedCompanyState({ id: null, name: normalizedName });
    // Clear previous graph/result so stale values do not remain visible.
    setCompanyData(null);
    setResult(null);

    try {
      const companies = await ensureMockCompaniesLoaded();
      const directDbMatches = await findCompanyByNameFromDb(normalizedName);
      const dbMatch = findBestMatch(directDbMatches, normalizedName) || findBestMatch(companies, normalizedName);

      if (dbMatch) {
        applyCompanySelection(dbMatch);
        setStatus('DB_MOCK_MATCH');
        setLoading(false);
        return;
      }

      // No mock match found - fallback to real AI Analysis
      setStatus('STARTING_AI_ANALYSIS');
      const aiResponse = await fetch(`${API_BASE}/analyze-company-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: normalizedName }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.detail || 'AI analysis request failed');
      }

      const aiPayload = await aiResponse.json();
      if (aiPayload.status === 'SUCCESS' && aiPayload.result) {
        const { analysis, company_data: realData } = aiPayload.result;
        
        // Map real company data to our record structure with safe defaults
        const record: CompanyRecord = {
          id: -1,
          company_name: analysis?.company_name || normalizedName,
          registration_number: realData?.registration_number || analysis?.registration_number || 'N/A',
          country: realData?.country || analysis?.country || 'Global',
          risk_score: (analysis?.risk_score || 0) / 100,
          risk_label: analysis?.risk_level || 'HIGH',
          risk_explanation: analysis?.chain_of_thought || 'No explanation provided.',
          address: realData?.address || 'OSINT Detected',
          directors: Array.isArray(analysis?.directors) ? analysis.directors : [], // Ensure directors is at least []
          revenue: realData?.revenue || 0,
          average_monthly_spend: realData?.average_monthly_spend || 0,
          expense_categories: {},
          budget_breakdown: { need: 33, want: 33, save: 34 }
        };

        setCompanyData(record);
        setResult({
          company_name: analysis?.company_name || normalizedName,
          risk_score: String(analysis?.risk_score || 0),
          risk_level: analysis?.risk_level || 'HIGH',
          chain_of_thought: analysis?.chain_of_thought || 'Analysis complete.',
          recommended_action: analysis?.recommended_action || 'Review required'
        });
        
        setStatus('AI_ANALYSIS_COMPLETE');
        setLoading(false);
        return;
      }

      setStatus('NOT_FOUND');
      setError(`Analysis for \"${normalizedName}\" could not be completed.`);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Unknown error during analysis');
      setLoading(false);
    }
  };

  const relatedCompanies = useMemo(() => {
    if (!companyData?.company_name) {
      return [];
    }
    return mockCompanies
      .filter((company) => company.company_name !== companyData.company_name)
      .filter((company) => {
        if (companyData.country && company.country === companyData.country) {
          return true;
        }
        return company.risk_label === companyData.risk_label;
      })
      .slice(0, 4)
      .map((company) => ({
        id: company.id,
        name: company.company_name,
        riskLabel: company.risk_label,
        country: company.country,
        relation:
          company.country && companyData.country && company.country === companyData.country
            ? `Country peer: ${company.country}`
            : `Risk peer: ${company.risk_label || 'UNKNOWN'}`,
      }));
  }, [mockCompanies, companyData]);

  const handleRelatedCompanySelect = (companyId: number) => {
    const selected = mockCompanies.find((company) => company.id === companyId);
    if (!selected) {
      return;
    }
    setStatus('GRAPH_SELECTION');
    setError(null);
    applyCompanySelection(selected);
  };

  const riskLevel = result ? getRiskLevel(result.risk_score) : 'HIGH';

  return (
    <div className="flex flex-col h-screen bg-[var(--main-bg)]">
      <TopBar entityName={submittedName} riskLevel={riskLevel}>
        <div className="ml-8 w-full max-w-sm">
          <SearchForm onSearch={handleSearch} isLoading={loading} status={status} />
        </div>
      </TopBar>

      {error && (
        <div className="m-8 p-6 bg-red-500/10 border-l-4 border-red-500 text-red-500 rounded-r-[12px] flex items-start shadow-sm">
          <span className="font-medium text-[14px]">{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-10 scrollbar-thin">
        <div className="mb-10">
          <FinancialOverview companyData={companyData} companies={mockCompanies} />
        </div>

        {result && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mb-10">
            <RiskSummary
              riskScore={parseInt(result.risk_score, 10) || 0}
              riskLevel={result.risk_level || riskLevel}
              recommendedAction={result.recommended_action}
              registrationDetails={{
                number: companyData?.registration_number,
                country: companyData?.country,
              }}
              sanctionsHit={companyData?.sanctions_hit}
              pepExposure={companyData?.pep_exposure}
              revenue={companyData?.revenue}
              averageMonthlySpend={companyData?.average_monthly_spend}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 overflow-hidden border-white/5">
                <CardHeader className="pb-3 border-b border-white/[0.03]">
                  <CardTitle className="flex items-center text-[var(--text-primary)]">
                    <Network className="w-5 h-5 mr-3 text-[var(--apple-blue)]" />
                    Network Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[450px] bg-black/20 relative">
                  <NetworkGraph
                    companyName={companyData?.company_name || result.company_name || submittedName}
                    directors={companyData?.directors}
                    address={companyData?.address}
                    relatedCompanies={relatedCompanies}
                    onRelatedCompanySelect={handleRelatedCompanySelect}
                  />
                </CardContent>
              </Card>

              <div className="lg:col-span-1 h-[450px]">
                <ReasoningView chainOfThought={result.chain_of_thought} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mt-10">
          <TransactionAnalytics companyData={companyData} companies={mockCompanies} />
          <div className="flex flex-col gap-10">
            <NeedWantSave budgetBreakdown={companyData?.budget_breakdown} />
            <SpendingInsights expenseCategories={companyData?.expense_categories} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAML;
