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

Educación Formal:
- Técnico Superior en Informática, Instituto Universitario Jesús Obrero (IUJO, 2022 - 2025)
- Técnico Medio en Programación Informática, Instituto Técnico Jesús Obrero (ITJO, 2016 - 2019)

Perfil Profesional:
Especialista en Desarrollo de Software, Arquitecturas Web Escalables y Soluciones TI con sólida experiencia liderando proyectos Frontend y Backend, modernización de plataformas de misión crítica (LMS Moodle, OJS, ecosistemas PHP/Laravel/JavaScript) y diseño de flujos operativos para sectores corporativos, educativos y bancarios. Dominio en la integración de modelos de Inteligencia Artificial (Google Gemini API), pasarelas de pago multimoneda y transaccionales, construcción de interfaces accesibles de alto rendimiento (Core Web Vitals) y automatización de despliegues continuos con Git, Netlify y Supabase.

Competencias Técnicas Clave:
- Frontend: JavaScript (ES6+), React, Next.js, HTML5 Semántico, CSS3 Moderno, Responsive Design, TailwindCSS, Web Performance (WPO), Accesibilidad (a11y).
- Backend & APIs: PHP, Laravel, Python, Node.js, REST APIs, Microservicios, Integración de Pasarelas Bancarias y Webhooks, JSON.
- Bases de Datos: PostgreSQL (RLS), MySQL, SQL Server, Modelado Relacional, Migraciones y Optimización de Consultas.
- Plataformas & CMS: Moodle LMS (arquitectura y plugins avanzados), Open Journal Systems (OJS), WordPress Headless/Custom Plugins, Shopify, Odoo ERP.
- Cloud & DevOps: Supabase Cloud (BaaS, Auth, Realtime, RLS), Netlify (Functions Serverless, CI/CD), Git/GitHub, Docker, Linux/Bash.
- Especialidades: Integración de IA Generativa (Gemini 2.5 API), Automatización, Optimización ATS, SEO Técnico, Pasarelas de Pago Multimoneda.

Experiencia Laboral Detallada:
1. Colegio Gonzaga | Desarrollador de sistemas (Febrero 2026 - Octubre 2026, Maracaibo / Remoto):
   - Rediseño & UX/UI: Optimización de rendimiento web (WPO) y reestructuración completa de la arquitectura del portal colegiogonzaga.org.ve.
   - Pasarela Multicuenta (Gonzaga Admin): Desarrollo e integración de módulo transaccional para procesar Pago Móvil, Transferencias Bs, Mercantil C2P y Zinli USD (+900 transacciones mensuales).
   - Analítica & Automatización: Configuración de GA4, reportes en tiempo real, alertas de tesorería y re-consultas automatizadas con la API Banco Mercantil.

2. Centro de Espiritualidad y Pastoral Venezuela | Diseñador Web (Marzo 2026 - Julio 2026, Caracas):
   - Arquitectura Web: Despliegue de plataforma nacional en WordPress, escalando de 7 a 11 páginas responsivas.
   - Sistema de Diseño Oasis: Tokens y componentes alineados al manual de identidad jesuita.
   - Componentes Dinámicos: Mapa interactivo SVG por estados y gestión responsiva de agenda pastoral.
   - Auditoría e Integraciones: Conexión con API de Meta, Custom Post Types (CPT) y manual técnico integral.

3. INGEDACA | Asistente de Presidencia & TI (Marzo 2026 - Abril 2026, Caracas):
   - Arquitectura Web: Auditoría, optimización y mantenimiento de sitios corporativos e infraestructura digital.
   - Gestión ERP: Estructuración e importación de datos en Odoo para optimizar procesos de procura y CRM.
   - Seguridad e IT: Gestión de accesos corporativos, contraseñas, políticas de seguridad y documentación de procesos técnicos.

4. Fe y Alegría Venezuela | Desarrolladora Full Stack (Agosto 2025 - Noviembre 2025):
   - Sistema de Gestión de Donaciones: Desarrollo a medida en Laravel gestionando flujos transaccionales y usuarios seguros (app.donarfeyalegriavzla.org).
   - Despliegue & DevOps: Gestión de entornos de hosting, migraciones de base de datos SQL y estabilidad para campañas de alto tráfico.
   - Landing Page WordPress: Diseño de landing de alto rendimiento integrada con Google Analytics y SEO.

5. CIDE Ecuador | Desarrolladora WordPress & Administradora CMS (Enero 2025 - Julio 2025):
   - Plugin de WordPress personalizado: Consulta y validación de bases de datos en tiempo real (cidelatam.org/sistema-de-validacion-de-resultados-2025).
   - LMS y Campus Virtual: Administración y optimización en LearnDash, Moodle y Eventin.
   - Ecosistema CMS Académico: Mantenimiento y actualización de DSpace y Open Journal Systems (OJS), garantizando integridad y seguridad.

6. Fe y Alegría Venezuela | Pasante Desarrolladora de Chatbots (Abril 2025 - Junio 2025):
   - Chatbot IA: Prototipo funcional con HTML5, CSS3, JavaScript e integración con la API de Google Gemini para procesamiento de lenguaje natural (chatbotfya.web.app).

7. Proyectos Académicos y Editoriales (2023 - 2024):
   - Editorial Crisálidas, Fundación Agydes, Editorial Visiones: Instalación y personalización de Open Journal Systems (OJS) en hosting para revistas científicas indexadas.
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
