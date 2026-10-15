-- ==============================================================================
-- SCRIPT DE ENDURECIMIENTO Y SEGURIDAD RLS PARA NAVEGALTOS
-- Ejecutar en el SQL Editor de Supabase (Dashboard > SQL Editor)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA: public.profiles
-- Vulnerabilidad cerrada: Fuga masiva de nombres y fotos de perfil de usuarios.
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow select for all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;

-- Solo usuarios con sesión activa pueden consultar perfiles de la comunidad
CREATE POLICY "Lectura de perfiles para usuarios autenticados"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Cada usuario solo puede editar su propio perfil
CREATE POLICY "Usuarios actualizan solo su propio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- ------------------------------------------------------------------------------
-- 2. TABLA: public.admin_users
-- Vulnerabilidad cerrada: Enumeración y descubrimiento de cuentas administradoras.
-- ------------------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow all admin_users" ON public.admin_users;

-- Cada usuario únicamente puede verificar si su propio ID es administrador
CREATE POLICY "Verificacion de rol de administrador propio"
ON public.admin_users FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- ------------------------------------------------------------------------------
-- 3. TABLA: public.system_bugs
-- Vulnerabilidad cerrada: Exposición pública de correos institucionales y fallos.
-- ------------------------------------------------------------------------------
ALTER TABLE public.system_bugs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read system_bugs" ON public.system_bugs;
DROP POLICY IF EXISTS "Allow all select system_bugs" ON public.system_bugs;
DROP POLICY IF EXISTS "Users can insert bugs" ON public.system_bugs;

-- Solo administradores pueden leer el listado de fallos
CREATE POLICY "Solo administradores leen fallos del sistema"
ON public.system_bugs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Cualquier usuario autenticado puede enviar un nuevo reporte de fallo
CREATE POLICY "Usuarios autenticados envian reportes de fallos"
ON public.system_bugs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- ------------------------------------------------------------------------------
-- 4. TABLA: public.pin_reports
-- Vulnerabilidad cerrada: Espionaje anónimo de denuncias y reporter_ids.
-- ------------------------------------------------------------------------------
ALTER TABLE public.pin_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read pin_reports" ON public.pin_reports;
DROP POLICY IF EXISTS "Allow all select pin_reports" ON public.pin_reports;
DROP POLICY IF EXISTS "Users can insert reports" ON public.pin_reports;

-- Solo administradores pueden leer las denuncias
CREATE POLICY "Solo administradores leen denuncias de pines"
ON public.pin_reports FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Cualquier usuario autenticado puede enviar una denuncia
CREATE POLICY "Usuarios autenticados envian denuncias de pines"
ON public.pin_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);


-- ------------------------------------------------------------------------------
-- 5. TABLA: public.shared_pins
-- Vulnerabilidad cerrada: Scrape masivo de pines privados compartidos.
-- ------------------------------------------------------------------------------
ALTER TABLE public.shared_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede leer pines compartidos" ON public.shared_pins;

-- Requiere que el usuario esté autenticado para visualizar enlaces compartidos
CREATE POLICY "Lectura de pines compartidos para usuarios autenticados"
ON public.shared_pins FOR SELECT
TO authenticated
USING (true);
