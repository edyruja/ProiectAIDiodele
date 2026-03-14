import React from 'react';
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
}

export function RiskSummary({ riskScore, riskLevel, recommendedAction, registrationDetails }: RiskSummaryProps) {
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
  const isMediumRisk = riskLevel === 'MEDIUM';

  const getRiskIcon = () => {
    if (isHighRisk) return <ShieldAlert className="h-5 w-5 text-red-500" />;
    if (isMediumRisk) return <Shield className="h-5 w-5 text-yellow-500" />;
    return <ShieldCheck className="h-5 w-5 text-green-500" />;
  };

  const getBadgeVariant = () => {
    if (isHighRisk) return "destructive";
    if (isMediumRisk) return "secondary"; // Will style in CSS
    return "default";
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50 border-b border-gray-100 rounded-t-lg">
        <CardTitle className="text-xl font-semibold text-slate-800 flex items-center">
          {getRiskIcon()}
          <span className="ml-2">Risk Identity</span>
        </CardTitle>
        <Badge variant={getBadgeVariant()} className="text-sm font-bold animate-in fade-in">
          {riskLevel}
        </Badge>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Score */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              AML Risk Score
            </h3>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold ${isHighRisk ? 'text-red-600' : isMediumRisk ? 'text-yellow-600' : 'text-green-600'}`}>
                {riskScore}
              </span>
              <span className="text-muted-foreground font-medium">/ 100</span>
            </div>
          </div>

          {/* Registration Info */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Registration Details
            </h3>
            <p className="text-sm font-medium text-slate-700">{registrationDetails?.number || 'N/A'}</p>
            <p className="text-xs text-slate-500">{registrationDetails?.country || 'Unknown Location'}</p>
          </div>

          {/* Action */}
          {recommendedAction && (
             <div className="space-y-1">
               <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                 Recommended Action
               </h3>
               <p className="text-sm font-semibold text-slate-800 bg-slate-100 rounded-md px-3 py-1.5 inline-block">
                 {recommendedAction}
               </p>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
