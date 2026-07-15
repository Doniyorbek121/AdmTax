import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { initNative } from './lib/native';
import { useAuth } from './store/auth';
import { useRide } from './store/ride';
import { Auth } from './screens/Auth';
import { Home } from './screens/Home';
import { Search } from './screens/Search';
import { Choose } from './screens/Choose';
import { Active } from './screens/Active';
import { Wallet } from './screens/Wallet';

function App() {
  const { user, ready, loadMe } = useAuth();
  const { screen, loadActive } = useRide();

  useEffect(() => { void initNative(); void loadMe(); }, [loadMe]);
  useEffect(() => { if (user) void loadActive(); }, [user]);

  if (!ready) {
    return (
      <div className="phone bg-ink-950 grid place-items-center text-4xl">🚕</div>
    );
  }
  if (!user) return <Auth />;

  switch (screen) {
    case 'search': return <Search />;
    case 'choose': return <Choose />;
    case 'active': return <Active />;
    case 'wallet': return <Wallet />;
    default: return <Home />;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
