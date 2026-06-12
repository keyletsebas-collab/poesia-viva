import { createClient } from '@supabase/supabase-js';
import { useState, useEffect, useCallback } from 'react';
import {
  User, Shield, PenTool, Mail, Calendar,
  CheckCircle, XCircle, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, []);
  const c = type === 'error'
    ? { bg: 'rgba(224,92,92,0.15)', border: 'rgba(224,92,92,0.3)', color: '#e05c5c' }
    : { bg: 'rgba(76,175,125,0.15)', border: 'rgba(76,175,125,0.3)', color: '#4caf7d' };
  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      padding: '1rem 1.5rem', borderRadius: '14px', fontWeight: 600, fontSize: '0.9rem',
      backdropFilter: 'blur(24px)', boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
      animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      display: 'flex', alignItems: 'center', gap: '0.7rem', maxWidth: '380px',
    }}>
      {type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
      {message}
    </div>
  );
};

const Members = () => {
  const [members, setMembers]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast]                 = useState(null);
  const { role, user } = useAuth();
  const supabase = createClient(
    atob('aHR0cHM6Ly9iaWVucmV6aWZsc2pwbXNra2t1ZC5zdXBhYmFzZS5jbw=='),
    atob('c2JfcHVibGlzaGFibGVfZmZBZk1VLW9XQzRNdFRzaERacUZGZ19KSjZYUkgtbA==')
  );

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchMembers = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('profiles').select('*').order('role', { ascending: false });
      if (data) setMembers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Realtime como respaldo — confirma el estado real de la DB
  useEffect(() => {
    const channel = supabase
      .channel('members-list-watch')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          // Actualizar solo el miembro afectado, sin re-fetch completo
          setMembers(prev => prev.map(m =>
            m.id === payload.new.id ? { ...m, ...payload.new } : m
          ));
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Actualización optimista de status ────────────────────────────────────
  const toggleStatus = async (memberId, currentStatus, name) => {
    if (role !== 'admin') return;
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    setActionLoading(`status-${memberId}`);

    // 1. Actualizar UI al instante (optimista)
    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, status: newStatus } : m
    ));

    try {
      const { error } = await supabase
        .from('profiles').update({ status: newStatus }).eq('id', memberId);
      if (error) {
        // Revertir si hubo error
        setMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, status: currentStatus } : m
        ));
        throw error;
      }
      showToast(`${name} ${newStatus === 'active' ? 'activado ✓' : 'desactivado ✓'}`);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setActionLoading(null); }
  };

  // ── Actualización optimista de rol ───────────────────────────────────────
  const toggleRole = async (memberId, currentRole, name) => {
    if (role !== 'admin') return;
    if (memberId === user?.id) { showToast('No puedes cambiar tu propio rol.', 'error'); return; }
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setActionLoading(`role-${memberId}`);

    // 1. Actualizar UI al instante (optimista)
    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, role: newRole } : m
    ));

    try {
      const { error } = await supabase
        .from('profiles').update({ role: newRole }).eq('id', memberId);
      if (error) {
        // Revertir si hubo error
        setMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, role: currentRole } : m
        ));
        throw error;
      }
      showToast(`${name} ahora es ${newRole === 'admin' ? 'Administrador ★' : 'Miembro'}`);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setActionLoading(null); }
  };

  const filtered = members.filter(m => {
    if (filter === 'active')   return m.status !== 'inactive';
    if (filter === 'inactive') return m.status === 'inactive';
    if (filter === 'admin')    return m.role === 'admin';
    return true;
  });

  if (loading) return <div className="loading"><div className="spinner" /><p>Invocando a los poetas...</p></div>;

  return (
    <div className="animate">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.4rem' }}>
            {members.filter(m => m.status !== 'inactive').length} activos · {members.filter(m => m.role === 'admin').length} admins
          </p>
          <h1 className="serif" style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.1 }}>Círculo de Poesía</h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem' }}>Aquellos que dan voz al sentimiento y vida a la palabra.</p>
        </div>
        <div className="glass" style={{ display: 'flex', padding: '0.4rem', gap: '0.3rem', flexShrink: 0 }}>
          {[
            { key: 'all',      label: 'Todos' },
            { key: 'active',   label: 'Activos' },
            { key: 'admin',    label: '★ Admins' },
            { key: 'inactive', label: 'Inactivos' },
          ].map(({ key, label }) => (
            <button key={key}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '8px' }}
              className={filter === key ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: '1.5rem' }}>
        {filtered.map((m, i) => {
          const isInactive = m.status === 'inactive';
          const isAdmin    = m.role === 'admin';
          const name       = m.full_name || m.username?.split('@')[0] || '?';
          const isSelf     = m.id === user?.id;
          return (
            <div key={m.id} className="glass member-card animate" style={{
              padding: '2rem', textAlign: 'center', position: 'relative',
              animationDelay: `${i * 0.04}s`, opacity: isInactive ? 0.55 : 1,
              borderColor: isAdmin ? 'rgba(212,175,55,0.25)' : 'var(--border)',
              boxShadow: isAdmin ? '0 0 24px rgba(212,175,55,0.06)' : 'none',
            }}>
              {/* Role pill */}
              <div style={{
                position: 'absolute', top: '1rem', right: '1rem',
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', borderRadius: '99px',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                background: isAdmin ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.04)',
                color: isAdmin ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${isAdmin ? 'rgba(212,175,55,0.22)' : 'transparent'}`,
              }}>
                {isAdmin ? <Crown size={9} /> : <PenTool size={9} />}
                {isAdmin ? 'Admin' : 'Poeta'}
              </div>

              {/* Avatar */}
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%', background: '#17140f',
                margin: '0 auto 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${isAdmin ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: isAdmin ? '0 0 20px var(--accent-glow)' : 'none',
                overflow: 'hidden', transition: 'var(--transition)',
              }}>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={40} color={isAdmin ? 'var(--accent)' : 'var(--text-muted)'} />}
              </div>

              <h3 className="serif" style={{ fontSize: '1.35rem', lineHeight: 1.2, marginBottom: '0.4rem' }}>{name}</h3>

              {/* Status dot */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.62rem', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
                textTransform: 'uppercase', marginBottom: '1.2rem',
                background: isInactive ? 'rgba(224,92,92,0.1)' : 'rgba(76,175,125,0.1)',
                color: isInactive ? '#f87171' : '#4caf7d',
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                {isInactive ? 'Inactivo' : 'Activo'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.6rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={12} />{m.username}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={12} />Desde {new Date(m.created_at || m.updated_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {role === 'admin' && !isSelf && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, fontSize: '0.74rem', padding: '0.45rem 0.5rem', borderRadius: '8px' }}
                    disabled={!!actionLoading}
                    onClick={() => toggleStatus(m.id, m.status, name)}
                  >
                    {actionLoading === `status-${m.id}` ? '...'
                      : isInactive
                        ? <><CheckCircle size={13} /> Activar</>
                        : <><XCircle size={13} /> Desactivar</>}
                  </button>
                  <button
                    className={isAdmin ? 'btn-ghost' : 'btn-primary'}
                    style={{ flex: 1, fontSize: '0.74rem', padding: '0.45rem 0.5rem', borderRadius: '8px' }}
                    disabled={!!actionLoading}
                    onClick={() => toggleRole(m.id, m.role, name)}
                  >
                    {actionLoading === `role-${m.id}` ? '...'
                      : isAdmin
                        ? <><Shield size={13} /> Quitar admin</>
                        : <><Crown size={13} /> Hacer admin</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .member-card { transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
        .member-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.4) !important; }
      `}</style>
    </div>
  );
};

export default Members;
