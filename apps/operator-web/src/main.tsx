import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { useAuth } from './store/auth';
import { Login } from './pages/Login';
import { Console } from './pages/Console';

function App() {
  const { user, loading, loadMe } = useAuth();
  useEffect(() => { void loadMe(); }, [loadMe]);

  if (loading) return <div className="min-h-screen grid place-items-center text-ink-400">Yuklanmoqda…</div>;
  if (!user) return <Login />;
  return <Console />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
