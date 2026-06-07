import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Telemetría de conexión ────────────────────────────────────────────────
console.log(
  '%c[Verbo Eterno] 🔍 Iniciando conexión con la base de datos...',
  'color:#d4af37; font-weight:600; font-family:monospace;'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verifica la conexión con un ping ligero
supabase.from('profiles').select('count', { count: 'exact', head: true }).then(({ error }) => {
  if (error) {
    console.error(
      '%c[Verbo Eterno] ❌ Error al conectar con la base de datos:',
      'color:#ef4444; font-weight:600; font-family:monospace;',
      error.message
    );
  } else {
    console.log(
      '%c[Verbo Eterno] ✅ Base de datos conectada correctamente.',
      'color:#4ade80; font-weight:700; font-family:monospace;'
    );
  }
});
