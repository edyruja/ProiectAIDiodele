import React from 'react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

interface StatusItem {
  label: string;
  status: 'online' | 'connected' | 'idle';
  statusText: string;
}

const statusColors: Record<string, string> = {
  online: '#10b981',
  connected: '#3b82f6',
  idle: '#f59e0b',
};

const BrainIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
    <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
    <path d="M6 18a4 4 0 0 1-1.967-.516"/>
    <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
  </svg>
);

const OrchestratorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
);

const AnalystIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

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

const VectorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
    <path d="M3 12A9 3 0 0 0 21 12"/>
  </svg>
);

const ServerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
    <line x1="6" x2="6.01" y1="6" y2="6"/>
    <line x1="6" x2="6.01" y1="18" y2="18"/>
  </svg>
);

const statusItems: StatusItem[] = [
  { label: 'FastAPI Backend', status: 'online', statusText: 'Online' },
  { label: 'Qdrant (RAG)', status: 'connected', statusText: 'Connected' },
  { label: 'Celery + Redis', status: 'idle', statusText: 'Idle (0 Tasks)' },
];

const Sidebar: React.FC = () => {
  return (
    <aside
      style={{
        width: '220px',
        minWidth: '220px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <BrainIcon />
          </div>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '14px', letterSpacing: '0.01em' }}>Antigravity</div>
            <div style={{ color: '#4a90d9', fontWeight: 600, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>AI SYSTEM</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }} className="scrollbar-thin">
        <SectionLabel label="AGENT ECOSYSTEM" />
        <NavLink icon={<OrchestratorIcon />} label="Orchestrator Hub" />
        <NavLink icon={<AnalystIcon />} label="Analyst Agent (CoT)" />

        <SectionLabel label="INVESTIGATION" />
        <NavLink icon={<DashboardIcon />} label="Customer Dashboard" active />
        <NavLink icon={<NetworkIcon />} label="Network Graph (React Flow)" />
        <NavLink icon={<OsintIcon />} label="OSINT Data Bridge" />

        <SectionLabel label="INFRASTRUCTURE" />
        <NavLink icon={<VectorIcon />} label="Vector Store (MCP)" />
      </nav>

      {/* Status Bar */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--sidebar-border)' }}>
        {statusItems.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ServerIcon />
              <span style={{ color: 'var(--sidebar-text)', fontSize: '10px' }}>{item.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: statusColors[item.status],
                display: 'inline-block',
                animation: item.status === 'online' ? 'status-pulse 2s infinite' : undefined,
              }} />
              <span style={{ color: statusColors[item.status], fontSize: '10px', fontWeight: 600 }}>{item.statusText}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    padding: '10px 16px 4px',
    color: '#4a5568',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  }}>{label}</div>
);

const NavLink: React.FC<NavItem> = ({ icon, label, active }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    borderRadius: '6px',
    margin: '1px 8px',
    background: active ? 'var(--sidebar-active-bg)' : 'transparent',
    color: active ? '#e2e8f0' : 'var(--sidebar-text)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    borderLeft: active ? '3px solid var(--sidebar-accent)' : '3px solid transparent',
    transition: 'all 0.15s ease',
  }}>
    <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>{icon}</span>
    <span style={{ lineHeight: 1.3 }}>{label}</span>
  </div>
);

export default Sidebar;
