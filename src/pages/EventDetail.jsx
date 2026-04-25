import React, { useState, useEffect } from 'react';
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
  Plus,
  Trash2,
  Edit3
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

  useEffect(() => {
    fetchEventDetails();
    fetchParticipants();
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

  const handleToggleJoin = async () => {
    if (!user) return;
    setBtnLoading(true);
    try {
      if (isJoined) {
        // Leave
        await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', id)
          .eq('profile_id', user.id);
      } else {
        // Join
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

  if (loading) return <div className="loading">Cargando la magia de la poesía...</div>;
  if (!event) return <div className="loading">Evento no encontrado.</div>;

  return (
    <div className="animate">
      <button onClick={() => navigate('/')} className="btn-ghost" style={{ marginBottom: '2rem', border: 'none' }}>
        <ChevronLeft size={20} /> Volver a la Agenda
      </button>

      <div className="glass-heavy" style={{ padding: '3rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent-glow)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <h1 className="serif" style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: 1.1 }}>{event.title}</h1>
            <div style={{ display: 'flex', gap: '2.5rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Clock size={20} color="var(--accent)" />
                {new Date(event.event_date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <MapPin size={20} color="var(--accent)" />
                {event.location}
              </span>
            </div>
          </div>
          <button 
            onClick={handleToggleJoin} 
            className={isJoined ? "btn-ghost" : "btn-primary"}
            disabled={btnLoading}
            style={{ 
              minWidth: '220px', 
              height: '56px',
              fontSize: '1rem',
              borderColor: isJoined ? '#ff4d4d' : 'var(--border)',
              color: isJoined ? '#ff4d4d' : (isJoined ? '#fff' : '#000')
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

      <div className="tabs-container">
        <div className="tabs-header" style={{ display: 'flex', gap: '3rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
          <button className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>
            <Users size={20} /> Asistencia ({participants.length})
          </button>
          <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
            <BookOpen size={20} /> Poesía y Dramas
          </button>
          <button className={`tab-btn ${activeTab === 'program' ? 'active' : ''}`} onClick={() => setActiveTab('program')}>
            <Clock size={20} /> Programa
          </button>
          <button className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            <MapPin size={20} /> Localización
          </button>
        </div>

        <div className="tab-content">
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
                {participants.length === 0 && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aún no hay confirmaciones. ¡Sé el primero!</p>}
              </div>
            </div>
          )}

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
          gap: 0.8rem;
          transition: var(--transition);
          font-size: 1.1rem;
        }
        .tab-btn:hover { color: var(--text-main); }
        .tab-btn.active { color: var(--accent); }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent-glow);
        }
        .animate-fade { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default EventDetail;
