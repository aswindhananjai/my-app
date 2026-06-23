import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isAuthenticated, logout } from './utils/auth';
import { requestNotificationPermission, setupForegroundMessageListener } from './utils/notifications';

// Pages
import PasscodeLock from './pages/PasscodeLock';
import Timeline from './pages/Timeline';
import Settings from './pages/Settings';
import AddMemory from './pages/AddMemory';
import MemoryDetail from './pages/MemoryDetail';
import AllMemories from './pages/AllMemories';

function ProtectedRoute({ children }) {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  if (authenticated === null) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return authenticated ? children : <Navigate to="/lock" replace />;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLocked, setIsLocked] = useState(!isAuthenticated());

  useEffect(() => {
    // Setup notification listener when user is authenticated
    if (isAuthenticated()) {
      // Setup foreground message listener
      const timer = setTimeout(() => {
        requestNotificationPermission();
        setupForegroundMessageListener();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Keep isLocked state in sync with authentication status
    const checkAuth = () => {
      if (!isAuthenticated()) {
        setIsLocked(true);
      }
    };
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-lock when app goes to background
    const handleVisibilityChange = () => {
      // When page becomes hidden (app goes to background)
      if (document.hidden) {
        // Mark the time when app was backgrounded
        localStorage.setItem('justus_backgrounded_at', Date.now().toString());
      } else {
        // When page becomes visible again (app comes to foreground)
        const backgroundedAt = localStorage.getItem('justus_backgrounded_at');

        if (backgroundedAt && isAuthenticated() && location.pathname !== '/lock') {
          // Lock the app immediately, setting isLocked to true and calling logout
          logout();
          setIsLocked(true);
          localStorage.removeItem('justus_backgrounded_at');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/lock" element={<PasscodeLock onSuccess={() => { setIsLocked(false); navigate('/'); }} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Timeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/memories"
          element={
            <ProtectedRoute>
              <AllMemories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddMemory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/memory/:id"
          element={
            <ProtectedRoute>
              <MemoryDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <AddMemory />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global screen overlay lock */}
      {isLocked && location.pathname !== '/lock' && (
        <div className="global-lock-overlay">
          <PasscodeLock onSuccess={() => setIsLocked(false)} />
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
