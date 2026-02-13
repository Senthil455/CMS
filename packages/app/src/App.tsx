import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StudioPage from './pages/studio-page';
import AiLogsPage from './pages/ai-logs-page';
import SystemSettingsPage from './pages/system-settings-page';
import { setAuthApiBaseUrl } from '@cms/sdk';
import { config } from './config';

setAuthApiBaseUrl(config.CMS_BASE_URL);

import LoginPage from './pages/login-page';
import { useAuth } from './hooks/use-auth';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, hasSuperAdmin } = useAuth();
  console.log({ hasSuperAdmin })
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

  return <>{children}</>;
}



function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/app">
          <Route path="login" element={<LoginPage />} />
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
            path="ai-logs"
            element={
              <ProtectedRoute>
                <AiLogsPage />
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
  );
}

export default App;
