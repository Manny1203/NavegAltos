-- ==============================================================================
-- FASE 1: REMEDIACIÓN DE VULNERABILIDADES CRÍTICAS
-- 1. Exposición de PII en public.profiles
-- 2. Fuga masiva de pines privados en public.shared_pins
-- ==============================================================================

-- ==============================================================================
-- 1. PROTECCIÓN DE PII EN TABLA 'profiles'
-- ==============================================================================
-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas públicas anteriores si existen
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow select for all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Lectura de perfiles para usuarios autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver perfiles propios o autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Users can only select their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios ven unicamente su propio perfil" ON public.profiles;

-- POLÍTICA ESTRICTA: Cada usuario SOLO puede consultar su propio registro (su propio ID)
-- Esto impide que cualquier usuario o atacante descargue nombres o fotos de otros estudiantes.
CREATE POLICY "Usuarios ven unicamente su propio perfil"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- POLÍTICA DE ACTUALIZACIÓN: Cada usuario solo puede editar su propio perfil
DROP POLICY IF EXISTS "Usuarios actualizan solo su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios actualizan solo su propio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- ==============================================================================
-- 2. PROTECCIÓN DE PINES PRIVADOS EN TABLA 'shared_pins'
-- ==============================================================================
-- Habilitar Row Level Security
ALTER TABLE public.shared_pins ENABLE ROW LEVEL SECURITY;

-- Eliminar la política permisiva vulnerable que permitía SELECT general con USING (true)
DROP POLICY IF EXISTS "Cualquiera puede leer pines compartidos" ON public.shared_pins;
DROP POLICY IF EXISTS "Lectura de pines compartidos para usuarios" ON public.shared_pins;
DROP POLICY IF EXISTS "Lectura de pines compartidos para usuarios autenticados" ON public.shared_pins;
DROP POLICY IF EXISTS "Usuarios pueden ver solo los pines que ellos compartieron" ON public.shared_pins;
DROP POLICY IF EXISTS "Usuarios solo consultan pines que ellos mismos compartieron" ON public.shared_pins;

-- POLÍTICA DE LECTURA DIRECTA: Bloquea listar la tabla a usuarios ajenos.
-- Solo el usuario que compartió el pin puede ver su propio registro por SELECT directo.
CREATE POLICY "Usuarios solo consultan pines que ellos mismos compartieron"
ON public.shared_pins FOR SELECT
TO authenticated
USING (auth.uid() = shared_by);

-- FUNCIÓN RPC SEGURA: get_shared_pin
-- Permite acceder a un pin compartido ÚNICAMENTE cuando el receptor conoce el UUID exacto (de 128 bits),
-- impidiendo que un atacante haga scraping o enumeración del contenido de la tabla.
-- Además, invalida automáticamente los enlaces que tengan más de 7 días.
CREATE OR REPLACE FUNCTION public.get_shared_pin(pin_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT json_build_object(
    'id', sp.id,
    'pin_data', sp.pin_data,
    'created_at', sp.created_at
  ) INTO v_result
  FROM public.shared_pins sp
  WHERE sp.id = pin_id
    AND sp.created_at >= (NOW() - INTERVAL '7 days');

  RETURN v_result;
END;
$$;

-- Otorgar permiso de ejecución tanto a invitados (anon) como a usuarios con cuenta (authenticated)
GRANT EXECUTE ON FUNCTION public.get_shared_pin(UUID) TO anon, authenticated;
