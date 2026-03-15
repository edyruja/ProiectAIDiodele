import React from 'react';

interface Category {
  name: string;
  pct: number;
  riskLevel: 'high' | 'medium' | 'low';
}

const categories: Category[] = [
  { name: 'Offshore Transfers', pct: 41, riskLevel: 'high' },
  { name: 'Luxury Goods', pct: 23, riskLevel: 'high' },
  { name: 'Crypto Exchanges', pct: 18, riskLevel: 'high' },
  { name: 'Real Estate', pct: 11, riskLevel: 'medium' },
  { name: 'Restaurants / Retail', pct: 7, riskLevel: 'low' },
];

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const riskColors: Record<string, string> = {
  high: 'var(--risk-high)',
  medium: 'var(--risk-medium)',
  low: 'var(--risk-low)',
};

interface SpendingInsightsProps {
  expenseCategories?: Record<string, number>;
}

const SpendingInsights: React.FC<SpendingInsightsProps> = ({ expenseCategories }) => {
  const categoriesToRender: Category[] = expenseCategories
    ? Object.entries(expenseCategories)
        .map(([name, pct]) => {
          const riskLevel: 'high' | 'medium' | 'low' =
            pct >= 20 ? 'high' : pct >= 10 ? 'medium' : 'low';
          return { name, pct, riskLevel };
        })
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5)
    : categories;

  const highRiskPct = categoriesToRender
    .filter((cat) => cat.riskLevel === 'high')
    .reduce((acc, cat) => acc + cat.pct, 0);

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: '20px',
      border: '1px solid var(--card-border)',
      padding: '24px 32px',
      boxShadow: 'var(--card-shadow)',
      backdropFilter: 'var(--apple-blur)',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '24px' }}>
        Spending Analysis Insights
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px' }}>
        TOP CATEGORIES
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        {categoriesToRender.map((cat) => (
          <div key={cat.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: riskColors[cat.riskLevel] }}>{cat.pct}%</span>
            </div>
            <div style={{
              height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${cat.pct}%`,
                background: riskColors[cat.riskLevel],
                borderRadius: '4px',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Risk Flag */}
      <div style={{
        background: 'var(--risk-high-bg)',
        border: '1px solid var(--risk-high-border)',
        borderRadius: '16px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}>
        <div style={{ color: 'var(--risk-high)', flexShrink: 0, marginTop: '1px' }}><AlertIcon /></div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--risk-high)', lineHeight: 1.5, fontWeight: 500 }}>
          High Concentration: <strong style={{ fontWeight: 800 }}>{highRiskPct}%</strong> of spending is in high-risk categories, matching patterns of financial obfuscation.
        </p>
      </div>
    </div>
  );
};

export default SpendingInsights;
