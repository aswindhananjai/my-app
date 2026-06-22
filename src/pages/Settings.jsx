import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../utils/auth';
import BottomNav from '../components/BottomNav';
import '../styles/Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to lock the app?')) {
      logout();
      navigate('/lock');
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        <div className="settings-info">
          <div className="info-card">
            <h3>Logged in as</h3>
            <p className="current-user">{currentUser}</p>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-secondary logout-btn" onClick={handleLogout}>
            Lock App
          </button>
        </div>
      </div>

      <div className="settings-footer">
        <p className="app-version">Just us v1.0.0</p>
        <p className="app-tagline">A space that's ours.</p>
      </div>

      <BottomNav />
    </div>
  );
}
