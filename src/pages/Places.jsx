import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { MapPin, Plus, Trash2, Map as MapIcon, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Places = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const { data } = await supabase
        .from('places')
        .select('*')
        .order('name', { ascending: true });
      
      if (data) setPlaces(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Explorando destinos...</div>;

  return (
    <div className="animate">
      <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '4rem', marginBottom: '0.5rem', lineHeight: 1 }}>Destinos Grupales</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '1rem' }}>Lugares que inspiran nuestra poesía o que planeamos visitar.</p>
        </div>
        {role === 'admin' && (
          <button className="btn-primary" onClick={() => navigate('/admin')}>
            <Plus size={20} /> Gestionar Lugares
          </button>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
        {places.length === 0 ? (
          <div className="glass-heavy" style={{ gridColumn: '1/-1', padding: '5rem', textAlign: 'center' }}>
            <Compass size={64} style={{ margin: '0 auto 2rem', color: 'var(--accent)', opacity: 0.5 }} />
            <h3 className="serif" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Horizonte despejado</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Aún no hay lugares registrados en nuestro mapa.</p>
          </div>
        ) : (
          places.map((place, index) => (
            <div key={place.id} className="glass card-hover animate" style={{ padding: '2.5rem', position: 'relative', animationDelay: `${index * 0.1}s` }}>
              <div style={{ 
                padding: '16px', 
                background: 'var(--accent-glow)', 
                borderRadius: '16px', 
                width: 'fit-content', 
                marginBottom: '2rem', 
                color: 'var(--accent)',
                boxShadow: '0 0 15px var(--accent-glow)'
              }}>
                <MapIcon size={28} />
              </div>
              <h3 className="serif" style={{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>{place.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                <MapPin size={18} color="var(--accent)" />
                {place.address || 'Sin dirección especificada'}
              </div>
              {place.notes && (
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.6,
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  borderLeft: '2px solid var(--accent)'
                }}>
                  {place.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        .card-hover {
          transition: var(--transition);
        }
        .card-hover:hover {
          transform: translateY(-8px);
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default Places;
