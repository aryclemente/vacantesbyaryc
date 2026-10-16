# Guía de Conexión y Puesta en Marcha: Supabase Cloud para "Vacantes by AryC"

Esta guía explica en 4 pasos rápidos cómo conectar tu base de datos en la nube para que tus postulaciones se sincronicen automáticamente entre tu **laptop**, **teléfono móvil** y **computadora de escritorio**, sin riesgo de perder datos nunca más.

---

## Paso 1: Crear Proyecto Gratuito en Supabase (1 minuto)

1. Ingresa a [supabase.com](https://supabase.com) e inicia sesión con tu cuenta de GitHub o correo.
2. Haz clic en **"New Project"**.
3. Completa los campos:
   - **Name:** `vacantes-by-aryc` (o el nombre que prefieras).
   - **Database Password:** Elige una contraseña segura (guárdala en tu gestor de contraseñas).
   - **Region:** Selecciona la región más cercana (ejemplo: `East US (North Virginia)`).
   - **Pricing Plan:** Elige el plan **Free** ($0/mes).
4. Haz clic en **"Create new project"** y espera ~1 minuto a que se inicialice.

---

## Paso 2: Ejecutar el Script SQL (Crea la tabla y la seguridad RLS)

1. En el panel izquierdo de tu proyecto en Supabase, haz clic en el icono **SQL Editor** (o presiona el botón con el símbolo `>_`).
2. Haz clic en **"+ New query"**.
3. Abre el archivo local [`documentacion/supabase_schema.sql`](file:///c:/Users/user/Desktop/Busqueda%20de%20Trabajo/documentacion/supabase_schema.sql), copia todo su contenido y pégalo en el editor de Supabase.
4. Haz clic en el botón verde **"Run"** (o presiona `Ctrl + Enter`).
5. Verás el mensaje: `Success. No rows returned`.
   *(Esto habrá creado la tabla `vacantes`, configurado los índices, activado la seguridad RLS para que solo tú veas tus datos y habilitado la sincronización en tiempo real).*

---

## Paso 3: Obtener tus Credenciales (Project URL y Anon Key)

1. En el panel izquierdo de Supabase, ve a **Project Settings** (icono de engranaje en la parte inferior) &rarr; **API**.
2. En la sección **Project URL**, copia el valor de **URL** (ejemplo: `https://abcdefghijklm.supabase.co`).
3. En la sección **Project API keys**, copia el valor de la clave llamada **`anon` `public`** (es una clave larga que empieza con `eyJh...`).

---

## Paso 4: Conectar y Respaldar en la Aplicación Web

1. Abre tu aplicación en el navegador (en tu laptop, PC o Netlify).
2. En la barra superior, haz clic en el nuevo botón **"Nube"** (junto al botón "Nueva Vacante").
3. Ve a la pestaña **"Configurar Supabase"**:
   - Pega tu **Supabase Project URL**.
   - Pega tu **Supabase Anon Key**.
   - Haz clic en **"Guardar y Conectar Supabase"**.
4. Pasa a la pestaña **"Cuenta & Sesión"**:
   - **Opción recomendada:** En *Magic Link*, escribe tu correo y haz clic en **"Enviar Enlace de Acceso"**. Te llegará un correo de Supabase con un botón para entrar con un solo clic.
   - O si prefieres, selecciona *Email y Contraseña* y haz clic en **"Registrarse"**.
5. Una vez iniciada la sesión, verás tu correo con un punto verde de **"Sesión activa y sincronizada"**.
6. Haz clic en el botón verde: **"Subir vacantes locales a la nube (16 iniciales)"**.
   - ¡Listo! Tus 16 vacantes históricas de Gemini (Ensolvers, Banesco, Wink, etc.) estarán respaldadas en PostgreSQL.

---

## ¿Cómo usarlo en otros dispositivos (Laptop / Móvil)?
- Cuando abras la web en tu laptop o en tu móvil por primera vez:
  1. Haz clic en **"Nube"**.
  2. En **"Configurar Supabase"**, ingresas la misma URL y Anon Key.
  3. En **"Cuenta & Sesión"**, ingresas con tu correo.
  4. **Tus vacantes aparecerán inmediatamente en pantalla**, y cualquier cambio que hagas en un dispositivo se reflejará al instante en los demás.
