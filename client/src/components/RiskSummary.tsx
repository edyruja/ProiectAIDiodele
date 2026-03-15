import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

interface RiskSummaryProps {
  riskScore: number;
  riskLevel: string;
  recommendedAction?: string;
  registrationDetails?: {
    number?: string;
    country?: string;
  };
  // New AML & financial fields (Cycle 3)
  sanctionsHit?: boolean;
  pepExposure?: boolean;
  revenue?: number;
  averageMonthlySpend?: number;
}

export function RiskSummary({ riskScore, riskLevel, recommendedAction, registrationDetails, sanctionsHit, pepExposure, revenue, averageMonthlySpend }: RiskSummaryProps) {
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
  const isMediumRisk = riskLevel === 'MEDIUM';

  const formatCurrency = (val: number | null | undefined) => {
    if (val == null) return 'N/A';
    return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const getRiskIcon = () => {
    if (isHighRisk) return <ShieldAlert className="h-5 w-5 text-[var(--risk-high)]" />;
    if (isMediumRisk) return <Shield className="h-5 w-5 text-[var(--risk-medium)]" />;
    return <ShieldCheck className="h-5 w-5 text-[var(--risk-low)]" />;
  };

  const getBadgeVariant = () => {
    if (isHighRisk) return "destructive";
    if (isMediumRisk) return "secondary";
    return "default";
  };

  return (
    <Card className="hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/[0.03]">
        <CardTitle className="text-[19px] font-bold text-[var(--text-primary)] flex items-center">
          <div className="mr-3 p-1.5 bg-white/[0.05] rounded-full">
            {getRiskIcon()}
          </div>
          Risk Identity
        </CardTitle>
        <Badge variant={getBadgeVariant()} className="px-4 py-1.5 rounded-full text-[12px] font-bold tracking-tight shadow-sm border-none">
          {riskLevel}
        </Badge>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Score */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">
              AML Risk Score
            </h3>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-extrabold tracking-tighter ${isHighRisk ? 'text-[var(--risk-high)]' : isMediumRisk ? 'text-[var(--risk-medium)]' : 'text-[var(--risk-low)]'}`}>
                {riskScore}
              </span>
              <span className="text-[var(--text-secondary)] font-medium text-[15px]">/ 100</span>
            </div>
          </div>

          {/* AML Flag Badges */}
          {(sanctionsHit || pepExposure) && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">
                AML Flags
              </h3>
              <div className="flex flex-wrap gap-2">
                {sanctionsHit && (
                  <span
                    data-testid="sanctions-badge"
                    className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-tight bg-[var(--risk-high)]/20 text-[var(--risk-high)] border border-[var(--risk-high)]/30"
                  >
                    ⚠ SANCTIONS HIT
                  </span>
                )}
                {pepExposure && (
                  <span
                    data-testid="pep-badge"
                    className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-tight bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  >
                    👤 PEP EXPOSED
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Revenue */}
          {revenue != null && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">
                Annual Revenue
              </h3>
              <p
                data-testid="revenue-value"
                className="text-[22px] font-extrabold tracking-tighter text-[var(--text-primary)]"
              >
                {formatCurrency(revenue)}
              </p>
            </div>
          )}

          {/* Monthly Spend */}
          {averageMonthlySpend != null && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">
                Avg Monthly Spend
              </h3>
              <p
                data-testid="monthly-spend-value"
                className="text-[22px] font-extrabold tracking-tighter text-[var(--text-primary)]"
              >
                {formatCurrency(averageMonthlySpend)}
              </p>
            </div>
          )}

          {/* Registration Info */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">
              Registration Details
            </h3>
            <p className="text-[16px] font-semibold text-[var(--text-primary)]">{registrationDetails?.number || 'N/A'}</p>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium">{registrationDetails?.country || 'Unknown Location'}</p>
          </div>

          {/* Action */}
          {recommendedAction && (
             <div className="space-y-2">
               <h3 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">
                 Recommended Action
               </h3>
               <div className="inline-flex items-center px-4 py-2 bg-white/[0.05] rounded-full border border-white/[0.05]">
                 <p className="text-[13px] font-bold text-[var(--text-primary)]">
                   {recommendedAction}
                 </p>
               </div>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
