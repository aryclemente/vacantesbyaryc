-- ==============================================================================
-- Supabase Schema: Vacantes by AryC
-- Sistema de gestión de postulaciones con sincronización en la nube y RLS
-- ==============================================================================

-- 1. Habilitar extensión pgcrypto para generación de UUIDs (habilitada por defecto en Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Creación de la tabla principal de vacantes
CREATE TABLE IF NOT EXISTS public.vacantes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa TEXT NOT NULL,
    puesto TEXT NOT NULL,
    modalidad TEXT DEFAULT 'Remoto',
    ubicacion TEXT DEFAULT 'No especificada',
    salario TEXT,
    estado TEXT NOT NULL DEFAULT 'saved' 
        CHECK (estado IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
    prioridad TEXT NOT NULL DEFAULT 'high' 
        CHECK (prioridad IN ('low', 'med', 'high')),
    url TEXT,
    contacto TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    notas TEXT,
    requisitos TEXT[] DEFAULT '{}',
    estrategia TEXT,
    interview_prep TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vacantes_updated_at ON public.vacantes;
CREATE TRIGGER trigger_vacantes_updated_at
    BEFORE UPDATE ON public.vacantes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.vacantes ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Seguridad (RLS)
-- Cada usuario autenticado sólo puede operar sobre sus propios registros

DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias vacantes" ON public.vacantes;
CREATE POLICY "Los usuarios pueden ver sus propias vacantes"
    ON public.vacantes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propias vacantes" ON public.vacantes;
CREATE POLICY "Los usuarios pueden insertar sus propias vacantes"
    ON public.vacantes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias vacantes" ON public.vacantes;
CREATE POLICY "Los usuarios pueden actualizar sus propias vacantes"
    ON public.vacantes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propias vacantes" ON public.vacantes;
CREATE POLICY "Los usuarios pueden eliminar sus propias vacantes"
    ON public.vacantes FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Índices para acelerar búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_vacantes_user_id ON public.vacantes (user_id);
CREATE INDEX IF NOT EXISTS idx_vacantes_user_estado ON public.vacantes (user_id, estado);
CREATE INDEX IF NOT EXISTS idx_vacantes_created_at ON public.vacantes (created_at DESC);

-- 7. Habilitar Realtime para la tabla vacantes (permite sincronización en vivo entre dispositivos)
ALTER PUBLICATION supabase_realtime ADD TABLE public.vacantes;
