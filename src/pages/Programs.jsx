import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FileText, Search, Sparkles, Trash2, Plus, ChevronDown, ChevronUp, Upload, Loader2, Pencil, Check, X } from 'lucide-react';
import { digitalizePoetry } from '../utils/GeminiService';

const Programs = () => {
  const { user, role } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', content: '', event_name: '' });

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newEvent, setNewEvent] = useState('');

  const [isDigitalizing, setIsDigitalizing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiTitle, setAiTitle] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => { fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
      if (data) setPrograms(data);
    } catch (err) {
      console.warn('[Verbo Eterno] Programs fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setActionLoading('add');
    const { error } = await supabase.from('programs').insert([{
      title: newTitle.trim(), content: newContent.trim(),
      event_name: newEvent.trim() || null, author_id: user?.id, is_digitized: false
    }]);
    if (!error) {
      await supabase.from('announcements').insert([{
        title: 'Nuevo Programa Añadido',
        message: `Se añadió "${newTitle.trim()}"${newEvent ? ` para ${newEvent}` : ''}.`,
        type: 'program'
      }]);
      setNewTitle(''); setNewContent(''); setNewEvent('');
      setShowAddForm(false); fetchPrograms();
    } else alert(error.message);
    setActionLoading(null);
  };

  const startEdit = (prog) => {
    setEditingId(prog.id);
    setEditData({ title: prog.title, content: prog.content || '', event_name: prog.event_name || '' });
    setExpanded(prog.id);
  };

  const saveEdit = async (id) => {
    setActionLoading(id);
    const { error } = await supabase.from('programs').update({
      title: editData.title, content: editData.content, event_name: editData.event_name || null
    }).eq('id', id);
    if (!error) { setEditingId(null); fetchPrograms(); }
    else alert(error.message);
    setActionLoading(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsDigitalizing(true); setShowAiPanel(true); setAiResult(null);
    try {
      const text = await digitalizePoetry(file);
      setAiResult(text); setAiTitle('Programa ' + new Date().toLocaleDateString());
    } catch (err) { alert(`Error: ${err.message}`); setShowAiPanel(false); }
    setIsDigitalizing(false);
  };

  const saveAiProgram = async () => {
    if (!aiResult || !aiTitle.trim()) return;
    setActionLoading('ai-save');
    const { error } = await supabase.from('programs').insert([{
      title: aiTitle.trim(), content: aiResult, author_id: user?.id, is_digitized: true
    }]);
    if (!error) {
      await supabase.from('announcements').insert([{
        title: 'Nuevo Programa Digitalizado con IA',
        message: `Se digitalizó "${aiTitle.trim()}".`, type: 'program'
      }]);
      setShowAiPanel(false); setAiResult(null); setAiTitle(''); fetchPrograms();
    } else alert(error.message);
    setActionLoading(null);
  };

  const deleteProgram = async (id, authorId) => {
    if (role !== 'admin' && user?.id !== authorId) return;
    if (!confirm('¿Eliminar este programa?')) return;
    setActionLoading(id);
    await supabase.from('programs').delete().eq('id', id);
    fetchPrograms(); setActionLoading(null);
  };

  const filtered = programs.filter(p => {
    const s = search.toLowerCase();
    const match = p.title?.toLowerCase().includes(s) || p.content?.toLowerCase().includes(s) || p.event_name?.toLowerCase().includes(s);
    const f = filter === 'all' || (filter === 'digitized' && p.is_digitized) || (filter === 'manual' && !p.is_digitized);
    return match && f;
  });

  return (
    <div className="animate">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.4rem' }}>
            <div style={{ padding: '10px', background: 'rgba(155,125,224,0.1)', borderRadius: '12px' }}>
              <FileText size={24} color="var(--purple)" />
            </div>
            <h1 className="serif" style={{ fontSize: '3rem', fontWeight: 800 }}>Programas</h1>
          </div>
          <p>{programs.length} programa{programs.length !== 1 ? 's' : ''} en el archivo</p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <label className="btn-ghost" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> Digitalizar con IA
            <input type="file" hidden onChange={handleFileUpload} accept="image/*,application/pdf,.docx,.doc" />
          </label>
          <button className={showAddForm ? 'btn-ghost' : 'btn-primary'} onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? <><X size={16} /> Cerrar</> : <><Plus size={16} /> Añadir</>}
          </button>
        </div>
      </header>

      {/* AI Panel */}
      {showAiPanel && (
        <div className="glass-heavy animate-fast" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 className="serif" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.5rem' }}>
              <Sparkles size={20} color="var(--purple)" /> Digitalización con IA
            </h3>
            <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={() => setShowAiPanel(false)}><X size={18} /></button>
          </div>
          {isDigitalizing ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={40} color="var(--purple)" style={{ animation: 'spin 1.2s linear infinite', marginBottom: '1rem' }} />
              <p>La IA está leyendo el programa...</p>
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Título</label>
                <input value={aiTitle} onChange={e => setAiTitle(e.target.value)} />
              </div>
              <textarea value={aiResult} onChange={e => setAiResult(e.target.value)} rows={10}
                style={{ width: '100%', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button className="btn-primary" onClick={saveAiProgram} disabled={!!actionLoading}>
                  {actionLoading === 'ai-save' ? 'Guardando...' : 'Guardar en Archivo'}
                </button>
                <button className="btn-ghost" onClick={() => { setShowAiPanel(false); setAiResult(null); }}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-heavy animate-fast" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 className="serif" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Nuevo Programa</h3>
          <form onSubmit={handleAddProgram}>
            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Evento / Iglesia</label>
                <input placeholder="Opcional" value={newEvent} onChange={e => setNewEvent(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Contenido *</label>
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} required rows={10}
                style={{ fontFamily: 'inherit', lineHeight: 1.8 }} />
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button type="submit" className="btn-primary" disabled={!!actionLoading}>
                {actionLoading === 'add' ? 'Guardando...' : 'Guardar Programa'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowAddForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="glass search-bar" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input placeholder="Buscar programas..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tabs-bar" style={{ marginBottom: 0 }}>
          {[['all','Todos'],['digitized','✨ IA'],['manual','✍ Manual']].map(([v,l]) => (
            <button key={v} className={`tab-btn${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="loading"><div className="spinner" /><p>Buscando en el archivo...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass" style={{ padding: '5rem' }}>
          <FileText size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: .2 }} />
          <p>{search ? 'No se encontraron programas.' : 'Aún no hay programas. ¡Añade el primero!'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(prog => (
            <div key={prog.id} className="glass" style={{
              overflow: 'hidden',
              borderLeft: expanded === prog.id ? '3px solid var(--purple)' : '3px solid transparent',
              transition: 'var(--transition)'
            }}>
              <div style={{ padding: '1.4rem 1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => editingId !== prog.id && setExpanded(expanded === prog.id ? null : prog.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === prog.id ? (
                    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.5rem' }}>
                      <input value={editData.title} onChange={e => setEditData(d => ({...d, title: e.target.value}))}
                        onClick={e => e.stopPropagation()} style={{ fontWeight: 700 }} />
                      <input value={editData.event_name} placeholder="Evento..."
                        onChange={e => setEditData(d => ({...d, event_name: e.target.value}))}
                        onClick={e => e.stopPropagation()} />
                    </div>
                  ) : (
                    <h3 className="serif" style={{ fontSize: '1.35rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>{prog.title}</h3>
                  )}
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    {prog.is_digitized && <span className="badge badge-gold"><Sparkles size={9} /> IA</span>}
                    {prog.event_name && <span className="badge badge-purple">📍 {prog.event_name}</span>}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(prog.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    {prog.content && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>· {prog.content.split(' ').length} palabras</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, marginLeft: '1rem' }} onClick={e => e.stopPropagation()}>
                  {editingId === prog.id ? (
                    <>
                      <button className="btn-primary" style={{ padding: '0.45rem 0.8rem' }} onClick={() => saveEdit(prog.id)} disabled={!!actionLoading}><Check size={15} /></button>
                      <button className="btn-ghost" style={{ padding: '0.45rem 0.8rem' }} onClick={() => setEditingId(null)}><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      {(role === 'admin' || user?.id === prog.author_id) && (
                        <>
                          <button className="btn-ghost" style={{ padding: '0.45rem 0.7rem' }} onClick={() => startEdit(prog)}><Pencil size={14} /></button>
                          <button className="btn-danger" style={{ padding: '0.45rem 0.7rem' }}
                            onClick={() => deleteProgram(prog.id, prog.author_id)} disabled={actionLoading === prog.id}><Trash2 size={14} /></button>
                        </>
                      )}
                      {expanded === prog.id ? <ChevronUp size={18} color="var(--purple)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </>
                  )}
                </div>
              </div>
              {expanded === prog.id && (
                <div style={{ padding: '0 1.8rem 1.8rem', borderTop: '1px solid var(--border)' }}>
                  {editingId === prog.id ? (
                    <textarea value={editData.content} onChange={e => setEditData(d => ({...d, content: e.target.value}))}
                      rows={12} style={{ width: '100%', marginTop: '1.2rem', lineHeight: 1.8 }} />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, fontSize: '1rem',
                      color: 'var(--text-main)', maxWidth: '80ch', marginTop: '1.5rem' }}>
                      {prog.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Programs;
