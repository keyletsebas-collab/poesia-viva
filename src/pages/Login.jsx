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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsRecovery(false);
      }
    }).catch(err => {
      console.error('Session Error:', err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isRecovery) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setMessage('Contraseña actualizada con éxito. Ya puedes iniciar sesión.');
        setIsRecovery(false);
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
        setMessage('Revisa tu correo para confirmar tu cuenta.');
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
        setMessage('Acceso denegado (403). Asegúrate de que el correo existe y está confirmado, o espera unos minutos.');
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
      minHeight: '80vh'
    }}>
      <div className="glass login-card animate" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '3rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'inline-flex', 
          padding: '12px', 
          background: 'var(--accent)', 
          borderRadius: '16px', 
          marginBottom: '1.5rem',
          color: '#000'
        }}>
          <PenTool size={32} />
        </div>
        
        <h2 className="serif" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {isRecovery ? 'Nueva Contraseña' : isSignUp ? 'Únete al Gupo' : 'Bienvenido'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {isRecovery ? 'Elige una contraseña segura' : isSignUp ? 'Comienza tu viaje poético con nosotros' : 'Entra para ver las últimas poesías'}
        </p>

        <form onSubmit={handleAuth}>
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
                <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                  <button 
                    type="button" 
                    className="btn-link" 
                    onClick={() => setIsForgotPassword(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', padding: 0 }}
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
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            disabled={loading || cooldown > 0}
          >
            {loading ? 'Procesando...' : (
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
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.8rem', fontSize: '0.85rem' }}
            >
              Volver al inicio de sesión
            </button>
          )}
        </form>

        {message && (
          <div className="glass-heavy" style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            borderColor: message.includes('Revisa') ? '#4ade80' : 'var(--accent)',
            fontSize: '0.9rem' 
          }}>
            <p style={{ color: message.includes('Revisa') ? '#4ade80' : 'var(--accent)' }}>
              {message}
            </p>
            {message.includes('Revisa') && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Nota: Si no recibes el correo, comprueba tu carpeta de Spam o contacta al administrador.
              </p>
            )}
          </div>
        )}

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="btn-ghost"
            style={{ fontSize: '0.9rem' }}
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
