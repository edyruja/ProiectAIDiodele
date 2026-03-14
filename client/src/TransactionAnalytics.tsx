import React from 'react';

interface PaymentChannel {
  name: string;
  pct: number;
  color: string;
}

const paymentChannels: PaymentChannel[] = [
  { name: 'POS (Point of Sale)', pct: 18, color: '#3b82f6' },
  { name: 'Offshore', pct: 41, color: '#ef4444' },
  { name: 'Crypto Exchanges', pct: 28, color: '#f59e0b' },
  { name: 'Wire Transfer (EU)', pct: 13, color: '#10b981' },
];

// SVG line chart data points (normalized 0-100 viewbox height, inverted)
const incomePoints = [60, 58, 55, 57, 56, 58];
const spendingPoints = [55, 60, 72, 85, 92, 98];
const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const toSvgPath = (points: number[], width: number, height: number): string => {
  const xStep = width / (points.length - 1);
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * xStep} ${height - (p / 100) * height}`)
    .join(' ');
};

const TransactionAnalytics: React.FC = () => {
  const W = 300;
  const H = 110;
  const incomePath = toSvgPath(incomePoints, W, H);
  const spendingPath = toSvgPath(spendingPoints, W, H);

  // Area fill path
  const incomeArea = `${incomePath} L ${W} ${H} L 0 ${H} Z`;
  const spendingArea = `${spendingPath} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e4e9f2',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
        Transaction Analytics
      </div>

      {/* Legend */}
      <div style={{ fontSize: '12px', color: '#374151', fontWeight: 600, marginBottom: '6px' }}>Income vs Spending Trend</div>
      <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
        <LegendDot color="#3b82f6" label="Income" />
        <LegendDot color="#93c5fd" label="Spending" />
      </div>

      {/* SVG Chart */}
      <div style={{ overflowX: 'hidden', marginBottom: '6px' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ display: 'block' }}>
          {/* Spending area */}
          <path d={spendingArea} fill="rgba(147,197,253,0.15)" />
          {/* Income area */}
          <path d={incomeArea} fill="rgba(59,130,246,0.10)" />
          {/* Spending line */}
          <path d={spendingPath} fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* Income line */}
          <path d={incomePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* X-axis labels */}
          {months.map((m, i) => (
            <text
              key={m}
              x={(i / (months.length - 1)) * W}
              y={H + 16}
              textAnchor="middle"
              fontSize="9"
              fill="#9ca3af"
              fontFamily="Inter, sans-serif"
            >
              {m}
            </text>
          ))}
        </svg>
      </div>

      {/* Payment Channels */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Payment Channels</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {paymentChannels.map(ch => (
            <div key={ch.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '2px',
                  background: ch.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: '11px', color: '#6b7280', flex: 1 }}>{ch.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '60px', height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden',
                }}>
                  <div style={{ width: `${ch.pct}%`, height: '100%', background: ch.color, borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: ch.color, width: '28px', textAlign: 'right' }}>{ch.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
    <span style={{ fontSize: '11px', color: '#6b7280' }}>{label}</span>
  </div>
);

export default TransactionAnalytics;
