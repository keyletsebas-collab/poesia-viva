import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { PenTool } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        
        if (data?.session) {
          setMessage('¡Registro e inicio de sesión exitosos!');
        } else {
          setMessage('¡Registro exitoso! Por favor, verifica tu correo electrónico si la confirmación está activa, o inicia sesión.');
        }
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Auth Error Details:', error);
      setMessage(error.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Elements */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'var(--accent-glow)', filter: 'blur(100px)', borderRadius: '50%', opacity: 0.3 }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'var(--accent-glow)', filter: 'blur(120px)', borderRadius: '50%', opacity: 0.2 }}></div>

      <div className="glass login-card animate-fade">
        <div style={{ 
          display: 'inline-flex', 
          padding: '16px', 
          background: 'var(--accent)', 
          borderRadius: '20px', 
          marginBottom: '2rem',
          color: '#000',
          boxShadow: '0 10px 30px var(--accent-glow)'
        }}>
          <PenTool size={36} />
        </div>
        
        <h2 className="serif" style={{ fontSize: '3rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          {isSignUp ? 'Únete al Grupo' : 'Verbo Eterno'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
          {isSignUp ? 'Comienza tu viaje poético con nosotros' : 'Donde las palabras cobran vida'}
        </p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isSignUp && (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Nombre Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', height: '56px', fontSize: '1.1rem', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? <span className="spinner-sm" style={{ borderTopColor: '#000' }} /> : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        {message && (
          <div className="glass-heavy animate-fade" style={{ 
            marginTop: '2rem', 
            padding: '1.2rem', 
            borderRadius: '16px',
            borderLeft: `4px solid ${message.includes('éxito') ? '#4ade80' : 'var(--accent)'}`,
            textAlign: 'left'
          }}>
            <p style={{ color: message.includes('éxito') ? '#4ade80' : 'var(--accent)', fontWeight: 500, fontSize: '0.95rem' }}>
              {message}
            </p>
          </div>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {isSignUp ? '¿Ya eres parte del grupo?' : '¿Aún no tienes cuenta?'}
          </p>
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', height: '52px' }}
          >
            {isSignUp ? 'Iniciar Sesión' : 'Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
