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

  const RADAR_CACHE_KEY = 'aryc_radar_verified_jobs_v2';
  const RADAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

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

  function isDirectActiveVacancyUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    try {
      const parsed = new URL(rawUrl.trim());
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      if (!parsed.pathname || parsed.pathname === '/') return false;
      if (SEARCH_URL_PATTERNS.some(re => re.test(rawUrl))) return false;
      return true;
    } catch {
      return false;
    }
  }

  function loadCachedVerifiedJobs() {
    try {
      const raw = localStorage.getItem(RADAR_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.jobs)) return [];
      return parsed.jobs.filter(j => isDirectActiveVacancyUrl(j.url));
    } catch {
      return [];
    }
  }

  function isRadarCacheFresh() {
    try {
      const raw = localStorage.getItem(RADAR_CACHE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed && parsed.timestamp && (Date.now() - parsed.timestamp) < RADAR_CACHE_TTL_MS && Array.isArray(parsed.jobs) && parsed.jobs.length > 0);
    } catch {
      return false;
    }
  }

  function saveVerifiedJobsCache(jobs) {
    try {
      localStorage.setItem(RADAR_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        jobs: jobs.slice(0, 60)
      }));
    } catch (e) {}
  }

  // =========================================================================
  // Algoritmo Dinámico de Compatibilidad ATS (Multi-Usuario, 0 Tokens)
  // =========================================================================
  function getActiveUserProfile() {
    if (window.appStorage && typeof window.appStorage.getProfile === 'function') {
      try {
        return window.appStorage.getProfile();
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function calculateAtsScore(job) {
    const profile = getActiveUserProfile();
    if (window.aiJobParser && typeof window.aiJobParser.computeProfileVacancyMatch === 'function') {
      const res = window.aiJobParser.computeProfileVacancyMatch({
        puesto: job.puesto,
        requisitos: job.requisitos || [],
        notas: job.descripcion || ''
      }, profile);
      return res.matchScore;
    }

    const skills = Array.isArray(profile?.habilidades) ? profile.habilidades.filter(Boolean) : [];
    if (skills.length === 0) return 0;

    const textBlob = `${job.puesto} ${job.descripcion || ''} ${(job.requisitos || []).join(' ')}`.toLowerCase();
    let hits = 0;
    skills.forEach(sk => {
      if (textBlob.includes(String(sk).trim().toLowerCase())) hits++;
    });
    return Math.min(100, Math.round((hits / Math.min(skills.length, 6)) * 100));
  }

  // =========================================================================
  // Estado del Módulo
  // =========================================================================
  const state = {
    jobs: loadCachedVerifiedJobs(),
    filteredJobs: [],
    selectedJobIdsForCompare: new Set(),
    activeFilterRole: 'all',
    activeFilterMarket: 'all',
    activeFilterPlatform: 'all',
    activeFilterType: 'all',
    activeFilterModality: 'all',
    activeMatchFilter: 'all', // all, high (>=55), med (10-54)
    searchKeyword: '',
    sortBy: 'match', // match, recent, salary
    isLoadingLive: false,
    useLocalModeOnly: false,
    chatMessages: [
      {
        sender: 'assistant',
        text: '¡Hola! 👋 Soy tu **Asesor de Reclutamiento IA**.\n\nPuedo analizar tus **vacantes guardadas en el Kanban** o evaluar las ofertas verificadas del **Radar de Empleos**. ¿Por dónde empezamos?'
      }
    ]
  };

  function recalculateAllScores() {
    state.jobs = state.jobs.filter(j => isDirectActiveVacancyUrl(j.url));
    state.jobs.forEach(j => {
      j.matchScore = calculateAtsScore(j);
      j.isTopMatch = j.matchScore >= 55;
    });
  }

  recalculateAllScores();

  // =========================================================================
  // Renderizado Principal del Radar
  // =========================================================================
  function render() {
    applyFilters();
    renderCards();
    updateResultsCount();
    renderCompareBar();
    updateAtsBadges();
  }

  function applyFilters() {
    const q = (state.searchKeyword || '').trim().toLowerCase();

    state.filteredJobs = state.jobs.filter(job => {
      // 1. Keyword search (multi-word match across puesto, empresa, ubicacion, modalidad, requisitos, descripcion)
      if (q) {
        const fullText = `${job.puesto} ${job.empresa} ${job.ubicacion} ${job.modalidad} ${(job.requisitos || []).join(' ')} ${job.descripcion}`.toLowerCase();
        const terms = q.split(/\s+/).filter(Boolean);
        const matchesAll = terms.every(t => fullText.includes(t));
        if (!matchesAll) return false;
      }

      // 2. Rol / Especialidad
      if (state.activeFilterRole && state.activeFilterRole !== 'all') {
        const role = state.activeFilterRole.toLowerCase();
        const fullRoleText = `${job.puesto} ${(job.requisitos || []).join(' ')} ${job.descripcion}`.toLowerCase();
        if (role === 'full stack') {
          if (!fullRoleText.includes('full stack') && !fullRoleText.includes('fullstack') && !fullRoleText.includes('full-stack') && !fullRoleText.includes('php / react') && !fullRoleText.includes('desarrollador')) return false;
        } else if (role === 'frontend') {
          if (!fullRoleText.includes('frontend') && !fullRoleText.includes('front-end') && !fullRoleText.includes('react') && !fullRoleText.includes('next.js') && !fullRoleText.includes('vue') && !fullRoleText.includes('angular') && !fullRoleText.includes('css')) return false;
        } else if (role === 'backend') {
          if (!fullRoleText.includes('backend') && !fullRoleText.includes('back-end') && !fullRoleText.includes('php') && !fullRoleText.includes('laravel') && !fullRoleText.includes('python') && !fullRoleText.includes('node') && !fullRoleText.includes('api')) return false;
        } else if (role === 'wordpress') {
          if (!fullRoleText.includes('wordpress') && !fullRoleText.includes('woocommerce') && !fullRoleText.includes('cms') && !fullRoleText.includes('headless')) return false;
        } else if (role === 'ai') {
          if (!fullRoleText.includes('ia') && !fullRoleText.includes('ai') && !fullRoleText.includes('chatbot') && !fullRoleText.includes('automatización') && !fullRoleText.includes('openai') && !fullRoleText.includes('gemini') && !fullRoleText.includes('prompt')) return false;
        } else {
          if (!fullRoleText.includes(role)) return false;
        }
      }

      // 3. Mercado / Ubicación
      if (state.activeFilterMarket && state.activeFilterMarket !== 'all') {
        const m = state.activeFilterMarket.toLowerCase();
        if (m === 'spain' || m === 'españa') {
          const matchSpain = job.mercado === 'spain' ||
            (job.ubicacion && (job.ubicacion.toLowerCase().includes('españa') || job.ubicacion.toLowerCase().includes('madrid') || job.ubicacion.toLowerCase().includes('barcelona')));
          if (!matchSpain) return false;
        } else if (m === 'remote' || m === 'remoto') {
          const matchRemote = job.mercado === 'remote' ||
            (job.modalidad && job.modalidad.toLowerCase().includes('remot')) ||
            (job.ubicacion && job.ubicacion.toLowerCase().includes('remot'));
          if (!matchRemote) return false;
        } else if (m === 'latam') {
          const matchLatam = job.mercado === 'latam' ||
            (job.ubicacion && (job.ubicacion.toLowerCase().includes('latam') || job.ubicacion.toLowerCase().includes('colombia') || job.ubicacion.toLowerCase().includes('méxico') || job.ubicacion.toLowerCase().includes('argentina') || job.ubicacion.toLowerCase().includes('chile')));
          if (!matchLatam) return false;
        } else if (m === 'venezuela') {
          const matchVzla = job.mercado === 'venezuela' ||
            (job.ubicacion && (job.ubicacion.toLowerCase().includes('venezuela') || job.ubicacion.toLowerCase().includes('caracas')));
          if (!matchVzla) return false;
        }
      }

      // 4. Plataforma
      if (state.activeFilterPlatform && state.activeFilterPlatform !== 'all') {
        const p = state.activeFilterPlatform.toLowerCase();
        const jobP = (job.plataforma || '').toLowerCase();
        const jobPName = (job.plataformaNombre || '').toLowerCase();
        if (!jobP.includes(p) && !jobPName.includes(p)) return false;
      }

      // 5. Modalidad
      if (state.activeFilterModality && state.activeFilterModality !== 'all') {
        if (!job.modalidad.toLowerCase().includes(state.activeFilterModality.toLowerCase())) return false;
      }

      // 6. Tipo
      if (state.activeFilterType && state.activeFilterType !== 'all') {
        if (job.tipo !== state.activeFilterType) return false;
      }

      // 7. Match ATS
      const score = job.matchScore || 0;
      if (state.activeMatchFilter === 'high' && score < 55) return false;
      if (state.activeMatchFilter === 'med' && (score < 10 || score >= 55)) return false;

      return isDirectActiveVacancyUrl(job.url);
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
      const matchBadgeClass = job.matchScore >= 55 ? 'high' : 'med';
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
            ${job.isTopMatch ? '<span class="boost-badge">🔥 TOP MATCH</span>' : ''}
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
    const containers = [
      document.getElementById('radarCopilotMessages'),
      document.getElementById('atsCopilotDrawerMessages')
    ].filter(Boolean);

    containers.forEach(container => {
      container.innerHTML = state.chatMessages.map(msg => {
        const isUser = msg.sender === 'user';
        return `
          <div class="copilot-msg-bubble ${isUser ? 'user' : 'assistant'}">
            ${formatCopilotMarkdown(msg.text)}
          </div>
        `;
      }).join('');
      container.scrollTop = container.scrollHeight;
    });
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

    // Si estamos en la vista de radar y el sidebar copilot existe
    if (document.getElementById('sidebarPanelCopilot')) {
      switchSidebarTab('copilot');
    }

    // 2. Indicador de carga
    state.chatMessages.push({ sender: 'assistant', text: 'Analizando con tu perfil y tus vacantes...', isPending: true });
    renderCopilotMessages();

    // 3. Generar respuesta
    try {
      const response = await generateRecruiterAdvice(cleanPrompt);
      state.chatMessages.pop(); // Quitar pending
      state.chatMessages.push({ sender: 'assistant', text: response });
    } catch (err) {
      state.chatMessages.pop();
      state.chatMessages.push({
        sender: 'assistant',
        text: 'Hubo un inconveniente temporal con el motor de IA. Te recomiendo postular primero a las vacantes de España en remoto, donde tu experiencia en Laravel y Moodle destaca con más del 90% de match.'
      });
    }

    renderCopilotMessages();
  }

  async function generateRecruiterAdvice(prompt) {
    // Si hay vacantes seleccionadas para comparar en el Radar
    if (state.selectedJobIdsForCompare.size >= 2) {
      const selectedJobs = state.jobs.filter(j => state.selectedJobIdsForCompare.has(j.id));
      return generateSideBySideComparison(selectedJobs);
    }

    // Obtener vacantes guardadas en el ATS
    const savedVacancies = (window.appStorage && typeof window.appStorage.getVacancies === 'function')
      ? window.appStorage.getVacancies()
      : [];

    const lower = prompt.toLowerCase();

    // =========================================================================
    // Heurísticas de Alto Rendimiento para Tablero ATS (0 Tokens)
    // =========================================================================

    // A. Diagnóstico de Embudo / Conversión ATS
    if (lower.includes('embudo') || lower.includes('funnel') || lower.includes('conversión') || lower.includes('tasa') || (lower.includes('ats') && lower.includes('estad'))) {
      const total = savedVacancies.length;
      const guardadas = savedVacancies.filter(v => v.estado === 'guardada').length;
      const postuladas = savedVacancies.filter(v => v.estado === 'postulada').length;
      const entrevistas = savedVacancies.filter(v => v.estado === 'entrevista').length;
      const ofertas = savedVacancies.filter(v => v.estado === 'oferta').length;
      const rechazos = savedVacancies.filter(v => v.estado === 'rechazada').length;
      const rate = total > 0 ? Math.round(((entrevistas + ofertas) / total) * 100) : 0;

      return `📊 **Diagnóstico Táctico de tu Embudo ATS:**\n\n` +
        `• **Total Registradas:** ${total} vacantes\n` +
        `• **Guardadas (Sin enviar):** ${guardadas} | **Postuladas:** ${postuladas}\n` +
        `• **En Proceso de Entrevista:** ${entrevistas} | **Ofertas:** ${ofertas} | **Rechazos:** ${rechazos}\n` +
        `• **Tasa de Efectividad a Entrevista:** ${rate}%\n\n` +
        `💡 **3 Acciones para Desbloquear tu Proceso:**\n` +
        (guardadas > 0 ? `1. **Activa tus vacantes guardadas:** Tienes ${guardadas} vacantes en "Guardada". Te recomiendo enviar tu CV hoy a las de prioridad Alta.\n` : `1. **Mantén el flujo:** Tu tablero tiene todas las vacantes en proceso activo.\n`) +
        (postuladas > 0 ? `2. **Seguimiento a postuladas:** Para las ${postuladas} postuladas que lleven más de 7 días, envía un mensaje breve de cortesía por LinkedIn al reclutador.\n` : `2. **Explora nuevas opciones:** Revisa el Radar de Empleos para nutrir tu embudo con ofertas de España y Remotas.\n`) +
        (entrevistas > 0 ? `3. **Prioridad máxima:** Enfócate 100% en preparar tus ${entrevistas} procesos en entrevista usando el Simulador STAR.` : `3. **Siguiente hito:** Tu objetivo esta semana es conseguir tu primera entrevista activa adaptando el CV con nuestro motor de IA.`);
    }

    // B. Preparación de Entrevistas Activas
    if (lower.includes('entrevista') || lower.includes('entrevistas')) {
      const enEntrevista = savedVacancies.filter(v => v.estado === 'entrevista');
      if (enEntrevista.length > 0) {
        return `🎤 **Estrategia para tus ${enEntrevista.length} Vacantes en Entrevista:**\n\n` +
          enEntrevista.map((v, i) => `**${i + 1}. ${v.empresa} - ${v.puesto}**\n- **Modalidad:** ${v.modalidad || 'Remoto'} | **Salario:** ${v.salario || 'A convenir'}\n- **Punto Fuerte a Destacar:** Liderazgo en proyectos reales de misión crítica y métricas cuantificables.\n- **Pregunta Crítica que te harán:** "¿Cómo aseguras la estabilidad y manejo de errores en pasarelas de pago o APIs bajo alta concurrencia?"`).join('\n\n') +
          `\n\n🎯 **Plan de Acción:** Abre la tarjeta en el Kanban y haz clic en **"🎤 Preparar Entrevista"** para simular las 5 preguntas con el Coach.`;
      } else {
        return `🎤 **Vacantes en Etapa Entrevista:**\n\nActualmente no tienes vacantes marcadas en la columna **"En Entrevistas"**.\n\n💡 **Recomendación:** Revisa tus vacantes **"Postuladas"** (${savedVacancies.filter(v => v.estado === 'postulada').length} registradas) y envía un mensaje de seguimiento para acelerar la respuesta de los reclutadores.`;
      }
    }

    // C. Prioridades y Top en el Kanban / ATS
    if (lower.includes('priorizar') || lower.includes('prioridad') || lower.includes('kanban') || lower.includes('guardadas') || lower.includes('tablero')) {
      if (savedVacancies.length > 0) {
        const priorityScore = { high: 3, med: 2, low: 1 };
        const sorted = [...savedVacancies].sort((a, b) => (priorityScore[b.prioridad] || 0) - (priorityScore[a.prioridad] || 0));
        const top = sorted.slice(0, 3);
        return `🎯 **Prioridades Estratégicas en tu Tablero ATS:**\n\n` +
          top.map((v, i) => `**${i + 1}. ${v.empresa} (${v.puesto})**\n- **Estado Actual:** ${v.estado.toUpperCase()} | **Prioridad:** ${v.prioridad === 'high' ? '🔥 Alta' : 'Media'}\n- **Modalidad:** ${v.modalidad || 'Remoto'} | **Salario:** ${v.salario || 'No especificado'}\n- **Por qué priorizar:** Alto ajuste técnico y potencial de cierre en el corto plazo.`).join('\n\n') +
          `\n\n💡 **Consejo:** Enfócate hoy en avanzar la vacante de **${top[0].empresa}**.`;
      }
    }

    // D. Vacante individual del ATS buscada por nombre de empresa
    const matchingAtsJob = savedVacancies.find(v => lower.includes(v.empresa.toLowerCase()));
    if (matchingAtsJob) {
      return `📌 **Análisis Táctico de tu Vacante: ${matchingAtsJob.empresa} (${matchingAtsJob.puesto})**\n\n` +
        `• **Estado en Kanban:** ${matchingAtsJob.estado.toUpperCase()} | **Prioridad:** ${matchingAtsJob.prioridad === 'high' ? '🔥 Alta' : 'Media'}\n` +
        `• **Modalidad:** ${matchingAtsJob.modalidad || 'Remoto'} | **Salario:** ${matchingAtsJob.salario || 'A convenir'}\n` +
        `• **Requisitos Declarados:** ${(matchingAtsJob.requisitos || []).join(', ') || 'Desarrollo de software y APIs'}\n\n` +
        `🚀 **Cómo asegurar esta vacante:**\n` +
        `1. **CV Personalizado:** Genera un CV resaltando proyectos transaccionales y tecnologías clave.\n` +
        `2. **Pitch de Valor:** Destaca tu capacidad de autonomía en entornos remotos y resolución de problemas.\n` +
        `3. **Simulador STAR:** Practica tus respuestas con el botón **"Asesor IA"** en su tarjeta del Kanban.`;
    }

    // E. Consultas sobre el Radar de Empleos
    if (lower.includes('top 3') || lower.includes('mejores') || lower.includes('para mí')) {
      const top3 = [...state.jobs].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
      return `⭐ **Tus 3 mejores opciones del Radar hoy:**\n\n` +
        top3.map((j, i) => `**${i + 1}. ${j.puesto}** (${j.empresa})\n- **Match ATS:** ${j.matchScore}%\n- **Requisitos:** ${j.requisitos.slice(0, 3).join(', ')}\n- **Salario:** ${j.salario || 'A convenir'}`).join('\n\n') +
        `\n\n💡 **Recomendación:** Te sugiero empezar enviando tu postulación a **${top3[0].empresa}**.`;
    }

    if (lower.includes('remoto vs españa') || lower.includes('españa')) {
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

    // Obtener información del perfil activo
    const profile = getActiveUserProfile();
    const candidateName = profile && profile.nombre ? profile.nombre : 'Arianna Clemente';
    const candidateRole = profile && profile.titular ? profile.titular : 'Full Stack Developer';
    const candidateSkills = (profile && Array.isArray(profile.habilidades) && profile.habilidades.length > 0)
      ? profile.habilidades.slice(0, 7).join(', ')
      : 'PHP, Laravel, React, WordPress, Moodle, Pasarelas de Pago, MySQL';

    // Si tenemos proveedor de IA configurado (Gemini, Claude, Kimi, OpenAI, etc.) y no está forzado el modo local
    if (!state.useLocalModeOnly && window.aiParser && (typeof window.aiParser.callLlmText === 'function' || typeof window.aiParser.callGeminiText === 'function')) {
      const atsSummary = savedVacancies.slice(0, 8).map(v => `${v.empresa} (${v.puesto}, estado: ${v.estado})`).join('; ');
      const compactPrompt = `Eres un Asesor de Carrera y Reclutador Senior para ${candidateName} (${candidateRole}: ${candidateSkills}).
Vacantes guardadas en su Tablero ATS: [${atsSummary}].
Pregunta de ${candidateName}: "${prompt}".
Responde con análisis táctico claro, 3 viñetas concisas y 1 recomendación de acción directa. Máximo 160 palabras.`;
      
      try {
        const caller = window.aiParser.callLlmText || window.aiParser.callGeminiText;
        const aiResponse = await caller(compactPrompt, 'Eres un asesor de reclutamiento profesional y conciso.');
        if (aiResponse) return aiResponse;
      } catch (e) {
        console.warn('Fallback a heurística local por error de API:', e);
      }
    }

    // Heurística general por defecto
    return `Analizando tu consulta sobre **"${escapeHtml(prompt)}"**:\n\n` +
      `• Tu perfil como **${escapeHtml(candidateRole)}** cuenta con fuerte tracción técnica en **${escapeHtml(candidateSkills)}**.\n` +
      `• Tienes **${savedVacancies.length} vacantes** registradas en tu Tablero ATS. Te sugiero revisar las que están en etapa **Entrevista** o **Postuladas** para priorizar tus esfuerzos de hoy.\n` +
      `• Puedes elegir una vacante específica en el menú superior del Asesor para ver un análisis detallado a medida.`;
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

    const prompt = `Analiza la vacante de "${job.puesto}" en ${job.empresa}. ¿Cuáles son mis ventajas clave y qué debo destacar en mi postulación?`;
    openAtsCopilotDrawer(prompt, null, 'radar');
  }

  // =========================================================================
  // Live Job Feeds (Verificados y Activos vía Serverless / APIs Públicas)
  // =========================================================================
  async function fetchDirectPublicFeedsFallback() {
    const jobs = [];
    try {
      const [remRes, arbRes] = await Promise.allSettled([
        fetch('https://remotive.com/api/remote-jobs?limit=20', { headers: { Accept: 'application/json' } }),
        fetch('https://www.arbeitnow.com/api/job-board-api', { headers: { Accept: 'application/json' } })
      ]);

      if (remRes.status === 'fulfilled' && remRes.value.ok) {
        const d = await remRes.value.json();
        if (Array.isArray(d?.jobs)) {
          d.jobs.forEach(item => {
            if (!isDirectActiveVacancyUrl(item.url)) return;
            jobs.push({
              id: `remotive-${item.id}`,
              empresa: item.company_name || 'Empresa Remota',
              puesto: item.title,
              modalidad: 'Remoto',
              ubicacion: item.candidate_required_location || 'Remoto Global',
              mercado: /spain|españa|madrid|barcelona/i.test(item.candidate_required_location || '') ? 'spain' : 'remote',
              salario: item.salary || '',
              salarioNum: 0,
              tipo: item.job_type === 'full_time' ? 'Tiempo Completo' : 'Remoto',
              plataforma: 'remotive',
              plataformaNombre: 'Remotive',
              url: item.url,
              fecha: item.publication_date ? item.publication_date.split('T')[0] : new Date().toISOString().split('T')[0],
              descripcion: String(item.description || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) + '...',
              requisitos: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 5) : ['Remoto', 'Tech']
            });
          });
        }
      }

      if (arbRes.status === 'fulfilled' && arbRes.value.ok) {
        const d = await arbRes.value.json();
        if (Array.isArray(d?.data)) {
          d.data.slice(0, 15).forEach(item => {
            if (!isDirectActiveVacancyUrl(item.url)) return;
            const loc = item.location || (item.remote ? 'Remoto Europa' : 'Europa');
            jobs.push({
              id: `arbeitnow-${item.slug}`,
              empresa: item.company_name || 'Empresa Tech',
              puesto: item.title,
              modalidad: item.remote ? 'Remoto' : 'Híbrido',
              ubicacion: loc,
              mercado: /spain|españa|madrid|barcelona/i.test(loc) ? 'spain' : (item.remote ? 'remote' : 'remote'),
              salario: '',
              salarioNum: 0,
              tipo: 'Tiempo Completo',
              plataforma: 'arbeitnow',
              plataformaNombre: 'Arbeitnow',
              url: item.url,
              fecha: item.created_at ? new Date(item.created_at * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              descripcion: String(item.description || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) + '...',
              requisitos: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 5) : ['Software', 'Tech']
            });
          });
        }
      }
    } catch (e) {
      console.warn('Error en fallback público del radar:', e);
    }
    return jobs;
  }

  async function refreshLiveJobs(silent = false) {
    if (state.isLoadingLive) return;
    state.isLoadingLive = true;
    const btnRefresh = document.getElementById('btnRefreshRadarJobs');
    if (btnRefresh) {
      btnRefresh.disabled = true;
      btnRefresh.innerHTML = `
        <span class="live-pulse" style="width:6px; height:6px;"><span class="live-pulse-core" style="background:var(--primary);"></span></span>
        <span>Verificando enlaces...</span>
      `;
    }

    try {
      let verifiedJobs = [];

      // 1. Intentar Netlify Function que verifica HTTP 200/activos y filtra rutas rotas/búsquedas
      let res = await fetch('/api/radar-jobs').catch(() => null);
      if (!res || !res.ok) {
        res = await fetch('/.netlify/functions/radar-jobs').catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.jobs)) {
          verifiedJobs = data.jobs.filter(j => isDirectActiveVacancyUrl(j.url));
        }
      }

      // 2. Fallback directo a APIs públicas CORS-friendly si el entorno local no corre Netlify Functions
      if (verifiedJobs.length === 0) {
        verifiedJobs = await fetchDirectPublicFeedsFallback();
      }

      if (verifiedJobs.length > 0) {
        verifiedJobs.forEach(j => {
          j.matchScore = calculateAtsScore(j);
          j.isTopMatch = j.matchScore >= 55;
        });
        state.jobs = verifiedJobs;
        saveVerifiedJobsCache(verifiedJobs);
        if (!silent) {
          showToastMessage(`¡${verifiedJobs.length} vacantes activas y verificadas en el Radar!`, 'success');
        }
      } else if (!silent) {
        showToastMessage('No se pudieron verificar nuevas vacantes activas en este momento.', 'info');
      }
    } catch (e) {
      console.warn('Error actualizando radar en vivo:', e);
      if (!silent) {
        showToastMessage('Error al consultar ofertas en vivo. Reintenta en unos segundos.', 'info');
      }
    } finally {
      state.isLoadingLive = false;
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
    // 1. Unified Search & Filter Bar Controls
    const heroInput = document.getElementById('radarHeroInput');
    const filterRole = document.getElementById('radarFilterRole');
    const filterLocation = document.getElementById('radarFilterLocation');
    const filterSource = document.getElementById('radarFilterSource');
    const filterModality = document.getElementById('radarFilterModality');
    const filterMatch = document.getElementById('radarFilterMatch');
    const btnSearch = document.getElementById('btnRadarSearch');

    function executeHeroSearch() {
      state.searchKeyword = (heroInput && heroInput.value) || '';
      state.activeFilterRole = (filterRole && filterRole.value) || 'all';
      state.activeFilterMarket = (filterLocation && filterLocation.value) || 'all';
      state.activeFilterPlatform = (filterSource && filterSource.value) || 'all';
      state.activeFilterModality = (filterModality && filterModality.value) || 'all';
      state.activeMatchFilter = (filterMatch && filterMatch.value) || 'all';
      render();
      const gridEl = document.getElementById('radarJobsGrid');
      if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (btnSearch) {
      btnSearch.addEventListener('click', (e) => {
        e.preventDefault();
        executeHeroSearch();
      });
    }

    if (heroInput) {
      heroInput.addEventListener('input', () => {
        state.searchKeyword = heroInput.value;
        applyFilters();
        renderCards();
        updateResultsCount();
      });
      heroInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeHeroSearch();
        }
      });
    }

    if (filterRole) {
      filterRole.addEventListener('change', (e) => {
        state.activeFilterRole = e.target.value;
        render();
      });
    }

    if (filterLocation) {
      filterLocation.addEventListener('change', (e) => {
        state.activeFilterMarket = e.target.value;
        render();
      });
    }

    if (filterSource) {
      filterSource.addEventListener('change', (e) => {
        state.activeFilterPlatform = e.target.value;
        render();
      });
    }

    if (filterModality) {
      filterModality.addEventListener('change', (e) => {
        state.activeFilterModality = e.target.value;
        render();
      });
    }

    if (filterMatch) {
      filterMatch.addEventListener('change', (e) => {
        state.activeMatchFilter = e.target.value;
        render();
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
        refreshLiveJobs(false);
      });
    }

    // 4. Botón Restablecer Filtros
    const btnReset = document.getElementById('btnResetRadarFilters');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        state.activeFilterRole = 'all';
        state.activeFilterMarket = 'all';
        state.activeFilterPlatform = 'all';
        state.activeFilterType = 'all';
        state.activeFilterModality = 'all';
        state.activeMatchFilter = 'all';
        state.searchKeyword = '';
        if (heroInput) heroInput.value = '';
        if (filterRole) filterRole.value = 'all';
        if (filterLocation) filterLocation.value = 'all';
        if (filterSource) filterSource.value = 'all';
        if (filterModality) filterModality.value = 'all';
        if (filterMatch) filterMatch.value = 'all';
        render();
      });
    }

    // 5. Botón Comparar en Copilot flotante
    const btnTriggerCompare = document.getElementById('btnTriggerCompareWithAi');
    if (btnTriggerCompare) {
      btnTriggerCompare.addEventListener('click', () => {
        openAtsCopilotDrawer('Compara detalladamente las vacantes que seleccioné y dime cuál debo priorizar.', null, 'radar');
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

  function updateCopilotGreeting() {
    const profile = getActiveUserProfile();
    const firstName = profile && profile.nombre ? profile.nombre.split(' ')[0] : 'Arianna';
    if (state.chatMessages.length === 1 && state.chatMessages[0].sender === 'assistant') {
      state.chatMessages[0].text = `¡Hola, ${escapeHtml(firstName)}! 👋 Soy tu **Asesor de Reclutamiento IA**.\n\nPuedo analizar tus **vacantes guardadas en el Kanban**, evaluar tu **embudo ATS**, o comparar opciones del **Radar de Empleos** (Remoto vs España). ¿Por dónde empezamos?`;
      renderCopilotMessages();
    }
  }

  function updateCopilotAiModeToggleUI() {
    const box = document.getElementById('copilotAiModeToggleBox');
    const btnAi = document.getElementById('btnCopilotModeAi');
    const btnLocal = document.getElementById('btnCopilotModeLocal');
    const statusText = document.getElementById('copilotDrawerStatus');
    if (!box) return;

    const settings = (window.appStorage && typeof window.appStorage.getSettings === 'function')
      ? window.appStorage.getSettings()
      : {};
    const hasKey = !!(settings.aiApiKey || settings.geminiApiKey);

    if (!hasKey) {
      box.style.display = 'none';
      state.useLocalModeOnly = true;
      if (statusText) {
        statusText.innerHTML = `<span class="live-pulse-core" style="width:6px; height:6px; background:#00D2B4; display:inline-block; border-radius:50%; margin-right:4px;" aria-hidden="true"></span>Modo Local Heurístico (Sin coste)`;
      }
      return;
    }

    // Si tiene clave configurada, mostrar el selector de modo
    box.style.display = 'flex';

    if (btnAi && btnLocal) {
      if (state.useLocalModeOnly) {
        btnLocal.style.background = 'var(--primary)';
        btnLocal.style.color = '#ffffff';
        btnAi.style.background = 'transparent';
        btnAi.style.color = 'var(--text-muted)';
        if (statusText) {
          statusText.innerHTML = `<span class="live-pulse-core" style="width:6px; height:6px; background:#f59e0b; display:inline-block; border-radius:50%; margin-right:4px;" aria-hidden="true"></span>Modo Local Heurístico (0 tokens)`;
        }
      } else {
        btnAi.style.background = 'var(--primary)';
        btnAi.style.color = '#ffffff';
        btnLocal.style.background = 'transparent';
        btnLocal.style.color = 'var(--text-muted)';
        if (statusText) {
          statusText.innerHTML = `<span class="live-pulse-core" style="width:6px; height:6px; background:#00D2B4; display:inline-block; border-radius:50%; margin-right:4px;" aria-hidden="true"></span>Conectado con tu API Key (${settings.aiProvider || 'Gemini'})`;
        }
      }
    }
  }

  // =========================================================================
  // Control del Drawer Desplegable del Asesor ATS & IA
  // =========================================================================
  function openAtsCopilotDrawer(initialPrompt, targetVacancyId, defaultMode) {
    const overlay = document.getElementById('atsCopilotDrawerOverlay');
    if (!overlay) return;

    overlay.classList.add('active');
    overlay.style.display = 'block';
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    }

    // Ocultar botón flotante mientras el drawer está abierto para evitar solapamientos
    const floatingBtn = document.getElementById('btnFloatingCopilot');
    if (floatingBtn) floatingBtn.style.display = 'none';

    const isRadarView = defaultMode === 'radar' || (!targetVacancyId && document.getElementById('view-jobsearch')?.classList.contains('active'));
    const tabAts = document.getElementById('btnCopilotTabAts');
    const tabRadar = document.getElementById('btnCopilotTabRadar');
    const pickerBox = document.getElementById('copilotVacancyPickerBox');
    if (tabAts && tabRadar) {
      if (isRadarView) {
        tabRadar.classList.add('active');
        tabAts.classList.remove('active');
        if (pickerBox) pickerBox.style.display = 'none';
      } else {
        tabAts.classList.add('active');
        tabRadar.classList.remove('active');
        if (pickerBox) pickerBox.style.display = 'flex';
      }
    }

    updateCopilotAiModeToggleUI();
    populateAtsVacancyPicker(targetVacancyId);
    updateAtsBadges();
    renderCopilotMessages();

    const input = document.getElementById('atsCopilotDrawerInput');
    if (input) setTimeout(() => input.focus(), 150);

    if (initialPrompt) {
      handleCopilotUserPrompt(initialPrompt);
    }
  }

  function closeAtsCopilotDrawer() {
    const overlay = document.getElementById('atsCopilotDrawerOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.style.display = 'none';
    document.body.style.overflow = '';

    // Restaurar botón flotante si estamos en Kanban, Vista Lista o Radar
    const floatingBtn = document.getElementById('btnFloatingCopilot');
    const isCopilotView = document.getElementById('view-kanban')?.classList.contains('active') ||
                          document.getElementById('view-list')?.classList.contains('active') ||
                          document.getElementById('view-jobsearch')?.classList.contains('active');
    if (floatingBtn && isCopilotView) {
      floatingBtn.style.display = 'flex';
    }
  }

  function updateAtsBadges() {
    const saved = (window.appStorage && typeof window.appStorage.getVacancies === 'function')
      ? window.appStorage.getVacancies()
      : [];
    const count = saved.length;

    const b1 = document.getElementById('badgeAtsCopilotCount');
    if (b1) b1.textContent = `${count} ATS`;

    const b2 = document.getElementById('copilotAtsCountBadge');
    if (b2) b2.textContent = count;

    const bRadar = document.getElementById('copilotRadarCountBadge');
    if (bRadar) bRadar.textContent = state.jobs.length;
  }

  function populateAtsVacancyPicker(selectedVacancyId) {
    const select = document.getElementById('copilotSelectAtsVacancy');
    if (!select) return;

    const saved = (window.appStorage && typeof window.appStorage.getVacancies === 'function')
      ? window.appStorage.getVacancies()
      : [];

    select.innerHTML = '<option value="">-- Elige una vacante para diagnóstico táctico --</option>' +
      saved.map(v => `
        <option value="${v.id}" ${v.id === selectedVacancyId ? 'selected' : ''}>
          ${escapeHtml(v.empresa)} - ${escapeHtml(v.puesto)} (${v.estado.toUpperCase()})
        </option>
      `).join('');
  }

  function initDrawerEventListeners() {
    // 1. Botón Flotante y Triggers
    const openTriggerIds = [
      'btnOpenAtsCopilotDrawer',
      'btnFloatingCopilot',
      'btnFloatingCopilotLauncher',
      'mobileNavCopilot'
    ];
    openTriggerIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          openAtsCopilotDrawer();
        });
      }
    });

    // 2. Cerrar Drawer
    const btnClose = document.getElementById('btnCloseAtsCopilotDrawer');
    if (btnClose) {
      btnClose.addEventListener('click', closeAtsCopilotDrawer);
    }

    const overlay = document.getElementById('atsCopilotDrawerOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAtsCopilotDrawer();
      });
    }

    // 3. Context Switcher Tabs (ATS vs Radar)
    const tabAts = document.getElementById('btnCopilotTabAts');
    const tabRadar = document.getElementById('btnCopilotTabRadar');
    const pickerBox = document.getElementById('copilotVacancyPickerBox');

    if (tabAts && tabRadar) {
      tabAts.addEventListener('click', () => {
        tabAts.classList.add('active');
        tabRadar.classList.remove('active');
        if (pickerBox) pickerBox.style.display = 'flex';
      });

      tabRadar.addEventListener('click', () => {
        tabRadar.classList.add('active');
        tabAts.classList.remove('active');
        if (pickerBox) pickerBox.style.display = 'none';
      });
    }

    // Switcher de Modo IA (API) vs Modo Local (0 Coste)
    const btnModeAi = document.getElementById('btnCopilotModeAi');
    const btnModeLocal = document.getElementById('btnCopilotModeLocal');
    if (btnModeAi && btnModeLocal) {
      btnModeAi.addEventListener('click', () => {
        state.useLocalModeOnly = false;
        updateCopilotAiModeToggleUI();
        showToastMessage('Modo IA Activado: usando tu API Key para análisis profundo', 'info');
      });
      btnModeLocal.addEventListener('click', () => {
        state.useLocalModeOnly = true;
        updateCopilotAiModeToggleUI();
        showToastMessage('Modo Local Activado: 0 tokens, análisis heurístico instantáneo', 'info');
      });
    }

    // 4. Botón Analizar Vacante Seleccionada en Dropdown
    const btnAudit = document.getElementById('btnAuditSelectedAtsJob');
    const selectVacancy = document.getElementById('copilotSelectAtsVacancy');
    if (btnAudit && selectVacancy) {
      btnAudit.addEventListener('click', () => {
        const vacId = selectVacancy.value;
        if (!vacId) {
          showToastMessage('Selecciona primero una vacante de la lista', 'info');
          return;
        }
        const saved = window.appStorage.getVacancies();
        const vac = saved.find(v => v.id === vacId);
        if (vac) {
          handleCopilotUserPrompt(`Analiza en detalle mi vacante de ${vac.empresa} (${vac.puesto}, estado: ${vac.estado}). ¿Cuáles son mis puntos fuertes, qué preguntas técnicas me harán y cómo asegurarla?`);
        }
      });
    }

    // 5. Submit Form Drawer
    const formDrawer = document.getElementById('atsCopilotDrawerForm');
    const inputDrawer = document.getElementById('atsCopilotDrawerInput');
    if (formDrawer && inputDrawer) {
      formDrawer.addEventListener('submit', (e) => {
        e.preventDefault();
        const txt = inputDrawer.value;
        if (txt && txt.trim()) {
          inputDrawer.value = '';
          handleCopilotUserPrompt(txt);
        }
      });
    }

    // 6. Chips en Drawer
    const drawerChips = document.querySelectorAll('#atsCopilotDrawerChips .prompt-chip');
    drawerChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const pr = e.currentTarget.dataset.prompt;
        if (pr) handleCopilotUserPrompt(pr);
      });
    });

    // 7. Escape key para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAtsCopilotDrawer();
    });
  }

  // Exponer función global para abrir el asesor desde cualquier tarjeta o vista del ATS
  window.openCopilotForAtsVacancy = function (vacancyId) {
    const saved = (window.appStorage && typeof window.appStorage.getVacancies === 'function')
      ? window.appStorage.getVacancies()
      : [];
    const vac = saved.find(v => v.id === vacancyId);
    if (!vac) {
      openAtsCopilotDrawer();
      return;
    }

    openAtsCopilotDrawer(`Analiza mi vacante de ${vac.empresa} (${vac.puesto}, estado: ${vac.estado}). ¿Cuáles son mis puntos fuertes, qué preguntas técnicas me harán y cómo asegurar mi avance?`, vacancyId);
  };

  // =========================================================================
  // Exportar API Pública
  // =========================================================================
  window.jobRadar = {
    init: function () {
      recalculateAllScores();
      updateCopilotGreeting();
      render();
      renderCopilotMessages();
      updateAtsBadges();

      if (!isRadarCacheFresh()) {
        refreshLiveJobs(true);
      }

      // Suscribirse a cambios en el perfil (por ejemplo al subir un .md o cambiar de usuario)
      if (window.appStorage && typeof window.appStorage.subscribeProfile === 'function') {
        window.appStorage.subscribeProfile(() => {
          recalculateAllScores();
          updateCopilotGreeting();
          render();
        });
      }
    },
    render: function () {
      render();
      if (state.jobs.length === 0 && !state.isLoadingLive) {
        refreshLiveJobs(true);
      }
    },
    importJobToKanban: importJobToKanban,
    askCopilot: handleCopilotUserPrompt,
    openDrawer: openAtsCopilotDrawer,
    closeDrawer: closeAtsCopilotDrawer,
    updateAtsBadges: updateAtsBadges,
    refreshCopilotMode: updateCopilotAiModeToggleUI,
    recalculateScores: function () {
      recalculateAllScores();
      render();
    }
  };

  // Inicializar al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initDrawerEventListeners();
    window.jobRadar.init();
  });

})();
