import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { initNative } from './lib/native';
import { useAuth } from './store/auth';
import { useDriver } from './store/driver';
import { Auth } from './screens/Auth';
import { Home } from './screens/Home';
import { Offer } from './screens/Offer';
import { Active } from './screens/Active';
import { Registration } from './screens/Registration';

function App() {
  const { user, ready, loadMe } = useAuth();
  const { activeRide, profile, loadProfile } = useDriver();

  useEffect(() => { void initNative(); void loadMe(); }, [loadMe]);
  useEffect(() => { if (user) void loadProfile(); }, [user]);

  if (!ready) return <div className="phone bg-ink-950 grid place-items-center text-4xl">🚕</div>;
  if (!user) return <Auth />;

  // Ro'yxatdan o'tish kerakmi: rad etilgan yoki hujjat yuklanmagan
  const needsRegistration = profile &&
    (profile.approval === 'REJECTED' ||
      (profile.approval === 'PENDING' && !profile.documents.licensePhotoUrl));
  if (needsRegistration) return <Registration />;

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
