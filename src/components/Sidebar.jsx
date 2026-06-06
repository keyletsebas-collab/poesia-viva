import React, { useState } from 'react';
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
  FileText,
  PenTool,
  Shield,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ padding: '6px', background: 'var(--accent)', borderRadius: '10px' }}>
            <PenTool size={18} color="#000" />
          </div>
          <span className="serif" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Verbo Eterno</span>
        </div>
        <button 
          onClick={toggleSidebar} 
          style={{ background: 'none', border: 'none', padding: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      />

      {/* Main Sidebar Drawer/Sticky aside */}
      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        <div className="brand" style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '8px', background: 'var(--accent)', borderRadius: '12px' }}>
              <PenTool size={24} color="#000" />
            </div>
            <h2 className="serif" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Verbo Eterno</h2>
          </div>
          <button 
            className="mobile-close-btn" 
            onClick={closeSidebar}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: 'none', 
              padding: '6px', 
              borderRadius: '50%', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Home size={20} />
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/members" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Users size={20} />
            <span>Miembros</span>
          </NavLink>
          <NavLink to="/poetries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <BookOpen size={20} />
            <span>Poesías</span>
          </NavLink>
          <NavLink to="/programs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <FileText size={20} />
            <span>Programas</span>
          </NavLink>
          <NavLink to="/places" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <MapPin size={20} />
            <span>Lugares</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Settings size={20} />
            <span>Ajustes</span>
          </NavLink>
          
          {role === 'admin' && (
            <>
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ marginTop: '1rem' }} onClick={closeSidebar}>
                <Shield size={20} />
                <span>Administración</span>
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                <Users size={20} />
                <span>Gestión de Cuentas</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="user-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          /* Mobile header top bar (hidden on desktop) */
          .mobile-header {
            display: none;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.5rem;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 70px;
            z-index: 90;
            background: rgba(18, 18, 18, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border);
          }

          .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 95;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }

          .sidebar-overlay.open {
            opacity: 1;
            pointer-events: auto;
          }

          /* Responsive sidebar container */
          .sidebar-container {
            width: 280px;
            height: 100vh;
            padding: 2rem 1.5rem;
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            z-index: 100;
            background: var(--glass);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-right: 1px solid var(--border);
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

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

          @media (max-width: 1024px) {
            .mobile-header {
              display: flex;
            }
            .mobile-close-btn {
              display: flex !important;
            }
            .sidebar-container {
              position: fixed;
              top: 0;
              left: 0;
              bottom: 0;
              background: rgba(18, 18, 18, 0.95) !important;
              box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
              transform: translateX(-100%);
            }
            .sidebar-container.open {
              transform: translateX(0);
            }
          }
        `}</style>
      </aside>
    </>
  );
};

export default Sidebar;
