import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Shield, User, Trash2, ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserDirectory = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });
      
      if (error) throw error;
      if (data) setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId, currentRole) => {
    setActionLoading(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      alert('Error al actualizar el rol: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este usuario? Esta acción borrará su cuenta y perfil, y no se puede deshacer.')) return;
    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { user_to_delete: userId });
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      alert('Error al eliminar el usuario: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate">
      {/* Header */}
      <header style={{ marginBottom: '3rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn-ghost" 
          style={{ padding: '0.6rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', lineHeight: 1 }}>Gestión de Cuentas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Lista y eliminación segura de usuarios en la base de datos.</p>
        </div>
      </header>

      {/* Buscador */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.5rem', flex: 1, minWidth: '280px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            placeholder="Buscar por nombre o correo electrónico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', width: '100%', fontSize: '1rem' }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="glass" style={{ padding: '2rem', minHeight: '50vh', overflowX: 'auto' }}>
        {loading ? (
          <div className="loading" style={{ height: '30vh' }}>Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            No se encontraron usuarios en la base de datos.
          </div>
        ) : (
          <div style={{ minWidth: '800px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1.2rem' }}>Miembro</th>
                  <th style={{ padding: '1.2rem' }}>Email</th>
                  <th style={{ padding: '1.2rem' }}>Contraseña</th>
                  <th style={{ padding: '1.2rem' }}>Rol</th>
                  <th style={{ padding: '1.2rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }} className="table-row-hover">
                    <td style={{ padding: '1.2rem', fontWeight: 500 }}>{u.full_name || 'Sin nombre'}</td>
                    <td style={{ padding: '1.2rem', color: 'var(--text-muted)' }}>{u.username}</td>
                    <td style={{ padding: '1.2rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      ••••••••
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#ffb84d', marginTop: '2px' }}>Encriptada (Bcrypt)</span>
                    </td>
                    <td style={{ padding: '1.2rem' }}>
                      <span style={{ 
                        padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                        background: u.role === 'admin' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                        letterSpacing: '0.05em'
                      }}>{u.role === 'admin' ? 'ADMIN' : 'USUARIO'}</span>
                    </td>
                    <td style={{ padding: '1.2rem' }}>
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <button 
                          disabled={actionLoading === u.id}
                          onClick={() => toggleAdmin(u.id, u.role)}
                          className="btn-ghost"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          {actionLoading === u.id ? '...' : (u.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin')}
                        </button>
                        <button 
                          disabled={actionLoading === u.id}
                          onClick={() => handleDeleteUser(u.id)}
                          className="btn-ghost"
                          style={{ color: '#ff4d4d', padding: '0.5rem', borderRadius: '8px' }}
                          title="Eliminar usuario permanentemente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .table-row-hover:hover { background: rgba(255, 255, 255, 0.02); }
      `}</style>
    </div>
  );
};

export default UserDirectory;
