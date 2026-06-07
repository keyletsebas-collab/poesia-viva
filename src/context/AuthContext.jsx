import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ── 1. Load session once on mount ─────────────────────────────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadProfile(u, mounted);
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
      subscription.unsubscribe();
    };
  }, []);

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
