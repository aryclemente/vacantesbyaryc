/**
 * ai-parser.js - Motor de extracción inteligente multimodal con Netlify Functions (Gemini 1.5 Flash) y Fallback Heurístico
 * Permite capturar vacantes desde texto masivo, URLs con scraping automático o capturas de pantalla (base64) sin llenado manual.
 */

class AiJobParser {
  constructor() {
    this.serverlessApiUrl = '/api/extract-job';
    this.serverlessFallbackUrl = '/.netlify/functions/extract-job';
    this.geminiDirectApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  }

  /**
   * Extrae los detalles de la vacante utilizando prioritariamente la función serverless de Netlify
   * (con Gemini 1.5 Flash y Scraping), con fallback inteligente a cliente directo o heurístico local.
   */
  async extractJobDetails({ text, imageBase64, url }) {
    const settings = window.appStorage.getSettings();
    const localApiKey = settings.geminiApiKey ? settings.geminiApiKey.trim() : null;

    // 1. Intento principal: Netlify Serverless Function (sin exponer API Keys en el cliente)
    try {
      const serverlessResult = await this.extractWithServerless({ text, imageBase64, url, localApiKey });
      if (serverlessResult) {
        return serverlessResult;
      }
    } catch (err) {
      console.warn('La función serverless no respondió o estamos en entorno local estático:', err.message);
    }

    // 2. Intento secundario: Si hay una API Key configurada localmente en el navegador
    if (localApiKey) {
      try {
        const directResult = await this.extractWithGeminiDirect({ text, imageBase64, url, apiKey: localApiKey });
        if (directResult) {
          directResult.extractionSource = 'ai-direct';
          return directResult;
        }
      } catch (err) {
        console.warn('Fallo en llamada directa a Gemini API:', err);
      }
    }

    // 3. Fallback Heurístico Local (Rápido, robusto, sin dependencias externas)
    const heuristicResult = this.extractWithHeuristics({ text, imageBase64, url });
    heuristicResult.extractionSource = 'heuristic';
    return heuristicResult;
  }

  /**
   * Llamada a la Netlify Function /api/extract-job
   */
  async extractWithServerless({ text, imageBase64, url, localApiKey }) {
    const headers = { 'Content-Type': 'application/json' };
    if (localApiKey) {
      headers['x-gemini-api-key'] = localApiKey;
    }

    const payload = JSON.stringify({ text, imageBase64, url });

    let response = await fetch(this.serverlessApiUrl, {
      method: 'POST',
      headers,
      body: payload
    }).catch(() => null);

    // Si falló el redirect de /api/, probar ruta directa de netlify
    if (!response || !response.ok) {
      response = await fetch(this.serverlessFallbackUrl, {
        method: 'POST',
        headers,
        body: payload
      }).catch(() => null);
    }

    if (!response || !response.ok) {
      return null;
    }

    const json = await response.json();
    if (json.success && json.data) {
      json.data.extractionSource = 'ai-serverless';
      return json.data;
    }

    return null;
  }

  /**
   * Llamada multimodal directa a la API de Gemini (Google AI Studio) como respaldo
   */
  async extractWithGeminiDirect({ text, imageBase64, url, apiKey }) {
    const prompt = `
Analiza la siguiente información de una vacante laboral (puede ser texto, captura de pantalla o ambos) y extrae los datos clave en formato JSON estrictamente válido.

Instrucciones de extracción:
1. "empresa": Nombre exacto de la compañía contratante.
2. "puesto": Título o cargo de la vacante.
3. "modalidad": Uno de estos tres valores: "Remoto", "Híbrido" o "Presencial".
4. "ubicacion": Ciudad, país o "Global / Remoto".
5. "salario": Rango o monto salarial si se menciona (con moneda USD, EUR, etc.). Si no aparece, deja cadena vacía "".
6. "prioridad": "high", "med" o "low" según el atractivo o relevancia técnica del puesto.
7. "contacto": Nombre, email o canal del reclutador/empresa.
8. "requisitos": Lista con los 4 a 6 requisitos o tecnologías principales.
9. "notas": Resumen breve de responsabilidades clave y estrategia recomendada para postular.

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

    if (text) {
      parts.push({ text: `Texto de la vacante:\n${text}` });
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

    const response = await fetch(`${this.geminiDirectApiUrl}?key=${apiKey}`, {
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

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Respuesta vacía de Gemini');
    }

    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
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
      notas: parsed.notas || (text ? text.slice(0, 200) : 'Captura de pantalla extraída con IA'),
      requisitos: Array.isArray(parsed.requisitos) ? parsed.requisitos : [],
      screenshot: !!imageBase64,
      aiGenerated: true
    };
  }

  /**
   * Parser inteligente local basado en heurísticas y análisis de patrones
   */
  extractWithHeuristics({ text = '', imageBase64, url = '' }) {
    let empresa = 'Empresa Detectada';
    let puesto = 'Especialista Web & TI';
    let modalidad = 'Remoto';
    let ubicacion = 'Remoto';
    let salario = '';
    let contacto = '';
    let prioridad = 'high';

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine.includes(' - ')) {
        const parts = firstLine.split(' - ');
        empresa = parts[0].trim();
        puesto = parts[1].trim();
      } else if (firstLine.includes(' at ')) {
        const parts = firstLine.split(' at ');
        puesto = parts[0].trim();
        empresa = parts[1].trim();
      } else if (firstLine.includes(' en ')) {
        const parts = firstLine.split(' en ');
        puesto = parts[0].trim();
        empresa = parts[1].trim();
      } else {
        puesto = firstLine.slice(0, 50);
        if (lines.length > 1) {
          empresa = lines[1].slice(0, 40);
        }
      }
    } else if (url) {
      try {
        const host = new URL(url).hostname.replace('www.', '').split('.')[0];
        empresa = host.charAt(0).toUpperCase() + host.slice(1);
        puesto = 'Vacante Detectada vía Enlace';
      } catch (e) {
        puesto = 'Vacante desde Enlace';
      }
    } else if (imageBase64) {
      puesto = 'Vacante desde Captura';
      empresa = 'Revisar Imagen';
    }

    if (/remot[oe]|remote|teletrabajo|work from home|wfh/i.test(text)) {
      modalidad = 'Remoto';
    } else if (/h[ií]brid[oe]|hybrid/i.test(text)) {
      modalidad = 'Híbrido';
    } else if (/presencial|on-site|office|en oficina/i.test(text)) {
      modalidad = 'Presencial';
    }

    const salaryMatch = text.match(/(\$|€|\bUSD\b|\bEUR\b)\s?[\d.,]+(\s?-\s?[\d.,]+)?(\s?(USD|EUR|k|al mes|\/mes|\/hr|mensuales))?/i);
    if (salaryMatch) {
      salario = salaryMatch[0];
    }

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      contacto = emailMatch[0];
    }

    const techCatalog = ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'PHP', 'WordPress', 'Shopify', 'SQL', 'PostgreSQL', 'Docker', 'AWS', 'Moodle', 'OJS', 'SEO', 'Tailwind', 'Next.js'];
    const detectedTechs = techCatalog.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(text));

    return {
      id: 'vac-' + Date.now(),
      empresa,
      puesto,
      modalidad,
      ubicacion,
      salario,
      prioridad,
      contacto,
      url,
      estado: 'saved',
      fecha: new Date().toISOString().split('T')[0],
      notas: text.length > 0 ? text.slice(0, 350) + (text.length > 350 ? '...' : '') : 'Datos capturados desde pantalla/enlace.',
      requisitos: detectedTechs,
      screenshot: !!imageBase64,
      aiGenerated: false
    };
  }
}

window.aiJobParser = new AiJobParser();
