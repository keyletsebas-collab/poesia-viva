import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Members from './pages/Members';
import AdminPanel from './pages/AdminPanel';
import EventDetail from './pages/EventDetail';
import Places from './pages/Places';
import Poetries from './pages/Poetries';
import Programs from './pages/Programs';
import Settings from './pages/Settings';
import UserDirectory from './pages/UserDirectory/UserDirectory';
import './index.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, role, loading } = useAuth();

  // Only show full loading if we don't have a user yet and we are still checking
  if (loading && !user) return (
    <div className="loading">
      <div className="spinner" />
      <p>Verificando sesión...</p>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && role !== 'admin') return <Navigate to="/" />;

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
          <Route path="/login" element={
            !user ? <Login /> : <Navigate to="/" />
          } />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/event/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/places" element={<ProtectedRoute><Places /></ProtectedRoute>} />
          <Route path="/poetries" element={<ProtectedRoute><Poetries /></ProtectedRoute>} />
          <Route path="/programs" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><UserDirectory /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
};

export default App;
