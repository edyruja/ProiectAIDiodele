import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  to: string;
}




const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1"/>
    <rect width="7" height="5" x="14" y="3" rx="1"/>
    <rect width="7" height="9" x="14" y="12" rx="1"/>
    <rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);

const NetworkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
  </svg>
);

const OsintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" x2="22" y1="12" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const Sidebar: React.FC = () => {
  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backdropFilter: 'var(--apple-blur)',
      }}
    >
      {/* Logo Area */}
      <div style={{ padding: '32px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <img src="/logo.png" alt="Vestra" style={{ 
          width: '85%', 
          height: 'auto', 
          maxHeight: '100px', 
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.1))'
        }} />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }} className="scrollbar-thin">
        <SectionLabel label="INVESTIGATION" />
        <NavLink icon={<DashboardIcon />} label="Customer Dashboard" to="/" />
        <NavLink icon={<NetworkIcon />} label="Network Graph" to="/network" />
        <NavLink icon={<HistoryIcon />} label="Temporal Analysis" to="/temporal" />
        <NavLink icon={<OsintIcon />} label="OSINT Data Bridge" to="/osint" />
      </nav>

    </aside>
  );
};

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    padding: '12px 24px 8px',
    color: 'var(--sidebar-text)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    opacity: 0.5,
  }}>{label}</div>
);

const NavLink: React.FC<NavItem> = ({ icon, label, to }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderRadius: '10px',
        margin: '2px 12px',
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
        color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: active ? 600 : 500,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
      }}>
        {active && (
          <div style={{
            position: 'absolute',
            left: '0',
            width: '3px',
            height: '18px',
            background: 'var(--sidebar-accent)',
            borderRadius: '0 4px 4px 0',
          }} />
        )}
        <span style={{ 
          opacity: active ? 1 : 0.7, 
          flexShrink: 0,
          color: active ? 'var(--sidebar-accent)' : 'inherit'
        }}>{icon}</span>
        <span style={{ lineHeight: 1 }}>{label}</span>
      </div>
    </Link>
  );
};

export default Sidebar;
