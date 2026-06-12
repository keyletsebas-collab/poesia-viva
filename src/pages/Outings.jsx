import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, MapPin, Trash2, DollarSign, Clock, X,
  PlusCircle, Image, Upload, ChevronDown, ChevronUp,
  FileText, CheckCircle, XCircle, Camera, Eye
} from 'lucide-react';

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
      display: 'flex', alignItems: 'center', gap: '0.7rem', maxWidth: '400px',
    }}>
      {type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
      {message}
    </div>
  );
};

// ── Lightbox ───────────────────────────────────────────────────────────────
const Lightbox = ({ src, caption, onClose }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem',
    animation: 'fadeIn 0.2s ease',
  }}>
    <button onClick={onClose} style={{
      position: 'absolute', top: '1.5rem', right: '1.5rem',
      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '50%', padding: '0.6rem', color: '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}><X size={20} /></button>
    <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', textAlign: 'center' }}>
      <img src={src} alt={caption} style={{
        maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)', objectFit: 'contain',
      }} />
      {caption && <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{caption}</p>}
    </div>
  </div>
);

// ── Photo Gallery for one outing ───────────────────────────────────────────
const PhotoGallery = ({ outingId, canUpload }) => {
  const [photos, setPhotos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption]   = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [toast, setToast]       = useState(null);
  const fileRef = useRef();
  const { role } = useAuth();

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from('event_photos')
      .select('*')
      .eq('event_id', outingId)
      .order('created_at', { ascending: true });
    if (data) setPhotos(data);
    setLoading(false);
  }, [outingId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 8 * 1024 * 1024) {
          showToast(`"${file.name}" supera los 8 MB.`, 'error');
          continue;
        }
        // Convert to base64
        const base64 = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
        const { error } = await supabase.from('event_photos').insert([{
          event_id: outingId,
          image_data: base64,
          caption: caption.trim() || null,
        }]);
        if (error) throw error;
      }
      setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      await fetchPhotos();
      showToast('Foto(s) guardadas correctamente ✓');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    const { error } = await supabase.from('event_photos').delete().eq('id', photoId);
    if (!error) fetchPhotos();
    else showToast('Error al eliminar.', 'error');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {lightbox && <Lightbox src={lightbox.src} caption={lightbox.caption} onClose={() => setLightbox(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <Camera size={16} color="var(--accent)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          Galería · {photos.length} foto{photos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Upload zone */}
      {canUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          style={{
            border: '2px dashed var(--border)', borderRadius: '12px',
            padding: '1.5rem', marginBottom: '1rem', textAlign: 'center',
            transition: 'var(--transition)', cursor: 'pointer',
            background: 'rgba(255,255,255,0.02)',
          }}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
            {uploading ? 'Subiendo...' : 'Arrastra fotos aquí o haz clic para seleccionar'}
          </p>
          <input
            placeholder="Descripción opcional..."
            value={caption}
            onChange={e => { e.stopPropagation(); setCaption(e.target.value); }}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '320px', marginBottom: '0.8rem', fontSize: '0.85rem', textAlign: 'center' }}
          />
          <input
            ref={fileRef}
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={e => handleUpload(e.target.files)}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1.2rem' }}
              disabled={uploading}
              onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
            >
              {uploading ? 'Guardando...' : <><Image size={14} /> Elegir fotos</>}
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando fotos...</div>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
          Aún no hay fotos en esta salida.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
          {photos.map(ph => (
            <div key={ph.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1', background: '#0c0a08', cursor: 'pointer', transition: 'var(--transition)' }}
              onClick={() => setLightbox({ src: ph.image_data, caption: ph.caption })}
              className="photo-thumb">
              <img
                src={ph.image_data}
                alt={ph.caption || 'foto'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
              <div className="photo-overlay">
                <Eye size={18} color="#fff" />
              </div>
              {role === 'admin' && (
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(ph.id); }}
                  style={{
                    position: 'absolute', top: '0.4rem', right: '0.4rem',
                    background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                    padding: '4px', color: '#f87171', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                ><X size={12} /></button>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .photo-thumb:hover { transform: scale(1.03); box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        .photo-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: var(--transition);
        }
        .photo-thumb:hover .photo-overlay { opacity: 1; background: rgba(0,0,0,0.35); }
      `}</style>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const Outings = () => {
  const { role } = useAuth();
  const [outings, setOutings]           = useState([]);
  const [programs, setPrograms]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [expanded, setExpanded]         = useState(null);
  const [toast, setToast]               = useState(null);

  const [form, setForm] = useState({
    title: '', event_date: '', location: '', description: '',
    has_payment: false, payment_amount: '', payment_description: '',
    program_id: '',
  });

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchOutings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*, program:program_id(id, title, event_name)')
      .order('event_date', { ascending: true });
    if (data) setOutings(data);
    setLoading(false);
  }, []);

  const fetchPrograms = useCallback(async () => {
    const { data } = await supabase
      .from('programs')
      .select('id, title, event_name')
      .order('created_at', { ascending: false });
    if (data) setPrograms(data);
  }, []);

  useEffect(() => {
    fetchOutings();
    fetchPrograms();
  }, [fetchOutings, fetchPrograms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    setActionLoading('add');
    const payload = {
      title:               form.title,
      event_date:          form.event_date,
      location:            form.location || null,
      description:         form.description || null,
      has_payment:         form.has_payment,
      payment_amount:      form.has_payment && form.payment_amount ? parseFloat(form.payment_amount) : null,
      payment_description: form.has_payment ? form.payment_description : null,
      program_id:          form.program_id || null,
    };
    const { error } = await supabase.from('events').insert([payload]);
    if (!error) {
      await supabase.from('announcements').insert([{
        title: `Nueva Salida: ${form.title}`,
        message: `Salida programada para el ${new Date(form.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}${form.location ? ` en ${form.location}` : ''}.${form.has_payment ? ` Costo: $${form.payment_amount}` : ''}`,
        type: 'outing',
      }]);
      setForm({ title: '', event_date: '', location: '', description: '', has_payment: false, payment_amount: '', payment_description: '', program_id: '' });
      setShowForm(false);
      fetchOutings();
      showToast('Salida creada correctamente ✓');
    } else {
      showToast(error.message, 'error');
    }
    setActionLoading(null);
  };

  const deleteOuting = async (id) => {
    if (!confirm('¿Eliminar esta salida y todas sus fotos?')) return;
    setActionLoading(id);
    await supabase.from('events').delete().eq('id', id);
    fetchOutings();
    setActionLoading(null);
    showToast('Salida eliminada.');
  };

  const upcoming = outings.filter(o => new Date(o.event_date) >= new Date());
  const past     = outings.filter(o => new Date(o.event_date) <  new Date());

  // ── Outing card ────────────────────────────────────────────────────────
  const OutingCard = ({ o }) => {
    const isPast = new Date(o.event_date) < new Date();
    const isOpen = expanded === o.id;
    return (
      <div className="glass outing-card" style={{
        marginBottom: '1rem', overflow: 'hidden',
        borderLeft: `3px solid ${o.has_payment ? 'var(--green)' : isPast ? 'var(--border)' : 'var(--accent)'}`,
        opacity: isPast ? 0.7 : 1, transition: 'var(--transition)',
      }}>
        {/* Header row */}
        <div style={{ padding: '1.4rem 1.6rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
          onClick={() => setExpanded(isOpen ? null : o.id)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{o.title}</h3>
              {o.has_payment && (
                <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <DollarSign size={10} />{o.payment_amount ? `$${o.payment_amount}` : 'Con costo'}
                </span>
              )}
              {o.program && (
                <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileText size={9} />Programa
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
                  <MapPin size={13} />{o.location}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {role === 'admin' && (
              <button className="btn-danger" style={{ padding: '0.45rem', flexShrink: 0 }}
                disabled={actionLoading === o.id}
                onClick={e => { e.stopPropagation(); deleteOuting(o.id); }}>
                <Trash2 size={14} />
              </button>
            )}
            {isOpen ? <ChevronUp size={18} color="var(--accent)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
          </div>
        </div>

        {/* Expanded panel */}
        {isOpen && (
          <div style={{ padding: '0 1.6rem 1.8rem', borderTop: '1px solid var(--border)', animation: 'slideUp 0.25s ease' }}>
            {/* Description */}
            {o.description && (
              <p style={{ marginTop: '1.2rem', lineHeight: 1.7, marginBottom: '1rem' }}>{o.description}</p>
            )}

            {/* Payment info */}
            {o.has_payment && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem',
                padding: '0.9rem 1.1rem', marginBottom: '1rem',
                background: 'rgba(76,175,125,0.07)', border: '1px solid rgba(76,175,125,0.18)',
                borderRadius: '10px',
              }}>
                <DollarSign size={18} color="var(--green)" />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>
                    Costo: {o.payment_amount ? `$${o.payment_amount}` : 'Por confirmar'}
                  </div>
                  {o.payment_description && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{o.payment_description}</div>
                  )}
                </div>
              </div>
            )}

            {/* Linked program */}
            {o.program && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem',
                padding: '0.9rem 1.1rem', marginBottom: '1rem',
                background: 'rgba(155,125,224,0.07)', border: '1px solid rgba(155,125,224,0.18)',
                borderRadius: '10px',
              }}>
                <FileText size={18} color="var(--purple)" />
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--purple)', fontWeight: 700 }}>Programa adjunto</div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>{o.program.title}</div>
                  {o.program.event_name && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.program.event_name}</div>}
                </div>
              </div>
            )}

            {/* Photo gallery */}
            <PhotoGallery outingId={o.id} canUpload={true} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
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

      {/* Create form */}
      {showForm && (
        <div className="glass-heavy animate-fast" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <h3 className="serif" style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Nueva Salida</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input placeholder="Ej: Visita al Templo Central" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha y hora *</label>
                <input type="datetime-local" value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Lugar</label>
                <input placeholder="Dirección o lugar" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>

              {/* Program selector */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={12} color="var(--purple)" /> Programa adjunto <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <select
                  value={form.program_id}
                  onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))}
                  style={{ color: form.program_id ? 'var(--text-main)' : 'var(--text-dim)' }}
                >
                  <option value="">— Sin programa —</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}{p.event_name ? ` · ${p.event_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Descripción (opcional)</label>
              <textarea rows={3} placeholder="Detalles adicionales..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Payment toggle */}
            <div className="toggle-row" style={{ marginBottom: '1rem' }}>
              <label className="toggle-switch">
                <input type="checkbox" checked={form.has_payment}
                  onChange={e => setForm(f => ({ ...f, has_payment: e.target.checked }))} />
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
                    onChange={e => setForm(f => ({ ...f, payment_amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción del cobro</label>
                  <input placeholder="Ej: Transporte y almuerzo" value={form.payment_description}
                    onChange={e => setForm(f => ({ ...f, payment_description: e.target.value }))} />
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

      {/* List */}
      {loading ? (
        <div className="loading"><div className="spinner" /><p>Cargando salidas...</p></div>
      ) : outings.length === 0 ? (
        <div className="empty-state glass" style={{ padding: '5rem' }}>
          <Calendar size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.2 }} />
          <p>No hay salidas registradas.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>Próximas</h2>
              {upcoming.map(o => <OutingCard key={o.id} o={o} />)}
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>Historial</h2>
              {past.map(o => <OutingCard key={o.id} o={o} />)}
            </section>
          )}
        </>
      )}

      <style>{`
        .outing-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
      `}</style>
    </div>
  );
};

export default Outings;
