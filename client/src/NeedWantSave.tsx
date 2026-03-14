import React from 'react';

interface DonutProps {
  percentage: number;
  color: string;
  label: string;
  sublabel: string;
}

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DonutChart: React.FC<DonutProps> = ({ percentage, color, label, sublabel }) => {
  const dashOffset = CIRCUMFERENCE * (1 - percentage / 100);

  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ display: 'block', margin: '0 auto' }}>
        {/* Track */}
        <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="36"
          cy="36"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        {/* Center text */}
        <text x="36" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill={color} fontFamily="Inter, sans-serif">
          {percentage}%
        </text>
      </svg>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginTop: '6px', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{sublabel}</div>
    </div>
  );
};

const NeedWantSave: React.FC = () => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e4e9f2',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
        Need-Want-Save
      </div>

      {/* Donut Charts Row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '14px' }}>
        <DonutChart percentage={15} color="#3b82f6" label="NEED" sublabel="Essential" />
        <DonutChart percentage={80} color="#ef4444" label="WANT" sublabel="Luxury/Crypto" />
        <DonutChart percentage={5} color="#10b981" label="SAVE" sublabel="Reserves" />
      </div>

      {/* Warning Label */}
      <div style={{
        background: '#fef3f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '11px',
        color: '#b91c1c',
        lineHeight: 1.5,
      }}>
        High &ldquo;Want&rdquo; distribution indicates <strong>luxury/crypto asset integration</strong>.
      </div>
    </div>
  );
};

export default NeedWantSave;
