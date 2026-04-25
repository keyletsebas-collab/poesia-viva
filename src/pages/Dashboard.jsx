import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { 
  PenTool, MapPin, Plus, Clock, Users, Megaphone, 
  Upload, FileText, CheckCircle, XCircle, ArrowRight,
  Loader2, Image as ImageIcon, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { digitalizePoetry } from '../utils/GeminiService';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [poetries, setPoetries] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [nextRehearsal, setNextRehearsal] = useState(null);
  
  // AI Flow State
  const [isDigitalizing, setIsDigitalizing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const { role, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        supabase.from('poetries').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('event_date', { ascending: true }),
        supabase.from('profiles').select('*'),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('rehearsals').select('*').gte('rehearsal_date', new Date().toISOString()).order('rehearsal_date', { ascending: true }).limit(1)
      ]);

      if (results[0].status === 'fulfilled' && results[0].value.data) setPoetries(results[0].value.data);
      if (results[1].status === 'fulfilled' && results[1].value.data) setEvents(results[1].value.data);
      if (results[2].status === 'fulfilled' && results[2].value.data) setMembers(results[2].value.data);
      if (results[3].status === 'fulfilled' && results[3].value.data) setAnnouncements(results[3].value.data);
      if (results[4].status === 'fulfilled' && results[4].value.data && results[4].value.data[0]) setNextRehearsal(results[4].value.data[0]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsDigitalizing(true);
    setShowAiModal(true);
    try {
      const text = await digitalizePoetry(file);
      setAiResult(text);
    } catch (err) {
      console.error(err);
      alert("Error al digitalizar la poesía. Inténtalo de nuevo.");
      setShowAiModal(false);
    } finally {
      setIsDigitalizing(false);
    }
  };

  const saveAiPoetry = async () => {
    if (!aiResult) return;
    try {
      const { data, error } = await supabase.from('poetries').insert([{
        title: "Poesía Digitalizada " + new Date().toLocaleDateString(),
        content: aiResult,
        author_id: user.id,
        is_digitized: true
      }]);
      if (error) throw error;

      await supabase.from('announcements').insert([{
        title: "Nueva Poesía Digitalizada",
        message: `Se ha subido una nueva poesía.`,
        type: 'poetry'
      }]);

      setShowAiModal(false);
      setAiResult(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la poesía.");
    }
  };

  if (loading) return <div className="loading">Inspirando el panel de control...</div>;

  return (
    <div className="animate">
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', lineHeight: 1 }}>Dashboard Poético</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Gestiona tus poesías, salidas y comunidad en un solo lugar.</p>
      </header>

      {/* REHEARSAL ALERT */}
      {nextRehearsal && (
        <div className="rehearsal-banner glass animate" style={{ 
          marginBottom: '2.5rem', 
          padding: '1.5rem 2.5rem', 
          background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.1), transparent)',
          borderLeft: '4px solid var(--accent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="pulse-icon">
              <Clock size={24} color="var(--accent)" />
            </div>
            <div>
              <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '0.2rem' }}>Próximo Ensayo</p>
              <h3 className="serif" style={{ fontSize: '1.4rem' }}>{nextRehearsal.title}</h3>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>{new Date(nextRehearsal.rehearsal_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <Clock size={14} style={{ marginRight: '5px' }} />
              {new Date(nextRehearsal.rehearsal_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} 
              <span style={{ margin: '0 10px' }}>|</span>
              <MapPin size={14} style={{ marginRight: '5px' }} />
              {nextRehearsal.location}
            </p>
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        {/* —————— SECCIÓN 1: POESÍAS —————— */}
        <section className="dashboard-section glass">
          <div className="section-header">
            <div className="title-with-icon">
              <PenTool size={22} color="var(--accent)" />
              <h2 className="serif">Poesías Digitales</h2>
            </div>
            <label className="btn-primary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={16} /> Digitalizar
              <input type="file" hidden onChange={handleFileUpload} accept="image/*,.pdf,.docx" />
            </label>
          </div>
          
          <div className="scroll-area">
            {poetries.length === 0 ? (
              <p className="empty-text">No hay poesías aún.</p>
            ) : (
              poetries.map(p => (
                <div key={p.id} className="item-card glass-heavy card-hover">
                  <div>
                    <h4 style={{ color: 'var(--text-main)' }}>{p.title}</h4>
                    <p className="item-meta">{p.is_digitized ? '✨ IA Digitalizada' : 'Manuscrito'}</p>
                  </div>
                  <ArrowRight size={18} className="arrow" />
                </div>
              ))
            )}
          </div>
        </section>

        {/* —————— SECCIÓN 2: SALIDAS —————— */}
        <section className="dashboard-section glass">
          <div className="section-header">
            <div className="title-with-icon">
              <MapPin size={22} color="var(--accent)" />
              <h2 className="serif">Próximas Salidas</h2>
            </div>
            {role === 'admin' && (
              <button className="btn-ghost btn-sm" onClick={() => navigate('/admin')}>
                <Plus size={16} /> Nueva
              </button>
            )}
          </div>
          
          <div className="scroll-area">
            {events.length === 0 ? (
              <p className="empty-text">No hay salidas programadas.</p>
            ) : (
              events.map(e => (
                <div key={e.id} className="item-card glass-heavy card-hover" onClick={() => navigate(`/event/${e.id}`)}>
                  <div>
                    <h4 style={{ color: 'var(--text-main)' }}>{e.title}</h4>
                    <p className="item-meta"><Clock size={12} /> {new Date(e.event_date).toLocaleDateString()}</p>
                    <p className="item-meta" style={{ fontSize: '0.8rem' }}><MapPin size={12} /> {e.location}</p>
                  </div>
                  <ArrowRight size={18} className="arrow" />
                </div>
              ))
            )}
          </div>
        </section>

        {/* —————— SECCIÓN 3: MIEMBROS —————— */}
        <section className="dashboard-section glass">
          <div className="section-header">
            <div className="title-with-icon">
              <Users size={22} color="var(--accent)" />
              <h2 className="serif">Miembros</h2>
            </div>
          </div>
          
          <div className="scroll-area">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <span className="stat-num">{members.filter(m => m.status !== 'inactive').length}</span>
                <span className="stat-label">Activos</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{members.filter(m => m.status === 'inactive').length}</span>
                <span className="stat-label">Inactivos</span>
              </div>
            </div>
            
            {members.slice(0, 8).map(m => (
              <div key={m.id} className="member-row">
                <div className="avatar-small">{m.full_name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.1rem' }}>{m.full_name}</p>
                  <span className={`badge ${m.status === 'inactive' ? 'badge-red' : 'badge-green'}`}>
                    {m.status === 'inactive' ? 'Inactivo' : 'Activo'}
                  </span>
                </div>
              </div>
            ))}
            <button className="btn-ghost" style={{ width: '100%', marginTop: 'auto' }} onClick={() => navigate('/members')}>
              Ver todos
            </button>
          </div>
        </section>

        {/* —————— SECCIÓN 4: ANUNCIOS —————— */}
        <section className="dashboard-section glass">
          <div className="section-header">
            <div className="title-with-icon">
              <Megaphone size={22} color="var(--accent)" />
              <h2 className="serif">Anuncios</h2>
            </div>
          </div>
          
          <div className="scroll-area feed">
            {announcements.length === 0 ? (
              <p className="empty-text">No hay anuncios recientes.</p>
            ) : (
              announcements.map(a => (
                <div key={a.id} className="feed-item">
                  <div className={`feed-icon ${a.type}`}>
                    {a.type === 'poetry' ? <FileText size={14} /> : <MapPin size={14} />}
                  </div>
                  <div className="feed-content">
                    <strong>{a.title}</strong>
                    <p>{a.message}</p>
                    <span className="feed-date">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* AI MODAL */}
      {showAiModal && (
        <div className="modal-overlay">
          <div className="glass-heavy modal-content animate">
            <div className="modal-header">
              <h3 className="serif">Digitalización con IA</h3>
              <button className="btn-ghost btn-sm" onClick={() => setShowAiModal(false)}><XCircle size={20}/></button>
            </div>
            
            <div className="modal-body">
              {isDigitalizing ? (
                <div className="ai-loader">
                  <Loader2 className="spinning" size={48} color="var(--accent)" />
                  <p>La IA está leyendo tus versos...</p>
                </div>
              ) : (
                <div className="ai-result">
                  <textarea 
                    value={aiResult} 
                    onChange={(e) => setAiResult(e.target.value)}
                    style={{ minHeight: '300px', width: '100%', whiteSpace: 'pre-wrap' }}
                  />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn-primary" onClick={saveAiPoetry} style={{ flex: 1 }}>
                      <Send size={18} /> Guardar en Colección
                    </button>
                    <button className="btn-ghost" onClick={() => setShowAiModal(false)} style={{ flex: 1 }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .dashboard-section {
          padding: 2rem;
          height: 500px;
          display: flex;
          flex-direction: column;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .title-with-icon {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .scroll-area {
          flex: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .item-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem;
          margin-bottom: 1rem;
          cursor: pointer;
        }

        .item-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.3rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .card-hover:hover .arrow {
          transform: translateX(5px);
          color: var(--accent);
        }

        .empty-text {
          color: var(--text-muted);
          text-align: center;
          margin-top: 3rem;
          font-style: italic;
        }

        .stat-card {
          flex: 1;
          background: rgba(255,255,255,0.03);
          padding: 1rem;
          border-radius: 12px;
          text-align: center;
          border: 1px solid var(--border);
        }

        .stat-num {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
        }

        .stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }

        .member-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 0;
          border-bottom: 1px solid var(--border);
        }

        .avatar-small {
          width: 32px;
          height: 32px;
          background: var(--accent);
          color: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .badge {
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .badge-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
        .badge-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }

        .feed-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .feed-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feed-icon.poetry { background: rgba(212, 175, 55, 0.15); color: var(--accent); }
        .feed-icon.outing { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

        .feed-content strong { display: block; font-size: 0.9rem; margin-bottom: 0.2rem; }
        .feed-content p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }
        .feed-date { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.4rem; display: block; }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .modal-content {
          width: 100%;
          max-width: 700px;
          padding: 2.5rem;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .ai-loader {
          text-align: center;
          padding: 4rem 0;
        }

        .spinning {
          animation: spin 1.5s linear infinite;
          margin-bottom: 1.5rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .pulse-icon {
          background: rgba(212, 175, 55, 0.2);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .pulse-icon::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1px solid var(--accent);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; border-radius: 8px; }
      `}</style>
    </div>
  );
};

export default Dashboard;
