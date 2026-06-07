import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Members from './pages/Members';
import Places from './pages/Places';
import Poetries from './pages/Poetries';
import Programs from './pages/Programs';
import Settings from './pages/Settings';
import News from './pages/News';
import Outings from './pages/Outings';
import Rehearsals from './pages/Rehearsals';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading && !user) return (
    <div className="loading">
      <div className="spinner" />
      <p>Verificando sesión...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
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

const AuthWrapper = () => {
  const { user } = useAuth();
  return (
    <>
      {user && <Sidebar />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/noticias" element={<ProtectedRoute><News /></ProtectedRoute>} />
          <Route path="/poetrias" element={<ProtectedRoute><Poetries /></ProtectedRoute>} />
          <Route path="/programas" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
          <Route path="/salidas" element={<ProtectedRoute><Outings /></ProtectedRoute>} />
          <Route path="/ensayos" element={<ProtectedRoute><Rehearsals /></ProtectedRoute>} />
          <Route path="/lugares" element={<ProtectedRoute><Places /></ProtectedRoute>} />
          <Route path="/miembros" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/ajustes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          {/* Backward compat */}
          <Route path="/poetries" element={<Navigate to="/poetrias" />} />
          <Route path="/programs" element={<Navigate to="/programas" />} />
          <Route path="/places" element={<Navigate to="/lugares" />} />
          <Route path="/members" element={<Navigate to="/miembros" />} />
          <Route path="/settings" element={<Navigate to="/ajustes" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
