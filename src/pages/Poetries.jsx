import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, Sparkles, Trash2, Plus, ChevronDown, ChevronUp, Upload, Loader2, Pencil, Check, X } from 'lucide-react';
import { digitalizePoetry } from '../utils/GeminiService';

const Poetries = () => {
  const { user, role } = useAuth();
  const [poetries, setPoetries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', content: '' });

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  const [isDigitalizing, setIsDigitalizing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiTitle, setAiTitle] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => { fetchPoetries(); }, []);

  const fetchPoetries = async () => {
    setLoading(true);
    const { data } = await supabase.from('poetries').select('*').order('created_at', { ascending: false });
    if (data) setPoetries(data);
    setLoading(false);
  };

  const handleAddPoetry = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setActionLoading('add');
    const { error } = await supabase.from('poetries').insert([{
      title: newTitle.trim(), content: newContent.trim(), author_id: user?.id, is_digitized: false
    }]);
    if (!error) {
      await supabase.from('announcements').insert([{
        title: 'Nueva Poesía Añadida',
        message: `Se añadió "${newTitle.trim()}"${newAuthor ? ` de ${newAuthor}` : ''}.`,
        type: 'poetry'
      }]);
      setNewTitle(''); setNewContent(''); setNewAuthor('');
      setShowAddForm(false); fetchPoetries();
    } else alert(error.message);
    setActionLoading(null);
  };

  const startEdit = (poem) => {
    setEditingId(poem.id);
    setEditData({ title: poem.title, content: poem.content || '' });
    setExpanded(poem.id);
  };

  const saveEdit = async (id) => {
    setActionLoading(id);
    const { error } = await supabase.from('poetries').update({
      title: editData.title, content: editData.content
    }).eq('id', id);
    if (!error) { setEditingId(null); fetchPoetries(); }
    else alert(error.message);
    setActionLoading(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsDigitalizing(true); setShowAiPanel(true); setAiResult(null);
    try {
      const text = await digitalizePoetry(file);
      setAiResult(text); setAiTitle('Poesía Digitalizada ' + new Date().toLocaleDateString());
    } catch (err) { alert(`Error: ${err.message}`); setShowAiPanel(false); }
    setIsDigitalizing(false);
  };

  const saveAiPoetry = async () => {
    if (!aiResult || !aiTitle.trim()) return;
    setActionLoading('ai-save');
    const { error } = await supabase.from('poetries').insert([{
      title: aiTitle.trim(), content: aiResult, author_id: user?.id, is_digitized: true
    }]);
    if (!error) {
      await supabase.from('announcements').insert([{
        title: 'Nueva Poesía Digitalizada con IA',
        message: `Se digitalizó "${aiTitle.trim()}".`, type: 'poetry'
      }]);
      setShowAiPanel(false); setAiResult(null); setAiTitle(''); fetchPoetries();
    } else alert(error.message);
    setActionLoading(null);
  };

  const deletePoetry = async (id, authorId) => {
    if (role !== 'admin' && user?.id !== authorId) return;
    if (!confirm('¿Eliminar esta poesía?')) return;
    setActionLoading(id);
    await supabase.from('poetries').delete().eq('id', id);
    fetchPoetries(); setActionLoading(null);
  };

  const filtered = poetries.filter(p => {
    const s = search.toLowerCase();
    const match = p.title?.toLowerCase().includes(s) || p.content?.toLowerCase().includes(s);
    const f = filter === 'all' || (filter === 'digitized' && p.is_digitized) || (filter === 'manual' && !p.is_digitized);
    return match && f;
  });

  return (
    <div className="animate">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.4rem' }}>
            <div style={{ padding: '10px', background: 'var(--accent-bg)', borderRadius: '12px' }}>
              <BookOpen size={24} color="var(--accent)" />
            </div>
            <h1 className="serif" style={{ fontSize: '3rem', fontWeight: 800 }}>Biblioteca</h1>
          </div>
          <p>{poetries.length} poema{poetries.length !== 1 ? 's' : ''} en la colección</p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <label className="btn-ghost" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> Digitalizar con IA
            <input type="file" hidden onChange={handleFileUpload}
              accept="image/*,application/pdf,.docx,.doc" />
          </label>
          <button className={showAddForm ? 'btn-ghost' : 'btn-primary'} onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? <><X size={16} /> Cerrar</> : <><Plus size={16} /> Añadir</>}
          </button>
        </div>
      </header>

      {/* AI Panel */}
      {showAiPanel && (
        <div className="glass-heavy animate-fast" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 className="serif" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.5rem' }}>
              <Sparkles size={20} color="var(--accent)" /> Digitalización con IA
            </h3>
            <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={() => setShowAiPanel(false)}><X size={18} /></button>
          </div>
          {isDigitalizing ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={40} color="var(--accent)" style={{ animation: 'spin 1.2s linear infinite', marginBottom: '1rem' }} />
              <p>La IA está leyendo tus versos...</p>
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Título</label>
                <input value={aiTitle} onChange={e => setAiTitle(e.target.value)} />
              </div>
              <textarea value={aiResult} onChange={e => setAiResult(e.target.value)} rows={10}
                style={{ width: '100%', marginBottom: '1rem', fontFamily: 'Georgia, serif', lineHeight: 1.8 }} />
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button className="btn-primary" onClick={saveAiPoetry} disabled={!!actionLoading}>
                  {actionLoading === 'ai-save' ? 'Guardando...' : 'Guardar en Colección'}
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
          <h3 className="serif" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Nueva Poesía</h3>
          <form onSubmit={handleAddPoetry}>
            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Autor (opcional)</label>
                <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Texto *</label>
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} required rows={10}
                style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', lineHeight: 1.8 }} />
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button type="submit" className="btn-primary" disabled={!!actionLoading}>
                {actionLoading === 'add' ? 'Guardando...' : 'Guardar Poesía'}
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
          <input placeholder="Buscar poesías..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tabs-bar" style={{ marginBottom: 0 }}>
          {[['all','Todas'],['digitized','✨ IA'],['manual','✍ Manual']].map(([v,l]) => (
            <button key={v} className={`tab-btn${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="loading"><div className="spinner" /><p>Invocando a las musas...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass" style={{ padding: '5rem' }}>
          <BookOpen size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: .2 }} />
          <p>{search ? 'No se encontraron poesías.' : 'Aún no hay poesías. ¡Sé el primero!'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(poem => (
            <div key={poem.id} className="glass" style={{
              overflow: 'hidden',
              borderLeft: expanded === poem.id ? '3px solid var(--accent)' : '3px solid transparent',
              transition: 'var(--transition)'
            }}>
              {/* Header row */}
              <div style={{ padding: '1.4rem 1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => editingId !== poem.id && setExpanded(expanded === poem.id ? null : poem.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === poem.id ? (
                    <input value={editData.title} onChange={e => setEditData(d => ({...d, title: e.target.value}))}
                      onClick={e => e.stopPropagation()} style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0' }} />
                  ) : (
                    <h3 className="serif" style={{ fontSize: '1.35rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>{poem.title}</h3>
                  )}
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    {poem.is_digitized && <span className="badge badge-gold"><Sparkles size={9} /> IA</span>}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(poem.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    {poem.content && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>· {poem.content.split(' ').length} palabras</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, marginLeft: '1rem' }} onClick={e => e.stopPropagation()}>
                  {editingId === poem.id ? (
                    <>
                      <button className="btn-primary" style={{ padding: '0.45rem 0.8rem' }} onClick={() => saveEdit(poem.id)} disabled={!!actionLoading}>
                        <Check size={15} />
                      </button>
                      <button className="btn-ghost" style={{ padding: '0.45rem 0.8rem' }} onClick={() => setEditingId(null)}><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      {(role === 'admin' || user?.id === poem.author_id) && (
                        <>
                          <button className="btn-ghost" style={{ padding: '0.45rem 0.7rem' }} onClick={() => startEdit(poem)}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn-danger" style={{ padding: '0.45rem 0.7rem' }}
                            onClick={() => deletePoetry(poem.id, poem.author_id)} disabled={actionLoading === poem.id}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      {expanded === poem.id ? <ChevronUp size={18} color="var(--accent)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {expanded === poem.id && (
                <div style={{ padding: '0 1.8rem 1.8rem', borderTop: '1px solid var(--border)' }}>
                  {editingId === poem.id ? (
                    <textarea value={editData.content} onChange={e => setEditData(d => ({...d, content: e.target.value}))}
                      rows={15} style={{ width: '100%', marginTop: '1.2rem', fontFamily: 'Georgia, serif', fontSize: '1.05rem', lineHeight: 1.9 }} />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2, fontSize: '1.1rem',
                      fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-main)',
                      maxWidth: '72ch', marginTop: '1.5rem', letterSpacing: '0.01em' }}>
                      {poem.content}
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

export default Poetries;
