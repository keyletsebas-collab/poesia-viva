import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ── Safety timeout: si Supabase no responde en 8s, liberar loading ────
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('[Verbo Eterno] ⚠️ Timeout al conectar con Supabase. Redirigiendo al login.');
        setLoading(false);
      }
    }, 8000);

    // ── 1. Load session once on mount ─────────────────────────────────────
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      clearTimeout(timeoutId);
      if (error) {
        console.error('[Verbo Eterno] Error al obtener sesión:', error.message);
        setLoading(false);
        return;
      }
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadProfile(u, mounted);
      setLoading(false);
    }).catch((err) => {
      if (!mounted) return;
      clearTimeout(timeoutId);
      console.error('[Verbo Eterno] Error crítico al obtener sesión:', err);
      setLoading(false);
    });

    // ── 2. React to sign-in / sign-out ────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await loadProfile(u, mounted);
        } else {
          setRole('user');
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // ── Realtime: watch own profile for role / status changes ─────────────
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const channel = supabase
      .channel(`profile-watch-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        async (payload) => {
          if (!mounted) return;
          const { new: updated } = payload;

          // Admin desactivó la cuenta → forzar logout
          if (updated.status === 'inactive') {
            await supabase.auth.signOut();
            setUser(null);
            setRole('user');
            alert('Tu cuenta ha sido inhabilitada por un administrador.');
            return;
          }

          // Rol cambiado → actualizar contexto sin recargar
          if (updated.role) setRole(updated.role);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ── Load / auto-create profile, then read role ─────────────────────────
  const loadProfile = async (u, mounted) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', u.id)
        .maybeSingle();

      // Auto-create if doesn't exist yet
      if (!data && !error) {
        const { data: created } = await supabase
          .from('profiles')
          .insert([{
            id: u.id,
            username: u.email,
            full_name: u.user_metadata?.full_name || u.email?.split('@')[0],
            role: 'user',
            status: 'active'
          }])
          .select('role, status')
          .single();
        data = created;
      }

      if (!mounted) return;

      if (data?.status === 'inactive') {
        await supabase.auth.signOut();
        setUser(null);
        setRole('user');
        alert('Tu cuenta ha sido inhabilitada por un administrador.');
        return;
      }

      if (data?.role) setRole(data.role);
    } catch (err) {
      console.error('Profile load error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
