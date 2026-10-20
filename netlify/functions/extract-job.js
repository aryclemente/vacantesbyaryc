/**
 * Netlify Serverless Function: extract-job
 * Procesa vacantes mediante Gemini 1.5 Flash (Visión Multimodal + Texto) y Scraping de URL.
 * Las credenciales se leen exclusivamente desde process.env.GEMINI_API_KEY.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';


/**
 * Realiza un scraping básico de URL extrayendo el contenido textual principal
 */
async function scrapeJobUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`Scraping warning: status ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();

    // Eliminar etiquetas que no aportan información sobre la vacante
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // Limitar tamaño de texto para evitar rebasar límites de tokens
    return clean.slice(0, 10000);
  } catch (err) {
    console.warn('Scraping error:', err.message);
    return null;
  }
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
    const { text = '', imageBase64 = null, url = '' } = payload;

    // Obtener la clave de Gemini desde el entorno o encabezado
    const headers = event.headers || {};
    const apiKey = process.env.GEMINI_API_KEY || headers['x-gemini-api-key'] || headers['X-Gemini-Api-Key'];


    if (!apiKey) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'NO_API_KEY',
          message: 'No se ha configurado GEMINI_API_KEY en Netlify ni en las cabeceras.'
        })
      };
    }

    let processedText = text;
    let scrapedInfo = '';

    // Si hay URL y poco texto, intentar scraping automático
    if (url && (!text || text.length < 50)) {
      const scraped = await scrapeJobUrl(url);
      if (scraped && scraped.length > 80) {
        processedText = (text ? text + '\n\n' : '') + `[Contenido extraído automáticamente de la URL]:\n${scraped}`;
        scrapedInfo = 'URL leída con scraping.';
      }
    }

    // Construcción del Prompt Estructurado para Gemini 1.5 Flash
    const prompt = `
Analiza la siguiente información de una vacante laboral (puede ser texto extraído de una web, captura de pantalla, o ambos) y extrae los datos clave en formato JSON estrictamente válido.

Instrucciones de extracción:
1. "empresa": Nombre exacto de la compañía contratante. Si no se indica, infiere el nombre más probable o escribe "Empresa por Confirmar".
2. "puesto": Título o cargo de la vacante.
3. "modalidad": Uno de estos tres valores exactos: "Remoto", "Híbrido" o "Presencial".
4. "ubicacion": Ciudad, país o "Global / Remoto".
5. "salario": Rango o monto salarial si se menciona (ej: "$1,500 - $2,500 USD", "€1,400 EUR"). Si no aparece, deja cadena vacía "".
6. "prioridad": "high", "med" o "low" según el atractivo o nivel de relevancia técnica.
7. "contacto": Nombre, email o canal del reclutador/empresa si aparece.
8. "requisitos": Lista con los 4 a 6 requisitos técnicos, herramientas o competencias principales requeridas.
9. "notas": Resumen conciso (máximo 3 líneas) de las responsabilidades principales y recomendaciones para postular.

Responde ÚNICAMENTE con el objeto JSON sin bloques de código markdown ni explicaciones adicionales:
{
  "empresa": "...",
  "puesto": "...",
  "modalidad": "...",
  "ubicacion": "...",
  "salario": "...",
  "prioridad": "...",
  "contacto": "...",
  "requisitos": ["...", "..."],
  "notas": "..."
}
`;

    const parts = [{ text: prompt }];

    if (processedText) {
      parts.push({ text: `Texto y notas de la vacante:\n${processedText}` });
    }

    if (url) {
      parts.push({ text: `URL de la oferta:\n${url}` });
    }

    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    // Consulta a la API de Google Gemini 1.5 Flash
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API Error:', geminiRes.status, errText);
      return {
        statusCode: geminiRes.status,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'GEMINI_API_ERROR',
          message: `Error desde Gemini API: ${errText}`
        })
      };
    }

    const geminiData = await geminiRes.json();
    const candidatePart = geminiData.candidates?.[0]?.content?.parts?.find(p => p.text);
    const candidateText = candidatePart?.text;


    if (!candidateText) {
      throw new Error('Respuesta vacía recibida del modelo Gemini');
    }

    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const vacancy = {
      id: 'vac-' + Date.now(),
      empresa: parsed.empresa || 'Empresa por Confirmar',
      puesto: parsed.puesto || 'Oportunidad TI',
      modalidad: parsed.modalidad || 'Remoto',
      ubicacion: parsed.ubicacion || 'Remoto',
      salario: parsed.salario || '',
      prioridad: parsed.prioridad || 'high',
      contacto: parsed.contacto || '',
      url: url || '',
      estado: 'saved',
      fecha: new Date().toISOString().split('T')[0],
      notas: parsed.notas || (scrapedInfo || (text ? text.slice(0, 200) : 'Captura de pantalla extraída con IA')),
      requisitos: Array.isArray(parsed.requisitos) ? parsed.requisitos : [],
      screenshot: !!imageBase64,
      aiGenerated: true
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: vacancy
      })
    };
  } catch (error) {
    console.error('Error en extract-job function:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      })
    };
  }
};
