import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StudioPage from './pages/studio-page';
import AiLogsPage from './pages/ai-logs-page';
import SystemSettingsPage from './pages/system-settings-page';

import LoginPage from './pages/login-page';
import { useAuth } from './hooks/use-auth';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isSystemReady, hasUser } = useAuth();
  console.log({ isSystemReady, hasUser })
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <Loader2 className="w-10 h-10 animate-spin text-primary-muted" />
      </div>
    );
  }

  if (isSystemReady === false || hasUser === false) {
    if (location.pathname !== '/app/settings') {
      return <Navigate to="/app/settings" replace />;
    }
    return <>{children}</>;
  }

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
