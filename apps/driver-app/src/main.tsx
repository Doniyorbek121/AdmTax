import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { useAuth } from './store/auth';
import { useDriver } from './store/driver';
import { Auth } from './screens/Auth';
import { Home } from './screens/Home';
import { Offer } from './screens/Offer';
import { Active } from './screens/Active';

function App() {
  const { user, ready, loadMe } = useAuth();
  const { activeRide, loadProfile } = useDriver();

  useEffect(() => { void loadMe(); }, [loadMe]);
  useEffect(() => { if (user) void loadProfile(); }, [user]);

  if (!ready) return <div className="phone bg-ink-950 grid place-items-center text-4xl">🚕</div>;
  if (!user) return <Auth />;

  return (
    <>
      {activeRide ? <Active /> : <Home />}
      <Offer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
