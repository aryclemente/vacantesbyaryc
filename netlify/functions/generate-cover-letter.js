/**
 * Netlify Serverless Function: generate-cover-letter
 * Genera una Carta de Presentación y Asunto de Email adaptados para la vacante seleccionada,
 * utilizando Gemini 2.5 Flash y la experiencia real de Arianna Clemente.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const DEFAULT_MASTER_CV = `
Nombre: Arianna Clemente
Rol: Full Stack Developer & Especialista en Soluciones TI / Web
Ubicación: Caracas, Venezuela (Disponible para Remoto Internacional)
Contacto: hello.ary.code@gmail.com | github.com/aryclemente | linkedin.com/in/aryclement

Educación:
- Técnico Superior en Informática, Instituto Universitario Jesús Obrero (2022 - 2025)
- Técnico Medio en Programación, Instituto Técnico Jesús Obrero (2016 - 2019)

Experiencia Laboral Real:
1. Colegio Gonzaga | Desarrollador de sistemas (Febrero 2026 - Octubre 2026, Maracaibo / Remoto):
   - Rediseño & UX/UI, optimización de rendimiento web (WPO) y reestructuración completa de la arquitectura del portal.
   - Pasarela Multicuenta (Gonzaga Admin): integración para procesar Pago Móvil, Transferencias Bs, Mercantil C2P y Zinli USD (+900 transacciones mensuales).
   - Analítica y automatización: Google Analytics 4, reportes en tiempo real, alertas de tesorería y re-consultas con API Banco Mercantil.

2. Centro de Espiritualidad y Pastoral Venezuela | Diseñador Web (Marzo 2026 - Julio 2026):
   - Plataforma en WordPress escalada a 11 páginas responsivas.
   - Sistema de Diseño Oasis (tokens y componentes) y mapa interactivo SVG dinámico por estados.
   - Integración con API de Meta, Custom Post Types (CPT) y manual técnico.

3. INGEDACA | Asistente del presidente (Marzo 2026 - Abril 2026):
   - Arquitectura web corporativa, estructuración e importación de datos en Odoo ERP para CRM y procura, seguridad y accesos IT.

4. Fe y Alegría Venezuela | Desarrolladora Full Stack (Agosto 2025 - Noviembre 2025):
   - Sistema de gestión de donaciones a medida en Laravel, gestión de transacciones seguras, migraciones SQL, hosting de alto tráfico y landing page en WordPress optimizada con SEO.

5. CIDE (Centro de Investigación y Desarrollo Ecuador) | Desarrolladora WordPress & Administradora CMS (Enero 2025 - Julio 2025):
   - Plugin de WordPress personalizado para consulta y validación de bases de datos en tiempo real.
   - Administración de campus virtuales Moodle/LearnDash, DSpace y Open Journal Systems (OJS).

6. Fe y Alegría Venezuela | Pasante Desarrolladora de Chatbots (Abril 2025 - Junio 2025):
   - Prototipo funcional de chatbot con HTML5, CSS3, JavaScript e integración de API Gemini para procesamiento de lenguaje natural.

7. Editorial Crisálidas, Fundación Agydes, Editorial Visiones:
   - Configuración y despliegue de OJS (Open Journal Systems) y Moodle.
`;

function getHeuristicCoverLetter(vacancy) {
  const empresa = vacancy.empresa || 'Equipo de Selección';
  const puesto = vacancy.puesto || 'Desarrolladora Full Stack';
  const reqs = (vacancy.requisitos && vacancy.requisitos.length > 0) ? vacancy.requisitos.slice(0, 3).join(', ') : 'desarrollo web, integración de APIs y buenas prácticas';

  const letter = `Estimado equipo de selección de ${empresa},

Me dirijo a ustedes con gran entusiasmo para presentar mi postulación al puesto de ${puesto}. Cuento con una sólida trayectoria como Desarrolladora Full Stack y Especialista en Soluciones Web, combinando experiencia práctica en arquitecturas backend robustas, interfaces reactivas de alto rendimiento e integración de Inteligencia Artificial.

A lo largo de mi trayectoria he liderado proyectos de alta responsabilidad transaccional y operativa. En el Colegio Gonzaga desarrollé e integré una pasarela de pagos multicuenta (Pago Móvil, transferencias bancarias, C2P Mercantil y Zinli USD) capaz de procesar más de 900 transacciones mensuales con conciliación automatizada. Asimismo, en Fe y Alegría construí un sistema integral de donaciones en Laravel con bases de datos relacionales seguras y diseñé chatbots inteligentes integrando APIs de Google Gemini, mientras que en CIDE desarrollé plugins personalizados de WordPress para validación de datos en tiempo real y gestioné plataformas LMS Moodle y revistas OJS a escala.

Mi perfil encaja con los requerimientos de ${empresa}, especialmente en el dominio de ${reqs}. Me caracterizo por una rigurosa metodología de trabajo, mentalidad de entrega continua, optimización de Core Web Vitals y un compromiso genuino por resolver problemas complejos con código limpio y escalable en entornos remotos.

Agradezco de antemano el tiempo dedicado a revisar mi perfil. Quedo a su entera disposición para coordinar una entrevista y profundizar en cómo mi experiencia puede generar valor inmediato para su equipo.

Atentamente,

Arianna Clemente
Full Stack Developer & Especialista TI / Web
Caracas, Venezuela • Disponible para Trabajo Remoto Internacional
Email: hello.ary.code@gmail.com
LinkedIn: linkedin.com/in/aryclement | GitHub: github.com/aryclemente`;

  const emailSubject = `Postulación: ${puesto} - Arianna Clemente | Full Stack Developer`;
  
  const emailBody = `Estimado equipo de ${empresa},

Espero que se encuentren muy bien. Les escribo para postularme a la vacante de ${puesto}.

Cuento con experiencia comprobada en desarrollo Full Stack, integración de pasarelas de pago y APIs (Laravel, PHP, JavaScript, React, SQL), arquitecturas escalables y soluciones con Inteligencia Artificial.

Adjunto a este correo mi Currículum Vitae adaptado para la posición. También pueden explorar mis proyectos en producción y código fuente en mis perfiles profesionales:
• GitHub: https://github.com/aryclemente
• LinkedIn: https://linkedin.com/in/aryclement

Quedo a su disposición para conversar en una entrevista cuando les sea más conveniente.

Saludos cordiales,
Arianna Clemente
hello.ary.code@gmail.com`;

  return { letter, emailSubject, emailBody };
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { vacancy, cvBase = DEFAULT_MASTER_CV } = payload;

    if (!vacancy) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Falta el objeto de la vacante' })
      };
    }

    const headers = event.headers || {};
    const apiKey = process.env.GEMINI_API_KEY || headers['x-gemini-api-key'] || headers['X-Gemini-Api-Key'];

    if (!apiKey) {
      const fallback = getHeuristicCoverLetter(vacancy);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, source: 'heuristic', data: fallback })
      };
    }

    const prompt = `
Eres una redactora experta en empleabilidad técnica y estratega de carrera.
Tu objetivo es redactar:
1. Una Carta de Presentación (Cover Letter) profesional, persuasiva y personalizada para Arianna Clemente.
2. El Asunto de Correo Electrónico ideal.
3. El Cuerpo de Correo Electrónico (Email Pitch) breve para acompañar el CV y Portafolio.

Perfil Real de Arianna Clemente:
${cvBase}

Vacante a la que postula:
- Empresa: ${vacancy.empresa || 'Empresa Confidencial'}
- Puesto: ${vacancy.puesto || 'Puesto TI'}
- Modalidad: ${vacancy.modalidad || 'Remoto'}
- Requisitos: ${(vacancy.requisitos || []).join(', ') || 'No especificados'}
- Notas: ${vacancy.notas || ''}

Instrucciones Estrictas:
1. La carta debe tener 4 párrafos claros y contundentes:
   - Párrafo 1: Saludo, mención del puesto en ${vacancy.empresa} y propuesta de valor inicial.
   - Párrafo 2: Casos de éxito y proyectos reales más relevantes de Arianna que conecten con la vacante (ej: pasarela multicuenta en Colegio Gonzaga +900 tx/mes, sistema de donaciones en Laravel en Fe y Alegría, plugins en WordPress/Moodle en CIDE, o chatbots con Gemini).
   - Párrafo 3: Por qué encaja con la cultura y requisitos técnicos de ${vacancy.empresa}.
   - Párrafo 4: Cierre profesional y disponibilidad para entrevista.
2. El Asunto del Email debe ser profesional y directo.
3. El Cuerpo del Email debe ser conciso (máximo 12 líneas), directo al grano, mencionando el CV adjunto y enlaces a GitHub y LinkedIn.

Responde ÚNICAMENTE en formato JSON estrictamente válido:
{
  "letter": "...",
  "emailSubject": "...",
  "emailBody": "..."
}
`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      console.warn('Gemini error, fallback to heuristic cover letter:', geminiRes.status);
      const fallback = getHeuristicCoverLetter(vacancy);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, source: 'heuristic', data: fallback })
      };
    }

    const geminiData = await geminiRes.json();
    const candidatePart = geminiData.candidates?.[0]?.content?.parts?.find(p => p.text);
    const candidateText = candidatePart?.text;

    if (!candidateText) {
      throw new Error('Respuesta vacía de Gemini');
    }

    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        source: 'gemini_2.5_flash',
        data: parsed
      })
    };
  } catch (err) {
    console.error('Error in generate-cover-letter:', err);
    const payload = JSON.parse(event.body || '{}');
    const fallback = getHeuristicCoverLetter(payload.vacancy || {});
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, source: 'heuristic_fallback', data: fallback })
    };
  }
};
