/**
 * storage.js - Capa de almacenamiento y persistencia de Vacantes by AryC
 * Maneja persistencia en localStorage, reactividad con suscriptores y datos semilla extraídos de Gemini.
 */

const STORAGE_KEY = 'aryc_vacancies_data';
const SETTINGS_KEY = 'aryc_app_settings';

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
    this.cache = null;
    this.syncStatus = 'local'; // 'local' | 'syncing' | 'synced' | 'error' | 'offline'
    this.syncListeners = [];
    this.init();
  }

  init() {
    // 1. Cargar caché inmediato desde localStorage
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      this.cache = [...SEED_VACANCIES];
      this.saveLocalVacancies(this.cache);
    } else {
      try {
        this.cache = JSON.parse(existing);
      } catch (e) {
        this.cache = [...SEED_VACANCIES];
      }
    }

    // 2. Escuchar cambios de red (Online / Offline)
    window.addEventListener('online', () => {
      this.syncStatus = 'syncing';
      this.notifySyncStatus();
      this.syncWithSupabase();
    });

    window.addEventListener('offline', () => {
      this.syncStatus = 'offline';
      this.notifySyncStatus();
    });

    // 3. Conectar con el cliente de Supabase cuando esté disponible
    this.setupSupabaseIntegration();
  }

  setupSupabaseIntegration() {
    if (window.appSupabase) {
      window.appSupabase.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await this.syncWithSupabase();
          this.setupRealtimeSubscription();
        } else {
          this.syncStatus = 'local';
          this.notifySyncStatus();
        }
      });
    } else {
      setTimeout(() => this.setupSupabaseIntegration(), 500);
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
        // El usuario está conectado pero la nube está vacía: podemos sugerir o migrar
        console.info('Cuenta en la nube sin vacantes. Se puede migrar el almacenamiento local.');
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
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : SEED_VACANCIES;
    } catch (e) {
      return SEED_VACANCIES;
    }
  }

  saveLocalVacancies(vacancies) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vacancies));
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
    this.cache.unshift(vacancy);
    this.saveLocalVacancies(this.cache);
    this.notifySubscribers();

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

  getSettings() {
    try {
      const settings = localStorage.getItem(SETTINGS_KEY);
      return settings ? JSON.parse(settings) : { geminiApiKey: '' };
    } catch (e) {
      return { geminiApiKey: '' };
    }
  }

  saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
