import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  MapPin, 
  BookOpen, 
  Clock, 
  ChevronLeft, 
  CheckCircle,
  XCircle,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Upload,
  X,
  ZoomIn
} from 'lucide-react';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('participants');
  const [isJoined, setIsJoined] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  
  // States for editing (Admins)
  const [isEditing, setIsEditing] = useState(false);
  const [poetries, setPoetries] = useState('');
  const [programs, setPrograms] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  // Photo gallery state
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    fetchEventDetails();
    fetchParticipants();
    fetchPhotos();
  }, [id, user]);

  const fetchEventDetails = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      setEvent(data);
      setPoetries(data.poetries || '');
      setPrograms(data.programs || '');
      setMapUrl(data.map_url || '');
    }
    setLoading(false);
  };

  const fetchParticipants = async () => {
    const { data } = await supabase
      .from('event_participants')
      .select('profiles (*)')
      .eq('event_id', id);
    
    if (data) {
      const pList = data.map(p => p.profiles);
      setParticipants(pList);
      setIsJoined(pList.some(p => p.id === user?.id));
    }
  };

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('event_photos')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false });
    if (data) setPhotos(data);
  };

  const handleToggleJoin = async () => {
    if (!user) return;
    setBtnLoading(true);
    try {
      if (isJoined) {
        await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', id)
          .eq('profile_id', user.id);
      } else {
        await supabase
          .from('event_participants')
          .insert([{ event_id: id, profile_id: user.id }]);
      }
      await fetchParticipants();
    } catch (err) {
      alert(err.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('events')
      .update({ poetries, programs, map_url: mapUrl })
      .eq('id', id);
    
    if (!error) {
      setIsEditing(false);
      fetchEventDetails();
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPhoto(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });

        const { error } = await supabase.from('event_photos').insert([{
          event_id: id,
          uploader_id: user?.id,
          image_data: base64,
          caption: file.name.replace(/\.[^/.]+$/, '')
        }]);
        if (error) throw error;
      }
      await fetchPhotos();
    } catch (err) {
      alert(`Error al subir foto: ${err.message}`);
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    const { error } = await supabase.from('event_photos').delete().eq('id', photoId);
    if (!error) fetchPhotos();
  };

  if (loading) return <div className="loading">Cargando la magia de la poesía...</div>;
  if (!event) return <div className="loading">Evento no encontrado.</div>;

  return (
    <div className="animate">
      <button onClick={() => navigate('/')} className="btn-ghost" style={{ marginBottom: '2rem', border: 'none' }}>
        <ChevronLeft size={20} /> Volver a la Agenda
      </button>

      {/* Hero del evento */}
      <div className="glass-heavy" style={{ padding: '3rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent-glow)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 className="serif" style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1.1 }}>{event.title}</h1>
            <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Clock size={18} color="var(--accent)" />
                {new Date(event.event_date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <MapPin size={18} color="var(--accent)" />
                {event.location}
              </span>
            </div>
          </div>
          <button 
            onClick={handleToggleJoin} 
            className={isJoined ? "btn-ghost" : "btn-primary"}
            disabled={btnLoading}
            style={{ 
              minWidth: '200px', 
              height: '52px',
              fontSize: '1rem',
              borderColor: isJoined ? '#ff4d4d' : 'var(--border)',
              color: isJoined ? '#ff4d4d' : undefined
            }}
          >
            {btnLoading ? 'Procesando...' : (
              isJoined
                ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><XCircle size={20} /> Cancelar Asistencia</span>
                : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={20} /> Confirmar Asistencia</span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-header" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <button className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>
            <Users size={18} /> Asistencia ({participants.length})
          </button>
          <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            <ImageIcon size={18} /> Información ({photos.length})
          </button>
          <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
            <BookOpen size={18} /> Poesía y Dramas
          </button>
          <button className={`tab-btn ${activeTab === 'program' ? 'active' : ''}`} onClick={() => setActiveTab('program')}>
            <Clock size={18} /> Programa
          </button>
          <button className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            <MapPin size={18} /> Localización
          </button>
        </div>

        <div className="tab-content">

          {/* ── ASISTENCIA ── */}
          {activeTab === 'participants' && (
            <div className="animate-fade">
              <h3 className="serif" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Almas presentes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {participants.map(p => (
                  <div key={p.id} className="glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={24} color="var(--accent)" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600 }}>{p.full_name || p.username}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.role === 'admin' ? 'Administrador' : 'Poeta'}</p>
                    </div>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aún no hay confirmaciones. ¡Sé el primero!</p>
                )}
              </div>
            </div>
          )}

          {/* ── INFORMACIÓN / FOTOS ── */}
          {activeTab === 'info' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 className="serif" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Fotos del lugar</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Imágenes de la iglesia o lugar visitado.</p>
                </div>
                <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {uploadingPhoto ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="spinner-sm" />
                      Subiendo...
                    </span>
                  ) : (
                    <><Upload size={18} /> Añadir Fotos</>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>

              {photos.length === 0 ? (
                <div className="glass" style={{ padding: '5rem', textAlign: 'center' }}>
                  <ImageIcon size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontStyle: 'italic' }}>
                    Aún no hay fotos. ¡Sube imágenes del lugar visitado!
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1.2rem'
                }}>
                  {photos.map(photo => (
                    <div
                      key={photo.id}
                      className="glass photo-card"
                      style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}
                    >
                      <img
                        src={photo.image_data}
                        alt={photo.caption || 'Foto del evento'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onClick={() => setLightboxPhoto(photo)}
                      />
                      <div className="photo-overlay">
                        <button
                          className="overlay-btn"
                          onClick={() => setLightboxPhoto(photo)}
                        >
                          <ZoomIn size={18} />
                        </button>
                        {(role === 'admin' || user?.id === photo.uploader_id) && (
                          <button
                            className="overlay-btn overlay-btn-danger"
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      {photo.caption && (
                        <div className="photo-caption">{photo.caption}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MAPA ── */}
          {activeTab === 'map' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 className="serif" style={{ fontSize: '2rem' }}>Punto de encuentro</h3>
                {role === 'admin' && (
                  <button className="btn-ghost" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancelar' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit3 size={18} /> Editar Mapa</span>}
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="glass" style={{ padding: '2rem' }}>
                  <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Pega el enlace de Google Maps o coordenadas:</p>
                  <input value={mapUrl} onChange={e => setMapUrl(e.target.value)} placeholder="https://maps.google.com/..." />
                  <button className="btn-primary" onClick={handleUpdate}>Guardar Localización</button>
                </div>
              ) : (
                <div style={{ borderRadius: '24px', overflow: 'hidden', height: '500px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapUrl || event.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>
              )}
            </div>
          )}

          {/* ── POESÍA Y DRAMAS ── */}
          {activeTab === 'content' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 className="serif" style={{ fontSize: '2rem' }}>Letras seleccionadas</h3>
                {role === 'admin' && (
                  <button className="btn-ghost" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancelar' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit3 size={18} /> Editar Poesías</span>}
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea 
                  className="glass"
                  value={poetries} 
                  onChange={e => setPoetries(e.target.value)} 
                  rows="15" 
                  style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem' }}
                />
              ) : (
                <div className="glass" style={{ padding: '3rem', whiteSpace: 'pre-wrap', lineHeight: '2', fontSize: '1.2rem', color: 'var(--text-main)', borderStyle: 'dashed' }}>
                  {poetries || 'Las musas aún no han dictado los poemas para este día.'}
                </div>
              )}
              {isEditing && <button className="btn-primary" onClick={handleUpdate}>Guardar Poemas</button>}
            </div>
          )}

          {/* ── PROGRAMA ── */}
          {activeTab === 'program' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 className="serif" style={{ fontSize: '2rem' }}>Cronograma</h3>
                {role === 'admin' && (
                  <button className="btn-ghost" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancelar' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit3 size={18} /> Editar Programa</span>}
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea 
                  className="glass"
                  value={programs} 
                  onChange={e => setPrograms(e.target.value)} 
                  rows="12" 
                  style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem' }}
                />
              ) : (
                <div className="glass" style={{ padding: '3rem', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                  {programs || 'El ritmo del evento se definirá pronto.'}
                </div>
              )}
              {isEditing && <button className="btn-primary" onClick={handleUpdate}>Guardar Programa</button>}
            </div>
          )}

        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '2rem', backdropFilter: 'blur(6px)'
          }}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <X size={22} />
          </button>
          <img
            src={lightboxPhoto.image_data}
            alt={lightboxPhoto.caption}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          />
          {lightboxPhoto.caption && (
            <p style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '1rem', opacity: 0.8 }}>
              {lightboxPhoto.caption}
            </p>
          )}
        </div>
      )}

      <style>{`
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 1rem 0;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          transition: var(--transition);
          font-size: 0.95rem;
          white-space: nowrap;
        }
        .tab-btn:hover { color: var(--text-main); }
        .tab-btn.active { color: var(--accent); }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0; right: 0;
          height: 3px;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent-glow);
        }
        .animate-fade { animation: fadeIn 0.4s ease-out; }
        .photo-card { cursor: pointer; }
        .photo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .photo-card:hover .photo-overlay { opacity: 1; }
        .overlay-btn {
          background: rgba(255,255,255,0.15);
          border: none;
          border-radius: 50%;
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff;
          transition: background 0.2s;
        }
        .overlay-btn:hover { background: rgba(255,255,255,0.3); }
        .overlay-btn-danger { background: rgba(255,60,60,0.65); }
        .overlay-btn-danger:hover { background: rgba(255,60,60,0.9); }
        .photo-caption {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 0.5rem 0.8rem;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          font-size: 0.78rem;
          color: #fff;
          pointer-events: none;
        }
        .spinner-sm {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid #000;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EventDetail;
