import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { PenTool, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Check if there are errors in the URL (like expired links)
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error_description') || params.get('error');
    if (errorMsg) {
      if (errorMsg.includes('expired')) {
        setMessage('El enlace ha expirado. Por favor, solicita uno nuevo.');
      } else {
        setMessage(`Error: ${errorMsg}`);
      }
    }

    const checkRecovery = async () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('access_token=')) {
        setIsRecovery(true);
      }
    };
    checkRecovery();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setIsForgotPassword(false);
        setIsSignUp(false);
      }
      
      // If user is logged in and not in recovery, they shouldn't be here (App.jsx handles redirect, but good to have)
      if (event === 'SIGNED_IN' && !isRecovery) {
        // Normal login redirect is handled by App.jsx
      }
    });
    return () => subscription?.unsubscribe();
  }, [isRecovery]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isRecovery) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setMessage('¡Contraseña actualizada con éxito! Entrando...');
        setIsRecovery(false);
        // Clear recovery hash from URL to allow App.jsx redirect to dashboard
        window.history.replaceState(null, '', window.location.pathname);
        setTimeout(() => window.location.href = '/', 1500);
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        setMessage('Se ha enviado un enlace de recuperación a tu correo.');
        setCooldown(60); // 60 seconds cooldown
        const timer = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        setMessage('¡Cuenta creada con éxito! Ya puedes iniciar sesión con tus datos.');
        setIsSignUp(false);
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Auth Error Details:', error);
      if (error.status === 403 || error.code === '403' || error.message?.includes('403')) {
        setMessage('Acceso denegado (403). Asegúrate de que tus datos sean correctos o que la cuenta esté activa.');
      } else {
        setMessage(error.message || 'Ocurrió un error inesperado.');
      }
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

      <div className="glass login-card animate-fade" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '4rem 3.5rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)'
      }}>
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
          {isRecovery ? 'Nueva Contraseña' : isSignUp ? 'Únete al Grupo' : 'Verbo Eterno'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
          {isRecovery ? 'Elige una contraseña segura' : isSignUp ? 'Comienza tu viaje poético con nosotros' : 'Donde las palabras cobran vida'}
        </p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isRecovery ? (
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Ingresa tu nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          ) : (
            <>
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

              {!isForgotPassword && (
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {!isSignUp && !isForgotPassword && (
                <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPassword(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.9rem', padding: 0, cursor: 'pointer', fontWeight: 500 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', height: '56px', fontSize: '1.1rem', marginTop: '1rem' }}
            disabled={loading || cooldown > 0}
          >
            {loading ? <span className="spinner-sm" style={{ borderTopColor: '#000' }} /> : (
              isForgotPassword 
                ? (cooldown > 0 ? `Espera ${cooldown}s` : 'Enviar enlace') 
                : isRecovery ? 'Actualizar Contraseña' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'
            )}
          </button>
          
          {(isForgotPassword || isRecovery) && (
            <button 
              type="button" 
              className="btn-ghost" 
              onClick={() => { setIsForgotPassword(false); setIsRecovery(false); }}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', height: '52px' }}
            >
              Volver al inicio de sesión
            </button>
          )}
        </form>

        {message && (
          <div className="glass-heavy animate-fade" style={{ 
            marginTop: '2rem', 
            padding: '1.2rem', 
            borderRadius: '16px',
            borderLeft: `4px solid ${message.includes('Revisa') || message.includes('éxito') ? '#4ade80' : 'var(--accent)'}`,
            textAlign: 'left'
          }}>
            <p style={{ color: message.includes('Revisa') || message.includes('éxito') ? '#4ade80' : 'var(--accent)', fontWeight: 500, fontSize: '0.95rem' }}>
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
