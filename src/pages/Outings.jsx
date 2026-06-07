import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Plus, Trash2, DollarSign, Clock, AlertCircle, X, PlusCircle } from 'lucide-react';

const Outings = () => {
  const { role } = useAuth();
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [expanded, setExpanded] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: '', event_date: '', location: '', description: '',
    has_payment: false, payment_amount: '', payment_description: ''
  });

  useEffect(() => { fetchOutings(); }, []);

  const fetchOutings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    if (data) setOutings(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    setActionLoading('add');
    const payload = {
      title: form.title,
      event_date: form.event_date,
      location: form.location || null,
      description: form.description || null,
      has_payment: form.has_payment,
      payment_amount: form.has_payment && form.payment_amount ? parseFloat(form.payment_amount) : null,
      payment_description: form.has_payment ? form.payment_description : null,
    };
    const { error } = await supabase.from('events').insert([payload]);
    if (!error) {
      await supabase.from('announcements').insert([{
        title: `Nueva Salida: ${form.title}`,
        message: `Salida programada para el ${new Date(form.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}${form.location ? ` en ${form.location}` : ''}.${form.has_payment ? ` Costo: $${form.payment_amount}` : ''}`,
        type: 'outing'
      }]);
      setForm({ title: '', event_date: '', location: '', description: '', has_payment: false, payment_amount: '', payment_description: '' });
      setShowForm(false);
      fetchOutings();
    } else {
      alert(error.message);
    }
    setActionLoading(null);
  };

  const deleteOuting = async (id) => {
    if (!confirm('¿Eliminar esta salida?')) return;
    setActionLoading(id);
    await supabase.from('events').delete().eq('id', id);
    fetchOutings();
    setActionLoading(null);
  };

  const upcoming = outings.filter(o => new Date(o.event_date) >= new Date());
  const past = outings.filter(o => new Date(o.event_date) < new Date());

  const OutingCard = ({ o }) => {
    const isPast = new Date(o.event_date) < new Date();
    return (
      <div className="glass" style={{
        marginBottom: '1rem', overflow: 'hidden',
        borderLeft: `3px solid ${o.has_payment ? 'var(--green)' : isPast ? 'var(--border)' : 'var(--accent)'}`,
        opacity: isPast ? 0.65 : 1
      }}>
        <div style={{ padding: '1.4rem 1.6rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
          onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{o.title}</h3>
              {o.has_payment && (
                <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <DollarSign size={10} /> {o.payment_amount ? `$${o.payment_amount}` : 'Con costo'}
                </span>
              )}
              {isPast && <span className="badge badge-muted">Pasada</span>}
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Clock size={13} />
                {new Date(o.event_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {o.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <MapPin size={13} /> {o.location}
                </span>
              )}
            </div>
          </div>
          {role === 'admin' && (
            <button className="btn-danger" style={{ padding: '0.5rem', flexShrink: 0 }}
              disabled={actionLoading === o.id}
              onClick={(e) => { e.stopPropagation(); deleteOuting(o.id); }}>
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {expanded === o.id && (o.description || o.has_payment) && (
          <div style={{ padding: '0 1.6rem 1.4rem', borderTop: '1px solid var(--border)' }}>
            {o.description && <p style={{ marginBottom: '0.8rem', lineHeight: 1.65, marginTop: '1rem' }}>{o.description}</p>}
            {o.has_payment && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.9rem 1.1rem',
                background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: '10px', marginTop: '0.8rem' }}>
                <DollarSign size={18} color="var(--green)" />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>
                    Costo: {o.payment_amount ? `$${o.payment_amount}` : 'Por confirmar'}
                  </div>
                  {o.payment_description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{o.payment_description}</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.4rem' }}>
            <div style={{ padding: '10px', background: 'rgba(212,175,55,0.1)', borderRadius: '12px' }}>
              <Calendar size={24} color="var(--accent)" />
            </div>
            <h1 className="serif" style={{ fontSize: '3rem', fontWeight: 800 }}>Salidas</h1>
          </div>
          <p>{upcoming.length} salida{upcoming.length !== 1 ? 's' : ''} programada{upcoming.length !== 1 ? 's' : ''}</p>
        </div>
        {role === 'admin' && (
          <button className={showForm ? 'btn-ghost' : 'btn-primary'} onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X size={16} /> Cerrar</> : <><PlusCircle size={16} /> Nueva Salida</>}
          </button>
        )}
      </header>

      {/* CREATE FORM */}
      {showForm && (
        <div className="glass-heavy animate-fast" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <h3 className="serif" style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Nueva Salida</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input placeholder="Ej: Visita al Templo Central" value={form.title}
                  onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha y hora *</label>
                <input type="datetime-local" value={form.event_date}
                  onChange={e => setForm(f => ({...f, event_date: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Lugar</label>
                <input placeholder="Dirección o lugar" value={form.location}
                  onChange={e => setForm(f => ({...f, location: e.target.value}))} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Descripción (opcional)</label>
              <textarea rows={3} placeholder="Detalles adicionales..." value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>

            {/* Payment toggle */}
            <div className="toggle-row" style={{ marginBottom: '1rem' }}>
              <label className="toggle-switch">
                <input type="checkbox" checked={form.has_payment}
                  onChange={e => setForm(f => ({...f, has_payment: e.target.checked}))} />
                <span className="toggle-slider" />
              </label>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>¿Esta salida tiene costo?</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Se mostrará el monto a los miembros</div>
              </div>
            </div>

            {form.has_payment && (
              <div className="form-grid-2" style={{ marginBottom: '1.2rem' }}>
                <div className="form-group">
                  <label className="form-label">Monto ($)</label>
                  <input type="number" step="0.01" placeholder="Ej: 15.00" value={form.payment_amount}
                    onChange={e => setForm(f => ({...f, payment_amount: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción del cobro</label>
                  <input placeholder="Ej: Transporte y almuerzo" value={form.payment_description}
                    onChange={e => setForm(f => ({...f, payment_description: e.target.value}))} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button type="submit" className="btn-primary" disabled={!!actionLoading}>
                {actionLoading === 'add' ? 'Guardando...' : 'Guardar Salida'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /><p>Cargando salidas...</p></div>
      ) : outings.length === 0 ? (
        <div className="empty-state glass" style={{ padding: '5rem' }}>
          <Calendar size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: .2 }} />
          <p>No hay salidas registradas.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>Próximas</h2>
              {upcoming.map(o => <OutingCard key={o.id} o={o} />)}
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>Historial</h2>
              {past.map(o => <OutingCard key={o.id} o={o} />)}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Outings;
