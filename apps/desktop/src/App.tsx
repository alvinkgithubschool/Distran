import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { StoreProvider, useStore } from './lib/context';
import { AppShell } from './components/AppShell';
import { LogEditor } from './components/Editors';
import { AuthPage, OnboardingPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { ListsPage, ListDetailPage } from './pages/ListsPage';
import { ProfilePage } from './pages/ProfilePage';
import { TitlePage, PartnerRoom } from './pages/TitlePage';
import { ChatPage } from './pages/ChatPage';
import { CreatorsPage, CreatorPage } from './pages/CreatorsPage';
import { SettingsPage } from './pages/SettingsPage';
function RequireAccount({ children }: { children: ReactNode }) {
  const { account } = useStore();
  return account ? children : <Navigate to="/" replace />;
}
function Entrance() {
  const { account } = useStore();
  return account ? <Navigate to={account.complete ? '/home' : '/setup'} replace /> : <AuthPage />;
}
function AppRoutes() {
  const { toast, clearToast, logTarget } = useStore();
  const location = useLocation();
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(clearToast, 4200);
    return () => clearTimeout(id);
  }, [toast, clearToast]);
  useEffect(() => {
    document.title = `Distran — ${location.pathname === '/home' ? 'Your cultural memory' : location.pathname === '/discover' ? 'Discover' : 'One ledger. Every format.'}`;
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <Routes>
        <Route path="/" element={<Entrance />} />
        <Route
          path="/setup"
          element={
            <RequireAccount>
              <OnboardingPage />
            </RequireAccount>
          }
        />
        <Route
          element={
            <RequireAccount>
              <AppShell />
            </RequireAccount>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/creators" element={<CreatorsPage />} />
          <Route path="/creators/:id" element={<CreatorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/title/:id" element={<TitlePage />} />
          <Route path="/room/dune" element={<PartnerRoom />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      {logTarget && <LogEditor key={`${logTarget.workId}-${logTarget.logId ?? 'new'}`} />}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{toast}</span>
          <button className="icon-button" aria-label="Dismiss notification" onClick={clearToast}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
export default function App() {
  return (
    <HashRouter>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </HashRouter>
  );
}
