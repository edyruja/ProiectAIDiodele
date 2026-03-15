import { Routes, Route } from 'react-router-dom';
import DashboardAML from './DashboardAML';
import Sidebar from './Sidebar';
import NetworkView from './views/NetworkView';
import OsintView from './views/OsintView';
import TemporalGraphView from './views/TemporalGraphView';

function App() {
  return (
    <div className="dark" style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--main-bg)',
      color: 'var(--text-primary)',
    }}>
      {/* Dark Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--main-bg)',
      }}>
        <Routes>
          <Route path="/" element={<DashboardAML />} />
          <Route path="/network" element={<NetworkView />} />
          <Route path="/osint" element={<OsintView />} />
          <Route path="/temporal" element={<TemporalGraphView />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
