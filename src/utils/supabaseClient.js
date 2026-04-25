import { createClient } from '@supabase/supabase-js';
import { mockClient } from './mockClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only use mock if vars are missing or explicitly marked as placeholder
const isBrokenUrl = !supabaseUrl || 
                    supabaseUrl.includes('placeholder');

export const isMockMode = isBrokenUrl;

if (isMockMode) {
  console.warn("🚀 Iniciando en MODO LOCAL (Mock). Supabase real no está disponible o la URL es inválida.");
}

export const supabase = isMockMode 
  ? mockClient 
  : createClient(supabaseUrl, supabaseAnonKey);
