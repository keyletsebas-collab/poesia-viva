import { createClient } from '@supabase/supabase-js';

// Credenciales en Base64
const _a = atob('aHR0cHM6Ly9iaWVucmV6aWZsc2pwbXNra2t1ZC5zdXBhYmFzZS5jbw==');
const _b = atob('c2JfcHVibGlzaGFibGVfZmZBZk1VLW9XQzRNdFRzaERacUZGZ19KSjZYUkgtbA==');

// ── Telemetría de conexión ────────────────────────────────────────────────
console.log(
  '%c[Verbo Eterno] 🔍 Iniciando conexión con la base de datos...',
  'color:#d4af37; font-weight:600; font-family:monospace;'
);

export const supabase = createClient(_a, _b);

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
