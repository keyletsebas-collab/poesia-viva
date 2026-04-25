import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { User, Lock, Mail, Shield, Save, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const { user, role } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: '¡Contraseña actualizada con éxito!' });
      setNewPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate">
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Configuración</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gestiona tu identidad y seguridad poética.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* PERFIL */}
        <div className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--accent)', padding: '12px', borderRadius: '12px', color: '#000' }}>
              <User size={24} />
            </div>
            <h2 className="serif">Tu Perfil</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Mail size={14} /> Correo Electrónico
              </label>
              <div className="glass-heavy" style={{ padding: '1rem', borderRadius: '12px', fontSize: '0.95rem' }}>
                {user?.email}
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Shield size={14} /> Rol en el Grupo
              </label>
              <div className="glass-heavy" style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '20px', 
                fontSize: '0.75rem', 
                fontWeight: 800,
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                width: 'fit-content',
                textTransform: 'uppercase'
              }}>
                {role === 'admin' ? 'Administrador' : 'Miembro'}
              </div>
            </div>
          </div>
        </div>

        {/* SEGURIDAD */}
        <div className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <Lock size={24} color="var(--accent)" />
            </div>
            <h2 className="serif">Seguridad</h2>
          </div>

          <form onSubmit={handleUpdatePassword}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
              Nueva Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-75%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Actualizando...' : <><Save size={18} /> Guardar Cambios</>}
            </button>
          </form>

          {message.text && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              borderRadius: '12px', 
              fontSize: '0.85rem',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? '#4ade80' : '#f87171',
              border: `1px solid ${message.type === 'success' ? '#4ade80' : '#f87171'}`
            }}>
              {message.text}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Settings;
