/**
 * storage.js - Capa de almacenamiento y persistencia de Vacantes by AryC
 * Maneja persistencia en localStorage e inicialización con datos semilla extraídos de Gemini.
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
    estrategia: 'Mantener disponibilidad actualizada y portafolio activo.'
  }
];

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      this.saveVacancies(SEED_VACANCIES);
    }
  }

  getVacancies() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : SEED_VACANCIES;
    } catch (e) {
      console.error('Error reading vacancies from storage:', e);
      return SEED_VACANCIES;
    }
  }

  saveVacancies(vacancies) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vacancies));
    } catch (e) {
      console.error('Error saving vacancies to storage:', e);
    }
  }

  addVacancy(vacancy) {
    const list = this.getVacancies();
    vacancy.id = vacancy.id || 'vac-' + Date.now();
    vacancy.fecha = vacancy.fecha || new Date().toISOString().split('T')[0];
    list.unshift(vacancy);
    this.saveVacancies(list);
    return vacancy;
  }

  updateVacancy(id, updatedFields) {
    const list = this.getVacancies();
    const index = list.findIndex(v => v.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      this.saveVacancies(list);
      return list[index];
    }
    return null;
  }

  deleteVacancy(id) {
    let list = this.getVacancies();
    list = list.filter(v => v.id !== id);
    this.saveVacancies(list);
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
      if (Array.isArray(parsed)) {
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
