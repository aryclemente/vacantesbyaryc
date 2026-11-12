/**
 * Netlify Serverless Function: radar-jobs
 * Agrega vacantes reales en vivo desde APIs públicas (Remotive, Arbeitnow, Jobicy),
 * descarta enlaces de búsqueda genéricos y verifica activamente que la URL de cada vacante responda.
 */

const SEARCH_URL_PATTERNS = [
  /\/jobs\?(?:.*&)?(?:q|query|keywords|search)=/i,
  /\/ofertas\?(?:.*&)?(?:q|query|palabra)=/i,
  /\/search(?:\/|\?|$)/i,
  /jobsearch/i,
  /trabajo-de-/i,
  /empleos-de-/i,
  /linkedin\.com\/jobs\/search/i,
  /indeed\.[a-z.]+\/jobs\?/i
];

function isDirectVacancyUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    // Debe tener una ruta específica más allá de "/"
    if (!parsed.pathname || parsed.pathname === '/') return false;
    if (SEARCH_URL_PATTERNS.some(re => re.test(rawUrl))) return false;
    return true;
  } catch {
    return false;
  }
}

async function checkUrlIsActive(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2600);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'VacantesByAryC-LinkValidator/1.0' }
    });

    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'VacantesByAryC-LinkValidator/1.0' }
      });
    }

    // Descartar rutas rotas (404, 410, 5xx) o redirecciones a buscadores genéricos
    if (res.status === 404 || res.status === 410 || res.status >= 500) {
      return false;
    }
    if (res.url && !isDirectVacancyUrl(res.url)) {
      return false;
    }
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function classifyMarket(locationStr = '') {
  const lower = locationStr.toLowerCase();
  if (/(spain|españa|madrid|barcelona|valencia|sevilla|bilbao|málaga)/i.test(lower)) return 'spain';
  if (/(venezuela|caracas|latam|latin america|colombia|méxico|mexico|argentina|chile|perú|peru|ecuador)/i.test(lower)) return 'latam';
  return 'remote';
}

function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchRemotive() {
  const res = await fetch('https://remotive.com/api/remote-jobs?limit=25', {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data?.jobs)) return [];
  return data.jobs.map(item => ({
    id: `remotive-${item.id}`,
    empresa: item.company_name || 'Empresa Remota',
    puesto: item.title || 'Oportunidad Tech',
    modalidad: 'Remoto',
    ubicacion: item.candidate_required_location || 'Remoto Global',
    mercado: classifyMarket(item.candidate_required_location || 'remote'),
    salario: item.salary || '',
    salarioNum: 0,
    tipo: item.job_type === 'full_time' ? 'Tiempo Completo' : (item.job_type || 'Tiempo Completo'),
    plataforma: 'remotive',
    plataformaNombre: 'Remotive',
    url: item.url,
    fecha: item.publication_date ? item.publication_date.split('T')[0] : new Date().toISOString().split('T')[0],
    descripcion: stripHtml(item.description).slice(0, 210) + '...',
    requisitos: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 5) : ['Remoto', 'Desarrollo Web']
  }));
}

async function fetchArbeitnow() {
  const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data?.data)) return [];
  return data.data.slice(0, 25).map(item => {
    const loc = item.location || (item.remote ? 'Remoto Europa / Global' : 'Europa');
    return {
      id: `arbeitnow-${item.slug}`,
      empresa: item.company_name || 'Empresa Tech',
      puesto: item.title || 'Software Position',
      modalidad: item.remote ? 'Remoto' : 'Híbrido / Presencial',
      ubicacion: loc,
      mercado: item.remote ? 'remote' : classifyMarket(loc),
      salario: '',
      salarioNum: 0,
      tipo: Array.isArray(item.job_types) && item.job_types.length > 0 ? item.job_types[0] : 'Tiempo Completo',
      plataforma: 'arbeitnow',
      plataformaNombre: 'Arbeitnow',
      url: item.url,
      fecha: item.created_at ? new Date(item.created_at * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      descripcion: stripHtml(item.description).slice(0, 210) + '...',
      requisitos: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 5) : ['Tech', 'Software']
    };
  });
}

async function fetchJobicy() {
  const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=20', {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data?.jobs)) return [];
  return data.jobs.map(item => {
    const loc = item.jobGeo || 'Remoto Global';
    const salMin = Number(item.annualSalaryMin || 0);
    const salMax = Number(item.annualSalaryMax || 0);
    const salText = (salMin || salMax) ? `$${salMin || salMax} - $${salMax || salMin} ${item.salaryCurrency || 'USD'}/año` : '';
    return {
      id: `jobicy-${item.id}`,
      empresa: item.companyName || 'Empresa Remota',
      puesto: item.jobTitle || 'Remote Tech Role',
      modalidad: 'Remoto',
      ubicacion: loc,
      mercado: classifyMarket(loc),
      salario: salText,
      salarioNum: salMax || salMin || 0,
      tipo: item.jobType ? String(item.jobType) : 'Tiempo Completo',
      plataforma: 'jobicy',
      plataformaNombre: 'Jobicy',
      url: item.url,
      fecha: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      descripcion: stripHtml(item.jobExcerpt || item.jobDescription || '').slice(0, 210) + '...',
      requisitos: Array.isArray(item.jobIndustry) && item.jobIndustry.length > 0 ? item.jobIndustry.slice(0, 4) : ['Remoto', 'Tech']
    };
  });
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const settled = await Promise.allSettled([fetchRemotive(), fetchArbeitnow(), fetchJobicy()]);
    const rawJobs = settled
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter(j => isDirectVacancyUrl(j.url));

    // Deduplicar por URL
    const seenUrls = new Set();
    const uniqueCandidates = [];
    for (const job of rawJobs) {
      const normUrl = job.url.trim().toLowerCase();
      if (!seenUrls.has(normUrl)) {
        seenUrls.add(normUrl);
        uniqueCandidates.push(job);
      }
    }

    // Verificar activamente los enlaces en lotes concurrentes (máx. 24 para responder rápido dentro del timeout serverless)
    const toVerify = uniqueCandidates.slice(0, 24);
    const verifications = await Promise.all(
      toVerify.map(async (job) => {
        const active = await checkUrlIsActive(job.url);
        return active ? { ...job, urlVerified: true } : null;
      })
    );

    const verifiedJobs = verifications.filter(Boolean);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        verifiedAt: new Date().toISOString(),
        totalChecked: toVerify.length,
        jobs: verifiedJobs
      })
    };
  } catch (error) {
    console.error('Error en radar-jobs function:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: error.message, jobs: [] })
    };
  }
};
