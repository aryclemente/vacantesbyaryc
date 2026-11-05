-- ==============================================================================
-- Supabase Schema: Vacantes by AryC // Multi-Tenant & Perfiles de Usuario
-- Extensión para soporte multi-usuario, aislamiento RLS y perfiles dinámicos
-- ==============================================================================

-- 1. Creación de la tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL DEFAULT '',
    titular TEXT DEFAULT 'Desarrollador / Especialista Tech',
    email TEXT,
    telefono TEXT DEFAULT '',
    ubicacion TEXT DEFAULT 'No especificada',
    enlaces JSONB DEFAULT '{"linkedin": "", "github": "", "portafolio": "", "web": ""}'::jsonb,
    resumen TEXT DEFAULT '',
    habilidades TEXT[] DEFAULT '{}',
    educacion JSONB DEFAULT '[]'::jsonb,
    experiencias JSONB DEFAULT '[]'::jsonb,
    foto_url TEXT DEFAULT '',
    foto_config JSONB DEFAULT '{"forma": "rounded", "mostrar": true, "zoom": 100}'::jsonb,
    preferencias_empleo JSONB DEFAULT '{"modalidades": ["Remoto", "Híbrido"], "mercados": ["all"]}'::jsonb,
    ai_provider TEXT DEFAULT 'gemini',
    ai_settings JSONB DEFAULT '{}'::jsonb,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_perfiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_perfiles_updated_at ON public.perfiles;
CREATE TRIGGER trigger_perfiles_updated_at
    BEFORE UPDATE ON public.perfiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_perfiles_updated_at();

-- 3. Habilitar Row Level Security (RLS) en la tabla perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS de Alto Rendimiento (Security & Performance Best Practices)
-- Envolver funciones de auth en SELECT para evitar ejecución fila por fila

DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios pueden ver su propio perfil"
    ON public.perfiles FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios pueden insertar su propio perfil"
    ON public.perfiles FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
    ON public.perfiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Los usuarios pueden eliminar su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios pueden eliminar su propio perfil"
    ON public.perfiles FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = id);

-- 5. Trigger en auth.users para creación automática de perfil al registrarse
-- Se ejecuta automáticamente cuando un nuevo usuario confirma su cuenta o entra con Magic Link
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, email, nombre, titular)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'titular', 'Profesional Tech')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Optimización de Políticas RLS de la tabla vacantes (Aislamiento y Rendimiento)
ALTER TABLE public.vacantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias vacantes" ON public.vacantes;
CREATE POLICY "Los usuarios pueden ver sus propias vacantes"
    ON public.vacantes FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propias vacantes" ON public.vacantes;
CREATE POLICY "Los usuarios pueden insertar sus propias vacantes"
    ON public.vacantes FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias vacantes" ON public.vacantes;
CREATE POLICY "Los usuarios pueden actualizar sus propias vacantes"
    ON public.vacantes FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propias vacantes" ON public.vacantes;
CREATE POLICY "Los usuarios pueden eliminar sus propias vacantes"
    ON public.vacantes FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 7. Índices para acelerar búsquedas y consultas RLS
CREATE INDEX IF NOT EXISTS idx_perfiles_id ON public.perfiles (id);
CREATE INDEX IF NOT EXISTS idx_vacantes_user_id ON public.vacantes (user_id);
CREATE INDEX IF NOT EXISTS idx_vacantes_user_estado ON public.vacantes (user_id, estado);

-- 8. Habilitar Realtime para perfiles y vacantes
ALTER PUBLICATION supabase_realtime ADD TABLE public.perfiles;

-- 9. Migración Segura: Crear perfil inicial para usuarios existentes que aún no tengan fila en perfiles
INSERT INTO public.perfiles (id, email, nombre, titular, resumen, habilidades)
SELECT 
    u.id, 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'nombre', 'Arianna Clemente'),
    COALESCE(u.raw_user_meta_data->>'titular', 'Full Stack Developer & Especialista en Soluciones TI / Web'),
    'Especialista en Desarrollo de Software, Arquitecturas Web Escalables y Soluciones TI con sólida experiencia liderando proyectos Frontend y Backend, modernización de plataformas LMS Moodle, ecosistemas PHP/Laravel/JavaScript y pasarelas de pago transaccionales.',
    ARRAY['PHP', 'Laravel', 'React', 'JavaScript', 'WordPress', 'WooCommerce', 'Moodle LMS', 'PostgreSQL', 'MySQL', 'Pasarelas de Pago', 'Supabase', 'Docker', 'REST APIs', 'Git']
FROM auth.users u
LEFT JOIN public.perfiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
