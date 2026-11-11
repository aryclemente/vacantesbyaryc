/**
 * storage.js - Capa de almacenamiento y persistencia de Vacantes by AryC
 * Maneja persistencia en localStorage, reactividad con suscriptores y datos semilla extraídos de Gemini.
 */

const STORAGE_KEY = 'aryc_vacancies_data';
const SETTINGS_KEY = 'aryc_app_settings';
const PROFILE_KEY = 'aryc_master_profile';

/**
 * CryptoVault - Cifrado simétrico autenticado AES-256-GCM (Web Crypto API)
 * Cifra API Keys del usuario antes de persistirlas en Supabase (public.perfiles.ai_settings) y almacenamiento local.
 */
const CryptoVault = {
  _toBase64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  },
  _fromBase64(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  },
  async _deriveKey(secretSeed, saltBytes) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(`aryc-vault-v1:${secretSeed}`),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },
  async encrypt(plaintext, userId) {
    if (!plaintext) return null;
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('Web Crypto API no disponible para cifrar la API Key.');
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await this._deriveKey(userId || 'local', salt);
    const encoded = new TextEncoder().encode(plaintext);
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);
    return {
      v: 1,
      alg: 'AES-GCM-256',
      salt: this._toBase64(salt),
      iv: this._toBase64(iv),
      ct: this._toBase64(new Uint8Array(cipherBuf))
    };
  },
  async decrypt(payload, userId) {
    if (!payload || typeof payload !== 'object' || !payload.ct || !payload.iv || !payload.salt) {
      return '';
    }
    if (typeof crypto === 'undefined' || !crypto.subtle) return '';
    try {
      const salt = this._fromBase64(payload.salt);
      const iv = this._fromBase64(payload.iv);
      const ct = this._fromBase64(payload.ct);
      const aesKey = await this._deriveKey(userId || 'local', salt);
      const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
      return new TextDecoder().decode(plainBuf);
    } catch (e) {
      console.warn('No se pudo descifrar la API Key almacenada:', e.message);
      return '';
    }
  }
};

// Perfil Maestro de Arianna Clemente (Garantía de Preservación de Datos 100%)
const ARIANNA_MASTER_PROFILE = {
  nombre: 'Arianna Clemente',
  titular: 'Full Stack Developer & Especialista en Soluciones TI / Web',
  email: 'hello.ary.code@gmail.com',
  telefono: '+58 412 000 0000',
  ubicacion: 'Caracas, Venezuela (Disponible Remoto Internacional)',
  enlaces: {
    github: 'github.com/aryclemente',
    linkedin: 'linkedin.com/in/aryclement',
    portafolio: 'https://portfoliodevariannaclemente.framer.website/',
    web: ''
  },
  resumen: 'Especialista en Desarrollo de Software, Arquitecturas Web Escalables y Soluciones TI con sólida experiencia liderando proyectos Frontend y Backend, modernización de plataformas LMS Moodle, ecosistemas PHP/Laravel/JavaScript y pasarelas de pago transaccionales.',
  habilidades: [
    'PHP', 'Laravel', 'React', 'JavaScript', 'WordPress', 'WooCommerce',
    'Moodle LMS', 'PostgreSQL', 'MySQL', 'Pasarelas de Pago', 'Supabase',
    'Docker', 'REST APIs', 'Git', 'Google Gemini API', 'TailwindCSS', 'Core Web Vitals'
  ],
  educacion: [
    {
      titulo: 'Técnico Superior en Informática',
      institucion: 'Instituto Universitario Jesús Obrero (IUJO)',
      periodo: '2022 - 2025'
    },
    {
      titulo: 'Técnico Medio en Programación Informática',
      institucion: 'Instituto Técnico Jesús Obrero (ITJO)',
      periodo: '2016 - 2019'
    }
  ],
  experiencias: [
    {
      id: 'exp-gonzaga',
      empresa: 'Colegio Gonzaga',
      puesto: 'Desarrollador de sistemas',
      periodo: 'Febrero 2026 - Octubre 2026',
      ubicacion: 'Maracaibo / Remoto',
      bullets: [
        'Rediseño & UX/UI: Optimización de rendimiento web (WPO) y reestructuración completa de la arquitectura del portal colegiogonzaga.org.ve.',
        'Pasarela Multicuenta: Desarrollo e integración de Gonzaga Admin para procesar Pago Móvil, Transferencias Bs, Mercantil C2P y Zinli USD (+900 transacciones mensuales).',
        'Analítica & Automatización: Configuración de GA4, reportes en tiempo real, alertas de tesorería y re-consultas con la API Banco Mercantil.'
      ]
    },
    {
      id: 'exp-pastoral',
      empresa: 'Centro de Espiritualidad y Pastoral Venezuela',
      puesto: 'Diseñador Web & Desarrollador WordPress',
      periodo: 'Marzo 2026 - Julio 2026',
      ubicacion: 'Caracas, Venezuela',
      bullets: [
        'Arquitectura Web: Despliegue de plataforma nacional en WordPress, escalando de 7 a 11 páginas responsivas.',
        'Sistema de Diseño Oasis: Tokens y componentes alineados al manual de identidad jesuita.',
        'Componentes Dinámicos: Mapa interactivo SVG por estados y gestión responsiva de agenda pastoral.',
        'Auditoría e Integraciones: Conexión con API de Meta, Custom Post Types (CPT) y manual técnico integral.'
      ]
    },
    {
      id: 'exp-ingedaca',
      empresa: 'INGEDACA',
      puesto: 'Asistente de Presidencia & TI',
      periodo: 'Marzo 2026 - Abril 2026',
      ubicacion: 'Caracas, Venezuela',
      bullets: [
        'Arquitectura Web: Auditoría, optimización y mantenimiento de sitios corporativos e infraestructura digital.',
        'Gestión ERP: Estructuración e importación de datos en Odoo para optimizar procesos de procura y CRM.',
        'Seguridad e IT: Gestión de accesos corporativos, contraseñas, políticas de seguridad y documentación de procesos técnicos.'
      ]
    },
    {
      id: 'exp-feyalegria-dev',
      empresa: 'Fe y Alegría Venezuela',
      puesto: 'Desarrolladora Full Stack',
      periodo: 'Agosto 2025 - Noviembre 2025',
      ubicacion: 'Caracas / Remoto',
      bullets: [
        'Sistema de Gestión de Donaciones: Desarrollo a medida en Laravel gestionando flujos transaccionales y usuarios seguros.',
        'Despliegue & DevOps: Gestión de entornos de hosting, migraciones de base de datos SQL y estabilidad para campañas de alto tráfico.',
        'Landing Page WordPress: Diseño de landing de alto rendimiento integrada con Google Analytics y SEO.'
      ]
    },
    {
      id: 'exp-cide',
      empresa: 'CIDE Ecuador',
      puesto: 'Desarrolladora WordPress & Administradora CMS',
      periodo: 'Enero 2025 - Julio 2025',
      ubicacion: 'Remoto Internacional',
      bullets: [
        'Plugin de WordPress personalizado: Consulta y validación de bases de datos en tiempo real.',
        'LMS y Campus Virtual: Administración y optimización en LearnDash, Moodle y Eventin.',
        'Ecosistema CMS Académico: Mantenimiento y actualización de DSpace y Open Journal Systems (OJS).'
      ]
    },
    {
      id: 'exp-feyalegria-bot',
      empresa: 'Fe y Alegría Venezuela',
      puesto: 'Pasante Desarrolladora de Chatbots con IA',
      periodo: 'Abril 2025 - Junio 2025',
      ubicacion: 'Caracas, Venezuela',
      bullets: [
        'Chatbot IA: Prototipo funcional con HTML5, CSS3, JavaScript e integración con la API de Google Gemini para procesamiento de lenguaje natural.'
      ]
    }
  ],
  foto_url: '',
  foto_config: { forma: 'rounded', mostrar: true, zoom: 100 },
  ai_provider: 'gemini',
  ai_settings: {},
  onboarding_completed: true
};

// 16 Vacantes iniciales extraídas del historial de Gemini de Arianna Clemente
const SEED_VACANCIES = [
  {
    id: 'vac-ensolvers',
    empresa: 'Ensolvers',
    puesto: 'Full Stack / Backend Developer',
    modalidad: 'Remoto',
    ubicacion: 'Internacional / Argentina',
    salario: '$1,500 - $2,500 USD',
    estado: 'interview', // saved, applied, interview, offer, rejected
    prioridad: 'high',
    url: 'https://ensolvers.com/careers',
    contacto: 'Talent Acquisition Team',
    fecha: '2026-10-01',
    notas: 'CV ModernCV Banking Style (1 pág. ATS friendly). Guía de práctica con ejercicios de lógica, algoritmos y PHP/JS Backend.',
    requisitos: ['JavaScript', 'PHP', 'Algoritmos', 'REST APIs', 'PostgreSQL'],
    estrategia: 'CV 1 página ATS, destacar desarrollo web robusto y resolución de problemas algorítmicos.'
  },
  {
    id: 'vac-banesco-seguros',
    empresa: 'Banesco Seguros',
    puesto: 'Especialista de Desarrollo TI',
    modalidad: 'Híbrido',
    ubicacion: 'Caracas, Venezuela',
    salario: 'Acorde al mercado bancario',
    estado: 'interview',
    prioridad: 'high',
    url: '',
    contacto: 'Selección de Personal TI',
    fecha: '2026-10-03',
    notas: 'Cuestionario de RRHH y competencias completado. CV LaTeX en formato bancario.',
    requisitos: ['Sistemas Transaccionales', 'Bases de Datos', 'Seguridad TI', 'Metodologías Ágiles'],
    estrategia: 'Enfocar en estabilidad, seguridad de datos bancarios y metodología ágil.'
  },
  {
    id: 'vac-ventana-digital',
    empresa: 'Ventana Digital',
    puesto: 'Tech Lead / Senior Web Developer',
    modalidad: 'Remoto',
    ubicacion: 'Chile / Remoto',
    salario: '$1,800 USD',
    estado: 'interview',
    prioridad: 'high',
    url: '',
    contacto: 'CTO Ventana Digital',
    fecha: '2026-10-05',
    notas: 'Script de preparación para entrevista con CTO. Solución de incidentes y performance en WordPress/Shopify.',
    requisitos: ['WordPress Headless', 'Shopify', 'PHP', 'Core Web Vitals', 'JavaScript'],
    estrategia: 'Liderazgo técnico, arquitecturas headless y optimización Core Web Vitals.'
  },
  {
    id: 'vac-ingedata',
    empresa: 'IngeData',
    puesto: 'Especialista TI & Sistemas',
    modalidad: 'Presencial / Híbrido',
    ubicacion: 'Caracas, Venezuela',
    salario: '$800 - $1,200 USD',
    estado: 'interview',
    prioridad: 'med',
    url: '',
    contacto: 'Gestión Humana',
    fecha: '2026-10-08',
    notas: 'Entrevista de contexto local, matriz de priorización y gestión de contingencias.',
    requisitos: ['Soporte Técnico Nivel 2', 'Infraestructura Web', 'Redes', 'Gestión de Servidores'],
    estrategia: 'Resolución de problemas en tiempo real y soporte a procesos operativos.'
  },
  {
    id: 'vac-wink-yummy',
    empresa: 'Wink (Yummy)',
    puesto: 'Operaciones & Producto Web',
    modalidad: 'Remoto',
    ubicacion: 'Latinoamérica',
    salario: 'Negociable',
    estado: 'applied',
    prioridad: 'high',
    url: 'https://yummy.com.ve',
    contacto: 'Hiring Manager',
    fecha: '2026-10-09',
    notas: 'CV Arianna Clemente adaptado a Wink. Argumentos enfocados en escalabilidad y UX.',
    requisitos: ['Gestión de Producto', 'Análisis de Datos', 'Automatización', 'UX/UI'],
    estrategia: 'Orientación a métricas de retención, agilidad y automatización de procesos.'
  },
  {
    id: 'vac-selec',
    empresa: 'SELEC',
    puesto: 'Web & SEO Specialist',
    modalidad: 'Remoto',
    ubicacion: 'España / Remoto',
    salario: '€1,200 - €1,600 EUR',
    estado: 'applied',
    prioridad: 'med',
    url: '',
    contacto: 'Área Digital',
    fecha: '2026-10-10',
    notas: 'Estrategia de posicionamiento orgánico y diseño web corporativo.',
    requisitos: ['SEO Técnico', 'Google Search Console', 'WordPress', 'HTML5 Semántico'],
    estrategia: 'Demostrar resultados de posicionamiento técnico y auditorías web.'
  },
  {
    id: 'vac-efiempresa',
    empresa: 'Efiempresa',
    puesto: 'Especialista Web & Contenidos',
    modalidad: 'Remoto',
    ubicacion: 'Internacional',
    salario: '$1,000 USD',
    estado: 'applied',
    prioridad: 'med',
    url: '',
    contacto: 'RRHH Efiempresa',
    fecha: '2026-10-10',
    notas: 'Guía de entrevista técnica preparada: SEO on-page, WordPress multisite, Google Ads.',
    requisitos: ['WordPress Multisite', 'SEO On-Page', 'Google Ads', 'Copywriting Técnico'],
    estrategia: 'Habilidades híbridas de desarrollo y marketing digital de precisión.'
  },
  {
    id: 'vac-logoscorp',
    empresa: 'Logoscorp',
    puesto: 'Full Stack Developer',
    modalidad: 'Remoto',
    ubicacion: 'USA / Remoto',
    salario: '$2,000 USD',
    estado: 'applied',
    prioridad: 'high',
    url: '',
    contacto: 'Recruiting Team',
    fecha: '2026-10-11',
    notas: 'Portafolio de proyectos en producción y pitch personalizado enviado.',
    requisitos: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs'],
    estrategia: 'Enfocar en desarrollo React, APIs RESTful y bases de datos relacionales.'
  },
  {
    id: 'vac-ivcisa',
    empresa: 'IVCISA',
    puesto: 'AI & Backend Solutions Developer',
    modalidad: 'Remoto',
    ubicacion: 'Venezuela / Internacional',
    salario: 'A convenir',
    estado: 'applied',
    prioridad: 'high',
    url: '',
    contacto: 'Dirección Técnica',
    fecha: '2026-10-11',
    notas: 'Perfil orientado a backend inteligente y automatizaciones con LLMs.',
    requisitos: ['Python', 'Integración LLMs', 'FastAPI', 'Automatización de Pipelines'],
    estrategia: 'Destacar pipelines de datos y consumo de APIs de IA generativa.'
  },
  {
    id: 'vac-kurios',
    empresa: 'Kurios Education',
    puesto: 'Program & Operations Manager',
    modalidad: 'Remoto',
    ubicacion: 'Perú / Latam',
    salario: '$1,400 - $1,800 USD',
    estado: 'applied',
    prioridad: 'med',
    url: 'https://kurios.la',
    contacto: 'Formulario ClickUp',
    fecha: '2026-10-12',
    notas: 'Respuestas enviadas en formulario ClickUp. Plantillas de seguimiento listas para 7 días.',
    requisitos: ['ClickUp', 'Zapier', 'Operaciones Educativas', 'LMS'],
    estrategia: 'Organización, gestión de cohortes educativas y herramientas no-code/low-code.'
  },
  {
    id: 'vac-cxmart',
    empresa: 'Cxmart',
    puesto: 'Especialista OJS & Plataformas Web',
    modalidad: 'Remoto',
    ubicacion: 'Latinoamérica',
    salario: '$900 - $1,200 USD',
    estado: 'applied',
    prioridad: 'med',
    url: '',
    contacto: 'Comité Editorial',
    fecha: '2026-10-12',
    notas: 'CV especializado en Open Journal Systems y revistas científicas indexadas.',
    requisitos: ['OJS (Open Journal Systems)', 'PHP', 'Metadatos Dublin Core', 'Indexación'],
    estrategia: 'Dominio de arquitectura OJS, metadatos Dublin Core y preservación digital.'
  },
  {
    id: 'vac-the-whiteam',
    empresa: 'The Whiteam',
    puesto: 'Especialista Moodle / E-learning',
    modalidad: 'Remoto',
    ubicacion: 'España',
    salario: '€1,400 EUR',
    estado: 'applied',
    prioridad: 'med',
    url: 'https://thewhiteam.com',
    contacto: 'Equipo E-learning',
    fecha: '2026-10-13',
    notas: 'CV enfocado en administración de campus virtual, plugins Moodle y soporte a docentes.',
    requisitos: ['Moodle LMS', 'PHP', 'SCORM', 'Gestión de Servidores Educativos'],
    estrategia: 'Experiencia técnica en entornos educativos virtuales a gran escala.'
  },
  {
    id: 'vac-central-zone',
    empresa: 'central.zone',
    puesto: 'Desarrollador Web Moderno',
    modalidad: 'Remoto',
    ubicacion: 'Internacional',
    salario: '$1,200 USD',
    estado: 'applied',
    prioridad: 'low',
    url: '',
    contacto: 'Talento Digital',
    fecha: '2026-10-13',
    notas: 'Portafolio enviado con casos de éxito y mejoras de velocidad web.',
    requisitos: ['JavaScript', 'HTML5/CSS3', 'Web Performance', 'Git'],
    estrategia: 'Entrega rápida de interfaces limpias y accesibles.'
  },
  {
    id: 'vac-banco-exterior',
    empresa: 'Banco Exterior',
    puesto: 'Especialista TI / Banca Digital',
    modalidad: 'Presencial / Híbrido',
    ubicacion: 'Caracas, Venezuela',
    salario: 'Beneficios bancarios',
    estado: 'applied',
    prioridad: 'high',
    url: '',
    contacto: 'Vicepresidencia de Tecnología',
    fecha: '2026-10-14',
    notas: 'Formato bancario riguroso, énfasis en seguridad, transacciones y normativas.',
    requisitos: ['Banca Online', 'Seguridad Transaccional', 'SQL', 'Auditoría TI'],
    estrategia: 'Rigurosidad metodológica, documentación y continuidad operativa.'
  },
  {
    id: 'vac-gofasti',
    empresa: 'GoFasti',
    puesto: 'Frontend / Full Stack Remoto',
    modalidad: 'Remoto',
    ubicacion: 'USA / Latam',
    salario: '$2,500 - $3,500 USD',
    estado: 'saved',
    prioridad: 'high',
    url: 'https://gofasti.com',
    contacto: 'Enlace de carreras',
    fecha: '2026-10-14',
    notas: 'Analizado rango salarial internacional. Pendiente afinar pitch en inglés.',
    requisitos: ['React', 'TypeScript', 'TailwindCSS', 'Next.js', 'Inglés Profesional'],
    estrategia: 'Portafolio de componentes UI pulidos, TypeScript y pruebas de integración.'
  },
  {
    id: 'vac-lateam',
    empresa: 'Lateam',
    puesto: 'Red de Talento Tech (Matching Activo)',
    modalidad: 'Remoto',
    ubicacion: 'Global',
    salario: 'Por proyecto ($20 - $35/hr)',
    estado: 'offer',
    prioridad: 'med',
    url: 'https://lateam.co',
    contacto: 'Talent Success Lead',
    fecha: '2026-10-15',
    notas: 'Perfil verificado y en lista de asignación directa de clientes internacionales.',
    requisitos: ['Full Stack', 'Web Development', 'Comunicación Asíncrona'],
    estrategia: 'Mantener disponibilidad actualizada y portafolio activo.'
  }
];

class StorageService {
  constructor() {
    this.listeners = [];
    this.profileListeners = [];
    this.cache = null;
    this.profileCache = null;
    this.decryptedKeyMemory = {};
    this.syncStatus = 'local'; // 'local' | 'syncing' | 'synced' | 'error' | 'offline'
    this.syncListeners = [];
    this.perfilesTableAvailable = null; // null: desconocido, true: disponible, false: tabla pendiente de crear en Supabase
    this.init();
  }

  init() {
    // 1. Cargar caché inmediato desde localStorage solo si hay usuario autenticado
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) {
      this.cache = [];
    } else {
      const key = this.getStorageKey();
      const existing = localStorage.getItem(key);
      if (!existing) {
        this.cache = [];
      } else {
        try {
          this.cache = JSON.parse(existing);
        } catch (e) {
          this.cache = [];
        }
      }
    }

    // 2. Escuchar cambios de red (Online / Offline)
    window.addEventListener('online', () => {
      this.syncStatus = 'syncing';
      this.notifySyncStatus();
      this.syncWithSupabase();
      this.syncProfileWithSupabase();
    });

    window.addEventListener('offline', () => {
      this.syncStatus = 'offline';
      this.notifySyncStatus();
    });

    // 3. Conectar con el cliente de Supabase cuando esté disponible
    this.setupSupabaseIntegration();
  }

  getStorageKey() {
    const user = window.appSupabase ? window.appSupabase.getUser() : null;
    return user ? `aryc_vacancies_${user.id}` : STORAGE_KEY;
  }

  getProfileKey() {
    const user = window.appSupabase ? window.appSupabase.getUser() : null;
    return user ? `aryc_profile_${user.id}` : PROFILE_KEY;
  }

  getProfile() {
    const user = window.appSupabase ? window.appSupabase.getUser() : null;
    if (!user) {
      return {
        nombre: '',
        titular: '',
        email: '',
        telefono: '',
        ubicacion: '',
        enlaces: { github: '', linkedin: '', portafolio: '', web: '' },
        resumen: '',
        habilidades: [],
        educacion: [],
        experiencias: [],
        foto_url: '',
        foto_config: {},
        preferencias_empleo: {},
        ai_provider: 'gemini',
        onboarding_completed: false
      };
    }

    if (this.profileCache) return this.profileCache;
    const key = this.getProfileKey();
    try {
      const data = localStorage.getItem(key);
      if (data) {
        this.profileCache = JSON.parse(data);
        return this.profileCache;
      }
    } catch (e) {
      console.warn('Error leyendo perfil de localStorage:', e);
    }

    const isArianna = user.email && (user.email.toLowerCase().includes('ary') || user.email.toLowerCase().includes('arianna'));
    const fallback = isArianna ? {
      ...ARIANNA_MASTER_PROFILE,
      email: user.email,
      onboarding_completed: true
    } : {
      nombre: user.user_metadata?.nombre || user.email.split('@')[0],
      titular: '',
      email: user.email,
      telefono: '',
      ubicacion: '',
      enlaces: { github: '', linkedin: '', portafolio: '', web: '' },
      resumen: '',
      habilidades: [],
      educacion: [],
      experiencias: [],
      foto_url: '',
      foto_config: {},
      preferencias_empleo: {},
      ai_provider: 'gemini',
      onboarding_completed: false
    };
    this.profileCache = fallback;
    return fallback;
  }

  saveProfile(profile, syncToCloud = true) {
    this.profileCache = { ...profile };
    const key = this.getProfileKey();
    try {
      localStorage.setItem(key, JSON.stringify(this.profileCache));
    } catch (e) {
      console.error('Error guardando perfil local:', e);
    }

    this.notifyProfileSubscribers();

    // Sincronizar con Supabase si está autenticado
    if (syncToCloud && window.appSupabase && window.appSupabase.isAuthenticated()) {
      if (this.perfilesTableAvailable === false) {
        // La tabla aún no existe en Supabase; los datos ya quedaron persistidos en localStorage
        return this.profileCache;
      }
      const user = window.appSupabase.getUser();
      const payload = {
        id: user.id,
        nombre: this.profileCache.nombre || '',
        titular: this.profileCache.titular || '',
        email: this.profileCache.email || user.email,
        telefono: this.profileCache.telefono || '',
        ubicacion: this.profileCache.ubicacion || '',
        enlaces: this.profileCache.enlaces || {},
        resumen: this.profileCache.resumen || '',
        habilidades: this.profileCache.habilidades || [],
        educacion: this.profileCache.educacion || [],
        experiencias: this.profileCache.experiencias || [],
        foto_url: this.profileCache.foto_url || '',
        foto_config: this.profileCache.foto_config || {},
        preferencias_empleo: this.profileCache.preferencias_empleo || {},
        ai_provider: this.profileCache.ai_provider || 'gemini',
        ai_settings: this.profileCache.ai_settings || {},
        onboarding_completed: Boolean(this.profileCache.onboarding_completed)
      };

      window.appSupabase.client
        .from('perfiles')
        .upsert(payload, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            if (error.code === 'PGRST205' || error.code === '42P01' || error.status === 404 || error.message?.includes('404') || error.message?.includes('not find')) {
              this.perfilesTableAvailable = false;
              console.info('ℹ️ [Supabase] La tabla "perfiles" aún no está creada en tu proyecto Supabase. Tus datos se guardaron localmente. Para habilitar la nube, ejecuta "documentacion/supabase_perfiles_schema.sql" en tu Dashboard de Supabase.');
            } else {
              console.error('Error sincronizando perfil con Supabase:', error);
            }
          } else {
            this.perfilesTableAvailable = true;
          }
        })
        .catch(err => {
          console.warn('Error de red al sincronizar perfil con Supabase:', err);
        });
    }

    return this.profileCache;
  }

  subscribeProfile(callback) {
    if (typeof callback === 'function') {
      this.profileListeners.push(callback);
      callback(this.getProfile());
    }
  }

  notifyProfileSubscribers() {
    const profile = this.getProfile();
    this.profileListeners.forEach(cb => {
      try {
        cb(profile);
      } catch (e) {
        console.error('Error in profile subscriber:', e);
      }
    });
  }

  async syncProfileWithSupabase() {
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) return;
    if (this.perfilesTableAvailable === false) return;
    const user = window.appSupabase.getUser();
    try {
      const { data, error } = await window.appSupabase.client
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01' || error.status === 404 || error.message?.includes('404') || error.message?.includes('not find')) {
          this.perfilesTableAvailable = false;
          console.info('ℹ️ [Supabase] La tabla "perfiles" aún no existe en tu base de datos Supabase. Se utilizará el perfil local.');
          return;
        }
        console.warn('Error al consultar perfil en Supabase:', error);
        return;
      }

      this.perfilesTableAvailable = true;
      if (data) {
        this.saveProfile(data, false);
        // Descifrar configuración de IA sincronizada desde Supabase
        if (data.ai_settings && data.ai_settings.encryptedKey) {
          const decryptedKey = await CryptoVault.decrypt(data.ai_settings.encryptedKey, user.id);
          const provider = data.ai_settings.provider || data.ai_provider || 'gemini';
          this.decryptedKeyMemory[user.id] = {
            aiProvider: provider,
            aiApiKey: decryptedKey,
            geminiApiKey: decryptedKey
          };
          try {
            localStorage.setItem(this.getSettingsKey(), JSON.stringify({
              aiProvider: provider,
              encryptedKey: data.ai_settings.encryptedKey
            }));
          } catch (e) {}
          if (window.jobRadar && typeof window.jobRadar.refreshCopilotMode === 'function') {
            window.jobRadar.refreshCopilotMode();
          }
        }
      } else {
        // Primera vez del usuario: registrar perfil inicial
        this.saveProfile(this.getProfile(), true);
      }
    } catch (e) {
      console.warn('Error al sincronizar perfil desde Supabase:', e);
    }
  }

  setupSupabaseIntegration() {
    if (window.appSupabase) {
      window.appSupabase.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          // Usuario inició sesión: cambiar a su espacio de trabajo aislado
          this.cache = null;
          this.profileCache = null;
          await this.unlockLocalEncryptedSettings();
          await this.syncProfileWithSupabase();
          await this.syncWithSupabase();
          this.setupRealtimeSubscription();
          this.recalculateExistingPrioritiesOnce();
        } else {
          // Usuario cerró sesión: limpiar caché en memoria
          this.cache = null;
          this.profileCache = null;
          this.decryptedKeyMemory = {};
          this.syncStatus = 'local';
          this.notifySyncStatus();
          this.notifySubscribers();
          this.notifyProfileSubscribers();
        }
      });
    } else {
      setTimeout(() => this.setupSupabaseIntegration(), 500);
    }
  }

  async recalculateExistingPrioritiesOnce() {
    if (this._priorityMigrationRunning) return;
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) return;
    const user = window.appSupabase.getUser();
    if (!user) return;

    const migrationKey = `aryc_priority_match_v1_${user.id}`;
    if (localStorage.getItem(migrationKey)) return;

    if (!window.aiJobParser || typeof window.aiJobParser.computeProfileVacancyMatch !== 'function') {
      setTimeout(() => this.recalculateExistingPrioritiesOnce(), 400);
      return;
    }

    const profile = this.getProfile();
    const hasProfileData = profile && (
      (Array.isArray(profile.habilidades) && profile.habilidades.length > 0) ||
      ((profile.titular || '').trim().length > 2) ||
      (Array.isArray(profile.experiencias) && profile.experiencias.length > 0)
    );
    const vacancies = this.getVacancies();
    if (!hasProfileData || !Array.isArray(vacancies) || vacancies.length === 0) {
      return;
    }

    this._priorityMigrationRunning = true;
    try {
      let updatedCount = 0;
      const updatesToSync = [];

      const nextList = vacancies.map(v => {
        const res = window.aiJobParser.computeProfileVacancyMatch(v, profile);
        if (v.prioridad !== res.priority) {
          updatedCount++;
          updatesToSync.push({ id: v.id, prioridad: res.priority });
          return { ...v, prioridad: res.priority };
        }
        return v;
      });

      if (updatedCount > 0) {
        this.cache = nextList;
        this.saveLocalVacancies(this.cache);
        this.notifySubscribers();

        // Sincronizar en segundo plano las prioridades actualizadas en Supabase
        if (window.appSupabase.client) {
          await Promise.all(updatesToSync.map(item =>
            window.appSupabase.client
              .from('vacantes')
              .update({ prioridad: item.prioridad })
              .eq('id', item.id)
              .eq('user_id', user.id)
          ));
        }
      }

      localStorage.setItem(migrationKey, new Date().toISOString());
      try {
        window.dispatchEvent(new CustomEvent('aryc:priorities-recalculated', { detail: { updatedCount, total: vacancies.length } }));
      } catch (e) {}
    } catch (err) {
      console.warn('Error en recálculo único de prioridades:', err);
    } finally {
      this._priorityMigrationRunning = false;
    }
  }

  setupRealtimeSubscription() {
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) return;

    window.appSupabase.subscribeToChanges(
      (newVac) => {
        // Inserción remota desde otro dispositivo
        if (!this.cache.some(v => v.id === newVac.id)) {
          this.cache.unshift(newVac);
          this.saveLocalVacancies(this.cache);
          this.notifySubscribers();
        }
      },
      (updVac) => {
        // Actualización remota desde otro dispositivo
        const index = this.cache.findIndex(v => v.id === updVac.id);
        if (index !== -1) {
          this.cache[index] = { ...this.cache[index], ...updVac };
          this.saveLocalVacancies(this.cache);
          this.notifySubscribers();
        }
      },
      (delVac) => {
        // Eliminación remota desde otro dispositivo
        this.cache = this.cache.filter(v => v.id !== delVac.id);
        this.saveLocalVacancies(this.cache);
        this.notifySubscribers();
      }
    );
  }

  async syncWithSupabase() {
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) {
      this.syncStatus = 'local';
      this.notifySyncStatus();
      return;
    }

    if (!navigator.onLine) {
      this.syncStatus = 'offline';
      this.notifySyncStatus();
      return;
    }

    this.syncStatus = 'syncing';
    this.notifySyncStatus();

    try {
      const { data, error } = await window.appSupabase.client
        .from('vacantes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        this.cache = data;
        this.saveLocalVacancies(data);
      } else if (this.cache && this.cache.length > 0) {
        // El usuario está conectado pero la nube está vacía
        console.info('Cuenta en la nube sin vacantes.');
      } else {
        this.cache = [];
        this.saveLocalVacancies(this.cache);
      }

      this.syncStatus = 'synced';
      this.notifySyncStatus();
      this.notifySubscribers();
    } catch (err) {
      console.error('Error al sincronizar con Supabase:', err);
      this.syncStatus = 'error';
      this.notifySyncStatus();
    }
  }

  /**
   * Sube las vacantes locales a la cuenta de Supabase del usuario autenticado
   */
  async migrateLocalToCloud() {
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para migrar tus vacantes a la nube.');
    }

    const user = window.appSupabase.getUser();
    const localList = this.getVacancies();

    if (!localList || localList.length === 0) {
      return { count: 0 };
    }

    this.syncStatus = 'syncing';
    this.notifySyncStatus();

    const payload = localList.map(v => ({
      id: v.id || ('vac-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
      user_id: user.id,
      empresa: v.empresa || 'Empresa Confidencial',
      puesto: v.puesto || 'Puesto no especificado',
      modalidad: v.modalidad || 'Remoto',
      ubicacion: v.ubicacion || 'No especificada',
      salario: v.salario || '',
      estado: v.estado || 'saved',
      prioridad: v.prioridad || 'high',
      url: v.url || '',
      contacto: v.contacto || '',
      fecha: v.fecha || new Date().toISOString().split('T')[0],
      notas: v.notas || '',
      requisitos: Array.isArray(v.requisitos) ? v.requisitos : [],
      estrategia: v.estrategia || '',
      interview_prep: v.interview_prep || null
    }));

    const { data, error } = await window.appSupabase.client
      .from('vacantes')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      this.syncStatus = 'error';
      this.notifySyncStatus();
      throw error;
    }

    this.cache = data || payload;
    this.saveLocalVacancies(this.cache);
    this.syncStatus = 'synced';
    this.notifySyncStatus();
    this.notifySubscribers();

    return { count: payload.length };
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifySubscribers() {
    const vacancies = this.getVacancies();
    this.listeners.forEach(cb => {
      try {
        cb(vacancies);
      } catch (e) {
        console.error('Error in storage subscriber:', e);
      }
    });
  }

  onSyncStatusChange(callback) {
    if (typeof callback === 'function') {
      this.syncListeners.push(callback);
      callback(this.syncStatus);
    }
  }

  notifySyncStatus() {
    this.syncListeners.forEach(cb => {
      try {
        cb(this.syncStatus);
      } catch (e) {
        console.error('Error in sync status subscriber:', e);
      }
    });
  }

  getVacancies() {
    if (this.cache && Array.isArray(this.cache)) {
      return this.cache;
    }
    return this.getLocalVacancies();
  }

  getLocalVacancies() {
    // Si no hay usuario autenticado, retornar lista vacía para proteger privacidad en la bienvenida
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) {
      return [];
    }

    const key = this.getStorageKey();
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error leyendo vacantes de localStorage:', e);
    }

    // Si es un usuario autenticado y su almacenamiento local está vacío, devolver []
    return [];
  }

  saveLocalVacancies(vacancies) {
    const key = this.getStorageKey();
    try {
      localStorage.setItem(key, JSON.stringify(vacancies));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }

  saveVacancies(vacancies) {
    this.cache = [...vacancies];
    this.saveLocalVacancies(this.cache);
    this.notifySubscribers();
  }

  addVacancy(vacancy) {
    vacancy.id = vacancy.id || ('vac-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5));
    vacancy.fecha = vacancy.fecha || new Date().toISOString().split('T')[0];
    vacancy.estado = vacancy.estado || 'saved';
    vacancy.prioridad = vacancy.prioridad || 'high';

    // 1. Actualización optimista local
    if (!Array.isArray(this.cache)) {
      this.cache = this.getLocalVacancies();
    }
    this.cache.unshift(vacancy);
    this.saveLocalVacancies(this.cache);
    this.notifySubscribers();
    try {
      window.dispatchEvent(new CustomEvent('aryc:vacancy-added', { detail: { vacancy, total: this.cache.length } }));
    } catch (e) {}

    // 2. Si hay sesión activa en Supabase, guardar en la nube en segundo plano
    if (window.appSupabase && window.appSupabase.isAuthenticated()) {
      const user = window.appSupabase.getUser();
      const dbRecord = {
        id: vacancy.id,
        user_id: user.id,
        empresa: vacancy.empresa,
        puesto: vacancy.puesto,
        modalidad: vacancy.modalidad || 'Remoto',
        ubicacion: vacancy.ubicacion || 'No especificada',
        salario: vacancy.salario || '',
        estado: vacancy.estado,
        prioridad: vacancy.prioridad,
        url: vacancy.url || '',
        contacto: vacancy.contacto || '',
        fecha: vacancy.fecha,
        notas: vacancy.notas || '',
        requisitos: vacancy.requisitos || [],
        estrategia: vacancy.estrategia || '',
        interview_prep: vacancy.interview_prep || null
      };

      window.appSupabase.client
        .from('vacantes')
        .insert([dbRecord])
        .then(({ error }) => {
          if (error) {
            console.error('Error insertando vacante en Supabase:', error);
            this.syncStatus = 'error';
            this.notifySyncStatus();
          } else {
            this.syncStatus = 'synced';
            this.notifySyncStatus();
          }
        });
    }

    return vacancy;
  }

  updateVacancy(id, updatedFields) {
    const index = this.cache.findIndex(v => v.id === id);
    if (index !== -1) {
      // 1. Actualización optimista local
      this.cache[index] = { ...this.cache[index], ...updatedFields };
      this.saveLocalVacancies(this.cache);
      this.notifySubscribers();

      // 2. Actualización en Supabase si está autenticado
      if (window.appSupabase && window.appSupabase.isAuthenticated()) {
        window.appSupabase.client
          .from('vacantes')
          .update(updatedFields)
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('Error actualizando vacante en Supabase:', error);
              this.syncStatus = 'error';
              this.notifySyncStatus();
            } else {
              this.syncStatus = 'synced';
              this.notifySyncStatus();
            }
          });
      }

      return this.cache[index];
    }
    return null;
  }

  saveInterviewPrep(id, compressedData) {
    return this.updateVacancy(id, { interview_prep: compressedData });
  }

  deleteVacancy(id) {
    // 1. Eliminación optimista local
    this.cache = this.cache.filter(v => v.id !== id);
    this.saveLocalVacancies(this.cache);
    this.notifySubscribers();

    // 2. Eliminación en Supabase si está autenticado
    if (window.appSupabase && window.appSupabase.isAuthenticated()) {
      window.appSupabase.client
        .from('vacantes')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Error eliminando vacante en Supabase:', error);
            this.syncStatus = 'error';
            this.notifySyncStatus();
          } else {
            this.syncStatus = 'synced';
            this.notifySyncStatus();
          }
        });
    }
  }

  resetToSeedData() {
    this.cache = [...SEED_VACANCIES];
    this.saveLocalVacancies(this.cache);
    this.notifySubscribers();
    return this.cache;
  }

  getSettingsKey() {
    const user = window.appSupabase ? window.appSupabase.getUser() : null;
    return user ? `aryc_settings_${user.id}` : SETTINGS_KEY;
  }

  async unlockLocalEncryptedSettings() {
    const user = window.appSupabase ? window.appSupabase.getUser() : null;
    const userId = user ? user.id : 'local';
    try {
      const raw = localStorage.getItem(this.getSettingsKey());
      if (!raw) return this.getSettings();
      const parsed = JSON.parse(raw);
      if (parsed.encryptedKey) {
        const plain = await CryptoVault.decrypt(parsed.encryptedKey, userId);
        this.decryptedKeyMemory[userId] = {
          aiProvider: parsed.aiProvider || 'gemini',
          aiApiKey: plain,
          geminiApiKey: plain
        };
      } else if (parsed.aiApiKey || parsed.geminiApiKey) {
        // Migrar clave antigua en texto plano a formato cifrado
        await this.saveSettings(parsed);
      }
    } catch (e) {
      console.warn('Error desbloqueando configuración local:', e);
    }
    return this.getSettings();
  }

  async getDecryptedSettings() {
    const user = window.appSupabase ? window.appSupabase.getUser() : null;
    const userId = user ? user.id : 'local';
    if (!this.decryptedKeyMemory[userId]) {
      await this.unlockLocalEncryptedSettings();
    }
    return this.getSettings();
  }

  getSettings() {
    const user = window.appSupabase ? window.appSupabase.getUser() : null;
    const userId = user ? user.id : 'local';
    if (this.decryptedKeyMemory[userId]) {
      return { ...this.decryptedKeyMemory[userId] };
    }
    try {
      const key = this.getSettingsKey();
      let settings = localStorage.getItem(key);
      if (!settings && key === SETTINGS_KEY) {
        settings = localStorage.getItem('aryc_app_settings');
      }
      if (!settings) return { geminiApiKey: '', aiProvider: 'gemini', aiApiKey: '' };
      const parsed = JSON.parse(settings);
      return {
        aiProvider: parsed.aiProvider || 'gemini',
        aiApiKey: parsed.aiApiKey || parsed.geminiApiKey || '',
        geminiApiKey: parsed.geminiApiKey || parsed.aiApiKey || '',
        hasEncryptedKey: Boolean(parsed.encryptedKey)
      };
    } catch (e) {
      return { geminiApiKey: '', aiProvider: 'gemini', aiApiKey: '' };
    }
  }

  async saveSettings(settings) {
    const user = window.appSupabase ? window.appSupabase.getUser() : null;
    const userId = user ? user.id : 'local';
    const provider = settings.aiProvider || 'gemini';
    const rawKey = (settings.aiApiKey || settings.geminiApiKey || '').trim();

    // 1. Mantener clave descifrada únicamente en memoria RAM durante la sesión activa
    this.decryptedKeyMemory[userId] = {
      aiProvider: provider,
      aiApiKey: rawKey,
      geminiApiKey: rawKey
    };

    // 2. Cifrar con AES-256-GCM antes de guardar en localStorage y en Supabase
    let encryptedKey = null;
    if (rawKey) {
      encryptedKey = await CryptoVault.encrypt(rawKey, userId);
    }

    const key = this.getSettingsKey();
    try {
      localStorage.setItem(key, JSON.stringify({
        aiProvider: provider,
        encryptedKey
      }));
    } catch (e) {
      console.error('Error guardando configuración cifrada local:', e);
    }

    // 3. Si el usuario está autenticado, guardar proveedor y API Key CIFRADA en public.perfiles.ai_settings
    if (window.appSupabase && window.appSupabase.isAuthenticated()) {
      const profile = this.getProfile();
      if (profile) {
        profile.ai_provider = provider;
        profile.ai_settings = {
          provider,
          encryptedKey,
          updatedAt: new Date().toISOString()
        };
        this.saveProfile(profile, true);
      }
    }

    if (window.jobRadar && typeof window.jobRadar.refreshCopilotMode === 'function') {
      window.jobRadar.refreshCopilotMode();
    }
  }

  exportDataJson() {
    const vacancies = this.getVacancies();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vacancies, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `vacantes_aryc_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  importDataJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.saveVacancies(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('JSON parse error:', e);
      return false;
    }
  }
}

window.appStorage = new StorageService();
