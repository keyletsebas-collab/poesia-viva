import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('user'); // 'user' or 'admin'
  const [status, setStatus] = useState('active'); // 'active' or 'inactive'

  useEffect(() => {
    let mounted = true;

    // Safety timeout — never leave the user on a blank screen
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth timeout: forcing loading = false (Supabase session is slow)');
        setLoading(false);
      }
    }, 8000);

    // Check active sessions and sets the user
    supabase.auth.getSession().then((response) => {
      if (!mounted) return;
      
      const session = response?.data?.session ?? null;
      const user = session?.user ?? null;
      
      setUser(user);
      if (user) {
        ensureProfile(user);
        fetchUserRoleAndStatus(user.id);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Session error:', err);
      if (mounted) setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        await ensureProfile(user);
        await fetchUserRoleAndStatus(user.id);
      } else {
        setRole('user');
        setStatus('active');
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  const ensureProfile = async (user) => {
    try {
      // Check if profile exists
      const { data } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      if (!data) {
        // Create profile
        await supabase.from('profiles').insert([{
          id: user.id,
          username: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: 'user',
          status: 'active'
        }]);
      }
    } catch (err) {
      console.error('Error ensuring profile:', err);
    }
  };

  const fetchUserRoleAndStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', userId)
        .single();
      
      if (data) {
        if (data.status === 'inactive') {
          // If deactivated, force sign out immediately
          await supabase.auth.signOut();
          setUser(null);
          setRole('user');
          setStatus('inactive');
          alert('Tu cuenta ha sido inhabilitada por un administrador.');
          return;
        }
        setRole(data.role);
        setStatus(data.status || 'active');
      }
    } catch (err) {
      console.error('Error fetching role and status:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, status, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
