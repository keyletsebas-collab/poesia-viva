import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Music, MapPin, Clock, Trash2, PlusCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

const Rehearsals = () => {
  const { role } = useAuth();
  const [rehearsals, setRehearsals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const [form, setForm] = useState({ title: '', rehearsal_date: '', location: '', notes: '' });

  useEffect(() => { fetchRehearsals(); }, []);

  const fetchRehearsals = async () => {
    setLoading(true);
    const { data } = await supabase.from('rehearsals').select('*').order('rehearsal_date', { ascending: true });
    if (data) setRehearsals(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('add');
    const { error } = await supabase.from('rehearsals').insert([{
      title: form.title, rehearsal_date: form.rehearsal_date,
      location: form.location || null, notes: form.notes || null
    }]);
    if (!error) {
      await supabase.from('announcements').insert([{
        title: `Ensayo convocado: ${form.title}`,
        message: `Ensayo programado para el ${new Date(form.rehearsal_date).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}${form.location ? ` en ${form.location}` : ''}.`,
        type: 'rehearsal'
      }]);
      setForm({ title: '', rehearsal_date: '', location: '', notes: '' });
      setShowForm(false);
      fetchRehearsals();
    } else {
      alert(error.message);
    }
    setActionLoading(null);
  };

  const deleteRehearsal = async (id) => {
    if (!confirm('¿Eliminar este ensayo?')) return;
    setActionLoading(id);
    await supabase.from('rehearsals').delete().eq('id', id);
    fetchRehearsals();
    setActionLoading(null);
  };

  const now = new Date();
  const upcoming = rehearsals.filter(r => new Date(r.rehearsal_date) >= now);
  const past = rehearsals.filter(r => new Date(r.rehearsal_date) < now);

  // Highlight next one
  const next = upcoming[0];

  return (
    <div className="animate">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.4rem' }}>
            <div style={{ padding: '10px', background: 'rgba(76,175,125,0.1)', borderRadius: '12px' }}>
              <Music size={24} color="var(--green)" />
            </div>
            <h1 className="serif" style={{ fontSize: '3rem', fontWeight: 800 }}>Ensayos</h1>
          </div>
          <p>{upcoming.length} ensayo{upcoming.length !== 1 ? 's' : ''} próximo{upcoming.length !== 1 ? 's' : ''}</p>
        </div>
        {role === 'admin' && (
          <button className={showForm ? 'btn-ghost' : 'btn-primary'} onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X size={16} /> Cerrar</> : <><PlusCircle size={16} /> Nuevo Ensayo</>}
          </button>
        )}
      </header>

      {/* Próximo ensayo destacado */}
      {next && !showForm && (
        <div style={{
          marginBottom: '2.5rem', padding: '1.8rem 2rem',
          background: 'linear-gradient(135deg, rgba(76,175,125,0.08), rgba(76,175,125,0.03))',
          border: '1px solid rgba(76,175,125,0.25)', borderRadius: 'var(--radius)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--green)', fontWeight: 800, marginBottom: '0.4rem' }}>
              ● Próximo Ensayo
            </div>
            <h2 className="serif" style={{ fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{next.title}</h2>
            <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} />
                {new Date(next.rehearsal_date).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </span>
              {next.location && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> {next.location}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE FORM */}
      {showForm && (
        <div className="glass-heavy animate-fast" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <h3 className="serif" style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Nuevo Ensayo</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input placeholder="Ej: Ensayo General" value={form.title}
                  onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha y hora *</label>
                <input type="datetime-local" value={form.rehearsal_date}
                  onChange={e => setForm(f => ({...f, rehearsal_date: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Lugar</label>
                <input placeholder="Salón, iglesia..." value={form.location}
                  onChange={e => setForm(f => ({...f, location: e.target.value}))} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Notas (opcional)</label>
              <textarea rows={3} placeholder="Indicaciones especiales..." value={form.notes}
                onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button type="submit" className="btn-primary" disabled={!!actionLoading}>
                {actionLoading === 'add' ? 'Guardando...' : 'Guardar Ensayo'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /><p>Cargando ensayos...</p></div>
      ) : rehearsals.length === 0 ? (
        <div className="empty-state glass" style={{ padding: '5rem' }}>
          <Music size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: .2 }} />
          <p>No hay ensayos registrados aún.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>Próximos</h2>
              <div className="glass" style={{ overflow: 'hidden' }}>
                {upcoming.map((r, i) => (
                  <div key={r.id}>
                    <div style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderBottom: i < upcoming.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      cursor: r.notes ? 'pointer' : 'default' }}
                      onClick={() => r.notes && setExpanded(expanded === r.id ? null : r.id)}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', marginBottom: '0.3rem' }}>{r.title}</div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} />
                            {new Date(r.rehearsal_date).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {r.location && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12} />{r.location}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {role === 'admin' && (
                          <button className="btn-danger" style={{ padding: '0.4rem' }} disabled={actionLoading === r.id}
                            onClick={(e) => { e.stopPropagation(); deleteRehearsal(r.id); }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                        {r.notes && (expanded === r.id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />)}
                      </div>
                    </div>
                    {expanded === r.id && r.notes && (
                      <div style={{ padding: '0.8rem 1.5rem 1.2rem', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>{r.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>Historial</h2>
              <div className="glass" style={{ overflow: 'hidden', opacity: 0.6 }}>
                {past.slice(0, 10).map((r, i) => (
                  <div key={r.id} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: i < Math.min(past.length, 10) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>{r.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {new Date(r.rehearsal_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {r.location && ` · ${r.location}`}
                      </div>
                    </div>
                    {role === 'admin' && (
                      <button className="btn-danger" style={{ padding: '0.4rem' }} disabled={actionLoading === r.id}
                        onClick={() => deleteRehearsal(r.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Rehearsals;
