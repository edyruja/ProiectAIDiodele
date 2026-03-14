import DashboardAML from './DashboardAML';
import Sidebar from './Sidebar';

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
        <DashboardAML />
      </div>
    </div>
  );
}

export default App;
