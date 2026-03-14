import { Routes, Route } from 'react-router-dom';
import DashboardAML from './DashboardAML';
import Sidebar from './Sidebar';
import NetworkView from './views/NetworkView';
import OsintView from './views/OsintView';

function App() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--main-bg)',
    }}>
      {/* Dark Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#f0f2f7',
      }}>
        <Routes>
          <Route path="/" element={<DashboardAML />} />
          <Route path="/network" element={<NetworkView />} />
          <Route path="/osint" element={<OsintView />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
