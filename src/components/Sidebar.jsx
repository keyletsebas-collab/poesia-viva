import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  Home, Users, MapPin, Settings, LogOut,
  BookOpen, FileText, PenTool, Menu, X,
  Newspaper, Music, Calendar
} from 'lucide-react';

const NAV = [
  { to: '/',          icon: Home,      label: 'Inicio' },
  { to: '/noticias',  icon: Newspaper, label: 'Noticias' },
  { to: '/poetrias',  icon: BookOpen,  label: 'Poesías' },
  { to: '/programas', icon: FileText,  label: 'Programas' },
  { to: '/salidas',   icon: Calendar,  label: 'Salidas' },
  { to: '/ensayos',   icon: Music,     label: 'Ensayos' },
  { to: '/lugares',   icon: MapPin,    label: 'Lugares' },
  { to: '/ajustes',   icon: Settings,  label: 'Ajustes' },
];

const Sidebar = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile top bar */}
      <div style={{
        display: 'none', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem', position: 'fixed', top: 0, left: 0, right: 0,
        height: '64px', zIndex: 90,
        background: 'rgba(12,10,8,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)'
      }} className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ padding: '6px', background: 'var(--accent)', borderRadius: '10px' }}>
            <PenTool size={16} color="#000" />
          </div>
          <span className="serif" style={{ fontSize: '1.15rem', fontWeight: 700 }}>Verbo Eterno</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '8px', color: 'var(--text-main)',
          display: 'flex', alignItems: 'center', cursor: 'pointer'
        }}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', zIndex: 95
        }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '256px', height: '100vh', padding: '1.8rem 1.2rem',
        display: 'flex', flexDirection: 'column', gap: '0.25rem',
        position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
        background: 'rgba(10,8,6,0.85)', backdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--border)',
      }} className={`sidebar-el${isOpen ? ' sidebar-open' : ''}`}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '2.5rem', paddingLeft: '0.4rem' }}>
          <div style={{ padding: '9px', background: 'linear-gradient(135deg, var(--accent), #a08020)', borderRadius: '12px', flexShrink: 0 }}>
            <PenTool size={20} color="#000" />
          </div>
          <div>
            <div className="serif" style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.1 }}>Verbo Eterno</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Grupo de Poesía</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}
              onClick={() => setIsOpen(false)}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.2rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', paddingLeft: '0.4rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #7a5c10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: '#000', flexShrink: 0
            }}>
              {(user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email?.split('@')[0]}
              </div>
              <span style={{
                fontSize: '0.6rem', fontWeight: 800, color: role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em'
              }}>
                {role === 'admin' ? '★ Admin' : 'Miembro'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <style>{`
        .mobile-topbar { display: none; }
        .nav-link {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.65rem 0.9rem; border-radius: 10px;
          color: var(--text-muted); font-size: 0.9rem; font-weight: 500;
          transition: var(--transition); text-decoration: none;
        }
        .nav-link:hover { color: var(--text-main); background: rgba(255,255,255,0.04); }
        .nav-active { color: var(--accent) !important; background: var(--accent-bg) !important; }
        .nav-active svg { color: var(--accent); }

        @media (max-width: 1024px) {
          .mobile-topbar { display: flex !important; }
          .sidebar-el {
            position: fixed !important; top: 0; left: 0; bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
            background: rgba(10,8,6,0.98) !important;
            box-shadow: 8px 0 40px rgba(0,0,0,0.8);
            padding-top: 1.5rem;
          }
          .sidebar-open { transform: translateX(0) !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
