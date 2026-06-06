import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error(
    "🚨 ERROR: Las variables de entorno de Supabase no están configuradas correctamente en el archivo .env.\n" +
    "Por favor, define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY."
  );
}

// Fix for Supabase Auth Lock bug: Clear any stuck locks in localStorage
try {
  const storageKey = 'poesia-viva-auth-v5';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('auth-token') || 
      key.includes('lock') || 
      key.startsWith('sb-') ||
      key.includes('poesia-viva-auth')
    )) {
      // If it's a lock key or old session, remove it to prevent stale lock errors
      if (key.includes('lock') || key.includes('v4')) {
        localStorage.removeItem(key);
      }
    }
  }
} catch (e) { /* ignore */ }

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    storageKey: 'poesia-viva-auth-v5', // Incrementing version to force fresh state
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Fix for NavigatorLockAcquireTimeoutError & TypeError: acquire is not a function
    lock: async (name, acquire) => {
      // Some versions pass (name, acquire), others just (acquire)
      const fn = typeof name === 'function' ? name : acquire;
      if (typeof fn === 'function') return await fn();
      return {}; // Return empty object as fallback
    }
  }
});

