-- 1. Crear la tabla de pines compartidos temporales
CREATE TABLE IF NOT EXISTS public.shared_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.shared_pins ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para que cualquier usuario autenticado pueda compartir un pin (Insertar)
CREATE POLICY "Usuarios pueden compartir pines"
ON public.shared_pins FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = shared_by);

-- 4. Crear política para que cualquier persona pueda leer un pin compartido (Select)
-- Nota: Solo podrán leerlo si tienen el ID exacto (debido a cómo funcionan las URLs compartidas).
CREATE POLICY "Cualquiera puede leer pines compartidos"
ON public.shared_pins FOR SELECT
USING (true);
