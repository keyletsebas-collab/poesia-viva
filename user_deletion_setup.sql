-- =====================================================================
-- FUNCIÓN PARA ELIMINACIÓN SEGURA DE USUARIOS (RPC DE SUPABASE)
-- =====================================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase.
-- Esta función comprueba que quien la invoque sea administrador antes de
-- proceder a eliminar la cuenta del usuario en auth.users.

CREATE OR REPLACE FUNCTION delete_user_by_admin(user_to_delete UUID)
RETURNS void AS $$
BEGIN
  -- 1. Validar que el usuario autenticado (auth.uid()) sea administrador
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- 2. Eliminar al usuario de la tabla del sistema auth.users.
    -- Las restricciones de llave foránea ON DELETE CASCADE se encargarán
    -- de borrar automáticamente su perfil en public.profiles y datos asociados.
    DELETE FROM auth.users WHERE id = user_to_delete;
  ELSE
    -- 3. Si no es admin, lanzar una excepción
    RAISE EXCEPTION 'Operación no permitida: Solo los administradores de Verbo Eterno pueden eliminar usuarios.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario para documentar la función en la base de datos
COMMENT ON FUNCTION delete_user_by_admin(UUID) IS 'Permite a un administrador de la aplicación borrar usuarios de la tabla auth.users de manera segura.';
