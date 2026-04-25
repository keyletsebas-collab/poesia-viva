import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Users, 
  MapPin, 
  Settings, 
  LogOut, 
  BookOpen,
  PenTool,
  Shield
} from 'lucide-react';

const Sidebar = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar glass" style={{
      width: '280px',
      height: '100vh',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0
    }}>
      <div className="brand" style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '8px', background: 'var(--accent)', borderRadius: '12px' }}>
          <PenTool size={24} color="#000" />
        </div>
        <h2 className="serif" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Poesía Viva</h2>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>Inicio</span>
        </NavLink>
        <NavLink to="/members" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Miembros</span>
        </NavLink>
        <NavLink to="/poetries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Poesías</span>
        </NavLink>
        <NavLink to="/places" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <MapPin size={20} />
          <span>Lugares</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Ajustes</span>
        </NavLink>
        
        {role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ marginTop: '1rem' }}>
            <Shield size={20} />
            <span>Administración</span>
          </NavLink>
        )}
      </nav>

      <div className="user-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
            {user?.username || user?.email}
          </div>
          {role === 'admin' && (
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 800, 
              color: 'var(--accent)', 
              background: 'rgba(212, 175, 55, 0.1)', 
              padding: '2px 8px', 
              borderRadius: '20px',
              width: 'fit-content',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1px solid rgba(212, 175, 55, 0.3)'
            }}>
              Administrador
            </span>
          )}
        </div>
        <button onClick={handleLogout} className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      <style>{`
        .nav-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 1rem;
          text-decoration: none;
          color: var(--text-muted);
          border-radius: 12px;
          transition: var(--transition);
          font-weight: 500;
        }
        .nav-link:hover {
          background: var(--glass);
          color: var(--text-main);
        }
        .nav-link.active {
          background: rgba(212, 175, 55, 0.1);
          color: var(--accent);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
