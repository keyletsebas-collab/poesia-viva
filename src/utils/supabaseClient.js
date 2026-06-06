import { createClient } from '@supabase/supabase-js';

const cleanEnvVar = (val) => {
  if (!val) return '';
  const cleaned = val.replace(/^['"]|['"]$/g, '').trim();
  if (cleaned === 'undefined' || cleaned === 'null') return '';
  return cleaned;
};

const supabaseUrl = cleanEnvVar(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnvVar(import.meta.env.VITE_SUPABASE_ANON_KEY);

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

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

