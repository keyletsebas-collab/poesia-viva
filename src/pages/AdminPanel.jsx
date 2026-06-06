import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Shield, ShieldAlert, User, Plus, Trash2, Calendar, MapPin, PlusCircle } from 'lucide-react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roles'); // 'roles', 'events', 'places', 'rehearsals'
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states for Rehearsals
  const [newRehTitle, setNewRehTitle] = useState('');
  const [newRehDate, setNewRehDate] = useState('');
  const [newRehLoc, setNewRehLoc] = useState('');

  // Form states for Events
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLoc, setNewLoc] = useState('');
  
  // Form states for Places
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceAddr, setNewPlaceAddr] = useState('');

  useEffect(() => {
    if (activeTab === 'roles') fetchUsers();
    if (activeTab === 'events') fetchEvents();
    if (activeTab === 'places') fetchPlaces();
    if (activeTab === 'rehearsals') fetchRehearsals();
    setShowAddForm(false);
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').order('role', { ascending: false });
      if (data) setUsers(data);
    } finally { setLoading(false); }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
      if (data) setEvents(data);
    } finally { setLoading(false); }
  };

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('places').select('*').order('created_at', { ascending: false });
      if (data) setPlaces(data);
    } finally { setLoading(false); }
  };

  const [rehearsals, setRehearsals] = useState([]);
  const fetchRehearsals = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('rehearsals').select('*').order('rehearsal_date', { ascending: false });
      if (data) setRehearsals(data);
    } finally { setLoading(false); }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setActionLoading('add-event');
    try {
      const { data, error } = await supabase.from('events').insert([{ title: newTitle, event_date: newDate, location: newLoc }]);
      if (error) throw error;

      await supabase.from('announcements').insert([{
        title: "Nueva Salida Programada",
        message: `Se ha agendado una nueva salida: "${newTitle}" para el día ${new Date(newDate).toLocaleDateString()}.`,
        type: 'outing'
      }]);

      setNewTitle(''); setNewDate(''); setNewLoc(''); setShowAddForm(false);
      fetchEvents();
    } catch (err) { alert(err.message); } finally { setActionLoading(null); }
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    setActionLoading('add-place');
    try {
      const { error } = await supabase.from('places').insert([{ name: newPlaceName, address: newPlaceAddr }]);
      if (error) throw error;

      // Add announcement
      await supabase.from('announcements').insert([{
        title: "Nuevo Lugar Añadido",
        message: `Se ha añadido "${newPlaceName}" al directorio de lugares.`,
        type: 'general'
      }]);

      setNewPlaceName(''); setNewPlaceAddr(''); setShowAddForm(false);
      fetchPlaces();
    } catch (err) { alert(err.message); } finally { setActionLoading(null); }
  };

  const handleAddRehearsal = async (e) => {
    e.preventDefault();
    setActionLoading('add-reh');
    try {
      const { error } = await supabase.from('rehearsals').insert([{
        title: newRehTitle,
        rehearsal_date: newRehDate,
        location: newRehLoc
      }]);

      if (error) throw error;

      await supabase.from('announcements').insert([{
        title: "¡Atención: Nuevo Ensayo!",
        message: `Se ha convocado un ensayo: "${newRehTitle}" para el día ${new Date(newRehDate).toLocaleString()}.`,
        type: 'general'
      }]);

      setNewRehTitle(''); setNewRehDate(''); setNewRehLoc(''); setShowAddForm(false);
      fetchRehearsals();
    } catch (err) { alert(err.message); } finally { setActionLoading(null); }
  };

  const toggleAdmin = async (userId, currentRole) => {
    setActionLoading(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      fetchUsers();
    } catch (err) { alert(err.message); } finally { setActionLoading(null); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este usuario? Esta acción no se puede deshacer.')) return;
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

  const deleteItem = async (table, id) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    setActionLoading(id);
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      if (table === 'events') fetchEvents();
      if (table === 'places') fetchPlaces();
      if (table === 'rehearsals') fetchRehearsals();
    } catch (err) { alert(err.message); } finally { setActionLoading(null); }
  };

  return (
    <div className="animate">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Panel de Control</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Gestión centralizada de miembros y contenidos.</p>
        </div>
        {(activeTab === 'events' || activeTab === 'places' || activeTab === 'rehearsals') && (
          <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cerrar' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} />
                Nuevo {activeTab === 'events' ? 'Evento' : activeTab === 'rehearsals' ? 'Ensayo' : 'Lugar'}
              </span>
            )}
          </button>
        )}
      </header>

      {showAddForm && (
        <div className="glass-heavy animate-fade" style={{ padding: '2.5rem', marginBottom: '3rem' }}>
          <h3 className="serif" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Crear {
            activeTab === 'events' ? 'Evento' : 
            activeTab === 'rehearsals' ? 'Ensayo' : 'Lugar'
          }</h3>
          <form onSubmit={
            activeTab === 'events' ? handleAddEvent : 
            activeTab === 'rehearsals' ? handleAddRehearsal : handleAddPlace
          }>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {activeTab === 'events' ? (
                <>
                  <input placeholder="Título del evento" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                  <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                  <input placeholder="Ubicación" value={newLoc} onChange={e => setNewLoc(e.target.value)} required style={{ gridColumn: '1/-1' }} />
                </>
              ) : activeTab === 'rehearsals' ? (
                <>
                  <input placeholder="Título del ensayo" value={newRehTitle} onChange={e => setNewRehTitle(e.target.value)} required />
                  <input type="datetime-local" value={newRehDate} onChange={e => setNewRehDate(e.target.value)} required />
                  <input placeholder="Ubicación del ensayo" value={newRehLoc} onChange={e => setNewRehLoc(e.target.value)} required style={{ gridColumn: '1/-1' }} />
                </>
              ) : (
                <>
                  <input placeholder="Nombre del lugar" value={newPlaceName} onChange={e => setNewPlaceName(e.target.value)} required />
                  <input placeholder="Dirección" value={newPlaceAddr} onChange={e => setNewPlaceAddr(e.target.value)} required />
                </>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={!!actionLoading}>
              {actionLoading ? 'Guardando...' : 'Guardar Datos'}
            </button>
          </form>
        </div>
      )}

      <div className="glass" style={{ padding: '2rem', minHeight: '60vh' }}>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)' }}>
          <button className={`tab ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>Roles de Miembros</button>
          <button className={`tab ${activeTab === 'rehearsals' ? 'active' : ''}`} onClick={() => setActiveTab('rehearsals')}>Ensayos</button>
          <button className={`tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Eventos Programados</button>
          <button className={`tab ${activeTab === 'places' ? 'active' : ''}`} onClick={() => setActiveTab('places')}>Directorio de Lugares</button>
        </div>

        {loading ? (
          <div className="loading">Cargando datos...</div>
        ) : (
          <div className="animate-fade">
             {activeTab === 'roles' && (
              <div className="table-responsive">
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
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1.2rem' }}>{u.full_name || 'Sin nombre'}</td>
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

            {activeTab === 'events' && (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '1.2rem' }}>Evento</th>
                      <th style={{ padding: '1.2rem' }}>Fecha</th>
                      <th style={{ padding: '1.2rem' }}>Ubicación</th>
                      <th style={{ padding: '1.2rem' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1.2rem', fontWeight: 600 }}>{e.title}</td>
                        <td style={{ padding: '1.2rem', color: 'var(--text-muted)' }}>{new Date(e.event_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td style={{ padding: '1.2rem' }}>{e.location}</td>
                        <td style={{ padding: '1.2rem' }}>
                          <button onClick={() => deleteItem('events', e.id)} className="btn-ghost" style={{ color: '#ff4d4d', padding: '0.5rem' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'places' && (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '1.2rem' }}>Lugar</th>
                      <th style={{ padding: '1.2rem' }}>Dirección</th>
                      <th style={{ padding: '1.2rem' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {places.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1.2rem', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '1.2rem', color: 'var(--text-muted)' }}>{p.address}</td>
                        <td style={{ padding: '1.2rem' }}>
                          <button onClick={() => deleteItem('places', p.id)} className="btn-ghost" style={{ color: '#ff4d4d', padding: '0.5rem' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'rehearsals' && (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '1.2rem' }}>Ensayo</th>
                      <th style={{ padding: '1.2rem' }}>Fecha y Hora</th>
                      <th style={{ padding: '1.2rem' }}>Lugar</th>
                      <th style={{ padding: '1.2rem' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rehearsals.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1.2rem', fontWeight: 600 }}>{r.title}</td>
                        <td style={{ padding: '1.2rem', color: 'var(--text-muted)' }}>{new Date(r.rehearsal_date).toLocaleString()}</td>
                        <td style={{ padding: '1.2rem' }}>{r.location}</td>
                        <td style={{ padding: '1.2rem' }}>
                          <button onClick={() => deleteItem('rehearsals', r.id)} className="btn-ghost" style={{ color: '#ff4d4d', padding: '0.5rem' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .tab {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 1.2rem 0;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          transition: var(--transition);
          font-size: 1rem;
        }
        .tab:hover { color: var(--text-main); }
        .tab.active { color: var(--accent); }
        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent-glow);
        }
        tr { transition: var(--transition); }
        tr:hover { background: rgba(255, 255, 255, 0.02); }
        .animate-fade { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default AdminPanel;
