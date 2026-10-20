/**
 * Netlify Serverless Function: tailor-cv
 * Adapta el CV de Arianna Clemente en tiempo real para una vacante específica con Gemini 1.5 Flash.
 * Cumple con formato ATS y destaca logros cuantificables y tecnologías clave.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';


const DEFAULT_MASTER_CV = `
Nombre: Arianna Clemente
Rol Principal: Full Stack Developer & Especialista en Soluciones TI / Web
Ubicación: Caracas, Venezuela (Disponible para Remoto Internacional)
Contacto: hello.ary.code@gmail.com | github.com/aryclemente | linkedin.com/in/aryclement

Perfil Profesional:
Especialista en Desarrollo de Software, Arquitecturas Web Escalables y Soluciones TI con sólida experiencia liderando proyectos Frontend y Backend, modernización de plataformas de misión crítica (LMS Moodle, OJS, ecosistemas PHP/JavaScript) y diseño de flujos operativos para sectores corporativos, educativos y bancarios. Dominio en la integración de modelos de Inteligencia Artificial (Google Gemini API), construcción de interfaces accesibles de alto rendimiento (Core Web Vitals) y automatización de despliegues continuos con Git y Netlify.

Competencias Técnicas:
- Frontend: JavaScript (ES6+), React, Next.js, HTML5 Semántico, CSS3 Moderno, Responsive Design, TailwindCSS, Web Performance, Accesibilidad (a11y).
- Backend & APIs: PHP, Python, Node.js, REST APIs, Microservicios, Integración de Webhooks, JSON.
- Bases de Datos: PostgreSQL (RLS), MySQL, SQL Server, Modelado Relacional, Optimización de Consultas e Índices.
- Plataformas: Moodle LMS (arquitectura y plugins avanzados), Open Journal Systems (OJS), WordPress Headless, Shopify.
- Cloud & DevOps: Supabase Cloud (BaaS, Auth, Realtime, RLS), Netlify (Functions Serverless, CI/CD), Git/GitHub, Docker, Linux/Bash.
- Especialidades: Integración de IA Generativa (Gemini API), Automatización, Optimización ATS, SEO Técnico.
- Metodologías: Scrum, Kanban, Rigurosidad Metodológica, Documentación Técnica, Continuidad Operativa, Resolución de Incidentes Nivel 2 y 3.

Experiencia Laboral:
1. Especialista de Desarrollo TI & Soluciones Web | Consultoría Independiente & Proyectos (2023 - Presente):
   - Desarrollo y despliegue de aplicaciones web reactivas, optimizando Core Web Vitals en +40%.
   - Integración de servicios Cloud (Supabase PostgreSQL RLS y Netlify Serverless Functions) con persistencia en tiempo real.
   - Implementación de flujos con IA multimodal (Gemini 1.5) para procesamiento y extracción automatizada de datos.
   - Modernización de plataformas de comercio electrónico y portales corporativos sobre WordPress y Shopify Headless con alta disponibilidad.

2. Especialista en Plataformas Web Educativas & Campus Virtual | Sector Académico / E-learning (2021 - 2023):
   - Administración integral y escalabilidad de campus virtuales basados en Moodle LMS (+5,000 usuarios activos simultáneos).
   - Desarrollo de plugins personalizados en PHP/JavaScript para gestión de notas, estándares SCORM y reportería docente.
   - Gestión y configuración de portales científicos sobre Open Journal Systems (OJS), metadatos Dublin Core e indexación.
   - Protocolos de respaldo automatizado, contingencia técnica y mitigación de caídas en alta demanda transaccional.

3. Desarrolladora Web & Soporte de Infraestructura TI (2019 - 2021):
   - Soporte técnico especializado Nivel 2 y 3 a plataformas de gestión operativa, bases de datos relacionales y redes.
   - Mantenimiento de sistemas transaccionales en PHP y SQL, asegurando integridad referencial y auditoría de accesos.
   - Capacitación a usuarios finales y redacción de manuales operativos y documentación conforme a normativas de calidad.
`;

function getHeuristicTailoring(vacancy) {
  const empresa = vacancy.empresa || 'Empresa';
  const puesto = vacancy.puesto || 'Full Stack Developer';
  const reqs = (vacancy.requisitos && vacancy.requisitos.length > 0) ? vacancy.requisitos : ['JavaScript', 'PHP', 'React', 'SQL', 'Git'];
  const reqsJoined = reqs.slice(0, 3).join(', ');

  return {
    role: `${puesto} | Arianna Clemente`,
    summary: `Especialista en Desarrollo de Soluciones Web y TI con amplia trayectoria optimizando plataformas escalables y sistemas transaccionales. Perfil altamente compatible con los estándares y requerimientos técnicos de ${empresa}, destacando en entrega continua, calidad de código y diseño de arquitecturas eficientes orientadas a resultados.`,
    bullets: [
      `Diseño e implementación de soluciones tecnológicas adaptadas a ${empresa}, aplicando ${reqsJoined} con foco en alta disponibilidad y rendimiento.`,
      `Construcción de arquitecturas web modernas con optimización de Core Web Vitals (+40%) y consumo de APIs REST de alto desempeño.`,
      `Automatización de flujos de trabajo e integración de servicios en la nube (Supabase PostgreSQL, Netlify Functions e Inteligencia Artificial).`,
      `Liderazgo técnico en resolución de incidentes de misión crítica, mantenimiento de plataformas de alta demanda y metodologías ágiles.`
    ],
    skills: {
      relevant: `${reqs.join(', ')}`,
      core: 'JavaScript (ES6+), React, PHP, Python, PostgreSQL, MySQL, REST APIs, Git/GitHub, Netlify, Supabase Cloud.',
      methodologies: 'Scrum, Kanban, Optimización ATS, SEO Técnico, Seguridad en Bases de Datos, Continuidad Operativa.'
    }
  };
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
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


    // Si no hay API key disponible en el entorno, devolver la adaptación heurística de alta calidad
    if (!apiKey) {
      const fallback = getHeuristicTailoring(vacancy);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          source: 'heuristic_fallback',
          data: fallback
        })
      };
    }

    const prompt = `
Eres una asesora de carrera de élite y reclutadora técnica sénior (Senior Tech Recruiter & Career Strategist).
Tu misión es adaptar el Currículum Maestro de Arianna Clemente para postular a una vacante específica, maximizando su puntuación en sistemas ATS (Applicant Tracking Systems) y captando inmediatamente el interés del Hiring Manager.

Perfil de la Candidata (CV Maestro):
${cvBase}

Detalles de la Vacante Objetivo:
- Empresa: ${vacancy.empresa || 'Empresa Confidencial'}
- Puesto: ${vacancy.puesto || 'Puesto TI'}
- Modalidad: ${vacancy.modalidad || 'Remoto'}
- Ubicación: ${vacancy.ubicacion || 'Remoto'}
- Requisitos / Tecnologías: ${(vacancy.requisitos || []).join(', ') || 'No especificados'}
- Notas / Contexto: ${vacancy.notas || ''}

Instrucciones Estrictas de Adaptación:
1. "role": Título profesional adaptado que combine el rol buscado con la identidad de Arianna (ej: "${vacancy.puesto} | Arianna Clemente").
2. "summary": Un párrafo profesional persuasivo de 3 a 4 líneas exactas. Debe conectar directamente la trayectoria de Arianna con los problemas y retos que ${vacancy.empresa} busca resolver, usando tono formal, técnico y orientado al valor de negocio.
3. "bullets": Array con exactamente 4 viñetas (bullets) para la sección de Experiencia Destacada:
   - Aplica el método STAR/XYZ ("Logré X medido por Y realizando Z").
   - Resalta cómo su experiencia real (LMS/OJS de alto tráfico, arquitecturas web optimizadas, integración de IA multimodal, bases de datos PostgreSQL/MySQL, backend y APIs) resuelve los requerimientos de esta vacante.
   - Incorpora las palabras clave y tecnologías de la oferta de forma natural y creíble.
4. "skills": Objeto con 3 categorías de habilidades:
   - "relevant": Las tecnologías y herramientas más demandadas por esta vacante.
   - "core": Tecnologías troncales del stack de Arianna que refuerzan su candidatura.
   - "methodologies": Metodologías de trabajo, rigurosidad técnica, seguridad y buenas prácticas.

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:
{
  "role": "...",
  "summary": "...",
  "bullets": [
    "...",
    "...",
    "...",
    "..."
  ],
  "skills": {
    "relevant": "...",
    "core": "...",
    "methodologies": "..."
  }
}
`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      console.warn('Gemini API call returned non-200, using heuristic fallback:', geminiRes.status);
      const fallback = getHeuristicTailoring(vacancy);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          source: 'heuristic_fallback',
          data: fallback
        })
      };
    }

    const geminiData = await geminiRes.json();
    const candidatePart = geminiData.candidates?.[0]?.content?.parts?.find(p => p.text);
    const candidateText = candidatePart?.text;


    if (!candidateText) {
      throw new Error('Respuesta vacía de Gemini');
    }

    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    const tailoredCv = JSON.parse(cleanJson);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        source: 'gemini_1.5_flash',
        data: tailoredCv
      })
    };
  } catch (error) {
    console.error('Error in tailor-cv function:', error);
    // En caso de cualquier error, no romper la experiencia de usuario: devolver adaptación heurística
    try {
      const payload = JSON.parse(event.body || '{}');
      const fallback = getHeuristicTailoring(payload.vacancy || {});
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          source: 'heuristic_fallback',
          data: fallback
        })
      };
    } catch (e) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }
};
