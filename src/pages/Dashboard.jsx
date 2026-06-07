import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, FileText, Calendar, Music, Users,
  Clock, MapPin, ArrowRight, Newspaper, TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    poetries: [], programs: [], outings: [], rehearsals: [],
    members: [], news: [], nextRehearsal: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      supabase.from('poetries').select('id,title,is_digitized,created_at').order('created_at', { ascending: false }).limit(6),
      supabase.from('programs').select('id,title,event_name,created_at').order('created_at', { ascending: false }).limit(6),
      supabase.from('events').select('id,title,event_date,location,has_payment').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(5),
      supabase.from('rehearsals').select('id,title,rehearsal_date,location').gte('rehearsal_date', new Date().toISOString()).order('rehearsal_date', { ascending: true }).limit(5),
      supabase.from('profiles').select('id,full_name,status,role'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(8),
    ]);

    const get = (i) => results[i].status === 'fulfilled' ? (results[i].value.data || []) : [];

    const rehearsals = get(3);
    setData({
      poetries: get(0),
      programs: get(1),
      outings: get(2),
      rehearsals,
      members: get(4),
      news: get(5),
      nextRehearsal: rehearsals[0] || null,
    });
    setLoading(false);
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <p>Cargando el panel...</p>
    </div>
  );

  const { poetries, programs, outings, rehearsals, members, news, nextRehearsal } = data;
  const activeMembers = members.filter(m => m.status !== 'inactive').length;

  const TYPE_COLORS = {
    poetry:    { color: 'var(--accent)',   bg: 'var(--accent-bg)' },
    outing:    { color: 'var(--blue)',     bg: 'rgba(92,156,224,0.1)' },
    rehearsal: { color: 'var(--green)',    bg: 'rgba(76,175,125,0.1)' },
    program:   { color: 'var(--purple)',   bg: 'rgba(155,125,224,0.1)' },
    general:   { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' },
  };

  return (
    <div className="animate">
      {/* Header */}
      <header style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.4rem' }}>
          Bienvenido de nuevo
        </p>
        <h1 className="serif" style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.1 }}>
          {user?.email?.split('@')[0] || 'Panel Principal'}
        </h1>
        <p style={{ marginTop: '0.5rem' }}>Resumen general del grupo Verbo Eterno.</p>
      </header>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        {[
          { icon: BookOpen,  value: poetries.length,  label: 'Poesías',   color: 'var(--accent)',  bg: 'var(--accent-bg)',            to: '/poetrias' },
          { icon: Calendar,  value: outings.length,   label: 'Salidas',   color: 'var(--blue)',    bg: 'rgba(92,156,224,0.1)',        to: '/salidas' },
          { icon: Music,     value: rehearsals.length,label: 'Ensayos',   color: 'var(--green)',   bg: 'rgba(76,175,125,0.1)',        to: '/ensayos' },
          { icon: Users,     value: activeMembers,    label: 'Miembros',  color: 'var(--purple)',  bg: 'rgba(155,125,224,0.1)',       to: '/miembros' },
        ].map(({ icon: Icon, value, label, color, bg, to }) => (
          <div key={label} className="glass stat-card" style={{ cursor: 'pointer', transition: 'var(--transition)' }}
            onClick={() => navigate(to)}
            onMouseEnter={e => e.currentTarget.style.borderColor = color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div className="stat-icon-container" style={{ background: bg, color }}><Icon size={22} /></div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Next rehearsal banner */}
      {nextRehearsal && (
        <div style={{
          marginBottom: '2.5rem', padding: '1.4rem 2rem',
          background: 'linear-gradient(90deg, rgba(76,175,125,0.08) 0%, transparent 100%)',
          border: '1px solid rgba(76,175,125,0.2)', borderLeft: '4px solid var(--green)',
          borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(76,175,125,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Music size={20} color="var(--green)" />
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid var(--green)',
                animation: 'pulse-ring 2s infinite', opacity: .5 }} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', fontWeight: 800 }}>Próximo Ensayo</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{nextRehearsal.title}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
              <Clock size={13} />
              {new Date(nextRehearsal.rehearsal_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {nextRehearsal.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                <MapPin size={13} /> {nextRehearsal.location}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Poesías */}
        <Section icon={<BookOpen size={18} color="var(--accent)" />} title="Poesías Recientes"
          onMore={() => navigate('/poetrias')} accentColor="var(--accent)">
          {poetries.length === 0 ? <Empty text="No hay poesías aún." /> : poetries.map(p => (
            <div key={p.id} className="item-row" onClick={() => navigate('/poetrias')}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>{p.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {p.is_digitized ? '✨ IA · ' : ''}{new Date(p.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
              <ArrowRight size={14} color="var(--text-dim)" />
            </div>
          ))}
        </Section>

        {/* Salidas */}
        <Section icon={<Calendar size={18} color="var(--blue)" />} title="Próximas Salidas"
          onMore={() => navigate('/salidas')} accentColor="var(--blue)">
          {outings.length === 0 ? <Empty text="No hay salidas programadas." /> : outings.map(o => (
            <div key={o.id} className="item-row" onClick={() => navigate('/salidas')}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {o.title}
                  {o.has_payment && <span className="badge badge-green" style={{ fontSize: '0.6rem' }}>$</span>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={10} />{new Date(o.event_date).toLocaleDateString('es-ES')}
                  {o.location && <><MapPin size={10} />{o.location}</>}
                </div>
              </div>
              <ArrowRight size={14} color="var(--text-dim)" />
            </div>
          ))}
        </Section>

        {/* Programas */}
        <Section icon={<FileText size={18} color="var(--purple)" />} title="Programas"
          onMore={() => navigate('/programas')} accentColor="var(--purple)">
          {programs.length === 0 ? <Empty text="No hay programas registrados." /> : programs.map(p => (
            <div key={p.id} className="item-row" onClick={() => navigate('/programas')}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>{p.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {p.event_name || new Date(p.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
              <ArrowRight size={14} color="var(--text-dim)" />
            </div>
          ))}
        </Section>

        {/* Noticias */}
        <Section icon={<Newspaper size={18} color="var(--text-muted)" />} title="Últimas Noticias"
          onMore={() => navigate('/noticias')} accentColor="var(--text-muted)">
          {news.length === 0 ? <Empty text="No hay noticias aún." /> : news.map(n => {
            const cfg = TYPE_COLORS[n.type] || TYPE_COLORS.general;
            return (
              <div key={n.id} className="item-row" onClick={() => navigate('/noticias')}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>{n.title}</div>
                  <div style={{ fontSize: '0.72rem', color: cfg.color, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={10} />{new Date(n.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <ArrowRight size={14} color="var(--text-dim)" />
              </div>
            );
          })}
        </Section>
      </div>
    </div>
  );
};

const Section = ({ icon, title, onMore, children, accentColor }) => (
  <div className="glass" style={{ overflow: 'hidden' }}>
    <div style={{ padding: '1.3rem 1.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
        {icon}
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{title}</span>
      </div>
      <button className="btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }} onClick={onMore}>
        Ver todo <ArrowRight size={12} />
      </button>
    </div>
    <div>{children}</div>
  </div>
);

const Empty = ({ text }) => (
  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>{text}</div>
);

export default Dashboard;
