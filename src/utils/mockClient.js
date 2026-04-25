/**
 * Mock Supabase Client – Local Development
 * 
 * NOTA: Este mock usa localStorage (datos por-navegador).
 * Para datos compartidos entre usuarios, configura Supabase real en .env
 */

const STORAGE_KEY = 'poetry_club_mock_db_v2'; // v2 = limpia datos corruptos anteriores
const authListeners = new Set();

const EMPTY_DB = () => ({
  profiles: [],
  events: [],
  places: [],
  event_participants: [],
  announcements: [],
  rehearsals: [],
  poetries: []
});

const getDb = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DB();
    const db = JSON.parse(raw);
    // Garantizar que todas las tablas existen
    const empty = EMPTY_DB();
    for (const key of Object.keys(empty)) {
      if (!Array.isArray(db[key])) db[key] = [];
    }
    return db;
  } catch {
    return EMPTY_DB();
  }
};

const saveDb = (db) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* quota */ }
};

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// Seed admin
const initDb = () => {
  const db = getDb();
  if (!db.profiles.some(p => p.username === 'admin@poesia.com')) {
    db.profiles.push({
      id: 'mock-admin-id',
      username: 'admin@poesia.com',
      full_name: 'Administrador Local',
      role: 'admin',
      status: 'active',
      updated_at: new Date().toISOString()
    });
    saveDb(db);
  }
};

initDb();

const notifyAuth = (event, session) => authListeners.forEach(cb => cb(event, session));

// ─── Operación genérica ────────────────────────────────────────
const execAsync = (fn) =>
  new Promise((resolve) => {
    setTimeout(() => {
      try { resolve(fn()); }
      catch (e) { resolve({ data: null, error: { message: String(e?.message || e) } }); }
    }, 80);
  });

// ─── MockQuery ────────────────────────────────────────────────
class MockQuery {
  constructor(table) {
    this.table = table;
    this._rows = [...(getDb()[table] || [])]; // snapshot inicial
    this._join = null;
    this._insert = null;
    this._update = null;
    this._delete = false;
  }

  // Filtros encadenables
  select(q = '*') {
    if (typeof q === 'string' && q.includes('(*)')) {
      const m = q.match(/(\w+)\s*\(\*\)/);
      if (m) this._join = m[1];
    }
    return this;
  }
  eq(col, val) { this._rows = this._rows.filter(r => String(r[col]) === String(val)); return this; }
  gte(col, val) { this._rows = this._rows.filter(r => r[col] >= val); return this; }
  order(col, { ascending = true } = {}) {
    this._rows.sort((a, b) => {
      if (a[col] < b[col]) return ascending ? -1 : 1;
      if (a[col] > b[col]) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }
  limit(n) { this._rows = this._rows.slice(0, n); return this; }

  single() {
    const item = this._applyJoin(this._rows)[0] || null;
    return { data: item, error: item ? null : { message: 'Not found' } };
  }

  // Mutaciones – devuelven Promise directamente para evitar problemas con thenable
  insert(items) {
    const arr = Array.isArray(items) ? items : [items];
    return execAsync(() => {
      const db = getDb();
      if (!Array.isArray(db[this.table])) db[this.table] = [];
      const newItems = arr.map(item => ({
        id: genId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item
      }));
      db[this.table].push(...newItems);
      saveDb(db);
      // Devolver objeto con .select() para soporte de encadenamiento
      return Object.assign({ data: newItems, error: null }, {
        select: () => Promise.resolve({ data: newItems, error: null })
      });
    });
  }

  update(updates) {
    const ids = this._rows.map(r => r.id);
    return execAsync(() => {
      const db = getDb();
      db[this.table] = db[this.table].map(r =>
        ids.includes(r.id) ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
      );
      saveDb(db);
      return { data: null, error: null };
    });
  }

  delete() {
    const ids = this._rows.map(r => r.id);
    return execAsync(() => {
      const db = getDb();
      db[this.table] = db[this.table].filter(r => !ids.includes(r.id));
      saveDb(db);
      return { data: null, error: null };
    });
  }

  // Para lecturas: await supabase.from('x').select().order()...
  then(onFulfilled, onRejected) {
    return execAsync(() => {
      return { data: this._applyJoin(this._rows), error: null };
    }).then(onFulfilled, onRejected);
  }

  _applyJoin(rows) {
    if (!this._join) return rows;
    const db = getDb();
    const joinTable = db[this._join] || [];
    const fk = this._join === 'profiles' ? 'profile_id' : `${this._join.replace(/s$/, '')}_id`;
    return rows.map(row => ({
      ...row,
      [this._join]: joinTable.find(r => r.id === row[fk]) || null
    }));
  }
}

// ─── Auth ─────────────────────────────────────────────────────
export const mockClient = {
  auth: {
    async getSession() {
      try {
        const user = JSON.parse(localStorage.getItem('mock_user') || 'null');
        return { data: { session: user ? { user } : null }, error: null };
      } catch { return { data: { session: null }, error: null }; }
    },

    async signInWithPassword({ email }) {
      const db = getDb();
      const user = db.profiles.find(p => p.username === email);
      if (user) {
        localStorage.setItem('mock_user', JSON.stringify(user));
        const session = { user, access_token: 'mock-token' };
        notifyAuth('SIGNED_IN', session);
        return { data: { user, session }, error: null };
      }
      return { data: { user: null }, error: { message: 'Usuario no encontrado. Regístrate primero.' } };
    },

    async signUp({ email, options }) {
      const db = getDb();
      if (db.profiles.find(p => p.username === email)) {
        return { data: { user: null }, error: { message: 'Email ya registrado.' } };
      }
      const newUser = {
        id: genId(), username: email,
        full_name: options?.data?.full_name || 'Nuevo Poeta',
        role: 'user', status: 'active',
        updated_at: new Date().toISOString()
      };
      db.profiles.push(newUser);
      saveDb(db);
      localStorage.setItem('mock_user', JSON.stringify(newUser));
      const session = { user: newUser, access_token: 'mock-token' };
      notifyAuth('SIGNED_IN', session);
      return { data: { user: newUser, session }, error: null };
    },

    async signOut() {
      localStorage.removeItem('mock_user');
      notifyAuth('SIGNED_OUT', null);
      return { error: null };
    },

    onAuthStateChange(callback) {
      authListeners.add(callback);
      this.getSession().then(({ data: { session } }) => callback('INITIAL_SESSION', session));
      return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
    }
  },

  from(table) { return new MockQuery(table); }
};
