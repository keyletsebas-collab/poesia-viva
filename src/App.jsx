import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import './index.css';

// ── Lazy-load every page — each becomes its own chunk ────────────────────
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Login      = lazy(() => import('./pages/Login'));
const Members    = lazy(() => import('./pages/Members'));
const Places     = lazy(() => import('./pages/Places'));
const Poetries   = lazy(() => import('./pages/Poetries'));
const Programs   = lazy(() => import('./pages/Programs'));
const Settings   = lazy(() => import('./pages/Settings'));
const News       = lazy(() => import('./pages/News'));
const Outings    = lazy(() => import('./pages/Outings'));
const Rehearsals = lazy(() => import('./pages/Rehearsals'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// ── Minimal inline loader (no spinner dependency) ─────────────────────────
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', flexDirection: 'column', gap: '1rem'
  }}>
    <div style={{
      width: '32px', height: '32px',
      border: '3px solid rgba(212,175,55,0.15)',
      borderTopColor: '#d4af37',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const AuthWrapper = () => {
  const { user } = useAuth();
  return (
    <>
      {user && <Sidebar />}
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/noticias"  element={<ProtectedRoute><News /></ProtectedRoute>} />
            <Route path="/poetrias"  element={<ProtectedRoute><Poetries /></ProtectedRoute>} />
            <Route path="/programas" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
            <Route path="/salidas"   element={<ProtectedRoute><Outings /></ProtectedRoute>} />
            <Route path="/ensayos"   element={<ProtectedRoute><Rehearsals /></ProtectedRoute>} />
            <Route path="/lugares"   element={<ProtectedRoute><Places /></ProtectedRoute>} />
            <Route path="/miembros"  element={<ProtectedRoute><Members /></ProtectedRoute>} />
            <Route path="/ajustes"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin"     element={<AdminRoute><AdminPanel /></AdminRoute>} />
            {/* Legacy redirects */}
            <Route path="/poetries"  element={<Navigate to="/poetrias" replace />} />
            <Route path="/programs"  element={<Navigate to="/programas" replace />} />
            <Route path="/places"    element={<Navigate to="/lugares" replace />} />
            <Route path="/members"   element={<Navigate to="/miembros" replace />} />
            <Route path="/settings"  element={<Navigate to="/ajustes" replace />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <AuthWrapper />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
