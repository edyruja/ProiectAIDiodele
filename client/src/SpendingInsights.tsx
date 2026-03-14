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

const riskColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const SpendingInsights: React.FC = () => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e4e9f2',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
        Spending Insights
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
        Top Categories
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {categories.map((cat) => (
          <div key={cat.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontSize: '11px', color: '#374151' }}>{cat.name}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: riskColors[cat.riskLevel] }}>{cat.pct}%</span>
            </div>
            <div style={{
              height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${cat.pct}%`,
                background: riskColors[cat.riskLevel],
                borderRadius: '2px',
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Risk Flag */}
      <div style={{
        background: '#fef3f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
      }}>
        <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }}><AlertIcon /></span>
        <p style={{ margin: 0, fontSize: '11px', color: '#b91c1c', lineHeight: 1.5 }}>
          82% of spending concentrated in <strong>high-risk categories</strong>. Pattern consistent with financial obfuscation.
        </p>
      </div>
    </div>
  );
};

export default SpendingInsights;
