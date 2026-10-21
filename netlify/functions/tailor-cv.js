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
  const reqs = (vacancy.requisitos && vacancy.requisitos.length > 0) ? vacancy.requisitos : ['JavaScript', 'PHP', 'Laravel', 'React', 'SQL', 'Git'];
  const reqsJoined = reqs.slice(0, 3).join(', ');

  return {
    role: `${puesto} | Arianna Clemente`,
    summary: `Especialista en Desarrollo de Soluciones Web y TI con amplia trayectoria optimizando plataformas escalables, sistemas transaccionales e integración de Inteligencia Artificial. Perfil altamente compatible con los estándares y requerimientos técnicos de ${empresa}, destacando en entrega continua, calidad de código, resolución de incidentes y diseño de arquitecturas eficientes orientadas a resultados.`,
    experiences: [
      {
        company: 'Colegio Gonzaga',
        role: 'Desarrollador de sistemas',
        period: 'febrero de 2026 - octubre de 2026 (9 meses)',
        location: 'Maracaibo, Estado Zulia, Venezuela (Remoto)',
        bullets: [
          'Pasarela Multicuenta: Desarrollo e integración de Gonzaga Admin para procesar Pago Móvil, Transferencias Bs, Mercantil C2P y Zinli USD (+900 transacciones mensuales).',
          'Rediseño & UX/UI: Optimización de rendimiento web (WPO) y reestructuración completa de la arquitectura del portal colegiogonzaga.org.ve.',
          `Analítica & Automatización: Configuración de GA4, reportes en tiempo real, alertas de tesorería y re-consultas automatizadas con la API Banco Mercantil.`
        ]
      },
      {
        company: 'Centro de Espiritualidad y Pastoral Venezuela',
        role: 'Diseñador de páginas web',
        period: 'marzo de 2026 - julio de 2026 (5 meses)',
        location: 'Caracas, Distrito Federal, Venezuela',
        bullets: [
          'Arquitectura Web: Diseñé y desplegué la plataforma nacional en WordPress, escalando de 7 a 11 páginas responsivas.',
          'Sistema de Diseño Oasis: Desarrollé el sistema Oasis (tokens y componentes modulares) alineado al manual de identidad jesuita.',
          'Componentes Dinámicos & APIs: Implementé mapa interactivo SVG por estados, agenda pastoral responsiva y diagnósticos de integración con API de Meta y CPT.'
        ]
      },
      {
        company: 'INGEDACA',
        role: 'Asistente del presidente & TI',
        period: 'marzo de 2026 - abril de 2026 (2 meses)',
        location: 'Metropolitan Region of Caracas, Venezuela',
        bullets: [
          'Arquitectura Web: Auditoría, optimización y mantenimiento de sitios web e infraestructura digital corporativa.',
          'Gestión ERP: Estructuración e importación de datos en Odoo para optimizar procesos de procura y CRM.',
          'Seguridad e IT: Gestión de accesos corporativos, contraseñas, políticas de seguridad y documentación de procesos técnicos.'
        ]
      },
      {
        company: 'Fe y Alegría Venezuela',
        role: 'Desarrolladora Full Stack',
        period: 'agosto de 2025 - noviembre de 2025 (4 meses)',
        location: 'Caracas, Distrito Federal, Venezuela',
        bullets: [
          `Sistema de Donaciones en Laravel: Desarrollé sistema a medida gestionando flujos transaccionales y usuarios seguros (app.donarfeyalegriavzla.org).`,
          'Despliegue & DevOps: Orquesté el ciclo completo de despliegue, gestión de hosting y migraciones de bases de datos SQL para campañas de alto tráfico.',
          'Landing Page en WordPress: Diseñé y lancé landing de alto rendimiento integrada con Google Analytics y estrategias SEO para maximizar conversión de donantes.'
        ]
      },
      {
        company: 'CIDE (Centro de Investigación y Desarrollo Ecuador)',
        role: 'Desarrolladora WordPress y Administradora CMS',
        period: 'enero de 2025 - julio de 2025 (7 meses)',
        location: 'Pichincha, Ecuador (Remoto)',
        bullets: [
          'Plugin de WordPress Personalizado: Diseñé y desarrollé plugin para la consulta y validación de bases de datos en tiempo real (cidelatam.org/sistema-de-validacion-de-resultados-2025).',
          'Campus Virtual & LMS: Administración y optimización de plataformas institucionales sobre LearnDash, Moodle y sistemas de gestión de eventos (Eventin).',
          'Ecosistema CMS Académico: Mantenimiento y actualización de plataformas complejas incluyendo DSpace y Open Journal Systems (OJS), garantizando integridad y seguridad.'
        ]
      },
      {
        company: 'Fe y Alegría Venezuela',
        role: 'Pasante Desarrolladora de Chatbots',
        period: 'abril de 2025 - junio de 2025 (3 meses)',
        location: 'Caracas, Distrito Federal, Venezuela',
        bullets: [
          'Chatbot impulsado por IA: Construí prototipo funcional utilizando HTML5, CSS3 y JavaScript, integrando la API de Google Gemini para procesamiento de lenguaje natural (chatbotfya.web.app).',
          'Experiencia de Usuario: Colaboré de forma remota para refinar los flujos de interacción del usuario, mejorando el canal de soporte digital institucional.'
        ]
      }
    ],
    skills: {
      relevant: `${reqs.join(', ')}`,
      core: 'JavaScript (ES6+), React, PHP, Laravel, Python, PostgreSQL (RLS), MySQL, REST APIs, Git/GitHub, Netlify, Supabase Cloud.',
      methodologies: 'Scrum, Kanban, Metodologías Ágiles, Optimización ATS, SEO Técnico, Seguridad TI, Continuidad Operativa.'
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
Eres una asesora de carrera de élite y reclutadora técnica sénior (Senior Tech Recruiter & ATS Strategist).
Tu misión es adaptar el Currículum de Arianna Clemente para postular a la vacante objetivo, maximizando su compatibilidad ATS sin perder la veracidad ni la estructura individualizada de su trayectoria laboral.

Perfil Real de la Candidata (con cada experiencia individual de LinkedIn):
${cvBase}

Detalles de la Vacante Objetivo:
- Empresa: ${vacancy.empresa || 'Empresa Confidencial'}
- Puesto: ${vacancy.puesto || 'Puesto TI'}
- Modalidad: ${vacancy.modalidad || 'Remoto'}
- Ubicación: ${vacancy.ubicacion || 'Remoto'}
- Requisitos / Tecnologías: ${(vacancy.requisitos || []).join(', ') || 'No especificados'}
- Notas / Contexto: ${vacancy.notas || ''}

REGLAS CRÍTICAS Y ESTRICTAS DE ESTRUCTURA:
1. PROHIBICIÓN ABSOLUTA DE AGRUPAR EXPERIENCIAS: Queda estrictamente PROHIBIDO resumir o consolidar las empresas en un solo bloque o mezclar fechas y tareas. Cada empresa y cargo del perfil de LinkedIn debe aparecer como un objeto INDIVIDUAL e INDEPENDIENTE dentro del array "experiences".
2. Mantén la separación exacta de empresas, cargos, periodos y ubicaciones tal como aparecen en su perfil:
   - Colegio Gonzaga (febrero de 2026 - octubre de 2026 | Maracaibo / Remoto) - Desarrollador de sistemas
   - Centro de Espiritualidad y Pastoral Venezuela (marzo de 2026 - julio de 2026 | Caracas) - Diseñador de páginas web
   - INGEDACA (marzo de 2026 - abril de 2026 | Caracas) - Asistente del presidente
   - Fe y Alegría Venezuela (agosto de 2025 - noviembre de 2025 | Caracas) - Desarrolladora Full Stack
   - CIDE Ecuador (enero de 2025 - julio de 2025 | Pichincha, Ecuador) - Desarrolladora WordPress y Administradora CMS
   - Fe y Alegría Venezuela (abril de 2025 - junio de 2025 | Caracas) - Pasante Desarrolladora de Chatbots
3. Para CADA experiencia individual:
   - Redacta entre 2 y 3 viñetas ("bullets") detallando las tareas y logros reales de Arianna en esa empresa.
   - Aplica el método STAR/XYZ ("Logré X medido por Y realizando Z").
   - Ajusta el vocabulario técnico para que resuene con las necesidades de ${vacancy.empresa} (${(vacancy.requisitos || []).slice(0, 3).join(', ')}), sin cambiar la verdad histórica de lo que hizo en esa empresa.
4. "role": Título profesional adaptado (ej: "${vacancy.puesto} | Arianna Clemente").
5. "summary": Párrafo profesional persuasivo de 3 a 4 líneas que conecte su trayectoria con los retos de ${vacancy.empresa}.
6. "skills": Objeto con "relevant", "core" y "methodologies".

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:
{
  "role": "...",
  "summary": "...",
  "experiences": [
    {
      "company": "Colegio Gonzaga",
      "role": "Desarrollador de sistemas",
      "period": "febrero de 2026 - octubre de 2026",
      "location": "Maracaibo, Estado Zulia, Venezuela (Remoto)",
      "bullets": [
        "...",
        "...",
        "..."
      ]
    },
    {
      "company": "Centro de Espiritualidad y Pastoral Venezuela",
      "role": "Diseñador de páginas web",
      "period": "marzo de 2026 - julio de 2026",
      "location": "Caracas, Distrito Federal, Venezuela",
      "bullets": [
        "...",
        "..."
      ]
    },
    {
      "company": "INGEDACA",
      "role": "Asistente del presidente & TI",
      "period": "marzo de 2026 - abril de 2026",
      "location": "Caracas, Venezuela",
      "bullets": [
        "...",
        "..."
      ]
    },
    {
      "company": "Fe y Alegría Venezuela",
      "role": "Desarrolladora Full Stack",
      "period": "agosto de 2025 - noviembre de 2025",
      "location": "Caracas, Distrito Federal, Venezuela",
      "bullets": [
        "...",
        "..."
      ]
    },
    {
      "company": "CIDE (Centro de Investigación y Desarrollo Ecuador)",
      "role": "Desarrolladora WordPress y Administradora CMS",
      "period": "enero de 2025 - julio de 2025",
      "location": "Pichincha, Ecuador (Remoto)",
      "bullets": [
        "...",
        "..."
      ]
    },
    {
      "company": "Fe y Alegría Venezuela",
      "role": "Pasante Desarrolladora de Chatbots",
      "period": "abril de 2025 - junio de 2025",
      "location": "Caracas, Distrito Federal, Venezuela",
      "bullets": [
        "...",
        "..."
      ]
    }
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
