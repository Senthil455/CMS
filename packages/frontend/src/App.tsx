import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudioPage from './pages/studio-page';
import AiLogsPage from './pages/ai-logs-page';

import LoginPage from './pages/login-page';
import { useAuth } from './hooks/use-auth';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <Loader2 className="w-10 h-10 animate-spin text-primary-muted" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/app/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
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

        </Route>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
