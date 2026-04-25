# Guía de Configuración - App de Poesía

Esta aplicación utiliza **Supabase** como base de datos gratuita y sistema de autenticación. Sigue estos pasos para ponerla en marcha:

### 1. Crear un proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com/) y crea una cuenta gratuita.
2. Crea un nuevo proyecto (ponle el nombre que quieras).

### 2. Configurar la Base de Datos
1. En tu panel de Supabase, ve a **SQL Editor**.
2. Haz clic en **New Query**.
3. Copia y pega el contenido del archivo `supabase_setup.sql` (que he creado en la carpeta raíz del proyecto).
4. Haz clic en **Run**. Esto creará todas las tablas y permisos necesarios.

### 3. Configurar las Variables de Entorno
1. En Supabase, ve a **Project Settings** > **API**.
2. Copia la **Project URL** y la **anon public key**.
3. Crea un archivo llamado `.env` en la raíz de este proyecto y pega lo siguiente:
   ```env
   VITE_SUPABASE_URL=tu_url_aqui
   VITE_SUPABASE_ANON_KEY=tu_key_anon_aqui
   ```

### 4. Cómo ser Administrador
Para poder añadir eventos, lugares y dar admin a otros:
1. Regístrate en la app normalmente.
2. Ve a tu panel de Supabase > **Table Editor** > tabla `profiles`.
3. Busca tu usuario y cambia la columna `role` de `'user'` a `'admin'`.
4. ¡Listo! Ahora verás las opciones de administración en la app.

### 5. Ejecutar la App
Corre los siguientes comandos en tu terminal:
```bash
npm install
npm run dev
```
