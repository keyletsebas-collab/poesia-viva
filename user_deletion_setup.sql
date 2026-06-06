-- =====================================================================
-- FUNCIONES PARA GESTIÓN ANÓNIMA Y DIRECTA DE USUARIOS (RPC DE SUPABASE)
-- =====================================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase.
-- Dado que la landing no requerirá iniciar sesión con usuario y contraseña,
-- estas funciones se ejecutan con privilegios de administrador del sistema (SECURITY DEFINER)
-- para poder modificar auth.users y public.profiles de forma directa.

-- 1. Redefinir la función para eliminar usuarios sin validación de sesión
CREATE OR REPLACE FUNCTION delete_user_by_admin(user_to_delete UUID)
RETURNS void AS $$
BEGIN
  -- Eliminar al usuario de la tabla del sistema auth.users.
  -- ON DELETE CASCADE se encargará de borrar su perfil en public.profiles y datos asociados.
  DELETE FROM auth.users WHERE id = user_to_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_user_by_admin(UUID) IS 'Elimina permanentemente a un usuario de auth.users sin validar sesión actual.';


-- 2. Crear una función para actualizar rol y estado de usuarios de forma directa
CREATE OR REPLACE FUNCTION update_profile_by_admin(user_to_update UUID, new_role TEXT, new_status TEXT)
RETURNS void AS $$
BEGIN
  -- Actualizar el rol y estado en la tabla pública profiles
  UPDATE public.profiles
  SET role = new_role, 
      status = new_status, 
      updated_at = timezone('utc'::text, now())
  WHERE id = user_to_update;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_profile_by_admin(UUID, TEXT, TEXT) IS 'Actualiza el rol y estado de un miembro en la tabla profiles sin validar sesión actual.';
