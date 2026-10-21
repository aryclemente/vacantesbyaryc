/**
 * Netlify Serverless Function: interview-coach
 * Entrenador de entrevistas con Gemini 2.5 Flash:
 * 1. Genera FAQs y preguntas de entrevista técnica y conductual específicas para la vacante.
 * 2. Mantiene una sesión interactiva de coaching / simulacro de entrevista.
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

Proyectos y Experiencia Real:
- Colegio Gonzaga (2026): Rediseño UX/UI, optimización WPO, Pasarela Multicuenta (Pago Móvil, Transferencias Bs, Mercantil C2P y Zinli USD con +900 transacciones mensuales), GA4 y APIs bancarias.
- Centro de Espiritualidad y Pastoral Venezuela (2026): WordPress Oasis Design System, mapa SVG interactivo, Meta API, Custom Post Types.
- INGEDACA (2026): Arquitectura web corporativa, ERP Odoo, seguridad IT y accesos.
- Fe y Alegría Venezuela (2025): Sistema de donaciones en Laravel con transacciones seguras y SQL, landing en WordPress SEO, y Chatbot IA con JavaScript y Gemini 2.5 API.
- CIDE Ecuador (2025): Plugin de validación de base de datos en WordPress en tiempo real, plataformas LMS Moodle / LearnDash, repositorios DSpace y revistas OJS.
`;

function getHeuristicFaqs(vacancy) {
  const empresa = vacancy.empresa || 'la empresa';
  const puesto = vacancy.puesto || 'Desarrollador Full Stack';

  return [
    {
      category: 'Experiencia & Casos de Éxito',
      question: `¿Podrías hablarnos de un proyecto donde hayas gestionado transacciones críticas o arquitecturas complejas que prepare tu perfil para ${empresa}?`,
      whyAsked: 'Evalúan tu capacidad para asumir responsabilidades técnicas de misión crítica con impacto real.',
      answerStrategy: 'Aplica el método STAR destacando el sistema de pagos multicuenta del Colegio Gonzaga o el sistema de donaciones en Laravel para Fe y Alegría.',
      suggestedPoints: [
        'Menciona las +900 transacciones mensuales procesadas con Pago Móvil, C2P Mercantil y Zinli USD.',
        'Explica la conciliación en tiempo real y el manejo de errores en pasarelas bancarias.',
        'Destaca la integridad de datos y seguridad transaccional.'
      ]
    },
    {
      category: 'Técnica & Rendimiento Web',
      question: `¿Cómo abordas la optimización de rendimiento (WPO) y Core Web Vitals en aplicaciones web modernas?`,
      whyAsked: 'Verifican que no solo sepas programar, sino construir soluciones rápidas, accesibles y optimizadas.',
      answerStrategy: 'Relata tu experiencia optimizando tiempos de carga en portales corporativos y e-commerce.',
      suggestedPoints: [
        'Uso de compresión de assets, carga diferida (lazy loading) y reducción de tiempo de bloqueo.',
        'Optimización de consultas a bases de datos e indexación.',
        'Mejora de métricas LCP, FID/INP y CLS en más de un 40%.'
      ]
    },
    {
      category: 'Integración de IA & Automatización',
      question: `¿Qué experiencia tienes integrando Inteligencia Artificial en flujos operativos y aplicaciones?`,
      whyAsked: 'Comprueban si estás a la vanguardia tecnológica y si puedes acelerar procesos de desarrollo.',
      answerStrategy: 'Menciona tus integraciones con Google Gemini 2.5 tanto en chatbots para Fe y Alegría como en Vacantes by AryC.',
      suggestedPoints: [
        'Consumo de modelos multimodales (visión + texto) para extracción automatizada de datos a JSON.',
        'Manejo de prompts estructurados y control de costos/tokens.',
        'Diseño de fallbacks heurísticos para garantizar 100% de disponibilidad.'
      ]
    },
    {
      category: 'Metodología & Resolución de Incidentes',
      question: `Cuéntanos sobre una situación imprevista o caída de un servicio y cómo la resolviste.`,
      whyAsked: 'Miden tu templanza, capacidad diagnóstica y rigurosidad metodológica.',
      answerStrategy: 'Describe tu experiencia en soporte de Nivel 2/3 y gestión de contingencias en Moodle o pasarelas de pago.',
      suggestedPoints: [
        'Identificación de la causa raíz mediante logs y auditoría.',
        'Mitigación inmediata del impacto para los usuarios.',
        'Documentación y despliegue del parche definitivo en producción.'
      ]
    },
    {
      category: 'Trabajo Remoto & Autonomía',
      question: `¿Cómo te organizas para trabajar de forma remota y comunicarte asíncronamente con equipos distribuidos?`,
      whyAsked: 'Buscan seguridad de que eres autónoma, proactiva y mantienes transparencia continua.',
      answerStrategy: 'Enfatiza tu experiencia con clientes en Venezuela, Ecuador y Perú usando Git, Slack, ClickUp y documentación clara.',
      suggestedPoints: [
        'Actualización continua del estado de tareas y blockers.',
        'Manuales técnicos y documentación rigurosa para evitar dependencias innecesarias.',
        'Compromiso con entregas a tiempo y respeto a las zonas horarias.'
      ]
    }
  ];
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
    const { action = 'generate_faqs', vacancy, message = '', history = [], cvBase = DEFAULT_MASTER_CV } = payload;

    if (!vacancy) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Falta información de la vacante' })
      };
    }

    const headers = event.headers || {};
    const apiKey = process.env.GEMINI_API_KEY || headers['x-gemini-api-key'] || headers['X-Gemini-Api-Key'];

    // 1. Acción: Generar FAQs de entrevista
    if (action === 'generate_faqs') {
      if (!apiKey) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, source: 'heuristic', data: { faqs: getHeuristicFaqs(vacancy) } })
        };
      }

      const prompt = `
Eres un Líder Técnico y Reclutador de Élite que va a entrevistar a Arianna Clemente para el puesto de "${vacancy.puesto}" en la empresa "${vacancy.empresa}".

Perfil de Arianna Clemente (CV):
${cvBase}

Detalles de la Vacante:
- Empresa: ${vacancy.empresa}
- Puesto: ${vacancy.puesto}
- Modalidad: ${vacancy.modalidad || 'Remoto'}
- Requisitos: ${(vacancy.requisitos || []).join(', ')}
- Notas: ${vacancy.notas || ''}

Tu tarea:
Genera las 5 preguntas más probables y determinantes que le harán a Arianna en esta entrevista (2 técnicas de su stack, 1 sobre arquitectura/rendimiento, 1 de resolución de incidentes/STAR y 1 de ajuste cultural/remoto).
Para cada pregunta, indica el motivo por el cual se la preguntan, la estrategia de respuesta recomendada conectando con sus proyectos reales (Gonzaga pasarela de pagos, Fe y Alegría Laravel/Chatbots, CIDE Moodle/OJS), y 3 viñetas con los puntos exactos que debe mencionar.

Responde ÚNICAMENTE en formato JSON estrictamente válido:
{
  "faqs": [
    {
      "category": "...",
      "question": "...",
      "whyAsked": "...",
      "answerStrategy": "...",
      "suggestedPoints": ["...", "...", "..."]
    }
  ]
}
`;

      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        })
      });

      if (!geminiRes.ok) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, source: 'heuristic', data: { faqs: getHeuristicFaqs(vacancy) } })
        };
      }

      const data = await geminiRes.json();
      const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
      const parsed = JSON.parse(textPart.replace(/```json/g, '').replace(/```/g, '').trim());

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, source: 'gemini_2.5_flash', data: parsed })
      };
    }

    // 2. Acción: Chat interactivo / Simulador de entrevista
    if (action === 'chat') {
      if (!apiKey) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            source: 'heuristic',
            data: {
              reply: `¡Excelente pregunta! Para ${vacancy.puesto} en ${vacancy.empresa}, te sugiero estructurar tu respuesta con el método STAR: inicia mencionando tu rol en el Colegio Gonzaga integrando la pasarela multicuenta (+900 tx/mes) o el sistema en Laravel en Fe y Alegría. Concluye explicando cómo esa misma solvencia técnica la aplicarás desde el primer día en ${vacancy.empresa}.`
            }
          })
        };
      }

      const systemInstruction = `
Eres el Coach de Entrevistas Técnicas para Arianna Clemente, preparándola para una entrevista clave en "${vacancy.empresa}" como "${vacancy.puesto}".
Conoces todo su perfil real:
${cvBase}

Vacante objetivo:
- Empresa: ${vacancy.empresa}
- Puesto: ${vacancy.puesto}
- Requisitos: ${(vacancy.requisitos || []).join(', ')}

Directrices de conversación:
- Eres constructiva, profesional, empática pero rigurosa.
- Ayuda a Arianna a brillar conectando sus proyectos reales (Gonzaga pagos, Laravel donaciones, Moodle/OJS, Chatbots Gemini) con lo que busca ${vacancy.empresa}.
- Si ella te hace una pregunta, respóndele de forma concisa, práctica y con ejemplos concretos.
- Si ella te pide simular una pregunta de entrevista, hazle una pregunta técnica o conductual desafiante y pídele su respuesta para darle feedback.
- Mantén las respuestas en 2 a 4 párrafos claros y directos.
`;

      const contents = [];
      contents.push({ role: 'user', parts: [{ text: systemInstruction }] });
      contents.push({ role: 'model', parts: [{ text: `Entendido. Soy tu Coach de Entrevistas Técnicas para ${vacancy.puesto} en ${vacancy.empresa}. Estoy lista para ayudarte a preparar tus respuestas, afinar tu pitch y superar con éxito cualquier pregunta técnica o conductual. ¿Qué te gustaría practicar o consultar primero?` }] });

      // Añadir historial reciente (últimos 6 mensajes para no desbordar tokens)
      const recentHistory = history.slice(-6);
      for (const h of recentHistory) {
        contents.push({
          role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text || h.content || '' }]
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.3 }
        })
      });

      if (!geminiRes.ok) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            source: 'heuristic_fallback',
            data: {
              reply: `Para ${vacancy.puesto} en ${vacancy.empresa}, enfoca tu respuesta destacando cómo tus proyectos en producción (como la pasarela multicuenta en Gonzaga o el sistema en Laravel) te dieron solvencia técnica para adaptarte rápidamente a sus requerimientos.`
            }
          })
        };
      }

      const data = await geminiRes.json();
      const replyText = data.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || 'No pude generar la respuesta en este momento.';

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          source: 'gemini_2.5_flash',
          data: { reply: replyText }
        })
      };
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Acción no válida' })
    };
  } catch (err) {
    console.error('Error in interview-coach function:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
