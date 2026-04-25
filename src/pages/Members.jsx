import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { User, Shield, PenTool, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const { role } = useAuth();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });
      
      if (data) setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (memberId, currentStatus) => {
    if (role !== 'admin') return;
    
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', memberId);
      
      if (error) throw error;
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el estado");
    }
  };

  const filteredMembers = members.filter(m => {
    if (filter === 'active') return m.status !== 'inactive';
    if (filter === 'inactive') return m.status === 'inactive';
    return true;
  });

  if (loading) return <div className="loading">Invocando a los poetas...</div>;

  return (
    <div className="animate">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '0.8rem' }}>Círculo de Poesía</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px' }}>
            Aquellos que dan voz al sentimiento y vida a la palabra.
          </p>
        </div>
        
        <div className="glass" style={{ display: 'flex', padding: '0.5rem', gap: '0.5rem' }}>
          <button 
            className={filter === 'all' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} 
            onClick={() => setFilter('all')}
          >Todos</button>
          <button 
            className={filter === 'active' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} 
            onClick={() => setFilter('active')}
          >Activos</button>
          <button 
            className={filter === 'inactive' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} 
            onClick={() => setFilter('inactive')}
          >Inactivos</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem' }}>
        {filteredMembers.map((member, index) => (
          <div 
            key={member.id} 
            className="glass animate" 
            style={{ 
              padding: '2.5rem', 
              textAlign: 'center', 
              position: 'relative',
              animationDelay: `${index * 0.1}s`,
              opacity: member.status === 'inactive' ? 0.6 : 1,
              transition: 'var(--transition)'
            }}
          >
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: 'var(--bg-dark)', 
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid ' + (member.role === 'admin' ? 'var(--accent)' : 'var(--border)'),
              boxShadow: member.role === 'admin' ? '0 0 20px var(--accent-glow)' : 'none',
              overflow: 'hidden'
            }}>
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={50} color={member.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)'} />
              )}
            </div>
            
            <h3 className="serif" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              {member.full_name || member.username.split('@')[0]}
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                fontSize: '0.7rem', 
                fontWeight: 700,
                padding: '4px 12px', 
                borderRadius: '24px', 
                background: member.role === 'admin' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.05)',
                color: member.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {member.role === 'admin' ? <Shield size={12} /> : <PenTool size={12} />}
                {member.role === 'admin' ? 'Administrador' : 'Poeta'}
              </div>

              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                fontSize: '0.7rem', 
                fontWeight: 700,
                padding: '4px 12px', 
                borderRadius: '24px', 
                background: member.status === 'inactive' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                color: member.status === 'inactive' ? '#f87171' : '#4ade80',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {member.status === 'inactive' ? 'Inactivo' : 'Activo'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} /> {member.username}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} /> Miembro desde {new Date(member.updated_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {role === 'admin' && (
              <button 
                className="btn-ghost btn-sm" 
                style={{ width: '100%' }}
                onClick={() => toggleStatus(member.id, member.status)}
              >
                {member.status === 'inactive' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {member.status === 'inactive' ? 'Activar Miembro' : 'Desactivar Miembro'}
              </button>
            )}
          </div>
        ))}
      </div>
      
      <style>{`
        .btn-sm { padding: 0.5rem 1rem; font-size: 0.8rem; border-radius: 8px; }
      `}</style>
    </div>
  );
};

export default Members;
