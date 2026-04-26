import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FileText, Search, Sparkles, Trash2, Plus, ChevronDown, ChevronUp, Upload, Loader2 } from 'lucide-react';
import { digitalizePoetry } from '../utils/GeminiService';

const Programs = () => {
  const { user, role } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | digitized | manual
  const [expanded, setExpanded] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Add form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newEvent, setNewEvent] = useState('');

  // AI state
  const [isDigitalizing, setIsDigitalizing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiTitle, setAiTitle] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setPrograms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setActionLoading('add');
    try {
      const { error } = await supabase.from('programs').insert([{
        title: newTitle.trim(),
        content: newContent.trim(),
        event_name: newEvent.trim() || null,
        author_id: user?.id,
        is_digitized: false
      }]);
      if (error) throw error;

      await supabase.from('announcements').insert([{
        title: 'Nuevo Programa Añadido',
        message: `Se ha añadido el programa "${newTitle.trim()}"${newEvent ? ` para ${newEvent}` : ''}.`,
        type: 'general'
      }]);

      setNewTitle(''); setNewContent(''); setNewEvent('');
      setShowAddForm(false);
      fetchPrograms();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsDigitalizing(true);
    setShowAiPanel(true);
    setAiResult(null);
    try {
      const text = await digitalizePoetry(file);
      setAiResult(text);
      setAiTitle('Programa ' + new Date().toLocaleDateString());
    } catch (err) {
      console.error(err);
      alert(`Error de digitalización: ${err.message}`);
      setShowAiPanel(false);
    } finally {
      setIsDigitalizing(false);
    }
  };

  const saveAiProgram = async () => {
    if (!aiResult || !aiTitle.trim()) return;
    setActionLoading('ai-save');
    try {
      const { error } = await supabase.from('programs').insert([{
        title: aiTitle.trim(),
        content: aiResult,
        author_id: user?.id,
        is_digitized: true
      }]);
      if (error) throw error;

      await supabase.from('announcements').insert([{
        title: 'Nuevo Programa Digitalizado con IA',
        message: `Se ha digitalizado el programa "${aiTitle.trim()}".`,
        type: 'general'
      }]);

      setShowAiPanel(false);
      setAiResult(null);
      setAiTitle('');
      fetchPrograms();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteProgram = async (id, authorId) => {
    if (role !== 'admin' && user?.id !== authorId) return;
    if (!confirm('¿Eliminar este programa?')) return;
    setActionLoading(id);
    try {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
      fetchPrograms();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = programs.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.content?.toLowerCase().includes(search.toLowerCase()) ||
      p.event_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'digitized' && p.is_digitized) ||
      (filter === 'manual' && !p.is_digitized);
    return matchSearch && matchFilter;
  });

  return (
    <div className="animate">
      {/* Header */}
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Programas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
            {programs.length} {programs.length === 1 ? 'programa' : 'programas'} en el archivo del grupo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="btn-ghost" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Upload size={18} /> Digitalizar con IA
            <input
              type="file"
              hidden
              onChange={handleFileUpload}
              accept="image/*,application/pdf,.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            />
          </label>
          <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cerrar' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> Añadir Programa
              </span>
            )}
          </button>
        </div>
      </header>

      {/* AI Panel */}
      {showAiPanel && (
        <div className="glass-heavy animate" style={{ padding: '2.5rem', marginBottom: '2.5rem', borderLeft: '4px solid var(--accent)' }}>
          <h3 className="serif" style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Sparkles size={22} color="var(--accent)" /> Digitalización con IA
          </h3>
          {isDigitalizing ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <Loader2 size={48} color="var(--accent)" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>La IA está leyendo el programa...</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <input
                  placeholder="Título del programa"
                  value={aiTitle}
                  onChange={e => setAiTitle(e.target.value)}
                />
                <textarea
                  value={aiResult}
                  onChange={e => setAiResult(e.target.value)}
                  rows={10}
                  style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '1rem', resize: 'vertical' }}
                  placeholder="Texto digitalizado..."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" onClick={saveAiProgram} disabled={!!actionLoading} style={{ flex: 1 }}>
                  {actionLoading === 'ai-save' ? 'Guardando...' : 'Guardar en Archivo'}
                </button>
                <button className="btn-ghost" onClick={() => { setShowAiPanel(false); setAiResult(null); }} style={{ flex: 1 }}>
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-heavy animate" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
          <h3 className="serif" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Nuevo Programa</h3>
          <form onSubmit={handleAddProgram}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <input
                placeholder="Título del programa *"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
              />
              <input
                placeholder="Evento / Iglesia (opcional)"
                value={newEvent}
                onChange={e => setNewEvent(e.target.value)}
              />
            </div>
            <textarea
              placeholder="Contenido del programa... *"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              required
              rows={10}
              style={{ width: '100%', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-main)', fontFamily: 'Georgia, serif', fontSize: '1.05rem', lineHeight: '1.8', resize: 'vertical' }}
            />
            <button type="submit" className="btn-primary" disabled={!!actionLoading}>
              {actionLoading === 'add' ? 'Guardando...' : 'Guardar Programa'}
            </button>
          </form>
        </div>
      )}

      {/* Filters and Search */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.5rem', flex: 1, minWidth: '250px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            placeholder="Buscar programas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', width: '100%', fontSize: '1rem' }}
          />
        </div>
        <div className="glass" style={{ display: 'flex', padding: '0.4rem', gap: '0.4rem' }}>
          {[['all', 'Todos'], ['digitized', '✨ IA'], ['manual', '✍ Manual']].map(([val, label]) => (
            <button
              key={val}
              className={filter === val ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', borderRadius: '8px' }}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Programs List */}
      {loading ? (
        <div className="loading">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="spinner" />
            <p>Buscando en el archivo de programas...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ padding: '5rem', textAlign: 'center' }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontStyle: 'italic' }}>
            {search ? 'No se encontraron programas con ese término.' : 'Aún no hay programas. ¡Añade el primero!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filtered.map((prog) => (
            <div
              key={prog.id}
              className="glass"
              style={{ padding: '2rem 2.5rem', transition: 'var(--transition)', borderLeft: expanded === prog.id ? '3px solid var(--accent)' : '3px solid transparent' }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === prog.id ? null : prog.id)}
              >
                <div style={{ flex: 1 }}>
                  <h3 className="serif" style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>{prog.title}</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {prog.is_digitized && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
                        borderRadius: '20px', background: 'rgba(212, 175, 55, 0.15)',
                        color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        <Sparkles size={10} /> IA
                      </span>
                    )}
                    {prog.event_name && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent)', opacity: 0.8 }}>
                        📍 {prog.event_name}
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(prog.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    {prog.content && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        · {prog.content.split(' ').length} palabras
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  {(role === 'admin' || user?.id === prog.author_id) && (
                    <button
                      className="btn-ghost"
                      style={{ padding: '0.4rem', color: '#ff4d4d' }}
                      onClick={(ev) => { ev.stopPropagation(); deleteProgram(prog.id, prog.author_id); }}
                      disabled={actionLoading === prog.id}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  {expanded === prog.id ? <ChevronUp size={20} color="var(--accent)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>
              </div>

              {expanded === prog.id && (
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.9',
                    fontSize: '1.05rem',
                    fontFamily: 'inherit',
                    color: 'var(--text-main)',
                    maxWidth: '80ch'
                  }}>
                    {prog.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Programs;
