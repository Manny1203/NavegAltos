-- ==============================================================================
-- FASE 2: REMEDIACIÓN DE SEGURIDAD (ETAPAS 3 Y 4 + CORRECCIÓN DEFINITIVA DE PROFILES)
-- 1. Cierre total de PII en public.profiles (limpieza dinámica de políticas heredadas)
-- 2. Blindaje de reportes de errores en public.system_bugs (Etapa 3)
-- 3. Blindaje de denuncias de pines en public.pin_reports (Etapa 4)
-- 4. Blindaje contra enumeración anónima en public.admin_users
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. FUNCIÓN AUXILIAR: is_admin()
-- Verifica de forma segura y centralizada si el usuario actual es administrador
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;


-- ------------------------------------------------------------------------------
-- 1. TABLA: public.profiles (Eliminación forzada de cualquier política pública heredada)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- Política definitiva: Cada usuario SOLO puede consultar su propio perfil
CREATE POLICY "Usuarios solo leen su propio perfil"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política de actualización: Cada usuario solo puede modificar su propio perfil
CREATE POLICY "Usuarios solo actualizan su propio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- ------------------------------------------------------------------------------
-- 2. TABLA: public.system_bugs (Etapa 3: Fuga de bugs y correos institucionales)
-- ------------------------------------------------------------------------------
ALTER TABLE public.system_bugs ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_bugs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.system_bugs';
    END LOOP;
END $$;

-- Lectura: Únicamente los administradores pueden ver la lista de fallos del sistema
CREATE POLICY "Solo administradores leen fallos del sistema"
ON public.system_bugs FOR SELECT
TO authenticated
USING (public.is_admin());

-- Inserción: Cualquier usuario con sesión iniciada puede reportar un error
CREATE POLICY "Usuarios autenticados envian reportes de fallos"
ON public.system_bugs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Actualización: Solo administradores pueden resolver o cambiar estado de fallos
CREATE POLICY "Solo administradores actualizan estado de fallos"
ON public.system_bugs FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ------------------------------------------------------------------------------
-- 3. TABLA: public.pin_reports (Etapa 4: Fuga de denuncias y reporter_ids)
-- ------------------------------------------------------------------------------
ALTER TABLE public.pin_reports ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pin_reports') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.pin_reports';
    END LOOP;
END $$;

-- Lectura: Únicamente los administradores pueden consultar las denuncias de pines
CREATE POLICY "Solo administradores leen denuncias de pines"
ON public.pin_reports FOR SELECT
TO authenticated
USING (public.is_admin());

-- Inserción: Cualquier usuario con sesión iniciada puede denunciar un pin
CREATE POLICY "Usuarios autenticados denuncian pines"
ON public.pin_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Actualización: Solo administradores pueden cambiar estado de denuncias (e.g. dismissed/resolved)
CREATE POLICY "Solo administradores actualizan denuncias"
ON public.pin_reports FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ------------------------------------------------------------------------------
-- 4. TABLA: public.admin_users (Blindaje contra enumeración anónima de administradores)
-- ------------------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.admin_users';
    END LOOP;
END $$;

-- Lectura: Solo usuarios con sesión activa (bloquea completamente a visitantes anónimos)
CREATE POLICY "Solo usuarios autenticados consultan lista de administradores"
ON public.admin_users FOR SELECT
TO authenticated
USING (true);
