import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useWebSocketStore } from './store/websocketStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import News from './pages/News';
import Trade from './pages/Trade';
// import Admin from './pages/Admin';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import NotFound from './pages/NotFound';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if already authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Loading Component
const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mb-4 shadow-lg">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
        <p className="text-slate-300">
          Please wait while we initialize the application
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, isAuthenticated, refreshUser, loading } = useAuthStore();
  const { connect, disconnect } = useWebSocketStore();

  useEffect(() => {
    // Try to refresh user data on app start
    const token = localStorage.getItem('token');
    if (token && !user) {
      refreshUser();
    }
  }, [user, refreshUser]);

  useEffect(() => {
    // Connect to WebSocket when user is authenticated
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/news"
              element={
                <ProtectedRoute>
                  <Layout>
                    <News />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/trade"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Trade />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <Admin />
                  </Layout>
                </ProtectedRoute>
              }
            /> */}

            {/* Landing Page */}
            <Route path="/" element={<Landing />} />

            {/* Default Redirects for authenticated users */}
            <Route
              path="/home"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
