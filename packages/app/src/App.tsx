import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StudioPage from './pages/studio-page';

import SystemSettingsPage from './pages/system-settings-page';
import { SocketProvider } from './context/socket-provider';
import { setAuthApiBaseUrl } from '@cms/sdk';

setAuthApiBaseUrl('');

import LoginPage from './pages/login-page';
import RegisterPage from './pages/register-page';
import { useAuth } from './hooks/use-auth';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, hasSuperAdmin, logout } = useAuth();
  const location = useLocation();

  // When system status is still loading, show loading screen
  if (hasSuperAdmin === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <Loader2 className="w-10 h-10 animate-spin text-primary-muted" />
      </div>
    );
  }

  // When database not ready, master password not set, or no user exists, redirect to settings
  if (!hasSuperAdmin) {
    if (location.pathname !== '/app/settings') {
      return <Navigate to="/app/settings" replace />;
    }
    // Allow access to settings page for initial setup
    return <>{children}</>;
  }

  // System is fully ready, require authentication
  if (!user) {
    return <Navigate to="/app/login" replace />;
  }

  if (user.allowedMenus && !user.allowedMenus.includes('menu_schema_builder')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <div className="w-full max-w-md p-8 bg-app-surface border border-border rounded-3xl shadow-2xl text-center flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
            <p className="text-primary-muted mt-2">You don't have privileges to access this application.</p>
          </div>
          <button
            onClick={logout}
            className="w-full h-12 bg-primary text-app rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* ... existing routes ... */}
          <Route path="/app">
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route
              path=""
              element={
                <ProtectedRoute>
                  <StudioPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="overview"
              element={
                <ProtectedRoute>
                  <StudioPage />
                </ProtectedRoute>
              }
            />
            <Route
              path=":type/:id"
              element={
                <ProtectedRoute>
                  <StudioPage />
                </ProtectedRoute>
              }
            />
            <Route
              path=":type/:id/edit"
              element={
                <ProtectedRoute>
                  <StudioPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SystemSettingsPage />
                </ProtectedRoute>
              }
            />

          </Route>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
