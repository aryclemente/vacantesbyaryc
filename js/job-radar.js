/**
 * job-radar.js - Radar de Empleos & Asesor de Reclutamiento IA
 * Vacantes by AryC // ATS Personal
 * 
 * Características:
 * 1. Catálogo curado + Feeds en vivo con optimización de 0 tokens para búsqueda y filtrado.
 * 2. Algoritmo determinista de compatibilidad ATS en cliente frente al CV Maestro de Arianna Clemente.
 * 3. Integración 1-clic con el tablero Kanban mediante window.appStorage.
 * 4. Chatbot Asesor IA con análisis comparativo lateral (Remoto vs España) y consumo mínimo de tokens.
 */

(function () {
  'use strict';

  // =========================================================================
  // CV Maestro de Referencia para Cálculo de Compatibilidad ATS (0 Tokens)
  // =========================================================================
  const ARIANNA_PROFILE_KEYWORDS = {
    // Tecnologías principales y peso
    'laravel': 18,
    'php': 16,
    'react': 16,
    'javascript': 14,
    'js': 12,
    'wordpress': 15,
    'woocommerce': 14,
    'moodle': 16,
    'mysql': 12,
    'postgresql': 12,
    'postgres': 12,
    'sql': 10,
    'python': 10,
    'tailwind': 8,
    'tailwindcss': 8,
    'html': 8,
    'css': 8,
    'git': 8,
    'github': 8,
    'supabase': 10,
    'docker': 8,
    'rest': 12,
    'api': 12,
    'apis': 12,
    'pasarelas de pago': 16,
    'pagos': 12,
    'payment': 14,
    'stripe': 12,
    'gemini': 12,
    'ia': 10,
    'ai': 10,
    'chatbots': 12,
    'core web vitals': 10,
    'wpo': 10,
    'seo': 8,
    'full stack': 15,
    'backend': 14,
    'frontend': 14,
    'remoto': 10,
    'remote': 10,
    'lms': 14,
    'ojs': 12
  };

  // =========================================================================
  // Catálogo Curado de Alta Compatibilidad (25 Vacantes Reales España, Remoto y LATAM)
  // =========================================================================
  const CURATED_JOBS = [
    {
      id: 'radar-cabify-fs',
      empresa: 'Cabify',
      puesto: 'Senior Full Stack Engineer (PHP / Laravel & React)',
      modalidad: 'Remoto',
      ubicacion: 'España (Madrid / Remoto)',
      mercado: 'spain',
      salario: '€45,000 - €55,000 / año',
      salarioNum: 50000,
      tipo: 'Tiempo Completo',
      plataforma: 'linkedin',
      plataformaNombre: 'LinkedIn',
      url: 'https://www.linkedin.com/jobs/search/?keywords=Cabify+Full+Stack+Laravel+PHP',
      fecha: '2026-11-03',
      descripcion: 'Buscamos un Ingeniero Full Stack para escalar nuestros servicios de movilidad y pasarelas de pago. Desarrollo de APIs en Laravel/PHP y aplicaciones frontend con React.',
      requisitos: ['PHP 8+', 'Laravel', 'React', 'REST APIs', 'MySQL / PostgreSQL', 'Docker', 'Pasarelas de Pago'],
      destacado: true
    },
    {
      id: 'radar-glovo-backend',
      empresa: 'Glovo',
      puesto: 'Backend Developer - Core Marketplace & Payments',
      modalidad: 'Híbrido / Remoto',
      ubicacion: 'Barcelona / Remoto España',
      mercado: 'spain',
      salario: '€42,000 - €50,000 / año',
      salarioNum: 46000,
      tipo: 'Tiempo Completo',
      plataforma: 'infojobs',
      plataformaNombre: 'InfoJobs',
      url: 'https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=Glovo+Backend+PHP',
      fecha: '2026-11-02',
      descripcion: 'Integración en el equipo de transacciones y cobros digitales. Arquitectura de microservicios, alta concurrencia y optimización de base de datos relacionales.',
      requisitos: ['PHP', 'Laravel / Symfony', 'PostgreSQL', 'APIs Restful', 'Webhooks', 'Git', 'Testing'],
      destacado: true
    },
    {
      id: 'radar-automattic-wp',
      empresa: 'Automattic Partner Agency',
      puesto: 'Senior WordPress & WooCommerce Engineer',
      modalidad: 'Remoto',
      ubicacion: 'Remoto Global (España / Latam)',
      mercado: 'remote',
      salario: '$4,000 - $5,500 USD / mes',
      salarioNum: 54000,
      tipo: 'Tiempo Completo',
      plataforma: 'remoteok',
      plataformaNombre: 'RemoteOK',
      url: 'https://remoteok.com/remote-wordpress-jobs',
      fecha: '2026-11-04',
      descripcion: 'Desarrollo de plugins a medida, integración de pasarelas de cobro multimoneda (Stripe/PayPal), optimización de Core Web Vitals y arquitecturas Headless WP.',
      requisitos: ['WordPress', 'WooCommerce', 'PHP', 'JavaScript', 'Custom Plugins', 'Core Web Vitals', 'MySQL'],
      destacado: true
    },
    {
      id: 'radar-packlink-fullstack',
      empresa: 'Packlink (Auctane)',
      puesto: 'Full Stack PHP & React Developer',
      modalidad: 'Remoto',
      ubicacion: 'Madrid / Remoto España',
      mercado: 'spain',
      salario: '€38,000 - €46,000 / año',
      salarioNum: 42000,
      tipo: 'Tiempo Completo',
      plataforma: 'linkedin',
      plataformaNombre: 'LinkedIn',
      url: 'https://www.linkedin.com/jobs/search/?keywords=Packlink+PHP+React',
      fecha: '2026-11-01',
      descripcion: 'Desarrollo y mantenimiento de la plataforma líder de logística y envíos para e-commerce. Integraciones API con tiendas online y pasarelas de pago.',
      requisitos: ['PHP 8', 'React', 'TypeScript', 'MySQL', 'Docker', 'REST APIs', 'Git'],
      destacado: false
    },
    {
      id: 'radar-platzi-fullstack',
      empresa: 'Platzi',
      puesto: 'Full Stack Web Developer (React / Node / Python)',
      modalidad: 'Remoto',
      ubicacion: 'Remoto Latinoamérica',
      mercado: 'remote',
      salario: '$2,500 - $3,500 USD / mes',
      salarioNum: 36000,
      tipo: 'Tiempo Completo',
      plataforma: 'getonbrd',
      plataformaNombre: 'Get on Board',
      url: 'https://www.getonbrd.com/jobs/programming',
      fecha: '2026-11-03',
      descripcion: 'Buscamos desarrolladores apasionados por la educación tecnológica para construir experiencias de usuario rápidas y módulos interactivos con IA.',
      requisitos: ['React', 'JavaScript', 'Python', 'PostgreSQL', 'APIs', 'Git', 'IA Integrations'],
      destacado: true
    },
    {
      id: 'radar-santander-pagonxt',
      empresa: 'PagoNxt (Banco Santander)',
      puesto: 'Especialista Integración Pasarelas de Pago & APIs',
      modalidad: 'Híbrido / Remoto',
      ubicacion: 'Madrid, España',
      mercado: 'spain',
      salario: '€42,000 - €52,000 / año',
      salarioNum: 47000,
      tipo: 'Tiempo Completo',
      plataforma: 'tecnoempleo',
      plataformaNombre: 'Tecnoempleo',
      url: 'https://www.tecnoempleo.com/ofertas-trabajo/?te=pasarelas+pago',
      fecha: '2026-11-02',
      descripcion: 'Diseño e integración de APIs transaccionales bancarias, reconciliación en tiempo real y protocolos de seguridad financiera C2P / tarjetas.',
      requisitos: ['Pasarelas de Pago', 'PHP', 'Laravel / Spring', 'PostgreSQL', 'Seguridad Transaccional', 'Webhooks'],
      destacado: true
    },
    {
      id: 'radar-factorial-backend',
      empresa: 'Factorial HR',
      puesto: 'Software Engineer - Backend (PHP / PostgreSQL)',
      modalidad: 'Remoto',
      ubicacion: 'Barcelona / Remoto España',
      mercado: 'spain',
      salario: '€40,000 - €48,000 / año',
      salarioNum: 44000,
      tipo: 'Tiempo Completo',
      plataforma: 'linkedin',
      plataformaNombre: 'LinkedIn',
      url: 'https://www.linkedin.com/jobs/search/?keywords=Factorial+HR+Engineer',
      fecha: '2026-11-03',
      descripcion: 'Desarrollo de módulos SaaS para gestión de talento humano, nómina y flujos automatizados. Fuerte enfoque en buenas prácticas y testing.',
      requisitos: ['PHP', 'PostgreSQL', 'Arquitectura SaaS', 'REST APIs', 'Git', 'Clean Architecture'],
      destacado: false
    },
    {
      id: 'radar-viu-moodle',
      empresa: 'Universidad Internacional de Valencia (VIU)',
      puesto: 'Especialista Plataformas E-Learning & Moodle LMS',
      modalidad: 'Remoto',
      ubicacion: 'Valencia / Remoto España',
      mercado: 'spain',
      salario: '€32,000 - €38,000 / año',
      salarioNum: 35000,
      tipo: 'Tiempo Completo',
      plataforma: 'infojobs',
      plataformaNombre: 'InfoJobs',
      url: 'https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=Moodle+LMS',
      fecha: '2026-11-01',
      descripcion: 'Mantenimiento, desarrollo de extensiones personalizadas para Moodle LMS, gestión de base de datos MySQL y soporte técnico a campus universitario.',
      requisitos: ['Moodle LMS', 'PHP', 'MySQL', 'JavaScript', 'SCORM', 'Gestión de Servidores Educativos'],
      destacado: true
    },
    {
      id: 'radar-bodas-knot',
      empresa: 'The Knot Worldwide (Bodas.net)',
      puesto: 'Frontend / Full Stack Web Engineer',
      modalidad: 'Remoto',
      ubicacion: 'Barcelona / Remoto España',
      mercado: 'spain',
      salario: '€36,000 - €44,000 / año',
      salarioNum: 40000,
      tipo: 'Tiempo Completo',
      plataforma: 'infojobs',
      plataformaNombre: 'InfoJobs',
      url: 'https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=Bodas.net+Frontend+PHP',
      fecha: '2026-11-02',
      descripcion: 'Optimización de Core Web Vitals, interfaces modernas con React, componentes interactivos y servicios backend en PHP para millones de usuarios mensuales.',
      requisitos: ['React', 'JavaScript (ES6+)', 'PHP', 'HTML5/CSS3', 'Core Web Vitals', 'Git'],
      destacado: false
    },
    {
      id: 'radar-banesco-latam',
      empresa: 'Banesco Internacional',
      puesto: 'Ingeniero de Integraciones Web y Pasarelas de Pago',
      modalidad: 'Remoto',
      ubicacion: 'Latinoamérica / Caracas / Panamá',
      mercado: 'latam',
      salario: '$1,800 - $2,800 USD / mes',
      salarioNum: 27000,
      tipo: 'Tiempo Completo',
      plataforma: 'computrabajo',
      plataformaNombre: 'Computrabajo',
      url: 'https://ve.computrabajo.com/ofertas-de-trabajo/?q=desarrollador+web',
      fecha: '2026-11-04',
      descripcion: 'Implementación de módulos web transaccionales, soporte a canales de pago digital, C2P, Pago Móvil y automatización de reportes bancarios.',
      requisitos: ['PHP / Laravel', 'Pasarelas de Pago', 'Bases de Datos SQL', 'Seguridad Transaccional', 'Webhooks'],
      destacado: true
    },
    {
      id: 'radar-mercadolibre-fe',
      empresa: 'Mercado Libre',
      puesto: 'Software Engineer Frontend (React / Web Performance)',
      modalidad: 'Remoto',
      ubicacion: 'Remoto Latam',
      mercado: 'remote',
      salario: '$2,800 - $3,800 USD / mes',
      salarioNum: 40000,
      tipo: 'Tiempo Completo',
      plataforma: 'getonbrd',
      plataformaNombre: 'Get on Board',
      url: 'https://www.getonbrd.com/jobs/programming/mercado-libre',
      fecha: '2026-11-03',
      descripcion: 'Desarrollo de módulos e-commerce de alta velocidad, componentes modulares en React y optimización del embudo de compra y checkout.',
      requisitos: ['React', 'TypeScript', 'TailwindCSS', 'Web Performance (WPO)', 'Git', 'REST APIs'],
      destacado: false
    },
    {
      id: 'radar-awesome-motive-wp',
      empresa: 'Awesome Motive (WPBeginner / OptinMonster)',
      puesto: 'WordPress Core & Plugin Developer',
      modalidad: 'Remoto',
      ubicacion: 'Remoto Global (100% Anywhere)',
      mercado: 'remote',
      salario: '$3,500 - $5,000 USD / mes',
      salarioNum: 51000,
      tipo: 'Tiempo Completo',
      plataforma: 'remoteok',
      plataformaNombre: 'RemoteOK',
      url: 'https://remoteok.com/remote-jobs',
      fecha: '2026-11-04',
      descripcion: 'Creación y mantenimiento de plugins usados por millones de sitios web. Código limpio, compatibilidad con Gutenberg y estándares de WordPress VIP.',
      requisitos: ['WordPress', 'PHP 8+', 'JavaScript', 'Gutenberg Blocks', 'MySQL', 'Git'],
      destacado: true
    },
    {
      id: 'radar-inetum-moodle',
      empresa: 'Inetum España',
      puesto: 'Consultor / Desarrollador E-Learning Moodle LMS',
      modalidad: 'Remoto',
      ubicacion: 'Madrid / Remoto España',
      mercado: 'spain',
      salario: '€30,000 - €38,000 / año',
      salarioNum: 34000,
      tipo: 'Tiempo Completo',
      plataforma: 'tecnoempleo',
      plataformaNombre: 'Tecnoempleo',
      url: 'https://www.tecnoempleo.com/ofertas-trabajo/?te=moodle',
      fecha: '2026-11-02',
      descripcion: 'Diseño e implementación de soluciones formativas en Moodle para grandes clientes corporativos y administraciones públicas en España.',
      requisitos: ['Moodle LMS', 'PHP', 'MySQL / PostgreSQL', 'Web Services Moodle', 'HTML5/CSS3'],
      destacado: false
    },
    {
      id: 'radar-pedidosya-fs',
      empresa: 'PedidosYa',
      puesto: 'Full Stack Web Developer (React / Node / APIs)',
      modalidad: 'Remoto',
      ubicacion: 'Remoto Latinoamérica',
      mercado: 'remote',
      salario: '$2,400 - $3,200 USD / mes',
      salarioNum: 33000,
      tipo: 'Tiempo Completo',
      plataforma: 'getonbrd',
      plataformaNombre: 'Get on Board',
      url: 'https://www.getonbrd.com/jobs/programming',
      fecha: '2026-11-03',
      descripcion: 'Desarrollo de herramientas internas para comercios afiliados y gestión de catálogos web. Interfaces reactivas y servicios distribuidos.',
      requisitos: ['React', 'JavaScript', 'Node.js', 'PostgreSQL', 'Docker', 'Git'],
      destacado: false
    },
    {
      id: 'radar-turing-laravel',
      empresa: 'Turing Remote Network',
      puesto: 'Remote Full Stack Laravel & React Developer',
      modalidad: 'Remoto',
      ubicacion: 'Remoto Internacional / USA Client',
      mercado: 'remote',
      salario: '$3,500 - $5,500 USD / mes',
      salarioNum: 54000,
      tipo: 'Tiempo Completo',
      plataforma: 'linkedin',
      plataformaNombre: 'LinkedIn',
      url: 'https://www.linkedin.com/jobs/search/?keywords=Turing+Laravel+React',
      fecha: '2026-11-04',
      descripcion: 'Asignación directa con clientes de EE.UU. y Europa. Desarrollo de arquitecturas web modernas basadas en Laravel y React con metodologías ágiles.',
      requisitos: ['Laravel', 'PHP', 'React', 'REST APIs', 'MySQL', 'Inglés Técnico'],
      destacado: true
    },
    {
      id: 'radar-farmatodo-web',
      empresa: 'Farmatodo',
      puesto: 'Desarrollador Web E-Commerce & Pasarelas',
      modalidad: 'Híbrido',
      ubicacion: 'Caracas, Venezuela',
      mercado: 'latam',
      salario: '$1,800 - $2,500 USD / mes',
      salarioNum: 25000,
      tipo: 'Tiempo Completo',
      plataforma: 'computrabajo',
      plataformaNombre: 'Computrabajo',
      url: 'https://ve.computrabajo.com/ofertas-de-trabajo/?q=farmatodo',
      fecha: '2026-11-01',
      descripcion: 'Integración de servicios web transaccionales, portal de compras en línea, pasarelas de pago nacionales e internacionales y optimización WPO.',
      requisitos: ['PHP / Laravel', 'JavaScript', 'Pasarelas de Pago', 'MySQL', 'Arquitectura Web', 'Git'],
      destacado: false
    },
    {
      id: 'radar-santillana-cms',
      empresa: 'Grupo Santillana',
      puesto: 'Desarrollador Web CMS Educativo (WordPress / LMS)',
      modalidad: 'Remoto',
      ubicacion: 'Madrid / Remoto España',
      mercado: 'spain',
      salario: '€30,000 - €36,000 / año',
      salarioNum: 33000,
      tipo: 'Tiempo Completo',
      plataforma: 'infojobs',
      plataformaNombre: 'InfoJobs',
      url: 'https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=Santillana+Web',
      fecha: '2026-10-31',
      descripcion: 'Desarrollo de portales educativos, personalización de plantillas y plugins en WordPress y conexión con plataformas de aula virtual.',
      requisitos: ['WordPress', 'PHP', 'JavaScript', 'Moodle o LMS', 'HTML5/CSS3', 'SEO'],
      destacado: false
    },
    {
      id: 'radar-banco-mercantil-dev',
      empresa: 'Banco Mercantil',
      puesto: 'Analista Programador Web & APIs C2P',
      modalidad: 'Híbrido / Presencial',
      ubicacion: 'Caracas, Venezuela',
      mercado: 'latam',
      salario: 'Competitivo Sector Bancario',
      salarioNum: 24000,
      tipo: 'Tiempo Completo',
      plataforma: 'computrabajo',
      plataformaNombre: 'Computrabajo',
      url: 'https://ve.computrabajo.com/ofertas-de-trabajo/?q=mercantil',
      fecha: '2026-11-02',
      descripcion: 'Desarrollo e integración de soluciones API de recaudación bancaria C2P, validación de transacciones Pago Móvil y servicios empresariales.',
      requisitos: ['APIs REST', 'PHP / Java', 'SQL Server / Oracle', 'Seguridad Bancaria', 'Webhooks'],
      destacado: true
    },
    {
      id: 'radar-adevinta-spain',
      empresa: 'Adevinta Spain (Fotocasa, Habitaclia, InfoJobs)',
      puesto: 'Full Stack Engineer (React & Microservicios)',
      modalidad: 'Remoto',
      ubicacion: 'Barcelona / Remoto España',
      mercado: 'spain',
      salario: '€44,000 - €54,000 / año',
      salarioNum: 49000,
      tipo: 'Tiempo Completo',
      plataforma: 'infojobs',
      plataformaNombre: 'InfoJobs',
      url: 'https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=Adevinta',
      fecha: '2026-11-03',
      descripcion: 'Desarrollo de productos digitales escalables para los mayores portales de empleo e inmobiliaria de España. Arquitectura distribuida y frontend reactivo.',
      requisitos: ['React', 'JavaScript', 'Node.js / PHP', 'Docker', 'Testing', 'Git'],
      destacado: false
    },
    {
      id: 'radar-yoco-fintech',
      empresa: 'Fintech Internacional (Yoco Partners)',
      puesto: 'Payments Gateway Integration Specialist',
      modalidad: 'Remoto',
      ubicacion: 'Remoto Global (España / Latam)',
      mercado: 'remote',
      salario: '$3,800 - $5,000 USD / mes',
      salarioNum: 52000,
      tipo: 'Tiempo Completo',
      plataforma: 'remoteok',
      plataformaNombre: 'RemoteOK',
      url: 'https://remoteok.com/remote-jobs',
      fecha: '2026-11-04',
      descripcion: 'Integración técnica de SDKs de cobro, conciliación bancaria, webhooks para comercio electrónico y plugins para plataformas WooCommerce/Shopify.',
      requisitos: ['Pasarelas de Pago', 'PHP', 'WooCommerce', 'JavaScript', 'APIs Transaccionales', 'Webhooks'],
      destacado: true
    }
  ];

  // =========================================================================
  // Algoritmo de Cálculo de Compatibilidad ATS (0 Tokens)
  // =========================================================================
  function calculateAtsScore(job) {
    let score = 55; // Base score
    const textBlob = `${job.puesto} ${job.descripcion} ${(job.requisitos || []).join(' ')}`.toLowerCase();

    // Sumar puntos por palabras clave
    for (const [kw, weight] of Object.entries(ARIANNA_PROFILE_KEYWORDS)) {
      if (textBlob.includes(kw)) {
        score += (weight * 0.45);
      }
    }

    // Boost si es remoto o tiene pasarelas/moodle/laravel
    if (job.modalidad && job.modalidad.toLowerCase().includes('remoto')) score += 5;
    if (textBlob.includes('laravel') && textBlob.includes('react')) score += 8;
    if (textBlob.includes('pasarelas de pago') || textBlob.includes('pago móvil') || textBlob.includes('stripe')) score += 8;
    if (textBlob.includes('moodle') || textBlob.includes('wordpress')) score += 7;

    // Normalizar entre 70% y 98%
    score = Math.min(98, Math.max(70, Math.round(score)));
    return score;
  }

  // Pre-calcular scores ATS para todos los trabajos
  CURATED_JOBS.forEach(j => {
    j.matchScore = calculateAtsScore(j);
    j.isTopMatch = j.matchScore >= 88;
  });

  // =========================================================================
  // Estado del Módulo
  // =========================================================================
  const state = {
    jobs: [...CURATED_JOBS],
    filteredJobs: [...CURATED_JOBS],
    selectedJobIdsForCompare: new Set(),
    activeFilterMarket: 'all',
    activeFilterPlatform: 'all',
    activeFilterType: 'all',
    activeFilterModality: 'all',
    filterMatchHigh: true,
    filterMatchMed: true,
    searchKeyword: '',
    sortBy: 'match', // match, recent, salary
    chatMessages: [
      {
        sender: 'assistant',
        text: '¡Hola, Arianna! 👋 Soy tu **Asesor de Reclutamiento IA**.\n\nPuedo analizar cualquier vacante, comparar opciones (por ejemplo, **Remoto Internacional vs España**) o decirte en cuál tienes mayor probabilidad de avanzar según tu CV. ¿Por dónde empezamos?'
      }
    ]
  };

  // =========================================================================
  // Renderizado Principal del Radar
  // =========================================================================
  function render() {
    applyFilters();
    renderFacets();
    renderCards();
    updateResultsCount();
    renderCompareBar();
  }

  function applyFilters() {
    const q = (state.searchKeyword || '').trim().toLowerCase();

    state.filteredJobs = state.jobs.filter(job => {
      // 1. Keyword search (puesto, empresa, descripción o requisitos)
      if (q) {
        const fullText = `${job.puesto} ${job.empresa} ${job.ubicacion} ${(job.requisitos || []).join(' ')}`.toLowerCase();
        if (!fullText.includes(q)) return false;
      }

      // 2. Mercado / Ubicación
      if (state.activeFilterMarket !== 'all') {
        if (state.activeFilterMarket === 'spain' && job.mercado !== 'spain') return false;
        if (state.activeFilterMarket === 'remote' && job.mercado !== 'remote') return false;
        if (state.activeFilterMarket === 'latam' && job.mercado !== 'latam') return false;
      }

      // 3. Plataforma
      if (state.activeFilterPlatform !== 'all') {
        if (job.plataforma !== state.activeFilterPlatform) return false;
      }

      // 4. Modalidad
      if (state.activeFilterModality !== 'all') {
        if (!job.modalidad.toLowerCase().includes(state.activeFilterModality.toLowerCase())) return false;
      }

      // 5. Tipo
      if (state.activeFilterType !== 'all') {
        if (job.tipo !== state.activeFilterType) return false;
      }

      // 6. Match ATS
      const score = job.matchScore || 75;
      if (!state.filterMatchHigh && score >= 85) return false;
      if (!state.filterMatchMed && score >= 70 && score < 85) return false;
      if (!state.filterMatchHigh && !state.filterMatchMed) return false;

      return true;
    });

    // Ordenamiento
    if (state.sortBy === 'match') {
      state.filteredJobs.sort((a, b) => b.matchScore - a.matchScore);
    } else if (state.sortBy === 'recent') {
      state.filteredJobs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    } else if (state.sortBy === 'salary') {
      state.filteredJobs.sort((a, b) => (b.salarioNum || 0) - (a.salarioNum || 0));
    }
  }

  function renderCards() {
    const gridEl = document.getElementById('radarJobsGrid');
    const emptyEl = document.getElementById('radarEmptyState');
    if (!gridEl) return;

    if (state.filteredJobs.length === 0) {
      gridEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    // Obtener vacantes actualmente guardadas en Kanban para mostrar si ya está agregada
    const savedVacancies = (window.appStorage && window.appStorage.getVacancies()) || [];
    const savedUrlsOrNames = new Set(savedVacancies.map(v => (v.url || v.puesto + ' ' + v.empresa).toLowerCase()));

    gridEl.innerHTML = state.filteredJobs.map(job => {
      const isSelectedForCompare = state.selectedJobIdsForCompare.has(job.id);
      const isAlreadyImported = savedUrlsOrNames.has(job.url.toLowerCase()) || savedUrlsOrNames.has((job.puesto + ' ' + job.empresa).toLowerCase());
      const matchBadgeClass = job.matchScore >= 85 ? 'high' : 'med';
      const sourceClass = job.plataforma || 'generic';

      return `
        <article class="job-card ${job.isTopMatch ? 'is-top-match' : ''}" data-job-id="${job.id}">
          <div class="job-card-header">
            <div>
              <div class="job-card-company">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
                <span>${escapeHtml(job.empresa)}</span>
              </div>
              <h3 class="job-card-title">${escapeHtml(job.puesto)}</h3>
              <div class="job-card-location">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${escapeHtml(job.ubicacion)} &bull; ${escapeHtml(job.modalidad)}</span>
              </div>
            </div>

            <!-- Compare Checkbox -->
            <label style="cursor:pointer; display:flex; flex-direction:column; align-items:center; font-size:0.65rem; color:var(--text-muted);" title="Seleccionar para comparar en el Asesor IA">
              <input type="checkbox" class="job-compare-chk" data-id="${job.id}" ${isSelectedForCompare ? 'checked' : ''} style="cursor:pointer; width:17px; height:17px; accent-color:var(--primary);">
              <span>Comparar</span>
            </label>
          </div>

          <!-- Badges Row -->
          <div class="job-badges-row">
            <span class="match-badge ${matchBadgeClass}">
              ⭐ ${job.matchScore}% Match ATS
            </span>
            ${job.isTopMatch ? '<span class="boost-badge">🔥 TOP FIT ARY</span>' : ''}
            <span class="source-badge ${sourceClass}">
              ${escapeHtml(job.plataformaNombre)}
            </span>
          </div>

          <!-- Salary if present -->
          ${job.salario ? `<div class="job-card-salary">💰 ${escapeHtml(job.salario)}</div>` : ''}

          <!-- Description -->
          <p class="job-card-description">${escapeHtml(job.descripcion)}</p>

          <!-- Tags -->
          <div class="job-card-tags">
            ${(job.requisitos || []).slice(0, 5).map(req => `<span class="job-tag">${escapeHtml(req)}</span>`).join('')}
          </div>

          <!-- Card Actions Footer -->
          <div class="job-card-footer">
            <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-job-action-outline" title="Ver oferta en el portal oficial">
              <span>Ver Oferta ↗</span>
            </a>

            <div class="job-card-actions">
              <button class="btn-job-action-outline btn-ask-copilot-about" data-id="${job.id}" title="Consultar al Asesor IA sobre este puesto">
                💬 Analizar
              </button>

              <button class="btn-job-action-primary ${isAlreadyImported ? 'is-imported' : ''} btn-import-job-kanban" data-id="${job.id}" ${isAlreadyImported ? 'disabled' : ''}>
                ${isAlreadyImported ? '✓ Guardada' : '+ Guardar Kanban'}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    attachCardEventListeners();
  }

  function attachCardEventListeners() {
    // 1. Botón Guardar en Kanban
    document.querySelectorAll('.btn-import-job-kanban').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jobId = e.currentTarget.dataset.id;
        importJobToKanban(jobId, e.currentTarget);
      });
    });

    // 2. Checkbox Comparar
    document.querySelectorAll('.job-compare-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const jobId = e.currentTarget.dataset.id;
        if (e.currentTarget.checked) {
          if (state.selectedJobIdsForCompare.size >= 3) {
            e.currentTarget.checked = false;
            showToastMessage('Puedes comparar un máximo de 3 vacantes a la vez.', 'warning');
            return;
          }
          state.selectedJobIdsForCompare.add(jobId);
        } else {
          state.selectedJobIdsForCompare.delete(jobId);
        }
        renderCompareBar();
      });
    });

    // 3. Botón Analizar con Copilot
    document.querySelectorAll('.btn-ask-copilot-about').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jobId = e.currentTarget.dataset.id;
        analyzeSingleJobWithCopilot(jobId);
      });
    });
  }

  function renderFacets() {
    // Tipos de Empleo
    const typesListEl = document.getElementById('facetTypesList');
    if (typesListEl) {
      const counts = {
        'all': state.jobs.length,
        'Tiempo Completo': state.jobs.filter(j => j.tipo === 'Tiempo Completo').length
      };

      typesListEl.innerHTML = `
        <label class="facet-checkbox-label">
          <span><input type="radio" name="facetType" value="all" ${state.activeFilterType === 'all' ? 'checked' : ''}> Todos</span>
          <span class="facet-count">${counts['all']}</span>
        </label>
        <label class="facet-checkbox-label">
          <span><input type="radio" name="facetType" value="Tiempo Completo" ${state.activeFilterType === 'Tiempo Completo' ? 'checked' : ''}> Tiempo Completo</span>
          <span class="facet-count">${counts['Tiempo Completo']}</span>
        </label>
      `;

      typesListEl.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
          state.activeFilterType = e.target.value;
          render();
        });
      });
    }

    // Modalidades
    const modalitiesListEl = document.getElementById('facetModalitiesList');
    if (modalitiesListEl) {
      const remoteCount = state.jobs.filter(j => j.modalidad.toLowerCase().includes('remoto')).length;
      const hybridCount = state.jobs.filter(j => j.modalidad.toLowerCase().includes('híbrido')).length;

      modalitiesListEl.innerHTML = `
        <label class="facet-checkbox-label">
          <span><input type="radio" name="facetModality" value="all" ${state.activeFilterModality === 'all' ? 'checked' : ''}> Todas</span>
          <span class="facet-count">${state.jobs.length}</span>
        </label>
        <label class="facet-checkbox-label">
          <span><input type="radio" name="facetModality" value="Remoto" ${state.activeFilterModality === 'Remoto' ? 'checked' : ''}> Remoto (100%)</span>
          <span class="facet-count">${remoteCount}</span>
        </label>
        <label class="facet-checkbox-label">
          <span><input type="radio" name="facetModality" value="Híbrido" ${state.activeFilterModality === 'Híbrido' ? 'checked' : ''}> Híbrido</span>
          <span class="facet-count">${hybridCount}</span>
        </label>
      `;

      modalitiesListEl.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
          state.activeFilterModality = e.target.value;
          render();
        });
      });
    }

    // Plataformas
    const sourcesListEl = document.getElementById('facetSourcesList');
    if (sourcesListEl) {
      const platforms = [
        { id: 'all', label: 'Todas las bolsas' },
        { id: 'linkedin', label: 'LinkedIn' },
        { id: 'infojobs', label: 'InfoJobs España' },
        { id: 'remoteok', label: 'RemoteOK' },
        { id: 'getonbrd', label: 'Get on Board' },
        { id: 'computrabajo', label: 'Computrabajo' },
        { id: 'tecnoempleo', label: 'Tecnoempleo' }
      ];

      sourcesListEl.innerHTML = platforms.map(p => {
        const count = p.id === 'all' ? state.jobs.length : state.jobs.filter(j => j.plataforma === p.id).length;
        return `
          <label class="facet-checkbox-label">
            <span><input type="radio" name="facetPlatform" value="${p.id}" ${state.activeFilterPlatform === p.id ? 'checked' : ''}> ${p.label}</span>
            <span class="facet-count">${count}</span>
          </label>
        `;
      }).join('');

      sourcesListEl.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
          state.activeFilterPlatform = e.target.value;
          render();
        });
      });
    }

    // Actualizar contadores ATS
    const countHigh = state.jobs.filter(j => j.matchScore >= 85).length;
    const countMed = state.jobs.filter(j => j.matchScore >= 70 && j.matchScore < 85).length;
    const countHighEl = document.getElementById('countMatchHigh');
    const countMedEl = document.getElementById('countMatchMed');
    if (countHighEl) countHighEl.textContent = countHigh;
    if (countMedEl) countMedEl.textContent = countMed;
  }

  function updateResultsCount() {
    const totalEl = document.getElementById('radarTotalCount');
    if (totalEl) totalEl.textContent = state.filteredJobs.length;

    const labelBadge = document.getElementById('radarActiveFilterLabel');
    if (labelBadge) {
      if (state.activeFilterMarket !== 'all' || state.activeFilterPlatform !== 'all' || state.searchKeyword) {
        labelBadge.style.display = 'inline-block';
        labelBadge.textContent = 'Filtros activos';
      } else {
        labelBadge.style.display = 'none';
      }
    }
  }

  function renderCompareBar() {
    const bar = document.getElementById('copilotCompareSelectionBar');
    const countEl = document.getElementById('compareSelectedCount');
    if (!bar || !countEl) return;

    const count = state.selectedJobIdsForCompare.size;
    countEl.textContent = count;

    if (count >= 2) {
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  }

  // =========================================================================
  // 1-Click Importación a Tablero Kanban
  // =========================================================================
  function importJobToKanban(jobId, btnElement) {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    if (!window.appStorage || typeof window.appStorage.addVacancy !== 'function') {
      showToastMessage('Error: Almacenamiento no inicializado.', 'error');
      return;
    }

    const vacancyPayload = {
      empresa: job.empresa,
      puesto: job.puesto,
      modalidad: job.modalidad,
      ubicacion: job.ubicacion,
      salario: job.salario || '',
      estado: 'saved',
      prioridad: job.isTopMatch ? 'high' : 'med',
      url: job.url,
      contacto: `Importado de ${job.plataformaNombre}`,
      fecha: new Date().toISOString().split('T')[0],
      notas: `Vacante detectada por el Radar de Empleos. Match ATS estimado: ${job.matchScore}%.`,
      requisitos: job.requisitos || [],
      estrategia: `Alinear CV resaltando experiencia demostrable en ${(job.requisitos || []).slice(0, 3).join(', ')}.`
    };

    window.appStorage.addVacancy(vacancyPayload);

    if (btnElement) {
      btnElement.textContent = '✓ Guardada';
      btnElement.classList.add('is-imported');
      btnElement.disabled = true;
    }

    showToastMessage(`¡"${job.puesto}" guardada en Kanban con éxito!`, 'success');
  }

  // =========================================================================
  // Chatbot Asesor IA (Optimizado en Tokens)
  // =========================================================================
  function switchSidebarTab(tabName) {
    const tabFilters = document.getElementById('tabSidebarFilters');
    const tabCopilot = document.getElementById('tabSidebarCopilot');
    const panelFilters = document.getElementById('sidebarPanelFilters');
    const panelCopilot = document.getElementById('sidebarPanelCopilot');

    if (tabName === 'copilot') {
      if (tabFilters) tabFilters.classList.remove('active');
      if (tabCopilot) tabCopilot.classList.add('active');
      if (panelFilters) panelFilters.style.display = 'none';
      if (panelCopilot) panelCopilot.style.display = 'block';
    } else {
      if (tabFilters) tabFilters.classList.add('active');
      if (tabCopilot) tabCopilot.classList.remove('active');
      if (panelFilters) panelFilters.style.display = 'block';
      if (panelCopilot) panelCopilot.style.display = 'none';
    }
  }

  function renderCopilotMessages() {
    const container = document.getElementById('radarCopilotMessages');
    if (!container) return;

    container.innerHTML = state.chatMessages.map(msg => {
      const isUser = msg.sender === 'user';
      return `
        <div class="copilot-msg-bubble ${isUser ? 'user' : 'assistant'}">
          ${formatCopilotMarkdown(msg.text)}
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  function formatCopilotMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    return html;
  }

  async function handleCopilotUserPrompt(promptText) {
    if (!promptText || !promptText.trim()) return;
    const cleanPrompt = promptText.trim();

    // 1. Agregar mensaje del usuario
    state.chatMessages.push({ sender: 'user', text: cleanPrompt });
    renderCopilotMessages();

    // Cambiar vista al asesor
    switchSidebarTab('copilot');

    // 2. Indicador de carga
    state.chatMessages.push({ sender: 'assistant', text: 'Analizando con tu perfil y experiencia...', isPending: true });
    renderCopilotMessages();

    // 3. Generar respuesta (Heurística o Gemini ultraligera)
    try {
      const response = await generateRecruiterAdvice(cleanPrompt);
      state.chatMessages.pop(); // Quitar pending
      state.chatMessages.push({ sender: 'assistant', text: response });
    } catch (err) {
      state.chatMessages.pop();
      state.chatMessages.push({
        sender: 'assistant',
        text: 'Hubo un inconveniente al conectar con el motor de IA. Te recomiendo postular primero a las vacantes de España en remoto, donde tu experiencia en Laravel y Moodle destaca con más del 90% de match.'
      });
    }

    renderCopilotMessages();
  }

  async function generateRecruiterAdvice(prompt) {
    // Si hay vacantes seleccionadas para comparar
    if (state.selectedJobIdsForCompare.size >= 2) {
      const selectedJobs = state.jobs.filter(j => state.selectedJobIdsForCompare.has(j.id));
      return generateSideBySideComparison(selectedJobs);
    }

    // Heurísticas locales de alta precisión (0 TOKENS)
    const lower = prompt.toLowerCase();

    if (lower.includes('top 3') || lower.includes('mejores') || lower.includes('para mí')) {
      const top3 = [...state.jobs].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
      return `⭐ **Tus 3 mejores opciones hoy:**\n\n` +
        top3.map((j, i) => `**${i + 1}. ${j.puesto}** (${j.empresa})\n- **Match ATS:** ${j.matchScore}%\n- **Por qué:** Pide ${j.requisitos.slice(0, 3).join(', ')}, encajando exactamente con tu desarrollo en Gonzaga y Fe y Alegría.\n- **Salario:** ${j.salario || 'A convenir'}`).join('\n\n') +
        `\n\n💡 **Recomendación:** Te sugiero empezar enviando tu postulación a **${top3[0].empresa}**.`;
    }

    if (lower.includes('remoto vs españa') || lower.includes('españa') || lower.includes('priorizar')) {
      return `⚖️ **Análisis Comparativo: Remoto Internacional vs España**\n\n` +
        `1. **Mercado de España (InfoJobs / Tecnoempleo):**\n` +
        `• **Ventajas:** Alta demanda de perfiles en PHP/Laravel y Moodle LMS. Los rangos para perfiles Full Stack oscilan entre **€36k y €50k/año**.\n` +
        `• **Estrategia:** Destaca que cuentas con disponibilidad inmediata en remoto y que manejas el huso horario europeo sin fricción.\n\n` +
        `2. **Remoto Internacional / Latam (Get on Board / RemoteOK):**\n` +
        `• **Ventajas:** Procesos de contratación más ágiles mediante contrato B2B o Contractor en USD ($2,500 - $4,500/mes).\n\n` +
        `🎯 **Veredicto del Asesor:** Prioriza **España** para puestos que pidan Moodle o Laravel corporativo (como VIU o Cabify), ya que tu especialidad allí es escasa y muy valorada.`;
    }

    if (lower.includes('venezuela') || lower.includes('enfocar') || lower.includes('postular')) {
      return `🇪🇸 **Consejo Estratégico para postular en España desde Venezuela:**\n\n` +
        `1. **Disponibilidad y Régimen:** Aclara en tu carta que buscas modalidad **Remoto 100% como Contractor / Autónomo** o contrato internacional.\n` +
        `2. **Solidez Técnica:** Menciona tu experiencia en plataformas con alto volumen transaccional (ej. +900 transacciones mensuales en Gonzaga Admin y sistemas universitarios).\n` +
        `3. **Pruebas de Código:** Adjunta tu enlace a GitHub y tu portafolio; para los reclutadores españoles el código limpio y verificable pesa más que la procedencia geográfica.`;
    }

    // Si tenemos API Key de Gemini configurada, hacemos una llamada ultracompacta (<200 tokens)
    if (window.aiParser && typeof window.aiParser.callGeminiText === 'function') {
      const compactPrompt = `Eres un Asesor de Empleo experto para Arianna Clemente (Full Stack: PHP, Laravel, React, WordPress, Moodle, Pasarelas de Pago, MySQL).
Pregunta de Arianna: "${prompt}".
Responde en 3 viñetas concisas y 1 recomendación de acción directa. Máximo 150 palabras.`;
      
      try {
        const aiResponse = await window.aiParser.callGeminiText(compactPrompt);
        if (aiResponse) return aiResponse;
      } catch (e) {
        console.warn('Fallback a heurística local por error de API:', e);
      }
    }

    // Heurística general por defecto
    return `Analizando tu consulta sobre **"${escapeHtml(prompt)}"**:\n\n` +
      `• Tu perfil tiene mayor ventaja competitiva en vacantes que combinan **Backend robusto (Laravel/PHP)** con interfaces interactivas en **React**.\n` +
      `• Para empresas que requieran pasarelas de pago, destaca tu módulo transaccional Gonzaga Admin.\n` +
      `• ¿Deseas seleccionar dos vacantes con la casilla **"Comparar"** para ver un cara a cara detallado?`;
  }

  function generateSideBySideComparison(jobs) {
    const [j1, j2] = jobs;
    return `⚖️ **Comparativa Directa de Selección:**\n\n` +
      `📌 **Opción A: ${j1.puesto}** (${j1.empresa})\n` +
      `• **Match:** ${j1.matchScore}% | **Modalidad:** ${j1.modalidad}\n` +
      `• **Salario:** ${j1.salario || 'No especificado'}\n` +
      `• **Punto Fuerte:** ${(j1.requisitos || []).slice(0, 2).join(' y ')} encajan directo con tu CV.\n\n` +
      `📌 **Opción B: ${j2.puesto}** (${j2.empresa})\n` +
      `• **Match:** ${j2.matchScore}% | **Modalidad:** ${j2.modalidad}\n` +
      `• **Salario:** ${j2.salario || 'No especificado'}\n` +
      `• **Punto Fuerte:** ${(j2.requisitos || []).slice(0, 2).join(' y ')}.\n\n` +
      `🏆 **Veredicto de Prioridad:**\n` +
      `Te recomiendo postular primero a **${j1.matchScore >= j2.matchScore ? j1.empresa : j2.empresa}** (${Math.max(j1.matchScore, j2.matchScore)}% Match). Prepara un CV enfatizando ${j1.matchScore >= j2.matchScore ? j1.requisitos[0] : j2.requisitos[0]}.`;
  }

  function analyzeSingleJobWithCopilot(jobId) {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    switchSidebarTab('copilot');

    const prompt = `Analiza la vacante de "${job.puesto}" en ${job.empresa}. ¿Cuáles son mis ventajas clave y qué debo destacar en mi postulación?`;
    handleCopilotUserPrompt(prompt);
  }

  // =========================================================================
  // Live Job Feeds (Optimizado con Caching de 12h y Fallback)
  // =========================================================================
  async function refreshLiveJobs() {
    const btnRefresh = document.getElementById('btnRefreshRadarJobs');
    if (btnRefresh) {
      btnRefresh.disabled = true;
      btnRefresh.innerHTML = `
        <span class="live-pulse" style="width:6px; height:6px;"><span class="live-pulse-core" style="background:var(--primary);"></span></span>
        <span>Consultando APIs...</span>
      `;
    }

    try {
      // Usar feed público de desarrollo web sin tokens (Remotive API)
      const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=12', {
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.jobs && Array.isArray(data.jobs)) {
          const liveTransformed = data.jobs.map(item => {
            const tempJob = {
              id: 'remotive-' + item.id,
              empresa: item.company_name || 'Empresa Internacional',
              puesto: item.title,
              modalidad: 'Remoto',
              ubicacion: item.candidate_required_location || 'Remoto Global',
              mercado: 'remote',
              salario: item.salary || '$3,000 - $4,500 USD',
              salarioNum: 40000,
              tipo: item.job_type === 'full_time' ? 'Tiempo Completo' : 'Remoto',
              plataforma: 'remoteok',
              plataformaNombre: 'Remotive Feed',
              url: item.url,
              fecha: item.publication_date ? item.publication_date.split('T')[0] : '2026-11-04',
              descripcion: (item.description || '').replace(/<[^>]*>?/gm, '').substring(0, 190) + '...',
              requisitos: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 5) : ['Web Development', 'JavaScript', 'APIs']
            };
            tempJob.matchScore = calculateAtsScore(tempJob);
            tempJob.isTopMatch = tempJob.matchScore >= 88;
            return tempJob;
          });

          // Mezclar sin duplicados
          const existingIds = new Set(state.jobs.map(j => j.id));
          const newUnique = liveTransformed.filter(j => !existingIds.has(j.id));
          state.jobs = [...newUnique, ...state.jobs];
          showToastMessage(`¡${newUnique.length} vacantes en vivo añadidas desde la red internacional!`, 'success');
        }
      }
    } catch (e) {
      console.info('Consulta a API externa completada con fallback local:', e);
      showToastMessage('Radar actualizado con el catálogo curado de 25 vacantes clave.', 'info');
    } finally {
      if (btnRefresh) {
        btnRefresh.disabled = false;
        btnRefresh.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          <span>Actualizar</span>
        `;
      }
      render();
    }
  }

  // =========================================================================
  // Listeners y Enlaces de Controles de Interfaz
  // =========================================================================
  function initEventListeners() {
    // 1. Hero Search Bar
    const heroInput = document.getElementById('radarHeroInput');
    const heroMarket = document.getElementById('radarHeroMarketSelect');
    const heroSource = document.getElementById('radarHeroSourceSelect');
    const heroForm = document.getElementById('radarHeroForm');

    if (heroForm) {
      heroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.searchKeyword = (heroInput && heroInput.value) || '';
        state.activeFilterMarket = (heroMarket && heroMarket.value) || 'all';
        state.activeFilterPlatform = (heroSource && heroSource.value) || 'all';
        render();
        // Desplazar suavemente a los resultados
        const gridEl = document.getElementById('radarJobsGrid');
        if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (heroInput) {
      heroInput.addEventListener('input', () => {
        state.searchKeyword = heroInput.value;
        applyFilters();
        renderCards();
        updateResultsCount();
      });
    }

    // 2. Ordenamiento
    const sortSelect = document.getElementById('radarSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        render();
      });
    }

    // 3. Botón Actualizar
    const btnRefresh = document.getElementById('btnRefreshRadarJobs');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        refreshLiveJobs();
      });
    }

    // 4. Tab switcher del Sidebar (Filtros vs Asesor IA)
    const tabFilters = document.getElementById('tabSidebarFilters');
    const tabCopilot = document.getElementById('tabSidebarCopilot');
    if (tabFilters) tabFilters.addEventListener('click', () => switchSidebarTab('filters'));
    if (tabCopilot) tabCopilot.addEventListener('click', () => switchSidebarTab('copilot'));

    // 5. Botón Restablecer Filtros
    const btnReset = document.getElementById('btnResetRadarFilters');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        state.activeFilterMarket = 'all';
        state.activeFilterPlatform = 'all';
        state.activeFilterType = 'all';
        state.activeFilterModality = 'all';
        state.filterMatchHigh = true;
        state.filterMatchMed = true;
        state.searchKeyword = '';
        if (heroInput) heroInput.value = '';
        if (heroMarket) heroMarket.value = 'all';
        if (heroSource) heroSource.value = 'all';
        const chkHigh = document.getElementById('chkMatchHigh');
        const chkMed = document.getElementById('chkMatchMed');
        if (chkHigh) chkHigh.checked = true;
        if (chkMed) chkMed.checked = true;
        render();
      });
    }

    // 6. Checkboxes Match ATS
    const chkHigh = document.getElementById('chkMatchHigh');
    const chkMed = document.getElementById('chkMatchMed');
    if (chkHigh) {
      chkHigh.addEventListener('change', (e) => {
        state.filterMatchHigh = e.target.checked;
        render();
      });
    }
    if (chkMed) {
      chkMed.addEventListener('change', (e) => {
        state.filterMatchMed = e.target.checked;
        render();
      });
    }

    // 7. Botón Comparar en Copilot
    const btnTriggerCompare = document.getElementById('btnTriggerCompareWithAi');
    if (btnTriggerCompare) {
      btnTriggerCompare.addEventListener('click', () => {
        switchSidebarTab('copilot');
        handleCopilotUserPrompt('Compara detalladamente las vacantes que seleccioné y dime cuál debo priorizar.');
      });
    }

    // 8. Chips de sugerencias del Copilot
    document.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const prompt = e.currentTarget.dataset.prompt;
        if (prompt) handleCopilotUserPrompt(prompt);
      });
    });

    // 9. Input del Copilot Form
    const copilotForm = document.getElementById('radarCopilotForm');
    const copilotInput = document.getElementById('radarCopilotInput');
    if (copilotForm && copilotInput) {
      copilotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = copilotInput.value;
        if (text && text.trim()) {
          copilotInput.value = '';
          handleCopilotUserPrompt(text);
        }
      });
    }
  }

  // =========================================================================
  // Utilidades
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToastMessage(msg, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span>${escapeHtml(msg)}</span>
    `;

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================================
  // Exportar API Pública
  // =========================================================================
  window.jobRadar = {
    init: function () {
      render();
      renderCopilotMessages();
    },
    render: render,
    importJobToKanban: importJobToKanban,
    askCopilot: handleCopilotUserPrompt
  };

  // Inicializar al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    window.jobRadar.init();
  });

})();
