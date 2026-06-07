import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Newspaper, BookOpen, Calendar, Music, FileText, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
  poetry:    { icon: BookOpen,  color: 'var(--accent)',  bg: 'var(--accent-bg)',        label: 'Poesía' },
  outing:    { icon: Calendar,  color: 'var(--blue)',    bg: 'rgba(92,156,224,0.1)',    label: 'Salida' },
  rehearsal: { icon: Music,     color: 'var(--green)',   bg: 'rgba(76,175,125,0.1)',    label: 'Ensayo' },
  program:   { icon: FileText,  color: 'var(--purple)',  bg: 'rgba(155,125,224,0.1)',   label: 'Programa' },
  general:   { icon: Newspaper, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', label: 'General' },
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora mismo';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d} día${d > 1 ? 's' : ''}`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

const News = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);
    if (data) setItems(data);
    setLoading(false);
  };

  const FILTERS = [
    { key: 'all',      label: 'Todo' },
    { key: 'poetry',   label: 'Poesías' },
    { key: 'outing',   label: 'Salidas' },
    { key: 'rehearsal',label: 'Ensayos' },
    { key: 'program',  label: 'Programas' },
  ];

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <div className="animate">
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <Newspaper size={24} color="var(--text-main)" />
          </div>
          <h1 className="serif" style={{ fontSize: '3rem', fontWeight: 800 }}>Noticias</h1>
        </div>
        <p>Últimas actualizaciones del grupo — poesías, salidas, ensayos y más.</p>
      </header>

      {/* Filter tabs */}
      <div className="tabs-bar" style={{ marginBottom: '2rem' }}>
        {FILTERS.map(f => (
          <button key={f.key} className={`tab-btn${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><p>Cargando noticias...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass" style={{ padding: '5rem' }}>
          <Newspaper size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: .2 }} />
          <p>No hay noticias aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(item => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
            const Icon = cfg.icon;
            return (
              <div key={item.id} className="glass" style={{
                padding: '1.4rem 1.8rem', display: 'flex', gap: '1.2rem', alignItems: 'flex-start',
                borderLeft: `3px solid ${cfg.color}`, transition: 'var(--transition)'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: cfg.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <span className="badge badge-muted" style={{ fontSize: '0.62rem', marginBottom: '0.4rem', display: 'inline-block' }}>{cfg.label}</span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>{item.title}</h3>
                      {item.message && <p style={{ fontSize: '0.88rem', lineHeight: '1.55' }}>{item.message}</p>}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem',
                      color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <Clock size={12} />{timeAgo(item.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default News;
