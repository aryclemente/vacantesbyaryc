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

  /**
   * Llamada universal a LLMs multi-proveedor (Gemini, Claude, Kimi, OpenAI / OpenRouter)
   * Respeta la configuración BYOK del usuario guardada en settings o perfiles.
   */
  async callLlmText(prompt, systemInstruction = '') {
    const settings = (window.appStorage && window.appStorage.getSettings()) || {};
    const provider = settings.aiProvider || 'gemini';
    const apiKey = (settings.aiApiKey || settings.geminiApiKey || '').trim();

    if (!apiKey) {
      console.info('Sin API Key de IA configurada. Usando fallback heurístico local.');
      return null;
    }

    // 1. Google Gemini (2.5 Flash / 1.5 Flash)
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Error Gemini API: ${res.status}`);
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    // 2. Anthropic Claude (Claude 3.5 Sonnet / Haiku)
    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 800,
          system: systemInstruction || undefined,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!res.ok) throw new Error(`Error Claude API: ${res.status}`);
      const data = await res.json();
      return data?.content?.[0]?.text || null;
    }

    // 3. Kimi / Moonshot AI (OpenAI Compatible)
    if (provider === 'kimi') {
      const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });

      if (!res.ok) throw new Error(`Error Kimi API: ${res.status}`);
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || null;
    }

    // 4. OpenAI / OpenRouter
    if (provider === 'openai' || provider === 'openrouter') {
      const endpoint = provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const model = provider === 'openrouter' ? 'deepseek/deepseek-chat' : 'gpt-4o-mini';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });

      if (!res.ok) throw new Error(`Error ${provider} API: ${res.status}`);
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || null;
    }

    return null;
  }

  /**
   * Alias de compatibilidad para código existente
   */
  async callGeminiText(prompt) {
    return this.callLlmText(prompt);
  }

  /**
   * Smart Profile Importer: Extrae la estructura completa de un perfil profesional
   * a partir de un archivo Markdown (ej. JuanProfile.md), PDF de LinkedIn o texto pegado.
   * Cero formularios gigantes: convierte el documento en objeto JSON para public.perfiles.
   */
  async parseProfileFromText(text, filename = '') {
    if (!text || !text.trim()) {
      throw new Error('El documento proporcionado está vacío.');
    }

    // 1. Intentar extracción con IA si hay API Key disponible
    try {
      const prompt = `Analiza el siguiente texto de currículum o perfil profesional (archivo: "${filename}") y extrae toda la información en un formato JSON estrictamente estructurado.
Devuelve ÚNICAMENTE el bloque JSON sin formato adicional ni explicaciones.

Esquema requerido:
{
  "nombre": "Nombre completo de la persona",
  "titular": "Título profesional o cargo actual / deseado (ej. Senior Frontend Engineer)",
  "email": "Correo electrónico",
  "telefono": "Teléfono con código de país si está presente",
  "ubicacion": "Ciudad y País de residencia",
  "enlaces": {
    "linkedin": "URL o slug de LinkedIn",
    "github": "URL o slug de GitHub",
    "portafolio": "URL de portafolio",
    "web": "Sitio web o blog personal"
  },
  "resumen": "Resumen o perfil profesional redactado en 3 a 4 líneas persuasivas y objetivas.",
  "habilidades": ["Habilidad 1", "Habilidad 2", "Habilidad 3"],
  "educacion": [
    {
      "titulo": "Grado o carrera",
      "institucion": "Universidad o Instituto",
      "periodo": "Años (ej. 2020 - 2024)"
    }
  ],
  "experiencias": [
    {
      "id": "exp-1",
      "empresa": "Nombre de la empresa",
      "puesto": "Cargo desempeñado",
      "periodo": "Fechas (ej. Enero 2024 - Presente)",
      "ubicacion": "Ciudad / Modalidad",
      "bullets": [
        "Logro o viñeta 1 demostrable con métricas o alcance técnico",
        "Logro o viñeta 2"
      ]
    }
  ]
}

Texto del perfil / CV a analizar:
"""
${text.slice(0, 10000)}
"""`;

      const aiResponse = await this.callLlmText(prompt, 'Eres un Asistente Experto en Extracción de Datos de CVs y Perfiles Tech en JSON estructurado.');
      if (aiResponse) {
        const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.nombre) {
          parsed.extractionSource = 'ai';
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Extracción con IA falló o no está configurada. Ejecutando parser heurístico Markdown:', e);
    }

    // 2. Parser Heurístico Determinista (0 Tokens / Offline) para Markdown y Texto
    return this.parseProfileHeuristically(text, filename);
  }

  /**
   * Parser heurístico local determinista para archivos Markdown / Perfiles LinkedIn
   */
  /**
   * Extrae el texto real de todas las páginas de un archivo PDF en el navegador con pdf.js
   */
  async extractTextFromPdf(arrayBuffer) {
    if (typeof window.pdfjsLib === 'undefined') {
      throw new Error('La biblioteca lectora de PDF (pdf.js) aún no está disponible en la página.');
    }

    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageLines = [];
        let lastY = null;
        let currentLine = [];

        textContent.items.forEach(item => {
          if (!item.str || !item.str.trim()) return;
          // Agrupar por coordenada Y aproximada para conservar saltos de línea
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageLines.push(currentLine.join(' '));
            currentLine = [];
          }
          currentLine.push(item.str.trim());
          lastY = item.transform[5];
        });

        if (currentLine.length > 0) {
          pageLines.push(currentLine.join(' '));
        }

        fullText += pageLines.join('\n') + '\n\n';
      }

      return fullText.trim();
    } catch (err) {
      console.error('Error al decodificar PDF:', err);
      throw new Error('No se pudo leer el contenido de texto del PDF: ' + (err.message || 'formato no estándar o escaneado como imagen'));
    }
  }

  /**
   * Parser heurístico local determinista para archivos Markdown, PDF de CVs y perfiles de LinkedIn
   */
  parseProfileHeuristically(text, filename = '') {
    if (!text || !text.trim()) {
      return {
        nombre: 'Usuario',
        titular: 'Profesional Tech',
        email: '',
        telefono: '',
        ubicacion: 'Disponible Remoto',
        enlaces: { linkedin: '', github: '', portafolio: '', web: '' },
        resumen: '',
        habilidades: ['JavaScript', 'HTML5', 'CSS3', 'Git'],
        educacion: [],
        experiencias: []
      };
    }

    // Normalizar texto y caracteres de viñetas
    const normalizedText = text
      .replace(/[•●▪■◆–—]/g, '-')
      .replace(/\r\n/g, '\n');
    const lines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean);

    let nombre = '';
    let titular = '';
    let email = '';
    let telefono = '';
    let ubicacion = '';
    const enlaces = { linkedin: '', github: '', portafolio: '', web: '' };
    let resumen = '';
    const habilidades = [];
    const educacion = [];
    const experiencias = [];

    // 1. Extraer Email
    const emailMatch = normalizedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0].toLowerCase();

    // 2. Extraer Teléfono
    const telMatch = normalizedText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}/);
    if (telMatch && telMatch[0].replace(/\D/g, '').length >= 8) {
      telefono = telMatch[0].trim();
    }

    // 3. Extraer Enlaces
    const linkedInMatch = normalizedText.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    if (linkedInMatch) enlaces.linkedin = 'linkedin.com/in/' + linkedInMatch[1];

    const githubMatch = normalizedText.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
    if (githubMatch) enlaces.github = 'github.com/' + githubMatch[1];

    // 4. Ubicación
    const locationKeywords = [
      'Remoto', 'Remote', 'España', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla',
      'Caracas', 'Venezuela', 'Colombia', 'Bogotá', 'Medellín', 'México', 'CDMX',
      'Argentina', 'Buenos Aires', 'Chile', 'Santiago', 'Perú', 'Lima', 'Híbrido'
    ];
    for (const loc of locationKeywords) {
      const locRegex = new RegExp(`\\b${loc}\\b`, 'i');
      if (locRegex.test(normalizedText)) {
        ubicacion = loc.includes('Remoto') || loc.includes('Remote') ? 'Remoto Internacional' : `${loc} (Disponible Remoto)`;
        break;
      }
    }
    if (!ubicacion) ubicacion = 'Disponible Remoto';

    // 5. Nombre y Titular (Prioridad: encabezados de CV o líneas superiores limpias)
    const nonNamePatterns = /curriculum|vitae|resume|hoja de vida|contacto|perfil|experiencia|educacion|habilidades|summary|about|phone|email|teléfono|correo/i;

    for (let i = 0; i < Math.min(12, lines.length); i++) {
      const line = lines[i];

      // Formato Markdown "# Nombre" o "**Nombre:** Juan"
      if (/^#\s+([A-ZÁÉÍÓÚ][a-záéíóúA-ZÁÉÍÓÚ\s]+)/.test(line)) {
        nombre = line.replace(/^#\s+/, '').replace(/\/\/.*/, '').trim();
        if (lines[i + 1] && !lines[i + 1].startsWith('#')) {
          titular = lines[i + 1].replace(/\*\*/g, '').replace(/Rol Principal:\s*/i, '').trim();
        }
        break;
      } else if (/^\*\*(?:Nombre|Name):\*\*\s*(.+)/i.test(line)) {
        nombre = line.replace(/^\*\*(?:Nombre|Name):\*\*\s*/i, '').trim();
      } else if (/^\*\*(?:Rol|Puesto|Headline|Cargo|Titular):\*\*\s*(.+)/i.test(line)) {
        titular = line.replace(/^\*\*(?:Rol|Puesto|Headline|Cargo|Titular):\*\*\s*/i, '').trim();
      } else if (!nombre && line.length >= 3 && line.length <= 40 && !nonNamePatterns.test(line) && !line.includes('@') && !line.includes('http')) {
        // Detectar 2 a 4 palabras que parezcan un nombre propio
        const words = line.split(/\s+/);
        const looksLikeName = words.length >= 2 && words.length <= 4 && words.every(w => /^[A-ZÁÉÍÓÚ][a-záéíóúA-ZÁÉÍÓÚ.'-]+$/.test(w));
        if (looksLikeName) {
          nombre = line;
          if (lines[i + 1] && lines[i + 1].length < 60 && !nonNamePatterns.test(lines[i + 1])) {
            titular = lines[i + 1].replace(/[-|]/g, '').trim();
          }
        }
      }
    }

    if (!nombre) {
      // Si el email tiene formato nombre.apellido@gmail.com
      if (email) {
        const localPart = email.split('@')[0];
        const parts = localPart.split(/[._-]/).filter(p => p.length > 2 && !/\d/.test(p));
        if (parts.length >= 2) {
          nombre = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
      }
      if (!nombre && filename) {
        nombre = filename.replace(/\.(pdf|md|txt)$/i, '').replace(/cv|profile|perfil|resume/gi, '').trim() || 'Mi Perfil';
      }
    }

    // 6. Diccionario Extendido de Habilidades Tech (+120 tecnologías modernas)
    const techDictionary = [
      'JavaScript', 'TypeScript', 'React', 'React.js', 'Next.js', 'Vue.js', 'Vue', 'Nuxt.js',
      'Angular', 'Svelte', 'Node.js', 'Express', 'NestJS', 'PHP', 'Laravel', 'Symfony',
      'Python', 'Django', 'FastAPI', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET', 'ASP.NET',
      'Go', 'Golang', 'Rust', 'Ruby', 'Ruby on Rails', 'HTML5', 'CSS3', 'TailwindCSS', 'Sass',
      'Bootstrap', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Supabase', 'Firebase',
      'GraphQL', 'REST APIs', 'RESTful', 'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'GCP',
      'Azure', 'Git', 'GitHub', 'GitLab', 'CI/CD', 'Linux', 'Nginx', 'Apache', 'Vercel', 'Netlify',
      'WordPress', 'WooCommerce', 'Shopify', 'Strapi', 'Headless CMS', 'Moodle LMS', 'Figma',
      'UI/UX', 'Jest', 'Cypress', 'Playwright', 'QA', 'Testing', 'Scrum', 'Agile', 'Jira',
      'Kanban', 'SEO', 'Data Analysis', 'Pandas', 'NumPy', 'OpenAI API', 'Chatbots', 'LLMs',
      'Machine Learning', 'English', 'Inglés', 'Full Stack', 'Frontend', 'Backend'
    ];

    techDictionary.forEach(tech => {
      const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(normalizedText)) {
        const canonical = tech === 'React.js' ? 'React' :
                          tech === 'Vue' ? 'Vue.js' :
                          tech === 'Golang' ? 'Go' :
                          tech === 'RESTful' ? 'REST APIs' : tech;
        if (!habilidades.includes(canonical)) {
          habilidades.push(canonical);
        }
      }
    });

    // Titular por defecto si no se detectó
    if (!titular) {
      if (habilidades.includes('Full Stack') || (habilidades.includes('React') && habilidades.includes('Node.js'))) {
        titular = 'Full Stack Developer';
      } else if (habilidades.includes('React') || habilidades.includes('Frontend') || habilidades.includes('Vue.js')) {
        titular = 'Frontend Developer';
      } else if (habilidades.includes('Python') || habilidades.includes('PHP') || habilidades.includes('Backend') || habilidades.includes('Laravel')) {
        titular = 'Backend Developer';
      } else if (habilidades.length > 0) {
        titular = `${habilidades[0]} Specialist`;
      } else {
        titular = 'Desarrollador de Software';
      }
    }

    // 7. Detección Inteligente de Secciones de Experiencia en CVs y PDFs
    const datePattern = /(?:(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|jan|january|february|march|april|june|july|august|september|october|november|december)\w*[\s.,-]*)*(?:19\d\d|20\d\d)[\s–—-]*(?:(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|jan|january|february|march|april|june|july|august|september|october|november|december)\w*[\s.,-]*)*(?:19\d\d|20\d\d|presente|actualidad|present|current)?/i;

    let expIdCounter = 1;
    let isInsideExpSection = false;
    let currentExp = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detectar inicio de sección de experiencia
      if (/^(?:#+\s*)?(?:experiencia|experience|trayectoria|historial profesional|historial laboral|work history)/i.test(line)) {
        isInsideExpSection = true;
        continue;
      }

      // Detectar fin de sección de experiencia
      if (isInsideExpSection && /^(?:#+\s*)?(?:educaci[oó]n|education|habilidades|skills|idiomas|languages|certificaciones|certifications|cursos|proyectos|projects|referencias)/i.test(line)) {
        if (currentExp && (currentExp.empresa || currentExp.puesto)) {
          experiencias.push(currentExp);
          currentExp = null;
        }
        isInsideExpSection = false;
        continue;
      }

      // Si encontramos una línea con fechas de trabajo
      const hasDate = datePattern.test(line);

      if (isInsideExpSection || hasDate) {
        if (hasDate) {
          if (currentExp && (currentExp.empresa || currentExp.puesto)) {
            experiencias.push(currentExp);
          }

          const matchDate = line.match(datePattern);
          const periodStr = matchDate ? matchDate[0].trim() : 'Historial reciente';
          const lineWithoutDate = line.replace(datePattern, '').replace(/[-|•()]/g, '').trim();

          // Buscar el puesto o empresa en la línea actual o inmediatamente anterior
          let titleOrCompany = lineWithoutDate;
          let prevLine = (i > 0 && lines[i - 1].length < 80 && !lines[i - 1].startsWith('-')) ? lines[i - 1] : '';

          currentExp = {
            id: 'exp-' + (expIdCounter++),
            empresa: prevLine || titleOrCompany || 'Empresa Tech',
            puesto: titleOrCompany && titleOrCompany !== prevLine ? titleOrCompany : titular,
            periodo: periodStr,
            ubicacion: 'Remoto',
            bullets: []
          };
          continue;
        }

        // Si ya tenemos una experiencia activa y la línea es una viñeta o descripción
        if (currentExp) {
          if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
            const bulletText = line.replace(/^[-*•]\s*/, '').trim();
            if (bulletText.length > 5 && currentExp.bullets.length < 5) {
              currentExp.bullets.push(bulletText);
            }
          } else if (line.length > 15 && !line.includes(':') && currentExp.bullets.length < 4) {
            currentExp.bullets.push(line);
          }
        }
      }

      // 8. Resumen Profesional
      if (!resumen && /^(?:#+\s*)?(?:resumen|perfil|perfil profesional|acerca de|about|summary|extracto)/i.test(line)) {
        const nextLines = lines.slice(i + 1, i + 4).filter(l => !l.startsWith('#') && !l.startsWith('-'));
        if (nextLines.length > 0) {
          resumen = nextLines.join(' ');
        }
      }
    }

    if (currentExp && (currentExp.empresa || currentExp.puesto)) {
      experiencias.push(currentExp);
    }

    // Resumen por defecto conciso si no se detectó un párrafo explícito
    if (!resumen) {
      const topSkills = habilidades.slice(0, 5).join(', ');
      resumen = `${titular} con experiencia en ${topSkills || 'desarrollo de software y soluciones digitales'}. Enfocado/a en buenas prácticas de ingeniería, escalabilidad y entrega de valor.`;
    }

    return {
      nombre: nombre || 'Usuario',
      titular: titular || 'Desarrollador de Software',
      email,
      telefono,
      ubicacion,
      enlaces,
      resumen,
      habilidades: habilidades.length > 0 ? habilidades : ['JavaScript', 'HTML5', 'CSS3', 'Git', 'React'],
      educacion,
      experiencias: experiencias.length > 0 ? experiencias : [
        {
          id: 'exp-1',
          empresa: 'Empresa Principal',
          puesto: titular || 'Desarrollador de Software',
          periodo: '2023 - Presente',
          ubicacion: 'Remoto',
          bullets: ['Desarrollo e implementación de soluciones técnicas alineadas al negocio.']
        }
      ],
      extractionSource: 'heuristic-cv'
    };
  }
}

window.aiJobParser = new AiJobParser();
window.aiParser = window.aiJobParser;
