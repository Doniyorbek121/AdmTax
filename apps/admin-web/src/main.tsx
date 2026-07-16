import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './index.css';
import { useAuth } from './store/auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Drivers } from './pages/Drivers';
import { Rides } from './pages/Rides';
import { Fleet } from './pages/Fleet';
import { Tariffs } from './pages/Tariffs';
import { Users } from './pages/Users';
import { Analytics } from './pages/Analytics';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-400">
        Yuklanmoqda…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function App() {
  const loadMe = useAuth((s) => s.loadMe);
  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <Protected>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/fleet" element={<Fleet />} />
                  <Route path="/rides" element={<Rides />} />
                  <Route path="/drivers" element={<Drivers />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/tariffs" element={<Tariffs />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
