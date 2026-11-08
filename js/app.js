/**
 * app.js - Controlador principal de Vacantes by AryC
 * Sistema de gestión de postulaciones con Kanban, Ingesta Multimodal con IA y Generador de CVs.
 */

document.addEventListener('DOMContentLoaded', () => {
  const COLUMNS = [
    { id: 'saved', label: 'Guardadas / Explorar', dotClass: 'saved' },
    { id: 'applied', label: 'Postuladas', dotClass: 'applied' },
    { id: 'interview', label: 'En Proceso / Entrevistas', dotClass: 'interview' },
    { id: 'offer', label: 'Ofertas / Red Activa', dotClass: 'offer' },
    { id: 'rejected', label: 'Descartadas / Cerradas', dotClass: 'rejected' }
  ];

  let currentView = 'kanban';
  let searchQuery = '';
  let selectedPriorityFilter = 'all';
  let selectedModalityFilter = 'all';
  let activeModalVacancyId = null;
  let intakePastedImageBase64 = null;
  let pendingExtractedJob = null;
  let isCvEditMode = false;

  // Cache DOM elements
  const kanbanBoardEl = document.getElementById('kanbanBoard');
  const tableBodyEl = document.getElementById('vacanciesTableBody');
  const searchInputEl = document.getElementById('searchInput');
  const filterPriorityEl = document.getElementById('filterPriority');
  const filterModalityEl = document.getElementById('filterModality');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const mobileNavBtns = document.querySelectorAll('.mobile-nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const toastContainer = document.getElementById('toastContainer');

  // KPI elements
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiApplied = document.getElementById('kpiApplied');
  const kpiInterviews = document.getElementById('kpiInterviews');
  const kpiResponseRate = document.getElementById('kpiResponseRate');

  // Vacancy Detail Modal
  const vacancyModal = document.getElementById('vacancyModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnSaveModalChanges = document.getElementById('btnSaveModalChanges');
  const btnDeleteVacancy = document.getElementById('btnDeleteVacancy');
  const btnOpenUrl = document.getElementById('btnOpenUrl');

  // Smart Intake elements
  const btnOpenIntake = document.getElementById('btnOpenIntake');
  const intakeDropzone = document.getElementById('intakeDropzone');
  const fileInput = document.getElementById('fileInput');
  const previewImg = document.getElementById('previewImg');
  const imagePreviewArea = document.getElementById('imagePreviewArea');
  const btnRemoveImg = document.getElementById('btnRemoveImg');
  const intakeUrl = document.getElementById('intakeUrl');
  const intakeText = document.getElementById('intakeText');
  const btnClearIntake = document.getElementById('btnClearIntake');
  const btnProcessIntake = document.getElementById('btnProcessIntake');

  // Intake Confirmation Modal
  const intakeConfirmModal = document.getElementById('intakeConfirmModal');
  const btnCloseConfirmModal = document.getElementById('btnCloseConfirmModal');
  const btnCancelConfirm = document.getElementById('btnCancelConfirm');
  const btnSaveConfirmedJob = document.getElementById('btnSaveConfirmedJob');
  const confirmEmpresa = document.getElementById('confirmEmpresa');
  const confirmPuesto = document.getElementById('confirmPuesto');
  const confirmModalidad = document.getElementById('confirmModalidad');
  const confirmPrioridad = document.getElementById('confirmPrioridad');
  const confirmSalario = document.getElementById('confirmSalario');
  const confirmContacto = document.getElementById('confirmContacto');
  const confirmUrl = document.getElementById('confirmUrl');
  const confirmRequisitosChips = document.getElementById('confirmRequisitosChips');
  const confirmRequisitosInput = document.getElementById('confirmRequisitosInput');
  const confirmNotas = document.getElementById('confirmNotas');
  const aiExtractionSourceBadge = document.getElementById('aiExtractionSourceBadge');

  // Settings Modal elements
  const settingsModal = document.getElementById('settingsModal');
  const btnSettings = document.getElementById('btnSettings');
  const btnCloseSettingsModal = document.getElementById('btnCloseSettingsModal');
  const inputApiKey = document.getElementById('inputApiKey');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const btnExportJson = document.getElementById('btnExportJson');
  const btnTriggerImport = document.getElementById('btnTriggerImport');
  const importFileInput = document.getElementById('importFileInput');
  const btnResetSeed = document.getElementById('btnResetSeed');

  // Cloud & Supabase Modal elements
  const btnOpenCloudModal = document.getElementById('btnOpenCloudModal');
  const cloudModal = document.getElementById('cloudModal');
  const btnCloseCloudModal = document.getElementById('btnCloseCloudModal');
  const headerCloudDot = document.getElementById('headerCloudDot');
  const headerCloudLabel = document.getElementById('headerCloudLabel');
  const modalCloudDot = document.getElementById('modalCloudDot');
  const modalCloudSubtext = document.getElementById('modalCloudSubtext');
  const cloudAuthLoggedOut = document.getElementById('cloudAuthLoggedOut');
  const cloudAuthLoggedIn = document.getElementById('cloudAuthLoggedIn');
  const btnToggleMagicLink = document.getElementById('btnToggleMagicLink');
  const btnTogglePassword = document.getElementById('btnTogglePassword');
  const formMagicLink = document.getElementById('formMagicLink');
  const formPassword = document.getElementById('formPassword');
  const inputMagicEmail = document.getElementById('inputMagicEmail');
  const inputAuthEmail = document.getElementById('inputAuthEmail');
  const inputAuthPassword = document.getElementById('inputAuthPassword');
  const btnSignInPassword = document.getElementById('btnSignInPassword');
  const btnSignUpPassword = document.getElementById('btnSignUpPassword');
  const userAvatarLetter = document.getElementById('userAvatarLetter');
  const userLoggedInEmail = document.getElementById('userLoggedInEmail');
  const btnSignOut = document.getElementById('btnSignOut');
  const btnMigrateSeedToCloud = document.getElementById('btnMigrateSeedToCloud');
  const btnManualSync = document.getElementById('btnManualSync');

  // CV elements
  const cvPaper = document.getElementById('cvPaper');
  const cvVacancySelect = document.getElementById('cvVacancySelect');
  const btnTailorCvAi = document.getElementById('btnTailorCvAi');
  const tailorCvBtnText = document.getElementById('tailorCvBtnText');
  const cvTemplateSelect = document.getElementById('cvTemplateSelect');
  const cvPhotoInput = document.getElementById('cvPhotoInput');
  const cvPhotoContainer = document.getElementById('cvPhotoContainer');
  const cvPhotoImg = document.getElementById('cvPhotoImg');
  const cvPhotoStatusText = document.getElementById('cvPhotoStatusText');
  const btnOpenPhotoConfig = document.getElementById('btnOpenPhotoConfig');
  const btnManageExperiences = document.getElementById('btnManageExperiences');
  const cvExpCountBadge = document.getElementById('cvExpCountBadge');
  const btnOpenSummarySuggestions = document.getElementById('btnOpenSummarySuggestions');
  const btnPrintCv = document.getElementById('btnPrintCv');
  const btnToggleEditCv = document.getElementById('btnToggleEditCv');
  const editCvBtnText = document.getElementById('editCvBtnText');
  const btnResetCvContent = document.getElementById('btnResetCvContent');
  const cvHeaderRole = document.getElementById('cvHeaderRole');
  const cvSummaryText = document.getElementById('cvSummaryText');
  const cvExperienceBullets = document.getElementById('cvExperienceBullets');
  const cvSkillsList = document.getElementById('cvSkillsList');

  // Summary Suggestions Modal Elements
  const summarySuggestionsModal = document.getElementById('summarySuggestionsModal');
  const btnCloseSummaryModal = document.getElementById('btnCloseSummaryModal');
  const btnDismissSummaryModal = document.getElementById('btnDismissSummaryModal');
  const btnRegenerateSummaries = document.getElementById('btnRegenerateSummaries');
  const btnRegenSummariesText = document.getElementById('btnRegenSummariesText');
  const summarySuggestionsGrid = document.getElementById('summarySuggestionsGrid');
  const summaryModalVacancyName = document.getElementById('summaryModalVacancyName');
  const summaryQuickEditContainer = document.getElementById('summaryQuickEditContainer');
  const summaryQuickEditTextarea = document.getElementById('summaryQuickEditTextarea');
  const btnCancelQuickEdit = document.getElementById('btnCancelQuickEdit');
  const btnApplyQuickEdit = document.getElementById('btnApplyQuickEdit');

  // Manage Experiences Modal Elements
  const manageExperiencesModal = document.getElementById('manageExperiencesModal');
  const btnCloseManageExpModal = document.getElementById('btnCloseManageExpModal');
  const btnApplyManageExperiences = document.getElementById('btnApplyManageExperiences');
  const btnShowAllExperiences = document.getElementById('btnShowAllExperiences');
  const manageExperiencesList = document.getElementById('manageExperiencesList');
  const manageExpCountText = document.getElementById('manageExpCountText');

  // Photo Config Modal Elements
  const cvPhotoConfigModal = document.getElementById('cvPhotoConfigModal');
  const btnClosePhotoModal = document.getElementById('btnClosePhotoModal');
  const btnApplyPhotoConfig = document.getElementById('btnApplyPhotoConfig');
  const modalTogglePhoto = document.getElementById('modalTogglePhoto');
  const modalPhotoPreviewBox = document.getElementById('modalPhotoPreviewBox');
  const modalPhotoPreviewImg = document.getElementById('modalPhotoPreviewImg');
  const btnUseOfficialPhoto = document.getElementById('btnUseOfficialPhoto');
  const btnModalUploadPhoto = document.getElementById('btnModalUploadPhoto');
  const btnRemovePhoto = document.getElementById('btnRemovePhoto');

  // Cover Letter Modal elements
  const coverLetterModal = document.getElementById('coverLetterModal');
  const btnOpenCoverLetterModal = document.getElementById('btnOpenCoverLetterModal');
  const btnCloseCoverLetterModal = document.getElementById('btnCloseCoverLetterModal');
  const coverLetterSubtext = document.getElementById('coverLetterSubtext');
  const coverLetterCompanyBadge = document.getElementById('coverLetterCompanyBadge');
  const coverLetterText = document.getElementById('coverLetterText');
  const btnRegenerateCoverLetter = document.getElementById('btnRegenerateCoverLetter');
  const regenerateLetterBtnText = document.getElementById('regenerateLetterBtnText');
  const btnCopyCoverLetter = document.getElementById('btnCopyCoverLetter');
  const btnPrintCoverLetter = document.getElementById('btnPrintCoverLetter');

  // Email Pitch Modal elements
  const emailPitchModal = document.getElementById('emailPitchModal');
  const btnOpenEmailModal = document.getElementById('btnOpenEmailModal');
  const btnCloseEmailPitchModal = document.getElementById('btnCloseEmailPitchModal');
  const emailPitchSubtext = document.getElementById('emailPitchSubtext');
  const emailToInput = document.getElementById('emailToInput');
  const emailSubjectInput = document.getElementById('emailSubjectInput');
  const emailBodyInput = document.getElementById('emailBodyInput');
  const btnCopyEmailSubject = document.getElementById('btnCopyEmailSubject');
  const btnCopyEmailBody = document.getElementById('btnCopyEmailBody');
  const btnRegenerateEmail = document.getElementById('btnRegenerateEmail');
  const regenerateEmailBtnText = document.getElementById('regenerateEmailBtnText');
  const btnLaunchMailClient = document.getElementById('btnLaunchMailClient');

  // Interview Coach & FAQ Modal elements
  const interviewCoachModal = document.getElementById('interviewCoachModal');
  const btnOpenInterviewModal = document.getElementById('btnOpenInterviewModal');
  const btnDetailInterviewCoach = document.getElementById('btnDetailInterviewCoach');
  const btnCloseInterviewCoachModal = document.getElementById('btnCloseInterviewCoachModal');
  const coachModalTitle = document.getElementById('coachModalTitle');
  const coachModalSubtitle = document.getElementById('coachModalSubtitle');
  const tabBtnFaqs = document.getElementById('tabBtnFaqs');
  const tabBtnChat = document.getElementById('tabBtnChat');
  const coachPanelFaqs = document.getElementById('coachPanelFaqs');
  const coachPanelChat = document.getElementById('coachPanelChat');
  const btnRefreshFaqs = document.getElementById('btnRefreshFaqs');
  const coachFaqsContainer = document.getElementById('coachFaqsContainer');
  const coachChatMessages = document.getElementById('coachChatMessages');
  const coachChatForm = document.getElementById('coachChatForm');
  const coachChatInput = document.getElementById('coachChatInput');
  const btnSendCoachMessage = document.getElementById('btnSendCoachMessage');
  const btnClearCoachChat = document.getElementById('btnClearCoachChat');

  // =========================================================================
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    } else {
      iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================================
  // View Navigation
  // =========================================================================
  function switchView(viewName) {
    currentView = viewName;

    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    mobileNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    viewPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `view-${viewName}`);
    });

    if (viewName === 'cv') {
      populateCvSelector();
      updateCvPreview();
    } else if (viewName === 'jobsearch') {
      if (window.jobRadar && typeof window.jobRadar.render === 'function') {
        window.jobRadar.render();
      }
    }

    // El Asesor IA del Tablero ATS opera contextualmente en Kanban y Vista Lista
    const isAtsBoardView = (viewName === 'kanban' || viewName === 'list');
    const toolbarCopilotBtn = document.getElementById('btnAtsCopilotToolbar');
    const floatingCopilotBtn = document.getElementById('btnFloatingCopilot');

    if (toolbarCopilotBtn) {
      toolbarCopilotBtn.style.display = isAtsBoardView ? 'inline-flex' : 'none';
    }
    if (floatingCopilotBtn) {
      floatingCopilotBtn.style.display = isAtsBoardView ? 'flex' : 'none';
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  mobileNavBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  btnOpenIntake.addEventListener('click', () => {
    switchView('intake');
  });

  // =========================================================================
  // Filter Logic
  // =========================================================================
  function getFilteredVacancies() {
    const all = window.appStorage.getVacancies();
    return all.filter(v => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = (
          v.puesto.toLowerCase().includes(q) ||
          v.empresa.toLowerCase().includes(q) ||
          (v.modalidad && v.modalidad.toLowerCase().includes(q)) ||
          (v.notas && v.notas.toLowerCase().includes(q)) ||
          (v.requisitos && v.requisitos.some(r => r.toLowerCase().includes(q)))
        );
        if (!matchesSearch) return false;
      }

      // Priority filter
      if (selectedPriorityFilter !== 'all') {
        if (v.prioridad !== selectedPriorityFilter) return false;
      }

      // Modality filter
      if (selectedModalityFilter !== 'all') {
        if (!v.modalidad || !v.modalidad.toLowerCase().includes(selectedModalityFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  // =========================================================================
  // Render Kanban Board with Drag & Drop & Quick Status
  // =========================================================================
  function renderKanban() {
    if (!kanbanBoardEl) return;
    const allVacancies = window.appStorage.getVacancies();
    const filtered = getFilteredVacancies();

    kanbanBoardEl.innerHTML = COLUMNS.map(col => {
      const colVacancies = filtered.filter(v => v.estado === col.id);
      return `
        <div class="kanban-col" data-col-id="${col.id}">
          <div class="col-header">
            <div class="col-title-group">
              <span class="col-dot ${col.dotClass}"></span>
              <span class="col-name">${col.label}</span>
            </div>
            <span class="col-count">${colVacancies.length}</span>
          </div>
          <div class="col-cards-list" data-status="${col.id}">
            ${colVacancies.map(v => renderJobCard(v)).join('')}
          </div>
        </div>
      `;
    }).join('');

    attachCardClickEvents();
    attachDragAndDropEvents();
    updateKpis(allVacancies);
  }

  function renderJobCard(v) {
    const priorityClass = v.prioridad === 'high' ? 'high' : v.prioridad === 'med' ? 'med' : 'low';
    const priorityLabel = v.prioridad === 'high' ? 'Alta' : v.prioridad === 'med' ? 'Media' : 'Baja';

    return `
      <div class="job-card" draggable="true" data-id="${v.id}">
        <div class="card-top">
          <span class="company-badge">${escapeHtml(v.empresa)}</span>
          <span class="priority-pill ${priorityClass}">${priorityLabel}</span>
        </div>
        <div class="job-title">${escapeHtml(v.puesto)}</div>
        <div class="job-meta-row">
          <span class="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${escapeHtml(v.modalidad || 'Remoto')}
          </span>
          ${v.salario ? `
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              ${escapeHtml(v.salario)}
            </span>
          ` : ''}
        </div>
        
        <div class="card-footer">
          <!-- Quick Status Select for Mobile & 1-tap Changes -->
          <select class="card-quick-move" onclick="event.stopPropagation();" onchange="window.moveVacancyStatus('${v.id}', this.value)">
            ${COLUMNS.map(c => `
              <option value="${c.id}" ${v.estado === c.id ? 'selected' : ''}>Mover: ${c.label.split('/')[0].trim()}</option>
            `).join('')}
          </select>
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <button class="btn-card-ai" onclick="event.stopPropagation(); window.openCopilotForAtsVacancy('${v.id}');" title="Analizar esta vacante con el Asesor IA">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>
              <span>Asesor IA</span>
            </button>
            <span style="color:var(--primary); font-weight:700;">Ver &rarr;</span>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // Drag and Drop (Native HTML5)
  // =========================================================================
  function attachDragAndDropEvents() {
    const cards = document.querySelectorAll('.job-card[draggable="true"]');
    const lists = document.querySelectorAll('.col-cards-list');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        lists.forEach(l => l.classList.remove('drag-over-col'));
      });
    });

    lists.forEach(list => {
      list.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        list.classList.add('drag-over-col');
      });

      list.addEventListener('dragleave', () => {
        list.classList.remove('drag-over-col');
      });

      list.addEventListener('drop', (e) => {
        e.preventDefault();
        list.classList.remove('drag-over-col');
        const vacancyId = e.dataTransfer.getData('text/plain');
        const targetStatus = list.dataset.status;

        if (vacancyId && targetStatus) {
          window.moveVacancyStatus(vacancyId, targetStatus);
        }
      });
    });
  }

  window.moveVacancyStatus = function(vacancyId, newStatus) {
    const vacancy = window.appStorage.updateVacancy(vacancyId, { estado: newStatus });
    if (vacancy) {
      const col = COLUMNS.find(c => c.id === newStatus);
      showToast(`Movida a: ${col ? col.label : newStatus}`);
    }
  };

  // =========================================================================
  // Render Table List
  // =========================================================================
  function renderTable() {
    if (!tableBodyEl) return;
    const filtered = getFilteredVacancies();

    tableBodyEl.innerHTML = filtered.map(v => {
      const col = COLUMNS.find(c => c.id === v.estado) || COLUMNS[0];
      return `
        <tr data-id="${v.id}">
          <td><strong>${escapeHtml(v.empresa)}</strong></td>
          <td>${escapeHtml(v.puesto)}</td>
          <td><span class="meta-item">${escapeHtml(v.modalidad || 'Remoto')}</span></td>
          <td>
            <span style="display:inline-flex; align-items:center; gap:0.4rem; font-size:0.8125rem; font-weight:600;">
              <span class="col-dot ${col.dotClass}"></span>
              ${col.label}
            </span>
          </td>
          <td><span class="priority-pill ${v.prioridad || 'med'}">${v.prioridad || 'Media'}</span></td>
          <td style="white-space: nowrap;">
            <button class="btn btn-outline" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="window.openVacancyModal('${v.id}')">
              Detalle
            </button>
            <button class="btn btn-outline" style="padding:0.3rem 0.65rem; font-size:0.75rem; color:var(--primary); border-color:rgba(77,23,214,0.3); margin-left:0.35rem;" onclick="event.stopPropagation(); window.openCopilotForAtsVacancy('${v.id}')" title="Analizar esta vacante con el Asesor IA">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;"><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>
              Asesor
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // KPIs Calculation
  // =========================================================================
  function updateKpis(vacancies) {
    const total = vacancies.length;
    const applied = vacancies.filter(v => ['applied', 'interview', 'offer'].includes(v.estado)).length;
    const interviews = vacancies.filter(v => v.estado === 'interview').length;
    const offers = vacancies.filter(v => v.estado === 'offer').length;

    kpiTotal.textContent = total;
    kpiApplied.textContent = applied;
    kpiInterviews.textContent = interviews;

    const rate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;
    kpiResponseRate.textContent = `${rate}%`;
  }

  // =========================================================================
  // Filters and Search Listener
  // =========================================================================
  if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderKanban();
      renderTable();
    });
  }

  if (filterPriorityEl) {
    filterPriorityEl.addEventListener('change', (e) => {
      selectedPriorityFilter = e.target.value;
      renderKanban();
      renderTable();
    });
  }

  if (filterModalityEl) {
    filterModalityEl.addEventListener('change', (e) => {
      selectedModalityFilter = e.target.value;
      renderKanban();
      renderTable();
    });
  }

  // =========================================================================
  // Modal Actions
  // =========================================================================
  function attachCardClickEvents() {
    document.querySelectorAll('.job-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent opening if clicking on status move select
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
        const id = card.dataset.id;
        openVacancyModal(id);
      });
    });
  }

  window.openVacancyModal = function(id) {
    const vacancies = window.appStorage.getVacancies();
    const vacancy = vacancies.find(v => v.id === id);
    if (!vacancy) return;

    activeModalVacancyId = id;
    document.getElementById('modalJobTitle').textContent = `${vacancy.puesto} - ${vacancy.empresa}`;

    const contentEl = document.getElementById('modalJobContent');
    contentEl.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
        <div class="form-group">
          <label class="form-label">Empresa</label>
          <input type="text" id="mEmpresa" class="form-control" value="${escapeHtml(vacancy.empresa)}">
        </div>
        <div class="form-group">
          <label class="form-label">Puesto / Título</label>
          <input type="text" id="mPuesto" class="form-control" value="${escapeHtml(vacancy.puesto)}">
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:1rem;">
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select id="mEstado" class="form-control">
            ${COLUMNS.map(c => `
              <option value="${c.id}" ${vacancy.estado === c.id ? 'selected' : ''}>${c.label}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Prioridad</label>
          <select id="mPrioridad" class="form-control">
            <option value="high" ${vacancy.prioridad === 'high' ? 'selected' : ''}>Alta</option>
            <option value="med" ${vacancy.prioridad === 'med' ? 'selected' : ''}>Media</option>
            <option value="low" ${vacancy.prioridad === 'low' ? 'selected' : ''}>Baja</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Modalidad</label>
          <input type="text" id="mModalidad" class="form-control" value="${escapeHtml(vacancy.modalidad || '')}">
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
        <div class="form-group">
          <label class="form-label">Salario Estimado</label>
          <input type="text" id="mSalario" class="form-control" value="${escapeHtml(vacancy.salario || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Contacto / Reclutador</label>
          <input type="text" id="mContacto" class="form-control" value="${escapeHtml(vacancy.contacto || '')}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">URL de la Oferta</label>
        <input type="url" id="mUrl" class="form-control" value="${escapeHtml(vacancy.url || '')}">
      </div>

      <div class="form-group">
        <label class="form-label">Requisitos & Tecnologías</label>
        <div style="margin-bottom:0.4rem;">
          ${(vacancy.requisitos || []).map(r => `<span class="tag-pill">${escapeHtml(r)}</span>`).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notas de Seguimiento & Estrategia</label>
        <textarea id="mNotas" class="form-control" rows="3">${escapeHtml(vacancy.notas || '')}</textarea>
      </div>

      <div style="background:var(--surface-container-low); padding:1rem; border-radius:var(--radius-lg); margin-top:0.5rem; border:1px solid var(--border-slate);">
        <div style="font-size:0.8125rem; font-weight:700; color:var(--text-dark-primary); margin-bottom:0.6rem; display:flex; align-items:center; gap:0.4rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
          <span>Herramientas IA para esta Vacante:</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
          <button class="btn btn-purple" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="window.generateCvForVacancy('${vacancy.id}')">
            📄 Adaptar CV
          </button>
          <button class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="window.openCoverLetterForVacancy('${vacancy.id}')">
            📝 Carta de Presentación
          </button>
          <button class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="window.openEmailForVacancy('${vacancy.id}')">
            ✉️ Email Postulación
          </button>
          <button class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.75rem; color:var(--primary); font-weight:700;" onclick="window.openInterviewCoachForVacancy('${vacancy.id}')">
            🎯 Entrenador IA
          </button>
        </div>
      </div>
    `;

    if (vacancy.url) {
      btnOpenUrl.style.display = 'inline-flex';
      btnOpenUrl.onclick = () => window.open(vacancy.url, '_blank');
    } else {
      btnOpenUrl.style.display = 'none';
    }

    vacancyModal.classList.add('open');
  };

  window.generateCvForVacancy = function(id) {
    closeModal();
    switchView('cv');
    cvVacancySelect.value = id;
    updateCvPreview();
  };

  window.openCoverLetterForVacancy = function(id) {
    closeModal();
    openCoverLetterModal(id);
  };

  window.openEmailForVacancy = function(id) {
    closeModal();
    openEmailPitchModal(id);
  };

  window.openInterviewCoachForVacancy = function(id) {
    closeModal();
    openInterviewCoachModal(id);
  };

  function closeModal() {
    vacancyModal.classList.remove('open');
    activeModalVacancyId = null;
  }

  btnCloseModal.addEventListener('click', closeModal);
  vacancyModal.addEventListener('click', (e) => {
    if (e.target === vacancyModal) closeModal();
  });

  if (btnDetailInterviewCoach) {
    btnDetailInterviewCoach.addEventListener('click', () => {
      if (activeModalVacancyId) {
        const id = activeModalVacancyId;
        closeModal();
        openInterviewCoachModal(id);
      }
    });
  }

  btnSaveModalChanges.addEventListener('click', () => {
    if (!activeModalVacancyId) return;

    const updated = {
      empresa: document.getElementById('mEmpresa').value.trim(),
      puesto: document.getElementById('mPuesto').value.trim(),
      estado: document.getElementById('mEstado').value,
      prioridad: document.getElementById('mPrioridad').value,
      modalidad: document.getElementById('mModalidad').value.trim(),
      salario: document.getElementById('mSalario').value.trim(),
      contacto: document.getElementById('mContacto').value.trim(),
      url: document.getElementById('mUrl').value.trim(),
      notas: document.getElementById('mNotas').value.trim()
    };

    window.appStorage.updateVacancy(activeModalVacancyId, updated);
    closeModal();
    showToast('Cambios guardados correctamente');
  });

  btnDeleteVacancy.addEventListener('click', () => {
    if (!activeModalVacancyId) return;
    if (confirm('¿Deseas eliminar esta vacante de tu tablero?')) {
      window.appStorage.deleteVacancy(activeModalVacancyId);
      closeModal();
      showToast('Vacante eliminada del tablero', 'info');
    }
  });

  // =========================================================================
  // Smart Intake: Multimodal Text + Screenshot Input (Ctrl+V)
  // =========================================================================
  intakeDropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  });

  intakeDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    intakeDropzone.classList.add('drag-over');
  });

  intakeDropzone.addEventListener('dragleave', () => {
    intakeDropzone.classList.remove('drag-over');
  });

  intakeDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    intakeDropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        handleImageFile(file);
        switchView('intake');
        showToast('Captura pegada desde el portapapeles', 'info');
        break;
      }
    }
  });

  function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      intakePastedImageBase64 = event.target.result;
      previewImg.src = intakePastedImageBase64;
      imagePreviewArea.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  btnRemoveImg.addEventListener('click', (e) => {
    e.stopPropagation();
    intakePastedImageBase64 = null;
    previewImg.src = '';
    imagePreviewArea.style.display = 'none';
    fileInput.value = '';
  });

  btnClearIntake.addEventListener('click', () => {
    intakeText.value = '';
    intakeUrl.value = '';
    intakePastedImageBase64 = null;
    previewImg.src = '';
    imagePreviewArea.style.display = 'none';
  });

  btnProcessIntake.addEventListener('click', async () => {
    const text = intakeText.value.trim();
    const url = intakeUrl.value.trim();

    if (!text && !intakePastedImageBase64 && !url) {
      showToast('Por favor pega texto, una captura de pantalla (Ctrl+V) o una URL.', 'error');
      return;
    }

    btnProcessIntake.disabled = true;
    btnProcessIntake.innerHTML = '<span>Extrayendo información con IA...</span>';

    try {
      const extracted = await window.aiJobParser.extractJobDetails({
        text,
        imageBase64: intakePastedImageBase64,
        url
      });

      pendingExtractedJob = extracted;
      openConfirmModal(extracted);
    } catch (err) {
      console.error(err);
      showToast('Error procesando la vacante. Intenta de nuevo.', 'error');
    } finally {
      btnProcessIntake.disabled = false;
      btnProcessIntake.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
        </svg>
        <span>Extraer y Guardar con IA</span>
      `;
    }
  });

  // =========================================================================
  // Intake Confirmation Modal Logic
  // =========================================================================
  function openConfirmModal(job) {
    confirmEmpresa.value = job.empresa || '';
    confirmPuesto.value = job.puesto || '';
    confirmModalidad.value = job.modalidad || 'Remoto';
    confirmPrioridad.value = job.prioridad || 'high';
    confirmSalario.value = job.salario || '';
    confirmContacto.value = job.contacto || '';
    confirmUrl.value = job.url || '';
    confirmNotas.value = job.notas || '';

    let badgeText = '⚡ Extracción inteligente local (Heurística)';
    if (job.extractionSource === 'ai-serverless') {
      badgeText = '✨ Extracción Multimodal con IA en la Nube (Gemini 1.5 Flash)';
    } else if (job.extractionSource === 'ai-direct' || job.aiGenerated) {
      badgeText = '✨ Extracción Multimodal con Google Gemini API';
    }
    aiExtractionSourceBadge.textContent = badgeText;


    renderRequisitosChips(job.requisitos || []);
    intakeConfirmModal.classList.add('open');
  }

  function renderRequisitosChips(techs) {
    confirmRequisitosChips.innerHTML = techs.map(t => `
      <span class="tag-pill">${escapeHtml(t)}</span>
    `).join('');
  }

  function closeConfirmModal() {
    intakeConfirmModal.classList.remove('open');
    pendingExtractedJob = null;
  }

  btnCloseConfirmModal.addEventListener('click', closeConfirmModal);
  btnCancelConfirm.addEventListener('click', closeConfirmModal);

  btnSaveConfirmedJob.addEventListener('click', () => {
    if (!pendingExtractedJob) return;

    const extraTechs = confirmRequisitosInput.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const allTechs = [...(pendingExtractedJob.requisitos || []), ...extraTechs];

    const finalJob = {
      ...pendingExtractedJob,
      empresa: confirmEmpresa.value.trim() || 'Empresa Confidencial',
      puesto: confirmPuesto.value.trim() || 'Oportunidad TI',
      modalidad: confirmModalidad.value,
      prioridad: confirmPrioridad.value,
      salario: confirmSalario.value.trim(),
      contacto: confirmContacto.value.trim(),
      url: confirmUrl.value.trim(),
      notas: confirmNotas.value.trim(),
      requisitos: allTechs,
      estado: 'saved'
    };

    window.appStorage.addVacancy(finalJob);
    closeConfirmModal();
    btnClearIntake.click();
    switchView('kanban');
    showToast(`¡Vacante "${finalJob.puesto}" guardada en el tablero!`, 'success');
  });

  // =========================================================================
  // Settings & Backup Modal Logic
  // =========================================================================
  btnSettings.addEventListener('click', () => {
    const current = window.appStorage.getSettings();
    inputApiKey.value = current.geminiApiKey || current.aiApiKey || '';
    const selectAiProvider = document.getElementById('selectAiProvider');
    if (selectAiProvider && current.aiProvider) {
      selectAiProvider.value = current.aiProvider;
    }
    settingsModal.classList.add('open');
  });

  btnCloseSettingsModal.addEventListener('click', () => {
    settingsModal.classList.remove('open');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('open');
  });

  btnSaveSettings.addEventListener('click', () => {
    const key = inputApiKey.value.trim();
    const selectAiProvider = document.getElementById('selectAiProvider');
    const provider = selectAiProvider ? selectAiProvider.value : 'gemini';
    window.appStorage.saveSettings({
      geminiApiKey: key,
      aiApiKey: key,
      aiProvider: provider
    });
    settingsModal.classList.remove('open');
    showToast('Configuración guardada para tu perfil', 'success');
  });

  btnExportJson.addEventListener('click', () => {
    window.appStorage.exportDataJson();
    showToast('Copia de seguridad descargada', 'info');
  });

  btnTriggerImport.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = window.appStorage.importDataJson(event.target.result);
      if (success) {
        showToast('Respaldo restaurado con éxito', 'success');
        settingsModal.classList.remove('open');
      } else {
        showToast('Formato JSON no válido', 'error');
      }
    };
    reader.readAsText(file);
  });

  btnResetSeed.addEventListener('click', () => {
    if (confirm('¿Restablecer el tablero a las 16 vacantes iniciales extraídas de Gemini? Se sobrescribirán los datos actuales.')) {
      window.appStorage.resetToSeedData();
      settingsModal.classList.remove('open');
      showToast('Tablero restablecido a las 16 vacantes de Gemini', 'info');
    }
  });

  // =========================================================================
  // CV Generator (Tailored Content, Templates, Photo & AI Optimization)
  // =========================================================================

  // Initial Master CV Base (from cv_base_arianna.md & LinkedIn)
  const MASTER_CV = {
    role: 'Full Stack Developer & Especialista TI / Web',
    summary: 'Especialista en Desarrollo de Software, Arquitecturas Web Escalables y Soluciones TI con sólida experiencia liderando proyectos Frontend y Backend, modernización de plataformas de misión crítica (LMS Moodle, OJS, ecosistemas PHP/Laravel/JavaScript) y diseño de flujos operativos para sectores corporativos, educativos y bancarios. Dominio en la integración de modelos de Inteligencia Artificial (Google Gemini API), pasarelas de pago multimoneda y transaccionales (+900 tx/mes), construcción de interfaces de alto rendimiento (Core Web Vitals) y despliegues continuos con Git, Netlify y Supabase.',
    experiences: [
      {
        company: 'Colegio Gonzaga',
        role: 'Desarrollador de sistemas',
        period: 'febrero de 2026 - octubre de 2026 (9 meses)',
        location: 'Maracaibo, Estado Zulia, Venezuela (Remoto)',
        bullets: [
          'Pasarela Multicuenta: Desarrollo e integración de Gonzaga Admin para procesar Pago Móvil, Transferencias Bs, Mercantil C2P y Zinli USD (+900 transacciones mensuales).',
          'Rediseño & UX/UI: Optimización de rendimiento web (WPO) y reestructuración completa de la arquitectura del portal colegiogonzaga.org.ve.',
          'Analítica & Automatización: Configuración de GA4, reportes en tiempo real, alertas de tesorería y re-consultas automatizadas con la API Banco Mercantil.'
        ]
      },
      {
        company: 'Centro de Espiritualidad y Pastoral Venezuela',
        role: 'Diseñador de páginas web',
        period: 'marzo de 2026 - julio de 2026 (5 meses)',
        location: 'Caracas, Distrito Federal, Venezuela',
        bullets: [
          'Arquitectura Web: Diseñé y desplegué la plataforma nacional en WordPress, escalando de 7 a 11 páginas responsivas.',
          'Sistema de Diseño Oasis: Desarrollé el sistema Oasis (tokens y componentes modulares) alineado al manual de identidad jesuita.',
          'Componentes Dinámicos & APIs: Implementé mapa interactivo SVG por estados, agenda pastoral responsiva y diagnósticos de integración con API de Meta y CPT.'
        ]
      },
      {
        company: 'INGEDACA',
        role: 'Asistente del presidente & TI',
        period: 'marzo de 2026 - abril de 2026 (2 meses)',
        location: 'Metropolitan Region of Caracas, Venezuela',
        bullets: [
          'Arquitectura Web: Auditoría, optimización y mantenimiento de sitios web corporativos e infraestructura digital.',
          'Gestión ERP: Estructuración e importación de datos en Odoo para optimizar procesos de procura y CRM.',
          'Seguridad e IT: Gestión de accesos corporativos, contraseñas, políticas de seguridad y documentación de procesos técnicos.'
        ]
      },
      {
        company: 'Fe y Alegría Venezuela',
        role: 'Desarrolladora Full Stack',
        period: 'agosto de 2025 - noviembre de 2025 (4 meses)',
        location: 'Caracas, Distrito Federal, Venezuela',
        bullets: [
          'Sistema de Donaciones en Laravel: Desarrollé sistema a medida gestionando flujos transaccionales y usuarios seguros (app.donarfeyalegriavzla.org).',
          'Despliegue & DevOps: Orquesté el ciclo completo de despliegue, gestión de hosting y migraciones de bases de datos SQL para campañas de recaudación de alto tráfico.',
          'Landing Page en WordPress: Diseñé y lancé landing de alto rendimiento integrada con Google Analytics y estrategias SEO para maximizar conversión de donantes.'
        ]
      },
      {
        company: 'CIDE (Centro de Investigación y Desarrollo Ecuador)',
        role: 'Desarrolladora WordPress y Administradora CMS',
        period: 'enero de 2025 - julio de 2025 (7 meses)',
        location: 'Pichincha, Ecuador (Remoto)',
        bullets: [
          'Plugin de WordPress Personalizado: Diseñé y desarrollé plugin para la consulta y validación de bases de datos en tiempo real (cidelatam.org/sistema-de-validacion-de-resultados-2025).',
          'Campus Virtual & LMS: Administración y optimización de plataformas institucionales sobre LearnDash, Moodle y sistemas de gestión de eventos (Eventin).',
          'Ecosistema CMS Académico: Mantenimiento y actualización de plataformas complejas incluyendo DSpace y Open Journal Systems (OJS), garantizando integridad y seguridad.'
        ]
      },
      {
        company: 'Fe y Alegría Venezuela',
        role: 'Pasante Desarrolladora de Chatbots',
        period: 'abril de 2025 - junio de 2025 (3 meses)',
        location: 'Caracas, Distrito Federal, Venezuela',
        bullets: [
          'Chatbot impulsado por IA: Construí prototipo funcional utilizando HTML5, CSS3 y JavaScript, integrando la API de Google Gemini para procesamiento de lenguaje natural (chatbotfya.web.app).',
          'Experiencia de Usuario: Colaboré de forma remota para refinar los flujos de interacción del usuario, mejorando el canal de soporte digital institucional.'
        ]
      }
    ],
    skills: {
      relevant: 'JavaScript (ES6+), React, PHP, Laravel, Python, PostgreSQL (RLS), MySQL, APIs REST, Netlify Functions, Git/GitHub, Supabase Cloud',
      core: 'Pasarelas de Pago (C2P, Pago Móvil, Zinli), Integración IA (Gemini 2.5), WordPress Headless/Plugins, Moodle LMS, OJS, Odoo ERP',
      methodologies: 'Scrum, Kanban, Metodologías Ágiles, Optimización ATS, SEO Técnico, Seguridad TI, Continuidad Operativa'
    }
  };

  // =========================================================================
  // CV Generator State & Core Controllers
  // =========================================================================

  let cvActiveData = null; // Stores current role, summary, experiences, skills

  // --- Photo Management ---
  const OFFICIAL_ARIANNA_PHOTO = 'assets/images/arianna_photo.jpg';

  function initCvPhoto() {
    const savedPhoto = localStorage.getItem('aryc_cv_photo') || OFFICIAL_ARIANNA_PHOTO;
    const photoEnabled = localStorage.getItem('aryc_cv_photo_enabled') !== 'false';
    const photoShape = localStorage.getItem('aryc_cv_photo_shape') || 'circle';
    const photoPos = localStorage.getItem('aryc_cv_photo_pos') || 'top';

    applyPhotoSettings({
      enabled: photoEnabled,
      shape: photoShape,
      pos: photoPos,
      photoUrl: savedPhoto
    });
  }

  function applyPhotoSettings({ enabled, shape, pos, photoUrl }) {
    if (!cvPaper || !cvPhotoContainer) return;

    if (photoUrl) {
      if (cvPhotoImg) cvPhotoImg.src = photoUrl;
      if (modalPhotoPreviewImg) modalPhotoPreviewImg.src = photoUrl;
      localStorage.setItem('aryc_cv_photo', photoUrl);
    }

    if (shape) {
      cvPhotoContainer.classList.remove('shape-circle', 'shape-rounded', 'shape-square');
      cvPhotoContainer.classList.add(`shape-${shape}`);
      if (modalPhotoPreviewBox) {
        modalPhotoPreviewBox.classList.remove('shape-circle', 'shape-rounded', 'shape-square');
        modalPhotoPreviewBox.classList.add(`shape-${shape}`);
      }
      document.querySelectorAll('#cvPhotoConfigModal .photo-shape-btn[data-shape]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.shape === shape);
      });
      localStorage.setItem('aryc_cv_photo_shape', shape);
    }

    if (pos) {
      if (cvPhotoImg) {
        cvPhotoImg.classList.remove('pos-top', 'pos-center');
        cvPhotoImg.classList.add(`pos-${pos}`);
      }
      if (modalPhotoPreviewImg) {
        modalPhotoPreviewImg.classList.remove('pos-top', 'pos-center');
        modalPhotoPreviewImg.classList.add(`pos-${pos}`);
      }
      document.querySelectorAll('#cvPhotoConfigModal .photo-shape-btn[data-pos]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.pos === pos);
      });
      localStorage.setItem('aryc_cv_photo_pos', pos);
    }

    if (typeof enabled === 'boolean') {
      if (enabled) {
        cvPaper.classList.remove('no-photo');
        cvPhotoContainer.style.display = 'block';
      } else {
        cvPaper.classList.add('no-photo');
        cvPhotoContainer.style.display = 'none';
      }
      if (modalTogglePhoto) modalTogglePhoto.checked = enabled;
      if (cvPhotoStatusText) cvPhotoStatusText.textContent = enabled ? 'Visible' : 'Oculta';
      localStorage.setItem('aryc_cv_photo_enabled', enabled ? 'true' : 'false');
    }
  }

  if (btnOpenPhotoConfig) {
    btnOpenPhotoConfig.addEventListener('click', () => {
      if (cvPhotoConfigModal) cvPhotoConfigModal.classList.add('open');
    });
  }

  if (btnClosePhotoModal) {
    btnClosePhotoModal.addEventListener('click', () => {
      cvPhotoConfigModal.classList.remove('open');
    });
  }

  if (btnApplyPhotoConfig) {
    btnApplyPhotoConfig.addEventListener('click', () => {
      cvPhotoConfigModal.classList.remove('open');
      showToast('Configuración de fotografía guardada', 'success');
    });
  }

  if (modalTogglePhoto) {
    modalTogglePhoto.addEventListener('change', () => {
      applyPhotoSettings({ enabled: modalTogglePhoto.checked });
      showToast(modalTogglePhoto.checked ? 'Foto activada en el CV' : 'Foto ocultada del CV', 'info');
    });
  }

  // Photo Shape Buttons
  document.querySelectorAll('#cvPhotoConfigModal .photo-shape-btn[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyPhotoSettings({ shape: btn.dataset.shape });
    });
  });

  // Photo Position Buttons
  document.querySelectorAll('#cvPhotoConfigModal .photo-shape-btn[data-pos]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyPhotoSettings({ pos: btn.dataset.pos });
    });
  });

  if (btnUseOfficialPhoto) {
    btnUseOfficialPhoto.addEventListener('click', () => {
      applyPhotoSettings({ photoUrl: OFFICIAL_ARIANNA_PHOTO, enabled: true });
      showToast('Foto oficial de Arianna restablecida', 'success');
    });
  }

  if (btnModalUploadPhoto) {
    btnModalUploadPhoto.addEventListener('click', () => {
      if (cvPhotoInput) cvPhotoInput.click();
    });
  }

  if (btnRemovePhoto) {
    btnRemovePhoto.addEventListener('click', () => {
      applyPhotoSettings({ enabled: false });
      showToast('Fotografía desactivada en el CV', 'info');
    });
  }

  if (cvPhotoInput) {
    cvPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const b64 = evt.target.result;
          applyPhotoSettings({ photoUrl: b64, enabled: true });
          showToast('Fotografía cargada exitosamente', 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // --- Template Selector ---
  function initCvTemplate() {
    const savedTemplate = localStorage.getItem('aryc_cv_template') || 'modern';
    if (cvTemplateSelect) {
      cvTemplateSelect.value = savedTemplate;
    }
    applyTemplate(savedTemplate);
  }

  function applyTemplate(templateName) {
    if (!cvPaper) return;
    cvPaper.classList.remove('template-modern', 'template-harvard', 'template-banking');
    cvPaper.classList.add(`template-${templateName}`);
    localStorage.setItem('aryc_cv_template', templateName);
  }

  if (cvTemplateSelect) {
    cvTemplateSelect.addEventListener('change', () => {
      applyTemplate(cvTemplateSelect.value);
      showToast(`Plantilla cambiada a: ${cvTemplateSelect.options[cvTemplateSelect.selectedIndex].text}`, 'info');
    });
  }

  // --- CV Selector & Rendering ---
  function populateCvSelector() {
    const vacancies = window.appStorage.getVacancies();
    cvVacancySelect.innerHTML = `
      <option value="general">CV Perfil General (Tech & Banking)</option>
      ${vacancies.map(v => `
        <option value="${v.id}">${escapeHtml(v.empresa)} - ${escapeHtml(v.puesto)}</option>
      `).join('')}
    `;
  }

  cvVacancySelect.addEventListener('change', () => {
    updateCvPreview();
  });

  function updateCvPreview() {
    const selectedId = cvVacancySelect.value;
    if (selectedId === 'general') {
      applyTailoredCvData(MASTER_CV, { empresa: 'General', puesto: 'Full Stack Developer & Especialista TI / Web' });
    } else {
      const vacancies = window.appStorage.getVacancies();
      const vacancy = vacancies.find(v => v.id === selectedId);
      if (vacancy) {
        const localTailored = generateLocalTailoredCv(vacancy);
        applyTailoredCvData(localTailored, vacancy);
      }
    }
  }

  function generateLocalTailoredCv(vacancy) {
    const empresa = vacancy.empresa || 'la empresa';
    const puesto = vacancy.puesto || 'Full Stack Developer';
    const currentProfile = (window.appStorage && window.appStorage.getProfile()) || ARIANNA_MASTER_PROFILE;
    const reqs = (vacancy.requisitos && vacancy.requisitos.length > 0)
      ? vacancy.requisitos
      : (currentProfile.habilidades && currentProfile.habilidades.length > 0 ? currentProfile.habilidades.slice(0, 6) : ['JavaScript', 'PHP', 'Laravel', 'React', 'SQL', 'Git']);

    const profileExperiences = (currentProfile.experiencias && currentProfile.experiencias.length > 0)
      ? currentProfile.experiencias.map(exp => ({
          company: exp.empresa || exp.company,
          role: exp.puesto || exp.role,
          period: exp.periodo || exp.period,
          location: exp.ubicacion || exp.location || 'Remoto',
          bullets: exp.bullets || []
        }))
      : MASTER_CV.experiences;

    return {
      role: `${puesto} | ${currentProfile.nombre || 'Arianna Clemente'}`,
      summary: currentProfile.resumen || MASTER_CV.summary,
      experiences: profileExperiences,
      skills: {
        relevant: `${reqs.join(', ')}`,
        core: currentProfile.habilidades ? currentProfile.habilidades.join(', ') : MASTER_CV.skills.core,
        methodologies: 'Scrum, Kanban, Metodologías Ágiles, Optimización ATS, SEO Técnico, Seguridad TI, Continuidad Operativa.'
      }
    };
  }

  // --- Hidden Experiences Management by Vacancy ---
  function getHiddenExperiences(vacancyId) {
    try {
      const stored = localStorage.getItem(`aryc_cv_hidden_exp_${vacancyId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveHiddenExperiences(vacancyId, list) {
    localStorage.setItem(`aryc_cv_hidden_exp_${vacancyId}`, JSON.stringify(list));
  }

  function applyTailoredCvData(data, vacancy) {
    cvActiveData = { ...data };
    const currentProfile = (window.appStorage && window.appStorage.getProfile()) || ARIANNA_MASTER_PROFILE;

    const cvHeaderName = document.getElementById('cvHeaderName');
    const cvHeaderContacts = document.getElementById('cvHeaderContacts');

    if (cvHeaderName) {
      cvHeaderName.textContent = currentProfile.nombre || 'Arianna Clemente';
    }

    if (cvHeaderContacts) {
      const links = currentProfile.enlaces || {};
      const linksStr = [links.github, links.linkedin, links.portafolio].filter(Boolean).join(' • ');
      cvHeaderContacts.innerHTML = `
        <div>${escapeHtml(currentProfile.ubicacion || 'Remoto Internacional')}</div>
        <div>${escapeHtml(currentProfile.email || 'hello.ary.code@gmail.com')}${currentProfile.telefono ? ` &bull; ${escapeHtml(currentProfile.telefono)}` : ''}</div>
        <div>${escapeHtml(linksStr || '')}</div>
      `;
    }

    cvHeaderRole.textContent = data.role || `${vacancy.puesto || currentProfile.titular || 'Full Stack Developer'} | ${currentProfile.nombre || 'Arianna Clemente'}`;
    cvSummaryText.textContent = data.summary || currentProfile.resumen || MASTER_CV.summary;

    renderCvExperiences();

    if (data.skills && typeof data.skills === 'object') {
      cvSkillsList.innerHTML = `
        <strong>Tecnologías Clave para ${escapeHtml(vacancy.empresa || 'el puesto')}:</strong> ${escapeHtml(data.skills.relevant || '')}<br>
        <strong>Stack &amp; Arquitectura:</strong> ${escapeHtml(data.skills.core || '')}<br>
        <strong>Metodologías &amp; Prácticas:</strong> ${escapeHtml(data.skills.methodologies || '')}
      `;
    }
  }

  function renderCvExperiences() {
    const expContainer = document.getElementById('cvExperienceContainer');
    if (!expContainer || !cvActiveData) return;

    const currentProfile = (window.appStorage && window.appStorage.getProfile()) || ARIANNA_MASTER_PROFILE;
    const profileExpList = (currentProfile.experiencias && currentProfile.experiencias.length > 0)
      ? currentProfile.experiencias.map(exp => ({
          company: exp.empresa || exp.company,
          role: exp.puesto || exp.role,
          period: exp.periodo || exp.period,
          location: exp.ubicacion || exp.location || 'Remoto',
          bullets: exp.bullets || []
        }))
      : MASTER_CV.experiences;

    const allExperiences = Array.isArray(cvActiveData.experiences) && cvActiveData.experiences.length > 0
      ? cvActiveData.experiences
      : profileExpList;

    const currentVacancyId = cvVacancySelect ? cvVacancySelect.value : 'general';
    const hiddenList = getHiddenExperiences(currentVacancyId);
    const hiddenSet = new Set(hiddenList);

    const visibleExperiences = allExperiences.filter(exp => !hiddenSet.has(exp.company));

    // Update badges
    if (cvExpCountBadge) {
      cvExpCountBadge.textContent = `${visibleExperiences.length}/${allExperiences.length}`;
    }
    if (manageExpCountText) {
      manageExpCountText.textContent = `${visibleExperiences.length} de ${allExperiences.length}`;
    }

    if (visibleExperiences.length === 0) {
      expContainer.innerHTML = `
        <div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.875rem; border:1px dashed var(--border-slate); border-radius:8px;">
          No hay experiencias visibles en este momento. 
          <button class="btn btn-outline" style="margin-left:0.5rem; padding:0.25rem 0.6rem; font-size:0.75rem;" onclick="document.getElementById('btnShowAllExperiences').click()">
            Mostrar Todas
          </button>
        </div>
      `;
      return;
    }

    expContainer.innerHTML = visibleExperiences.map((job, idx) => `
      <div class="cv-job" data-company="${escapeHtml(job.company)}">
        <div class="cv-job-header">
          <div class="cv-job-header-left">
            <span class="cv-job-role">${escapeHtml(job.role)}</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span class="cv-job-period">${escapeHtml(job.period)}</span>
            <div class="cv-job-actions">
              <button class="btn-job-action btn-hide-job" data-company="${escapeHtml(job.company)}" title="Ocultar del CV">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                <span>Ocultar</span>
              </button>
            </div>
          </div>
        </div>
        <div class="cv-job-sub">
          <span class="cv-job-company"><strong>${escapeHtml(job.company)}</strong></span>
          <span class="cv-job-location">${escapeHtml(job.location || 'Remoto')}</span>
        </div>
        <ul class="cv-bullets">
          ${(job.bullets || []).map(b => `
            <li>
              <span>${escapeHtml(b)}</span>
              <button class="btn-bullet-remove" title="Eliminar viñeta">&times;</button>
            </li>
          `).join('')}
        </ul>
        <button class="btn-bullet-add" data-company="${escapeHtml(job.company)}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Agregar logro</span>
        </button>
      </div>
    `).join('');

    // Attach Hide Job event listeners
    expContainer.querySelectorAll('.btn-hide-job').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const company = btn.dataset.company;
        const currentVacancyId = cvVacancySelect.value;
        const currentHidden = getHiddenExperiences(currentVacancyId);
        if (!currentHidden.includes(company)) {
          currentHidden.push(company);
          saveHiddenExperiences(currentVacancyId, currentHidden);
          renderCvExperiences();
          showToast(`Puesto en "${company}" ocultado del CV`, 'info');
        }
      });
    });

    // Attach Bullet Remove event listeners
    expContainer.querySelectorAll('.btn-bullet-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const li = btn.closest('li');
        if (li) li.remove();
        showToast('Viñeta eliminada', 'info');
      });
    });

    // Attach Bullet Add event listeners
    expContainer.querySelectorAll('.btn-bullet-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const jobCard = btn.closest('.cv-job');
        const ul = jobCard.querySelector('.cv-bullets');
        if (ul) {
          const newLi = document.createElement('li');
          newLi.innerHTML = `
            <span contenteditable="true">Nuevo logro cuantificable o tarea relevante...</span>
            <button class="btn-bullet-remove" title="Eliminar viñeta">&times;</button>
          `;
          newLi.querySelector('.btn-bullet-remove').addEventListener('click', () => newLi.remove());
          ul.appendChild(newLi);
          const span = newLi.querySelector('span');
          span.focus();
        }
      });
    });

    if (isCvEditMode) {
      expContainer.querySelectorAll('.cv-job-role, .cv-job-period, .cv-job-company, .cv-job-location, .cv-bullets li span').forEach(el => {
        el.setAttribute('contenteditable', 'true');
      });
    }
  }

  // --- Manage Experiences Modal Logic ---
  if (btnManageExperiences) {
    btnManageExperiences.addEventListener('click', () => {
      openManageExperiencesModal();
      manageExperiencesModal.classList.add('open');
    });
  }

  if (btnCloseManageExpModal) {
    btnCloseManageExpModal.addEventListener('click', () => {
      manageExperiencesModal.classList.remove('open');
    });
  }

  if (btnApplyManageExperiences) {
    btnApplyManageExperiences.addEventListener('click', () => {
      manageExperiencesModal.classList.remove('open');
      showToast('Selección de experiencias actualizada', 'success');
    });
  }

  function openManageExperiencesModal() {
    if (!manageExperiencesList || !cvActiveData) return;

    const allExperiences = Array.isArray(cvActiveData.experiences) && cvActiveData.experiences.length > 0
      ? cvActiveData.experiences
      : MASTER_CV.experiences;

    const currentVacancyId = cvVacancySelect.value;
    const hiddenList = getHiddenExperiences(currentVacancyId);
    const hiddenSet = new Set(hiddenList);

    manageExperiencesList.innerHTML = allExperiences.map(job => {
      const isVisible = !hiddenSet.has(job.company);
      return `
        <div class="exp-manage-item ${isVisible ? '' : 'is-hidden'}" data-company="${escapeHtml(job.company)}">
          <input type="checkbox" class="exp-checkbox" style="accent-color:var(--primary); width:18px; height:18px; cursor:pointer;" ${isVisible ? 'checked' : ''}>
          <div class="exp-manage-item-info">
            <span class="exp-manage-company">${escapeHtml(job.company)}</span>
            <span class="exp-manage-meta">${escapeHtml(job.role)} &bull; ${escapeHtml(job.period)}</span>
          </div>
          <span class="tag-pill" style="margin:0; font-size:0.75rem; ${isVisible ? 'background:rgba(0, 210, 180, 0.12); color:var(--deep-teal);' : 'background:#f1f5f9; color:#94a3b8;'}">
            ${isVisible ? 'Visible' : 'Oculta'}
          </span>
        </div>
      `;
    }).join('');

    // Attach checkbox changes
    manageExperiencesList.querySelectorAll('.exp-manage-item').forEach(item => {
      const checkbox = item.querySelector('.exp-checkbox');
      const company = item.dataset.company;

      const toggleAction = () => {
        const currentVacancyId = cvVacancySelect.value;
        let currentHidden = getHiddenExperiences(currentVacancyId);

        if (checkbox.checked) {
          currentHidden = currentHidden.filter(c => c !== company);
        } else {
          if (!currentHidden.includes(company)) currentHidden.push(company);
        }

        saveHiddenExperiences(currentVacancyId, currentHidden);
        renderCvExperiences();
        openManageExperiencesModal(); // refresh UI in modal
      };

      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleAction();
      });

      item.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
          toggleAction();
        }
      });
    });
  }

  if (btnShowAllExperiences) {
    btnShowAllExperiences.addEventListener('click', () => {
      const currentVacancyId = cvVacancySelect.value;
      saveHiddenExperiences(currentVacancyId, []);
      renderCvExperiences();
      openManageExperiencesModal();
      showToast('Todas las experiencias ahora son visibles', 'success');
    });
  }

  // --- Summary Suggestions Modal ("✨ Sugerir Resúmenes") ---
  function getActiveVacancyForCv() {
    const selectedId = cvVacancySelect ? cvVacancySelect.value : 'general';
    const vacancies = window.appStorage.getVacancies();
    return selectedId === 'general'
      ? {
          empresa: 'Empresas Tech & Fintech',
          puesto: 'Senior Full Stack Developer & Especialista TI / Web',
          modalidad: 'Remoto',
          requisitos: ['JavaScript', 'React', 'PHP', 'Python', 'PostgreSQL', 'APIs REST', 'Cloud Architecture'],
          notas: 'Perfil orientado a liderazgo técnico, calidad de software y arquitecturas cloud escalables.'
        }
      : (vacancies.find(v => v.id === selectedId) || {
          empresa: 'Empresa',
          puesto: 'Full Stack Developer',
          requisitos: ['JavaScript', 'PHP', 'Laravel', 'React', 'PostgreSQL']
        });
  }

  function generateLocalSummarySuggestions(vacancy) {
    const empresa = vacancy.empresa || 'Empresas Tech';
    const puesto = vacancy.puesto || 'Full Stack Developer';
    const reqs = (vacancy.requisitos && vacancy.requisitos.length > 0)
      ? vacancy.requisitos.slice(0, 4).join(', ')
      : 'JavaScript, React, PHP, Laravel, PostgreSQL';

    return [
      {
        id: 'tech',
        title: 'Enfoque Técnico & Arquitectura',
        tag: 'Ingeniería & Stack',
        tagClass: 'tag-tech',
        text: `Especialista en Desarrollo de Software y Arquitecturas Web Escalables con sólida trayectoria en desarrollo Frontend y Backend, modernización de plataformas críticas e integración de APIs REST y microservicios. Dominio en el ecosistema ${reqs}, bases de datos relacionales (PostgreSQL, MySQL), optimización de Core Web Vitals y despliegues serverless continuos con Git, Netlify y Supabase.`
      },
      {
        id: 'metrics',
        title: 'Impacto Transaccional & Métricas',
        tag: 'Alto Tráfico (+900 tx/mes)',
        tagClass: 'tag-metrics',
        text: `Desarrolladora Full Stack orientada a la ingeniería de software de alto impacto y rendimiento transaccional. Experiencia comprobada en el desarrollo e integración de pasarelas de pago multimoneda con capacidad para procesar +900 transacciones mensuales, optimización de velocidad de carga (WPO) y continuidad operativa para sistemas de misión crítica en sectores corporativos y financieros.`
      },
      {
        id: 'industry',
        title: 'Soluciones & Adaptabilidad',
        tag: 'Persuasión Sutil',
        tagClass: 'tag-industry',
        text: `Ingeniera de software con comprobada experiencia diseñando plataformas web modulares, automatización de flujos con Inteligencia Artificial (Gemini API) y resolución analítica de incidentes técnicos complejos. Trayectoria destacada en entrega ágil (Scrum/Kanban), rigurosidad metodológica y adaptabilidad rápida a arquitecturas tecnológicas exigentes en organizaciones dinámicas.`
      }
    ];
  }

  async function fetchSummarySuggestions(vacancy) {
    try {
      const settings = window.appStorage.getSettings();
      const localApiKey = settings.geminiApiKey ? settings.geminiApiKey.trim() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (localApiKey) headers['x-gemini-api-key'] = localApiKey;

      const currentProfile = (window.appStorage && window.appStorage.getProfile) ? window.appStorage.getProfile() : null;

      let res = await fetch('/api/tailor-cv', {
        method: 'POST',
        headers,
        body: JSON.stringify({ vacancy, userProfile: currentProfile, mode: 'suggest-summaries' })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/.netlify/functions/tailor-cv', {
          method: 'POST',
          headers,
          body: JSON.stringify({ vacancy, userProfile: currentProfile, mode: 'suggest-summaries' })
        }).catch(() => null);
      }

      if (res && res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Fallo llamada a sugerencias de resumen por API, usando heurística:', err);
    }
    return generateLocalSummarySuggestions(vacancy);
  }

  function renderSummarySuggestions(options) {
    if (!summarySuggestionsGrid) return;

    summarySuggestionsGrid.innerHTML = options.map((opt, i) => `
      <div class="summary-card" data-index="${i}">
        <div class="summary-card-header">
          <div class="summary-card-title">
            <span>${escapeHtml(opt.title)}</span>
          </div>
          <span class="summary-tag ${escapeHtml(opt.tagClass || 'tag-tech')}">
            ${escapeHtml(opt.tag)}
          </span>
        </div>
        <p class="summary-text-preview">${escapeHtml(opt.text)}</p>
        <div class="summary-card-footer">
          <button class="btn btn-outline btn-edit-summary" style="padding:0.35rem 0.75rem; font-size:0.8125rem;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>Editar y Aplicar</span>
          </button>
          <button class="btn btn-primary btn-apply-summary" style="padding:0.35rem 0.85rem; font-size:0.8125rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span>✓ Aplicar al CV</span>
          </button>
        </div>
      </div>
    `).join('');

    // Attach card event listeners
    summarySuggestionsGrid.querySelectorAll('.summary-card').forEach((card, idx) => {
      const opt = options[idx];

      card.querySelector('.btn-apply-summary').addEventListener('click', () => {
        applySummaryToCv(opt.text);
        summarySuggestionsModal.classList.remove('open');
      });

      card.querySelector('.btn-edit-summary').addEventListener('click', () => {
        summaryQuickEditContainer.style.display = 'block';
        summaryQuickEditTextarea.value = opt.text;
        summaryQuickEditTextarea.scrollIntoView({ behavior: 'smooth' });
        summaryQuickEditTextarea.focus();
      });
    });
  }

  function applySummaryToCv(text) {
    if (cvSummaryText) {
      cvSummaryText.textContent = text;
      if (cvActiveData) cvActiveData.summary = text;

      // Pulse animation effect
      cvSummaryText.style.transition = 'background-color 0.4s ease';
      cvSummaryText.style.backgroundColor = 'rgba(77, 23, 214, 0.12)';
      setTimeout(() => {
        cvSummaryText.style.backgroundColor = 'transparent';
      }, 1000);

      showToast('Resumen profesional actualizado en el CV', 'success');
    }
  }

  if (btnOpenSummarySuggestions) {
    btnOpenSummarySuggestions.addEventListener('click', async () => {
      const vacancy = getActiveVacancyForCv();
      if (summaryModalVacancyName) {
        summaryModalVacancyName.textContent = `${vacancy.empresa || 'General'} (${vacancy.puesto || 'Full Stack Developer'})`;
      }
      if (summaryQuickEditContainer) summaryQuickEditContainer.style.display = 'none';

      summarySuggestionsModal.classList.add('open');
      summarySuggestionsGrid.innerHTML = `
        <div style="padding:2rem; text-align:center; color:var(--text-muted); font-size:0.875rem;">
          <div class="live-pulse" style="margin:0 auto 0.5rem auto;">
            <span class="live-pulse-ring"></span>
            <span class="live-pulse-core"></span>
          </div>
          Generando sugerencias de alto impacto...
        </div>
      `;

      const options = await fetchSummarySuggestions(vacancy);
      renderSummarySuggestions(options);
    });
  }

  if (btnCloseSummaryModal) {
    btnCloseSummaryModal.addEventListener('click', () => {
      summarySuggestionsModal.classList.remove('open');
    });
  }

  if (btnDismissSummaryModal) {
    btnDismissSummaryModal.addEventListener('click', () => {
      summarySuggestionsModal.classList.remove('open');
    });
  }

  if (btnCancelQuickEdit) {
    btnCancelQuickEdit.addEventListener('click', () => {
      summaryQuickEditContainer.style.display = 'none';
    });
  }

  if (btnApplyQuickEdit) {
    btnApplyQuickEdit.addEventListener('click', () => {
      const customText = summaryQuickEditTextarea.value.trim();
      if (customText) {
        applySummaryToCv(customText);
        summarySuggestionsModal.classList.remove('open');
      }
    });
  }

  if (btnRegenerateSummaries) {
    btnRegenerateSummaries.addEventListener('click', async () => {
      const vacancy = getActiveVacancyForCv();
      btnRegenerateSummaries.disabled = true;
      if (btnRegenSummariesText) btnRegenSummariesText.textContent = 'Generando...';

      const options = await fetchSummarySuggestions(vacancy);
      renderSummarySuggestions(options);

      btnRegenerateSummaries.disabled = false;
      if (btnRegenSummariesText) btnRegenSummariesText.textContent = 'Regenerar con IA';
    });
  }

  if (cvPhotoConfigModal) {
    cvPhotoConfigModal.addEventListener('click', (e) => {
      if (e.target === cvPhotoConfigModal) cvPhotoConfigModal.classList.remove('open');
    });
  }

  if (manageExperiencesModal) {
    manageExperiencesModal.addEventListener('click', (e) => {
      if (e.target === manageExperiencesModal) manageExperiencesModal.classList.remove('open');
    });
  }

  if (summarySuggestionsModal) {
    summarySuggestionsModal.addEventListener('click', (e) => {
      if (e.target === summarySuggestionsModal) summarySuggestionsModal.classList.remove('open');
    });
  }

  // Global Escape key handler for all modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });

  // --- AI Tailor CV Action Button ---
  if (btnTailorCvAi) {
    btnTailorCvAi.addEventListener('click', async () => {
      const selectedId = cvVacancySelect.value;
      const vacancies = window.appStorage.getVacancies();
      const vacancy = selectedId === 'general'
        ? {
            empresa: 'Empresas Tech & Fintech',
            puesto: 'Senior Full Stack Developer & Tech Lead',
            modalidad: 'Remoto',
            requisitos: ['JavaScript', 'React', 'PHP', 'Python', 'PostgreSQL', 'APIs REST', 'Cloud Architecture'],
            notas: 'Perfil orientado a liderazgo técnico, calidad de software y arquitecturas cloud escalables.'
          }
        : vacancies.find(v => v.id === selectedId);

      if (!vacancy) {
        showToast('Selecciona una vacante para adaptar el CV', 'error');
        return;
      }

      btnTailorCvAi.disabled = true;
      tailorCvBtnText.textContent = 'Adaptando con IA...';

      try {
        const settings = window.appStorage.getSettings();
        const localApiKey = settings.geminiApiKey ? settings.geminiApiKey.trim() : null;
        const headers = { 'Content-Type': 'application/json' };
        if (localApiKey) headers['x-gemini-api-key'] = localApiKey;

        const currentProfile = (window.appStorage && window.appStorage.getProfile) ? window.appStorage.getProfile() : null;

        let res = await fetch('/api/tailor-cv', {
          method: 'POST',
          headers,
          body: JSON.stringify({ vacancy, userProfile: currentProfile })
        }).catch(() => null);

        if (!res || !res.ok) {
          res = await fetch('/.netlify/functions/tailor-cv', {
            method: 'POST',
            headers,
            body: JSON.stringify({ vacancy, userProfile: currentProfile })
          }).catch(() => null);
        }

        let tailoredData = null;
        if (res && res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            tailoredData = json.data;
          }
        }

        if (!tailoredData) {
          tailoredData = generateLocalTailoredCv(vacancy);
        }

        applyTailoredCvData(tailoredData, vacancy);
        showToast(`¡CV adaptado exitosamente para ${vacancy.empresa}!`, 'success');
      } catch (err) {
        console.error('Error al adaptar CV con IA:', err);
        const fallback = generateLocalTailoredCv(vacancy);
        applyTailoredCvData(fallback, vacancy);
        showToast('CV adaptado con motor inteligente local.', 'info');
      } finally {
        btnTailorCvAi.disabled = false;
        tailorCvBtnText.textContent = '✨ Adaptar con IA';
      }
    });
  }

  // Toggle inline editing on the CV paper
  btnToggleEditCv.addEventListener('click', () => {
    isCvEditMode = !isCvEditMode;
    cvPaper.classList.toggle('editing-mode', isCvEditMode);

    const editableElements = [cvHeaderRole, cvSummaryText, cvSkillsList];
    editableElements.forEach(el => {
      if (el) el.setAttribute('contenteditable', isCvEditMode ? 'true' : 'false');
    });

    const expContainer = document.getElementById('cvExperienceContainer');
    if (expContainer) {
      expContainer.querySelectorAll('.cv-job-role, .cv-job-period, .cv-job-company, .cv-job-location, .cv-bullets li span').forEach(el => {
        el.setAttribute('contenteditable', isCvEditMode ? 'true' : 'false');
      });
    }

    if (isCvEditMode) {
      editCvBtnText.textContent = 'Terminar Edición';
      btnToggleEditCv.classList.add('btn-purple');
      btnToggleEditCv.classList.remove('btn-outline');
      showToast('Modo edición activado: haz clic en cualquier texto del CV para cambiarlo.', 'info');
    } else {
      editCvBtnText.textContent = 'Editar Texto';
      btnToggleEditCv.classList.remove('btn-purple');
      btnToggleEditCv.classList.add('btn-outline');
      showToast('Texto guardado temporalmente para descargar en PDF.', 'success');
    }
  });

  btnResetCvContent.addEventListener('click', () => {
    updateCvPreview();
    showToast('CV restablecido a la plantilla original.', 'info');
  });

  btnPrintCv.addEventListener('click', () => {
    if (isCvEditMode) {
      btnToggleEditCv.click();
    }
    window.print();
  });

  // Helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- GZIP Compression / Decompression for Interview Chats & FAQs ---
  async function compressGzip(str) {
    if (!str || typeof str !== 'string') return '';
    try {
      const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
      const buf = await new Response(stream).arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
      }
      return btoa(binary);
    } catch (err) {
      console.warn('GZIP Compression fallback to raw text:', err);
      return str;
    }
  }

  async function decompressGzip(b64) {
    if (!b64 || typeof b64 !== 'string') return null;
    const trimmed = b64.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return trimmed;
    }
    try {
      const binary = atob(trimmed);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return await new Response(stream).text();
    } catch (err) {
      console.warn('GZIP Decompression fallback:', err);
      return b64;
    }
  }

  // =========================================================================
  // Cover Letter Controller (Carta de Presentación Adaptada)
  // =========================================================================
  let currentCoverLetterVacancy = null;

  async function openCoverLetterModal(vacancyId) {
    const vacancies = window.appStorage.getVacancies();
    let vacancy = vacancies.find(v => v.id === vacancyId);
    if (!vacancy) {
      vacancy = {
        id: 'general',
        empresa: 'Empresas Tech & Fintech',
        puesto: 'Senior Full Stack Developer & Tech Lead',
        modalidad: 'Remoto',
        requisitos: ['JavaScript', 'PHP', 'Laravel', 'React', 'PostgreSQL', 'APIs REST', 'Cloud'],
        notas: 'Especialista en desarrollo web, arquitecturas transaccionales y soluciones Cloud.'
      };
    }
    currentCoverLetterVacancy = vacancy;

    if (coverLetterCompanyBadge) {
      coverLetterCompanyBadge.textContent = vacancy.empresa || 'Empresa';
    }
    if (coverLetterSubtext) {
      coverLetterSubtext.textContent = `Generada con IA para ${vacancy.puesto || 'la vacante'}`;
    }

    coverLetterModal.classList.add('open');

    // If already generated for this vacancy and has content, avoid duplicate API calls
    if (coverLetterText.dataset.vacancyId === vacancy.id && coverLetterText.innerText.trim().length > 50) {
      return;
    }

    await generateCoverLetter(vacancy);
  }

  async function generateCoverLetter(vacancy) {
    if (!vacancy) return;
    coverLetterText.dataset.vacancyId = vacancy.id;
    coverLetterText.innerHTML = '<div style="color:var(--text-muted); font-style:italic;">Redactando carta de presentación personalizada con Gemini 2.5 Flash...</div>';
    if (btnRegenerateCoverLetter) btnRegenerateCoverLetter.disabled = true;
    if (regenerateLetterBtnText) regenerateLetterBtnText.textContent = 'Generando...';

    try {
      const settings = window.appStorage.getSettings();
      const localApiKey = settings.geminiApiKey ? settings.geminiApiKey.trim() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (localApiKey) headers['x-gemini-api-key'] = localApiKey;

      const currentProfile = (window.appStorage && window.appStorage.getProfile) ? window.appStorage.getProfile() : null;

      let res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers,
        body: JSON.stringify({ vacancy, userProfile: currentProfile })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/.netlify/functions/generate-cover-letter', {
          method: 'POST',
          headers,
          body: JSON.stringify({ vacancy, userProfile: currentProfile })
        }).catch(() => null);
      }

      let letterData = null;
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          letterData = json.data;
        }
      }

      if (letterData && letterData.letter) {
        coverLetterText.innerText = letterData.letter;
        showToast('Carta de presentación generada con IA', 'success');
      } else {
        const fallback = generateLocalCoverLetter(vacancy);
        coverLetterText.innerText = fallback.letter;
        showToast('Carta generada con plantilla inteligente', 'info');
      }
    } catch (err) {
      console.error('Error generando cover letter:', err);
      const fallback = generateLocalCoverLetter(vacancy);
      coverLetterText.innerText = fallback.letter;
      showToast('Carta generada con plantilla inteligente', 'info');
    } finally {
      if (btnRegenerateCoverLetter) btnRegenerateCoverLetter.disabled = false;
      if (regenerateLetterBtnText) regenerateLetterBtnText.textContent = 'Regenerar con IA';
    }
  }

  function generateLocalCoverLetter(vacancy) {
    const empresa = vacancy.empresa || 'Equipo de Selección';
    const puesto = vacancy.puesto || 'Desarrolladora Full Stack';
    const reqs = (vacancy.requisitos && vacancy.requisitos.length > 0) ? vacancy.requisitos.slice(0, 3).join(', ') : 'desarrollo web, integración de APIs y buenas prácticas';

    const letter = `Estimado equipo de selección de ${empresa},

Me dirijo a ustedes con gran entusiasmo para presentar mi postulación al puesto de ${puesto}. Cuento con una sólida trayectoria como Desarrolladora Full Stack y Especialista en Soluciones Web, combinando experiencia práctica en arquitecturas backend robustas, interfaces reactivas de alto rendimiento e integración de Inteligencia Artificial.

A lo largo de mi trayectoria he liderado proyectos de alta responsabilidad transaccional y operativa. En el Colegio Gonzaga desarrollé e integré una pasarela de pagos multicuenta (Pago Móvil, transferencias bancarias, C2P Mercantil y Zinli USD) capaz de procesar más de 900 transacciones mensuales con conciliación automatizada. Asimismo, en Fe y Alegría construí un sistema integral de donaciones en Laravel con bases de datos relacionales seguras y diseñé chatbots inteligentes integrando APIs de Google Gemini, mientras que en CIDE desarrollé plugins personalizados de WordPress para validación de datos en tiempo real y gestioné plataformas LMS Moodle y revistas OJS a escala.

Mi perfil encaja con los requerimientos de ${empresa}, especialmente en el dominio de ${reqs}. Me caracterizo por una rigurosa metodología de trabajo, mentalidad de entrega continua, optimización de Core Web Vitals y un compromiso genuino por resolver problemas complejos con código limpio y escalable en entornos remotos.

Agradezco de antemano el tiempo dedicado a revisar mi perfil. Quedo a su entera disposición para coordinar una entrevista y profundizar en cómo mi experiencia puede generar valor inmediato para su equipo.

Atentamente,

Arianna Clemente
Full Stack Developer & Especialista TI / Web
Caracas, Venezuela • Disponible para Trabajo Remoto Internacional
Email: hello.ary.code@gmail.com
LinkedIn: linkedin.com/in/aryclement | GitHub: github.com/aryclemente`;

    return { letter };
  }

  // Cover Letter Event Listeners
  if (btnOpenCoverLetterModal) {
    btnOpenCoverLetterModal.addEventListener('click', () => {
      const selectedId = cvVacancySelect ? cvVacancySelect.value : 'general';
      openCoverLetterModal(selectedId);
    });
  }

  if (btnCloseCoverLetterModal) {
    btnCloseCoverLetterModal.addEventListener('click', () => {
      coverLetterModal.classList.remove('open');
    });
  }

  if (coverLetterModal) {
    coverLetterModal.addEventListener('click', (e) => {
      if (e.target === coverLetterModal) coverLetterModal.classList.remove('open');
    });
  }

  if (btnRegenerateCoverLetter) {
    btnRegenerateCoverLetter.addEventListener('click', () => {
      if (currentCoverLetterVacancy) {
        generateCoverLetter(currentCoverLetterVacancy);
      }
    });
  }

  if (btnCopyCoverLetter) {
    btnCopyCoverLetter.addEventListener('click', async () => {
      const text = coverLetterText.innerText;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Carta de presentación copiada al portapapeles', 'success');
      } catch (e) {
        showToast('No se pudo copiar automáticamente', 'error');
      }
    });
  }

  if (btnPrintCoverLetter) {
    btnPrintCoverLetter.addEventListener('click', () => {
      const content = coverLetterText.innerText;
      if (!content) return;
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Permite las ventanas emergentes para imprimir', 'error');
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Carta de Presentación - Arianna Clemente</title>
          <style>
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 11.5pt;
              line-height: 1.65;
              color: #1e293b;
              padding: 1.5in;
              margin: 0;
              white-space: pre-wrap;
            }
            @media print {
              body { padding: 0.8in; font-size: 11pt; }
            }
          </style>
        </head>
        <body>${escapeHtml(content)}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    });
  }

  // =========================================================================
  // Email Pitch Controller (Correo de Postulación con CV y Portafolio)
  // =========================================================================
  let currentEmailVacancy = null;

  async function openEmailPitchModal(vacancyId) {
    const vacancies = window.appStorage.getVacancies();
    let vacancy = vacancies.find(v => v.id === vacancyId);
    if (!vacancy) {
      vacancy = {
        id: 'general',
        empresa: 'Empresas Tech & Fintech',
        puesto: 'Senior Full Stack Developer & Tech Lead',
        modalidad: 'Remoto',
        requisitos: ['JavaScript', 'PHP', 'Laravel', 'React', 'PostgreSQL', 'APIs REST'],
        notas: 'Especialista en desarrollo web, arquitecturas transaccionales y soluciones Cloud.'
      };
    }
    currentEmailVacancy = vacancy;

    if (emailPitchSubtext) {
      emailPitchSubtext.textContent = `Preparado para enviar con tu CV y Portafolio a ${vacancy.empresa}`;
    }

    if (emailToInput) {
      const contact = (vacancy.contacto || '').trim();
      emailToInput.value = contact.includes('@') ? contact : '';
    }

    emailPitchModal.classList.add('open');

    if (emailSubjectInput.dataset.vacancyId === vacancy.id && emailBodyInput.value.trim().length > 30) {
      updateMailtoLink();
      return;
    }

    await generateEmailPitch(vacancy);
  }

  async function generateEmailPitch(vacancy) {
    if (!vacancy) return;
    emailSubjectInput.dataset.vacancyId = vacancy.id;
    emailSubjectInput.value = `Postulación: ${vacancy.puesto || 'Full Stack Developer'} - Arianna Clemente`;
    emailBodyInput.value = 'Generando correo persuasivo con Gemini 2.5 Flash...';
    if (btnRegenerateEmail) btnRegenerateEmail.disabled = true;
    if (regenerateEmailBtnText) regenerateEmailBtnText.textContent = 'Generando...';

    try {
      const settings = window.appStorage.getSettings();
      const localApiKey = settings.geminiApiKey ? settings.geminiApiKey.trim() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (localApiKey) headers['x-gemini-api-key'] = localApiKey;

      const currentProfile = (window.appStorage && window.appStorage.getProfile) ? window.appStorage.getProfile() : null;

      let res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers,
        body: JSON.stringify({ vacancy, userProfile: currentProfile })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/.netlify/functions/generate-cover-letter', {
          method: 'POST',
          headers,
          body: JSON.stringify({ vacancy, userProfile: currentProfile })
        }).catch(() => null);
      }

      let emailData = null;
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          emailData = json.data;
        }
      }

      if (emailData && emailData.emailBody) {
        if (emailData.emailSubject) emailSubjectInput.value = emailData.emailSubject;
        emailBodyInput.value = emailData.emailBody;
        showToast('Email de postulación preparado con IA', 'success');
      } else {
        const fallback = generateLocalEmailPitch(vacancy);
        emailSubjectInput.value = fallback.emailSubject;
        emailBodyInput.value = fallback.emailBody;
        showToast('Email preparado con plantilla inteligente', 'info');
      }
    } catch (err) {
      console.error('Error generando email pitch:', err);
      const fallback = generateLocalEmailPitch(vacancy);
      emailSubjectInput.value = fallback.emailSubject;
      emailBodyInput.value = fallback.emailBody;
      showToast('Email preparado con plantilla inteligente', 'info');
    } finally {
      if (btnRegenerateEmail) btnRegenerateEmail.disabled = false;
      if (regenerateEmailBtnText) regenerateEmailBtnText.textContent = 'Regenerar con IA';
      updateMailtoLink();
    }
  }

  function generateLocalEmailPitch(vacancy) {
    const empresa = vacancy.empresa || 'Equipo de Selección';
    const puesto = vacancy.puesto || 'Desarrolladora Full Stack';
    const emailSubject = `Postulación: ${puesto} - Arianna Clemente | Full Stack Developer`;
    const emailBody = `Estimado equipo de ${empresa},

Espero que se encuentren muy bien. Les escribo para presentar formalmente mi postulación a la vacante de ${puesto}.

Cuento con sólida experiencia comprobada en desarrollo Full Stack, pasarelas de pago transaccionales (+900 tx/mes), ecosistemas PHP/Laravel/JavaScript, optimización de rendimiento web (Core Web Vitals +40%) e integraciones con Inteligencia Artificial (Google Gemini API).

Adjunto a este correo mi Currículum Vitae adaptado para la posición. Asimismo, les comparto los enlaces directos a mis proyectos en producción, certificaciones y código fuente:
• Portafolio & GitHub: https://github.com/aryclemente
• Perfil Profesional en LinkedIn: https://linkedin.com/in/aryclement

Quedo a su entera disposición para coordinar una entrevista y profundizar en cómo mi experiencia puede generar valor inmediato para ${empresa}.

Atentamente,

Arianna Clemente
Full Stack Developer & Especialista TI / Web
Caracas, Venezuela (Disponible para Remoto Internacional)
hello.ary.code@gmail.com`;

    return { emailSubject, emailBody };
  }

  function updateMailtoLink() {
    if (!btnLaunchMailClient) return;
    const to = emailToInput ? emailToInput.value.trim() : '';
    const subject = emailSubjectInput ? emailSubjectInput.value.trim() : '';
    const body = emailBodyInput ? emailBodyInput.value.trim() : '';

    const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    btnLaunchMailClient.setAttribute('href', href);
  }

  if (emailToInput) emailToInput.addEventListener('input', updateMailtoLink);
  if (emailSubjectInput) emailSubjectInput.addEventListener('input', updateMailtoLink);
  if (emailBodyInput) emailBodyInput.addEventListener('input', updateMailtoLink);

  if (btnOpenEmailModal) {
    btnOpenEmailModal.addEventListener('click', () => {
      const selectedId = cvVacancySelect ? cvVacancySelect.value : 'general';
      openEmailPitchModal(selectedId);
    });
  }

  if (btnCloseEmailPitchModal) {
    btnCloseEmailPitchModal.addEventListener('click', () => {
      emailPitchModal.classList.remove('open');
    });
  }

  if (emailPitchModal) {
    emailPitchModal.addEventListener('click', (e) => {
      if (e.target === emailPitchModal) emailPitchModal.classList.remove('open');
    });
  }

  if (btnRegenerateEmail) {
    btnRegenerateEmail.addEventListener('click', () => {
      if (currentEmailVacancy) {
        generateEmailPitch(currentEmailVacancy);
      }
    });
  }

  if (btnCopyEmailSubject) {
    btnCopyEmailSubject.addEventListener('click', async () => {
      const text = emailSubjectInput.value;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Asunto copiado al portapapeles', 'success');
      } catch (e) {
        showToast('No se pudo copiar el asunto', 'error');
      }
    });
  }

  if (btnCopyEmailBody) {
    btnCopyEmailBody.addEventListener('click', async () => {
      const text = emailBodyInput.value;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Cuerpo de correo copiado al portapapeles', 'success');
      } catch (e) {
        showToast('No se pudo copiar el correo', 'error');
      }
    });
  }

  // =========================================================================
  // Interview Coach & FAQ Controller (Entrenador de Entrevistas con Gemini)
  // =========================================================================
  let currentCoachVacancy = null;
  let currentCoachPrep = { faqs: [], chatHistory: [] };

  async function openInterviewCoachModal(vacancyId) {
    const vacancies = window.appStorage.getVacancies();
    let vacancy = vacancies.find(v => v.id === vacancyId);
    if (!vacancy) {
      vacancy = {
        id: 'general',
        empresa: 'Empresas Tech & Fintech',
        puesto: 'Senior Full Stack Developer & Tech Lead',
        modalidad: 'Remoto',
        requisitos: ['JavaScript', 'PHP', 'Laravel', 'React', 'PostgreSQL', 'APIs REST'],
        notas: 'Preparación para preguntas de arquitectura, pasarelas de pago y metodología ágil.'
      };
    }
    currentCoachVacancy = vacancy;

    if (coachModalTitle) {
      coachModalTitle.textContent = `Entrenador & FAQ: ${vacancy.puesto || 'Puesto'}`;
    }
    if (coachModalSubtitle) {
      coachModalSubtitle.textContent = `Preparación personalizada para ${vacancy.empresa || 'la empresa'}`;
    }

    interviewCoachModal.classList.add('open');
    switchCoachTab('faqs');

    currentCoachPrep = { faqs: [], chatHistory: [] };

    if (vacancy.interview_prep) {
      try {
        const decompressed = await decompressGzip(vacancy.interview_prep);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          currentCoachPrep.faqs = Array.isArray(parsed.faqs) ? parsed.faqs : [];
          currentCoachPrep.chatHistory = Array.isArray(parsed.chatHistory) ? parsed.chatHistory : [];
        }
      } catch (e) {
        console.warn('Error parseando interview_prep previo:', e);
      }
    }

    if (currentCoachPrep.faqs && currentCoachPrep.faqs.length > 0) {
      renderFaqsList(currentCoachPrep.faqs);
    } else {
      await fetchCoachFaqs(vacancy);
    }

    renderCoachChatMessages();
  }

  function switchCoachTab(tab) {
    if (tab === 'faqs') {
      tabBtnFaqs.style.borderBottomColor = 'var(--primary)';
      tabBtnFaqs.style.color = 'var(--primary)';
      tabBtnChat.style.borderBottomColor = 'transparent';
      tabBtnChat.style.color = 'var(--text-muted)';
      coachPanelFaqs.style.display = 'block';
      coachPanelChat.style.display = 'none';
    } else {
      tabBtnChat.style.borderBottomColor = 'var(--primary)';
      tabBtnChat.style.color = 'var(--primary)';
      tabBtnFaqs.style.borderBottomColor = 'transparent';
      tabBtnFaqs.style.color = 'var(--text-muted)';
      coachPanelFaqs.style.display = 'none';
      coachPanelChat.style.display = 'flex';
      if (coachChatMessages) {
        setTimeout(() => { coachChatMessages.scrollTop = coachChatMessages.scrollHeight; }, 50);
      }
    }
  }

  if (tabBtnFaqs) tabBtnFaqs.addEventListener('click', () => switchCoachTab('faqs'));
  if (tabBtnChat) tabBtnChat.addEventListener('click', () => switchCoachTab('chat'));

  async function fetchCoachFaqs(vacancy) {
    if (!vacancy || !coachFaqsContainer) return;
    coachFaqsContainer.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-muted);"><div class="cloud-status-dot cloud-dot-syncing" style="margin-bottom:0.5rem;"></div><br>Analizando vacante y generando las 5 preguntas más determinantes con Gemini 2.5 Flash...</div>';
    if (btnRefreshFaqs) btnRefreshFaqs.disabled = true;

    try {
      const settings = window.appStorage.getSettings();
      const localApiKey = settings.geminiApiKey ? settings.geminiApiKey.trim() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (localApiKey) headers['x-gemini-api-key'] = localApiKey;

      const currentProfile = (window.appStorage && window.appStorage.getProfile) ? window.appStorage.getProfile() : null;

      let res = await fetch('/api/interview-coach', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate_faqs', vacancy, userProfile: currentProfile })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/.netlify/functions/interview-coach', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'generate_faqs', vacancy, userProfile: currentProfile })
        }).catch(() => null);
      }

      let faqs = null;
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && json.data && Array.isArray(json.data.faqs)) {
          faqs = json.data.faqs;
        }
      }

      if (!faqs || faqs.length === 0) {
        faqs = generateLocalFaqs(vacancy);
      }

      currentCoachPrep.faqs = faqs;
      renderFaqsList(faqs);
      await saveCompressedPrep();
      showToast('Preguntas frecuentes listas para practicar', 'success');
    } catch (err) {
      console.error('Error cargando FAQs:', err);
      const fallback = generateLocalFaqs(vacancy);
      currentCoachPrep.faqs = fallback;
      renderFaqsList(fallback);
      await saveCompressedPrep();
    } finally {
      if (btnRefreshFaqs) btnRefreshFaqs.disabled = false;
    }
  }

  function renderFaqsList(faqs) {
    if (!coachFaqsContainer) return;
    if (!faqs || faqs.length === 0) {
      coachFaqsContainer.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--text-muted);">No hay preguntas registradas. Haz clic en "Regenerar FAQs".</div>';
      return;
    }

    coachFaqsContainer.innerHTML = faqs.map((faq, idx) => `
      <div class="faq-card">
        <div class="faq-card-header">
          <span class="faq-category-badge">${escapeHtml(faq.category || 'Pregunta de Entrevista')}</span>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">#${idx + 1}</span>
        </div>
        <div class="faq-question">${escapeHtml(faq.question)}</div>
        ${faq.whyAsked ? `
          <div class="faq-why-box">
            <strong>💡 ¿Por qué lo preguntan?</strong> ${escapeHtml(faq.whyAsked)}
          </div>
        ` : ''}
        ${faq.answerStrategy ? `
          <div class="faq-strategy-box">
            <strong>🎯 Estrategia recomendada:</strong> ${escapeHtml(faq.answerStrategy)}
          </div>
        ` : ''}
        ${Array.isArray(faq.suggestedPoints) && faq.suggestedPoints.length > 0 ? `
          <div style="font-size:0.8125rem; font-weight:700; color:var(--text-dark-secondary); margin-bottom:0.35rem;">📌 Puntos clave a mencionar:</div>
          <ul class="faq-bullets-list">
            ${faq.suggestedPoints.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('');
  }

  function renderCoachChatMessages() {
    if (!coachChatMessages) return;
    const history = currentCoachPrep.chatHistory || [];

    if (history.length === 0) {
      const emp = currentCoachVacancy?.empresa || 'la empresa';
      const rol = currentCoachVacancy?.puesto || 'Desarrolladora Full Stack';
      coachChatMessages.innerHTML = `
        <div class="coach-msg-row model">
          <div class="coach-bubble coach-bubble-model">
            ¡Hola Arianna! 👋 Soy tu entrevistador técnico para el puesto de <strong>${escapeHtml(rol)}</strong> en <strong>${escapeHtml(emp)}</strong>.<br><br>
            He revisado tu perfil y me llaman mucho la atención tus logros en la pasarela multicuenta del Colegio Gonzaga y tus proyectos en Laravel y Gemini. ¿Te gustaría practicar tu presentación inicial (Elevator Pitch) o prefieres que te haga la primera pregunta técnica?
            <div class="coach-bubble-meta">Simulador Gemini 2.5 Flash</div>
          </div>
        </div>
      `;
      return;
    }

    coachChatMessages.innerHTML = history.map(msg => {
      const isUser = msg.role === 'user';
      return `
        <div class="coach-msg-row ${isUser ? 'user' : 'model'}">
          <div class="coach-bubble ${isUser ? 'coach-bubble-user' : 'coach-bubble-model'}">
            ${escapeHtml(msg.content)}
            <div class="coach-bubble-meta" style="${isUser ? 'color:rgba(255,255,255,0.7);' : ''}">${isUser ? 'Tú' : 'Entrevistador IA'}</div>
          </div>
        </div>
      `;
    }).join('');

    coachChatMessages.scrollTop = coachChatMessages.scrollHeight;
  }

  async function handleCoachChatSubmit(e) {
    e.preventDefault();
    const text = coachChatInput ? coachChatInput.value.trim() : '';
    if (!text || !currentCoachVacancy) return;

    coachChatInput.value = '';

    if (!currentCoachPrep.chatHistory) currentCoachPrep.chatHistory = [];
    currentCoachPrep.chatHistory.push({ role: 'user', content: text, timestamp: new Date().toISOString() });
    renderCoachChatMessages();

    const typingRow = document.createElement('div');
    typingRow.className = 'coach-msg-row model';
    typingRow.id = 'coachTypingIndicator';
    typingRow.innerHTML = `
      <div class="coach-bubble coach-bubble-model" style="font-style:italic; color:var(--text-muted);">
        El entrevistador está evaluando tu respuesta...
      </div>
    `;
    coachChatMessages.appendChild(typingRow);
    coachChatMessages.scrollTop = coachChatMessages.scrollHeight;

    if (btnSendCoachMessage) btnSendCoachMessage.disabled = true;

    try {
      const settings = window.appStorage.getSettings();
      const localApiKey = settings.geminiApiKey ? settings.geminiApiKey.trim() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (localApiKey) headers['x-gemini-api-key'] = localApiKey;

      const historyToSend = currentCoachPrep.chatHistory.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const currentProfile = (window.appStorage && window.appStorage.getProfile) ? window.appStorage.getProfile() : null;

      let res = await fetch('/api/interview-coach', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'chat',
          vacancy: currentCoachVacancy,
          userProfile: currentProfile,
          message: text,
          history: historyToSend
        })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/.netlify/functions/interview-coach', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'chat',
            vacancy: currentCoachVacancy,
            userProfile: currentProfile,
            message: text,
            history: historyToSend
          })
        }).catch(() => null);
      }

      let reply = null;
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.reply) {
          reply = json.data.reply;
        }
      }

      if (!reply) {
        reply = `Excelente respuesta. Al defender tu perfil ante ${currentCoachVacancy.empresa}, asegúrate de cuantificar siempre el impacto de tus soluciones (por ejemplo, las +900 transacciones mensuales procesadas o la reducción en tiempos de respuesta). ¿Qué enfoque tomarías si el sistema debe responder a picos imprevistos de concurrencia?`;
      }

      const typingEl = document.getElementById('coachTypingIndicator');
      if (typingEl) typingEl.remove();

      currentCoachPrep.chatHistory.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
      renderCoachChatMessages();

      await saveCompressedPrep();
    } catch (err) {
      console.error('Error en simulador de entrevista:', err);
      const typingEl = document.getElementById('coachTypingIndicator');
      if (typingEl) typingEl.remove();
      showToast('Error en la comunicación con el entrenador IA', 'error');
    } finally {
      if (btnSendCoachMessage) btnSendCoachMessage.disabled = false;
    }
  }

  async function saveCompressedPrep() {
    if (!currentCoachVacancy || currentCoachVacancy.id === 'general') return;
    try {
      const payloadStr = JSON.stringify({
        updatedAt: new Date().toISOString(),
        faqs: currentCoachPrep.faqs || [],
        chatHistory: currentCoachPrep.chatHistory || []
      });

      const compressed = await compressGzip(payloadStr);
      window.appStorage.saveInterviewPrep(currentCoachVacancy.id, compressed);
    } catch (err) {
      console.error('Error comprimiendo datos de entrevista:', err);
    }
  }

  function generateLocalFaqs(vacancy) {
    const empresa = vacancy.empresa || 'la empresa';
    const puesto = vacancy.puesto || 'Desarrollador Full Stack';

    return [
      {
        category: 'Arquitectura & Misión Crítica',
        question: `¿Podrías hablarnos de un proyecto donde hayas gestionado transacciones críticas o arquitecturas complejas que prepare tu perfil para ${empresa}?`,
        whyAsked: 'Evalúan tu capacidad para asumir responsabilidades técnicas con impacto real y sin margen de error.',
        answerStrategy: 'Aplica el método STAR destacando el sistema de pagos multicuenta del Colegio Gonzaga o el sistema de donaciones en Laravel para Fe y Alegría.',
        suggestedPoints: [
          'Menciona las +900 transacciones mensuales procesadas con Pago Móvil, C2P Mercantil y Zinli USD.',
          'Explica la conciliación en tiempo real y el manejo de errores en pasarelas bancarias.',
          'Destaca la integridad de datos y seguridad transaccional.'
        ]
      },
      {
        category: 'Rendimiento & Core Web Vitals',
        question: `¿Cómo abordas la optimización de rendimiento web (WPO) y Core Web Vitals en plataformas con alto tráfico?`,
        whyAsked: 'Verifican que construyas soluciones rápidas, fluidas, accesibles y optimizadas para SEO.',
        answerStrategy: 'Relata tu experiencia optimizando tiempos de carga y métricas en portales corporativos.',
        suggestedPoints: [
          'Uso de compresión de assets, carga diferida (lazy loading) y reducción de tiempo de bloqueo.',
          'Optimización de consultas a bases de datos relacionales e indexación.',
          'Mejora de métricas LCP, FID/INP y CLS en más de un 40%.'
        ]
      },
      {
        category: 'Integración de IA & Automatización',
        question: `¿Qué experiencia práctica tienes integrando Inteligencia Artificial en flujos operativos y aplicaciones web?`,
        whyAsked: 'Comprueban si estás a la vanguardia tecnológica y si puedes acelerar procesos de desarrollo de manera medible.',
        answerStrategy: 'Menciona tus integraciones con Google Gemini 2.5 en chatbots para Fe y Alegría y en el ATS Vacantes by AryC.',
        suggestedPoints: [
          'Consumo de modelos multimodales (visión + texto) para extracción automatizada de datos a JSON.',
          'Manejo de prompts estructurados, validación de esquemas y control de tokens.',
          'Diseño de fallbacks heurísticos para garantizar 100% de disponibilidad.'
        ]
      },
      {
        category: 'Resolución de Incidentes & DevOps',
        question: `Cuéntanos sobre una situación imprevista o caída de un servicio en producción y cómo la resolviste.`,
        whyAsked: 'Miden tu templanza, capacidad diagnóstica y rigurosidad metodológica ante la presión.',
        answerStrategy: 'Describe tu experiencia en soporte de Nivel 2/3 y gestión de contingencias en Moodle o pasarelas de pago.',
        suggestedPoints: [
          'Identificación de la causa raíz mediante logs y auditoría sistemática.',
          'Mitigación inmediata del impacto para los usuarios.',
          'Documentación y despliegue del parche definitivo en producción con Git.'
        ]
      },
      {
        category: 'Trabajo Remoto & Autonomía',
        question: `¿Cómo te organizas para trabajar de forma remota y comunicarte asíncronamente con equipos distribuidos?`,
        whyAsked: 'Buscan seguridad de que eres autónoma, proactiva y mantienes transparencia continua en tus avances.',
        answerStrategy: 'Enfatiza tu experiencia con clientes en Venezuela, Ecuador y Perú usando Git, Slack y documentación técnica rigurosa.',
        suggestedPoints: [
          'Actualización continua del estado de tareas y blockers.',
          'Manuales técnicos y especificaciones claras para evitar dependencias innecesarias.',
          'Compromiso con entregas a tiempo y respeto a las zonas horarias.'
        ]
      }
    ];
  }

  // Interview Coach Event Listeners
  if (btnOpenInterviewModal) {
    btnOpenInterviewModal.addEventListener('click', () => {
      const selectedId = cvVacancySelect ? cvVacancySelect.value : 'general';
      openInterviewCoachModal(selectedId);
    });
  }

  if (btnCloseInterviewCoachModal) {
    btnCloseInterviewCoachModal.addEventListener('click', () => {
      interviewCoachModal.classList.remove('open');
    });
  }

  if (interviewCoachModal) {
    interviewCoachModal.addEventListener('click', (e) => {
      if (e.target === interviewCoachModal) interviewCoachModal.classList.remove('open');
    });
  }

  if (btnRefreshFaqs) {
    btnRefreshFaqs.addEventListener('click', () => {
      if (currentCoachVacancy) {
        fetchCoachFaqs(currentCoachVacancy);
      }
    });
  }

  if (coachChatForm) {
    coachChatForm.addEventListener('submit', handleCoachChatSubmit);
  }

  if (btnClearCoachChat) {
    btnClearCoachChat.addEventListener('click', async () => {
      if (confirm('¿Deseas reiniciar la conversación con el simulador para esta vacante?')) {
        currentCoachPrep.chatHistory = [];
        renderCoachChatMessages();
        await saveCompressedPrep();
        showToast('Historial de chat reiniciado', 'info');
      }
    });
  }

  // =========================================================================
  // Supabase Cloud & Multi-Device Sync Controller
  // =========================================================================
  function updateCloudStatusUI(status) {
    if (!headerCloudDot || !modalCloudDot) return;

    // Reset status classes
    const classes = ['cloud-dot-local', 'cloud-dot-syncing', 'cloud-dot-synced', 'cloud-dot-error', 'cloud-dot-offline'];
    classes.forEach(c => {
      headerCloudDot.classList.remove(c);
      modalCloudDot.classList.remove(c);
    });

    const activeClass = `cloud-dot-${status || 'local'}`;
    headerCloudDot.classList.add(activeClass);
    modalCloudDot.classList.add(activeClass);

    const isAuth = window.appSupabase && window.appSupabase.isAuthenticated();
    const isConfig = window.appSupabase && window.appSupabase.isConfigured();

    if (isAuth) {
      headerCloudLabel.textContent = 'Nube Activa';
      modalCloudSubtext.textContent = 'Conectado y sincronizado con Supabase Cloud';
    } else if (isConfig) {
      headerCloudLabel.textContent = 'Iniciar Sesión';
      modalCloudSubtext.textContent = 'Supabase configurado. Inicia sesión para sincronizar.';
    } else {
      headerCloudLabel.textContent = 'Conectar Nube';
      modalCloudSubtext.textContent = 'Configura Supabase para sincronizar entre laptop, móvil y PC';
    }
  }

  function updateAuthUI() {
    if (!window.appSupabase) return;

    const isAuth = window.appSupabase.isAuthenticated();

    if (isAuth) {
      const user = window.appSupabase.getUser();
      if (cloudAuthLoggedOut) cloudAuthLoggedOut.style.display = 'none';
      if (cloudAuthLoggedIn) cloudAuthLoggedIn.style.display = 'block';
      if (userLoggedInEmail) userLoggedInEmail.textContent = user?.email || 'Usuario Activo';
      if (userAvatarLetter) userAvatarLetter.textContent = (user?.email || 'A')[0].toUpperCase();
    } else {
      if (cloudAuthLoggedOut) cloudAuthLoggedOut.style.display = 'block';
      if (cloudAuthLoggedIn) cloudAuthLoggedIn.style.display = 'none';
    }

    updateCloudStatusUI(window.appStorage.syncStatus);
  }

  // Cloud Modal Open / Close
  btnOpenCloudModal.addEventListener('click', () => {
    hideAuthAlert();
    updateAuthUI();
    cloudModal.classList.add('open');
  });

  btnCloseCloudModal.addEventListener('click', () => {
    cloudModal.classList.remove('open');
  });

  cloudModal.addEventListener('click', (e) => {
    if (e.target === cloudModal) cloudModal.classList.remove('open');
  });

  // Toggle Magic Link vs Password Forms
  btnToggleMagicLink.addEventListener('click', () => {
    btnToggleMagicLink.style.background = 'var(--surface-container-lowest)';
    btnToggleMagicLink.style.fontWeight = '700';
    btnToggleMagicLink.style.color = 'inherit';
    btnToggleMagicLink.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';

    btnTogglePassword.style.background = 'transparent';
    btnTogglePassword.style.fontWeight = '500';
    btnTogglePassword.style.color = 'var(--text-muted)';
    btnTogglePassword.style.boxShadow = 'none';

    hideAuthAlert();
    formMagicLink.style.display = 'block';
    formPassword.style.display = 'none';
  });

  btnTogglePassword.addEventListener('click', () => {
    btnTogglePassword.style.background = 'var(--surface-container-lowest)';
    btnTogglePassword.style.fontWeight = '700';
    btnTogglePassword.style.color = 'inherit';
    btnTogglePassword.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';

    btnToggleMagicLink.style.background = 'transparent';
    btnToggleMagicLink.style.fontWeight = '500';
    btnToggleMagicLink.style.color = 'var(--text-muted)';
    btnToggleMagicLink.style.boxShadow = 'none';

    hideAuthAlert();
    formMagicLink.style.display = 'none';
    formPassword.style.display = 'block';
  });

  const authAlertBox = document.getElementById('authAlertBox');
  function showAuthAlert(msg, type = 'info') {
    if (!authAlertBox) return;
    authAlertBox.style.display = 'block';
    if (type === 'success') {
      authAlertBox.style.background = 'rgba(0, 210, 180, 0.12)';
      authAlertBox.style.border = '1px solid var(--mint-turquoise)';
      authAlertBox.style.color = '#004d40';
    } else if (type === 'error') {
      authAlertBox.style.background = 'rgba(239, 68, 68, 0.12)';
      authAlertBox.style.border = '1px solid var(--error)';
      authAlertBox.style.color = '#7f1d1d';
    } else {
      authAlertBox.style.background = 'rgba(77, 23, 214, 0.08)';
      authAlertBox.style.border = '1px solid var(--primary)';
      authAlertBox.style.color = 'var(--text-dark-primary)';
    }
    authAlertBox.innerHTML = msg;
  }

  function hideAuthAlert() {
    if (authAlertBox) {
      authAlertBox.style.display = 'none';
      authAlertBox.innerHTML = '';
    }
  }

  // Magic Link Submit
  formMagicLink.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputMagicEmail.value.trim();
    if (!email) return;

    try {
      btnSendMagicLink.disabled = true;
      btnSendMagicLink.innerHTML = '<span>Enviando enlace...</span>';
      hideAuthAlert();
      await window.appSupabase.signInWithOtp(email);
      showAuthAlert(`📨 <strong>¡Enlace enviado a ${escapeHtml(email)}!</strong><br>Abre tu correo y haz clic en el enlace para ingresar inmediatamente sin contraseña.`, 'success');
      showToast('¡Enlace de acceso enviado! Revisa tu bandeja de correo.', 'success');
      inputMagicEmail.value = '';
    } catch (err) {
      showAuthAlert(`⚠️ ${err.message || 'Error al enviar Magic Link'}`, 'error');
      showToast(err.message || 'Error al enviar Magic Link', 'error');
    } finally {
      btnSendMagicLink.disabled = false;
      btnSendMagicLink.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        <span>Enviar Enlace de Acceso</span>
      `;
    }
  });

  // Password Sign In
  btnSignInPassword.addEventListener('click', async () => {
    const email = inputAuthEmail.value.trim();
    const password = inputAuthPassword.value;
    if (!email || !password) {
      showAuthAlert('Por favor completa tu correo y contraseña.', 'error');
      showToast('Por favor completa tu correo y contraseña', 'error');
      return;
    }

    try {
      btnSignInPassword.disabled = true;
      btnSignInPassword.textContent = 'Iniciando...';
      hideAuthAlert();
      await window.appSupabase.signIn(email, password);
      showAuthAlert('¡Sesión iniciada con éxito! Sincronizando datos...', 'success');
      showToast('¡Sesión iniciada con éxito! Sincronizando datos...', 'success');
      updateAuthUI();
      setTimeout(() => {
        const cloudModal = document.getElementById('cloudModal');
        if (cloudModal) cloudModal.classList.remove('open');
        checkNewUserWelcome();
      }, 500);
    } catch (err) {
      let friendlyMsg = err.message || 'Error al iniciar sesión';
      if (friendlyMsg.includes('Invalid login credentials')) {
        friendlyMsg = 'Correo o contraseña incorrectos. Si te registraste hace poco, confirma primero el correo enviado a tu bandeja o entra con Magic Link.';
      } else if (friendlyMsg.includes('Email not confirmed')) {
        friendlyMsg = '⚠️ Debes confirmar tu correo electrónico antes de ingresar con contraseña. Revisa tu bandeja de entrada o ingresa directamente con Magic Link.';
      }
      showAuthAlert(`⚠️ ${friendlyMsg}`, 'error');
      showToast(friendlyMsg, 'error');
    } finally {
      btnSignInPassword.disabled = false;
      btnSignInPassword.textContent = 'Iniciar Sesión';
    }
  });

  // Password Sign Up
  btnSignUpPassword.addEventListener('click', async () => {
    const email = inputAuthEmail.value.trim();
    const password = inputAuthPassword.value;
    if (!email || !password) {
      showAuthAlert('Por favor completa correo y contraseña para registrarte.', 'error');
      showToast('Por favor completa correo y contraseña para registrarte', 'error');
      return;
    }

    if (password.length < 6) {
      showAuthAlert('La contraseña debe tener un mínimo de 6 caracteres.', 'error');
      showToast('La contraseña debe tener un mínimo de 6 caracteres', 'error');
      return;
    }

    try {
      btnSignUpPassword.disabled = true;
      btnSignUpPassword.textContent = 'Creando cuenta...';
      hideAuthAlert();
      const result = await window.appSupabase.signUp(email, password);

      if (result?.user && result?.user?.identities && result.user.identities.length === 0) {
        showAuthAlert(`ℹ️ Este correo ya se encuentra registrado. Ingresa tu contraseña y haz clic en <strong>Iniciar Sesión</strong>, o solicita un Magic Link.`, 'info');
        showToast('El correo ya está registrado. Inicia sesión.', 'info');
      } else if (result?.session) {
        showAuthAlert(`🎉 <strong>¡Cuenta creada y sesión iniciada!</strong> Sincronizando tus vacantes...`, 'success');
        showToast('¡Cuenta creada y sesión activa!', 'success');
        updateAuthUI();
        setTimeout(() => {
          const cloudModal = document.getElementById('cloudModal');
          if (cloudModal) cloudModal.classList.remove('open');
          checkNewUserWelcome();
        }, 500);
      } else {
        showAuthAlert(`🎉 <strong>¡Cuenta creada exitosamente!</strong><br>Hemos enviado un correo de confirmación a <strong>${escapeHtml(email)}</strong>.<br><br>👉 <em>Revisa tu bandeja de entrada (o carpeta de spam) y haz clic en el enlace para activar tu cuenta antes de iniciar sesión.</em>`, 'success');
        showToast('¡Cuenta creada! Revisa tu correo de confirmación.', 'success');
      }
      updateAuthUI();
    } catch (err) {
      let friendlyMsg = err.message || 'Error al crear cuenta';
      if (friendlyMsg.includes('Password should be at least')) {
        friendlyMsg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (friendlyMsg.includes('already registered')) {
        friendlyMsg = 'Este correo ya está registrado. Inicia sesión o solicita un Magic Link.';
      }
      showAuthAlert(`⚠️ ${friendlyMsg}`, 'error');
      showToast(friendlyMsg, 'error');
    } finally {
      btnSignUpPassword.disabled = false;
      btnSignUpPassword.textContent = 'Crear Cuenta';
    }
  });

  // Sign Out
  btnSignOut.addEventListener('click', async () => {
    if (window.appSupabase) {
      await window.appSupabase.signOut();
      hideAuthAlert();
      showToast('Sesión cerrada. Ahora estás en modo local.', 'info');
      updateAuthUI();
    }
  });

  // Migrate Seed Vacancies to Cloud (opcional si existe en DOM)
  if (btnMigrateSeedToCloud) {
    btnMigrateSeedToCloud.addEventListener('click', async () => {
      try {
        btnMigrateSeedToCloud.disabled = true;
        btnMigrateSeedToCloud.innerHTML = '<span>Subiendo vacantes a la nube...</span>';
        const result = await window.appStorage.migrateLocalToCloud();
        showToast(`¡${result.count} vacantes migradas a tu nube con éxito!`, 'success');
      } catch (err) {
        showToast(err.message || 'Error al migrar vacantes', 'error');
      } finally {
        btnMigrateSeedToCloud.disabled = false;
        btnMigrateSeedToCloud.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Subir vacantes locales a la nube (16 iniciales)</span>
        `;
      }
    });
  }

  // Manual Sync
  btnManualSync.addEventListener('click', async () => {
    showToast('Sincronizando con Supabase...', 'info');
    await window.appStorage.syncWithSupabase();
    showToast('Sincronización completada', 'success');
  });

  // Set Password logic for Magic Link users
  const btnToggleSetPassword = document.getElementById('btnToggleSetPassword');
  const boxSetPassword = document.getElementById('boxSetPassword');
  const inputSetNewPassword = document.getElementById('inputSetNewPassword');
  const btnSaveNewPassword = document.getElementById('btnSaveNewPassword');
  const setPasswordFeedback = document.getElementById('setPasswordFeedback');

  if (btnToggleSetPassword && boxSetPassword) {
    btnToggleSetPassword.addEventListener('click', () => {
      const isVisible = boxSetPassword.style.display === 'block';
      boxSetPassword.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && inputSetNewPassword) inputSetNewPassword.focus();
    });
  }

  if (btnSaveNewPassword && inputSetNewPassword) {
    btnSaveNewPassword.addEventListener('click', async () => {
      const newPwd = inputSetNewPassword.value;
      if (!newPwd || newPwd.length < 6) {
        if (setPasswordFeedback) {
          setPasswordFeedback.style.display = 'block';
          setPasswordFeedback.style.color = 'var(--error)';
          setPasswordFeedback.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        }
        return;
      }

      try {
        btnSaveNewPassword.disabled = true;
        btnSaveNewPassword.textContent = 'Guardando...';
        const { error } = await window.appSupabase.client.auth.updateUser({ password: newPwd });
        if (error) throw error;
        if (setPasswordFeedback) {
          setPasswordFeedback.style.display = 'block';
          setPasswordFeedback.style.color = 'var(--mint-turquoise)';
          setPasswordFeedback.textContent = '✓ Contraseña establecida con éxito. Ahora puedes entrar con clave o Magic Link.';
        }
        showToast('Contraseña guardada con éxito', 'success');
        inputSetNewPassword.value = '';
        setTimeout(() => {
          if (boxSetPassword) boxSetPassword.style.display = 'none';
        }, 2800);
      } catch (err) {
        if (setPasswordFeedback) {
          setPasswordFeedback.style.display = 'block';
          setPasswordFeedback.style.color = 'var(--error)';
          setPasswordFeedback.textContent = err.message || 'Error al actualizar contraseña';
        }
        showToast(err.message || 'Error al actualizar contraseña', 'error');
      } finally {
        btnSaveNewPassword.disabled = false;
        btnSaveNewPassword.textContent = 'Guardar Clave';
      }
    });
  }

  // Onboarding bienvenida para nuevo usuario
  function checkNewUserWelcome() {
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) return;
    const user = window.appSupabase.getUser();
    if (!user) return;

    // Obtener perfil específico del usuario
    const profile = window.appStorage.getProfile();

    // Comprobar si completó el onboarding
    const isCompleted = profile && profile.onboarding_completed === true && Array.isArray(profile.habilidades) && profile.habilidades.length > 0;

    if (!isCompleted) {
      const profileModal = document.getElementById('profileModal');
      const cloudModal = document.getElementById('cloudModal');

      // Cerrar modal de login si estaba abierto
      if (cloudModal) cloudModal.classList.remove('open');

      if (profileModal) {
        setTimeout(() => {
          if (typeof window.populateProfileForm === 'function') {
            window.populateProfileForm(profile);
          }
          profileModal.classList.add('open');
          showToast(`🎉 ¡Bienvenido/a! Sube tu perfil en PDF o Markdown para adaptar tus postulaciones en 10 segundos.`, 'info');
        }, 400);
      }
    }
  }

  // Listeners for Supabase Auth and Sync Status
  window.appStorage.onSyncStatusChange((status) => {
    updateCloudStatusUI(status);
  });

  if (window.appSupabase) {
    window.appSupabase.onAuthStateChange(() => {
      updateAuthUI();
      setTimeout(() => {
        checkNewUserWelcome();
      }, 500);
    });
  }

  // Initial Auth & Cloud state check
  setTimeout(() => {
    updateAuthUI();
    checkNewUserWelcome();
  }, 700);

  // =========================================================================
  // Reactive Storage Subscription
  // =========================================================================
  window.appStorage.subscribe(() => {
    renderKanban();
    renderTable();
    populateCvSelector();
  });

  // =========================================================================
  // User Profile & Settings Module (Multi-Tenant & Smart Onboarding)
  // =========================================================================
  function initUserProfileAndSettings() {
    function updateHeaderProfileUI() {
      const profile = (window.appStorage && window.appStorage.getProfile()) || ARIANNA_MASTER_PROFILE;
      const headerUserName = document.getElementById('headerUserName');
      const headerUserAvatar = document.getElementById('headerUserAvatar');

      if (headerUserName) {
        headerUserName.textContent = profile.nombre ? profile.nombre.split(' ')[0] : 'Mi Perfil';
      }
      if (headerUserAvatar) {
        const initials = profile.nombre
          ? profile.nombre.split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
          : 'AC';
        headerUserAvatar.textContent = initials;
      }
    }

    // Settings Modal Controller
    const selectAiProvider = document.getElementById('selectAiProvider');
    const labelAiApiKey = document.getElementById('labelAiApiKey');

    if (btnSettings && settingsModal) {
      btnSettings.addEventListener('click', () => {
        const settings = window.appStorage.getSettings();
        if (selectAiProvider) selectAiProvider.value = settings.aiProvider || 'gemini';
        if (inputApiKey) inputApiKey.value = settings.aiApiKey || settings.geminiApiKey || '';
        settingsModal.classList.add('open');
      });
    }

    if (btnCloseSettingsModal && settingsModal) {
      btnCloseSettingsModal.addEventListener('click', () => {
        settingsModal.classList.remove('open');
      });
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('open');
      });
    }

    if (selectAiProvider) {
      selectAiProvider.addEventListener('change', () => {
        const prov = selectAiProvider.value;
        const placeholders = {
          gemini: 'AIzaSy... (Google AI Studio)',
          claude: 'sk-ant-api03-... (Anthropic)',
          kimi: 'sk-... (Moonshot AI)',
          openai: 'sk-proj-... (OpenAI)',
          openrouter: 'sk-or-v1-... (OpenRouter)'
        };
        if (inputApiKey) inputApiKey.placeholder = placeholders[prov] || 'Ingresa tu API Key...';
        if (labelAiApiKey) labelAiApiKey.textContent = `API Key de ${selectAiProvider.options[selectAiProvider.selectedIndex].text}`;
      });
    }

    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const provider = selectAiProvider ? selectAiProvider.value : 'gemini';
        const apiKey = inputApiKey ? inputApiKey.value.trim() : '';

        window.appStorage.saveSettings({
          aiProvider: provider,
          aiApiKey: apiKey,
          geminiApiKey: apiKey
        });

        showToast('Configuración de IA guardada exitosamente', 'success');
        if (settingsModal) settingsModal.classList.remove('open');
      });
    }

    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => {
        window.appStorage.exportDataJson();
      });
    }

    if (btnTriggerImport && importFileInput) {
      btnTriggerImport.addEventListener('click', () => {
        importFileInput.click();
      });

      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const success = window.appStorage.importDataJson(evt.target.result);
          if (success) {
            showToast('Postulaciones importadas correctamente', 'success');
            if (settingsModal) settingsModal.classList.remove('open');
          } else {
            showToast('Formato JSON no válido', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    if (btnResetSeed) {
      btnResetSeed.addEventListener('click', () => {
        if (confirm('¿Restablecer el tablero a las vacantes de ejemplo?')) {
          window.appStorage.resetToSeedData();
          showToast('Tablero restablecido', 'info');
          if (settingsModal) settingsModal.classList.remove('open');
        }
      });
    }

    // User Profile Modal & Smart Dropzone
    const profileModal = document.getElementById('profileModal');
    const btnOpenProfileModal = document.getElementById('btnOpenProfileModal');
    const btnCloseProfileModal = document.getElementById('btnCloseProfileModal');
    const btnUploadProfileFile = document.getElementById('btnUploadProfileFile');
    const profileFileInput = document.getElementById('profileFileInput');
    const btnTogglePasteProfile = document.getElementById('btnTogglePasteProfile');
    const pasteProfileArea = document.getElementById('pasteProfileArea');
    const profilePasteTextarea = document.getElementById('profilePasteTextarea');
    const btnProcessPastedProfile = document.getElementById('btnProcessPastedProfile');
    const profileExtractLoading = document.getElementById('profileExtractLoading');
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    const btnResetToAriannaProfile = document.getElementById('btnResetToAriannaProfile');
    const btnAddEmptyExp = document.getElementById('btnAddEmptyExp');

    // Form inputs
    const profNombre = document.getElementById('profNombre');
    const profTitular = document.getElementById('profTitular');
    const profEmail = document.getElementById('profEmail');
    const profTelefono = document.getElementById('profTelefono');
    const profUbicacion = document.getElementById('profUbicacion');
    const profLinkedin = document.getElementById('profLinkedin');
    const profGithub = document.getElementById('profGithub');
    const profResumen = document.getElementById('profResumen');
    const profHabilidades = document.getElementById('profHabilidades');
    const profSkillsChips = document.getElementById('profSkillsChips');
    const profExpList = document.getElementById('profExpList');
    const profExpCount = document.getElementById('profExpCount');

    let currentFormExperiences = [];

    function populateProfileForm(profile) {
      if (!profile) return;
      if (profNombre) profNombre.value = profile.nombre || '';
      if (profTitular) profTitular.value = profile.titular || '';
      if (profEmail) profEmail.value = profile.email || '';
      if (profTelefono) profTelefono.value = profile.telefono || '';
      if (profUbicacion) profUbicacion.value = profile.ubicacion || '';
      if (profLinkedin) profLinkedin.value = profile.enlaces?.linkedin || '';
      if (profGithub) profGithub.value = profile.enlaces?.github || '';
      if (profResumen) profResumen.value = profile.resumen || '';
      if (profHabilidades) profHabilidades.value = (profile.habilidades || []).join(', ');

      renderFormSkillsChips(profile.habilidades || []);

      currentFormExperiences = Array.isArray(profile.experiencias)
        ? JSON.parse(JSON.stringify(profile.experiencias))
        : [];
      renderFormExperiences();
    }

    window.populateProfileForm = populateProfileForm;

    function renderFormSkillsChips(skills) {
      if (!profSkillsChips) return;
      profSkillsChips.innerHTML = skills.map(skill => `
        <span class="job-tag" style="background:rgba(77,23,214,0.08); color:var(--primary); font-weight:700;">
          ${escapeHtml(skill)}
        </span>
      `).join('');
    }

    if (profHabilidades) {
      profHabilidades.addEventListener('input', () => {
        const raw = profHabilidades.value.split(',').map(s => s.trim()).filter(Boolean);
        renderFormSkillsChips(raw);
      });
    }

    // Elementos del Editor Inline de Experiencia
    const profExpEditorCard = document.getElementById('profExpEditorCard');
    const profExpEditorTitle = document.getElementById('profExpEditorTitle');
    const expEditingIndex = document.getElementById('expEditingIndex');
    const expInputCompany = document.getElementById('expInputCompany');
    const expInputRole = document.getElementById('expInputRole');
    const expInputPeriod = document.getElementById('expInputPeriod');
    const expInputLocation = document.getElementById('expInputLocation');
    const expInputBullets = document.getElementById('expInputBullets');
    const btnCancelExpEditor = document.getElementById('btnCancelExpEditor');
    const btnSaveInlineExp = document.getElementById('btnSaveInlineExp');

    function renderFormExperiences() {
      if (!profExpList) return;
      if (profExpCount) profExpCount.textContent = currentFormExperiences.length;

      if (currentFormExperiences.length === 0) {
        profExpList.innerHTML = `
          <div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:1rem; border:1px dashed var(--border-slate); border-radius:6px;">
            No hay experiencias añadidas aún. Sube un archivo PDF/Markdown o añade una manualmente.
          </div>
        `;
        return;
      }

      profExpList.innerHTML = currentFormExperiences.map((exp, idx) => `
        <div style="background:var(--surface-container-low); border:1px solid var(--border-slate); border-radius:6px; padding:0.65rem; font-size:0.8125rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.35rem;">
            <div>
              <strong style="color:var(--text-dark-primary);">${escapeHtml(exp.empresa || exp.company || 'Empresa')}</strong> &ndash; 
              <span style="font-weight:600; color:var(--primary);">${escapeHtml(exp.puesto || exp.role || 'Puesto')}</span>
            </div>
            <div style="display:flex; gap:0.3rem;">
              <button type="button" class="btn btn-outline btn-edit-form-exp" data-idx="${idx}" style="padding:0.15rem 0.45rem; font-size:0.7rem;" title="Editar experiencia">
                Editar
              </button>
              <button type="button" class="btn btn-outline btn-remove-form-exp" data-idx="${idx}" style="padding:0.15rem 0.45rem; font-size:0.7rem; color:var(--error);" title="Eliminar experiencia">
                &times;
              </button>
            </div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.35rem;">
            ${escapeHtml(exp.periodo || exp.period || '')} &bull; ${escapeHtml(exp.ubicacion || exp.location || 'Remoto')}
          </div>
          <ul style="padding-left:1.1rem; margin:0; font-size:0.75rem; color:var(--text-dark-secondary);">
            ${(exp.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
          </ul>
        </div>
      `).join('');

      // Listener para eliminar experiencia
      profExpList.querySelectorAll('.btn-remove-form-exp').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx, 10);
          currentFormExperiences.splice(idx, 1);
          renderFormExperiences();
        });
      });

      // Listener para editar experiencia
      profExpList.querySelectorAll('.btn-edit-form-exp').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx, 10);
          const exp = currentFormExperiences[idx];
          if (!exp) return;

          if (expEditingIndex) expEditingIndex.value = idx;
          if (profExpEditorTitle) profExpEditorTitle.textContent = `Editar Experiencia en ${exp.empresa || 'Empresa'}`;
          if (expInputCompany) expInputCompany.value = exp.empresa || '';
          if (expInputRole) expInputRole.value = exp.puesto || '';
          if (expInputPeriod) expInputPeriod.value = exp.periodo || '';
          if (expInputLocation) expInputLocation.value = exp.ubicacion || '';
          if (expInputBullets) expInputBullets.value = Array.isArray(exp.bullets) ? exp.bullets.join('\n') : '';

          if (profExpEditorCard) {
            profExpEditorCard.style.display = 'block';
            profExpEditorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      });
    }

    // Botón "+ Añadir Experiencia": abre editor inline limpio
    if (btnAddEmptyExp) {
      btnAddEmptyExp.addEventListener('click', () => {
        if (expEditingIndex) expEditingIndex.value = '-1';
        if (profExpEditorTitle) profExpEditorTitle.textContent = 'Añadir Nueva Experiencia';
        if (expInputCompany) expInputCompany.value = '';
        if (expInputRole) expInputRole.value = '';
        if (expInputPeriod) expInputPeriod.value = '2024 - Presente';
        if (expInputLocation) expInputLocation.value = 'Remoto';
        if (expInputBullets) expInputBullets.value = '';

        if (profExpEditorCard) {
          profExpEditorCard.style.display = 'block';
          if (expInputCompany) expInputCompany.focus();
        }
      });
    }

    // Cancelar edición inline
    if (btnCancelExpEditor && profExpEditorCard) {
      btnCancelExpEditor.addEventListener('click', () => {
        profExpEditorCard.style.display = 'none';
      });
    }

    // Guardar experiencia inline
    if (btnSaveInlineExp) {
      btnSaveInlineExp.addEventListener('click', () => {
        const company = expInputCompany ? expInputCompany.value.trim() : '';
        const role = expInputRole ? expInputRole.value.trim() : '';
        const period = expInputPeriod ? expInputPeriod.value.trim() : '2024 - Presente';
        const location = expInputLocation ? expInputLocation.value.trim() : 'Remoto';
        const rawBullets = expInputBullets ? expInputBullets.value.split('\n').map(b => b.replace(/^[-•*]\s*/, '').trim()).filter(Boolean) : [];

        if (!company || !role) {
          showToast('Ingresa al menos la Empresa y el Puesto', 'info');
          return;
        }

        const editIdx = expEditingIndex ? parseInt(expEditingIndex.value, 10) : -1;
        const newExpObj = {
          id: editIdx >= 0 && currentFormExperiences[editIdx]?.id ? currentFormExperiences[editIdx].id : 'exp-' + Date.now(),
          empresa: company,
          puesto: role,
          periodo: period,
          ubicacion: location,
          bullets: rawBullets.length > 0 ? rawBullets : ['Desarrollo e implementación técnica.']
        };

        if (editIdx >= 0 && editIdx < currentFormExperiences.length) {
          currentFormExperiences[editIdx] = newExpObj;
          showToast('Experiencia actualizada en tu perfil', 'success');
        } else {
          currentFormExperiences.unshift(newExpObj);
          showToast('Nueva experiencia añadida al perfil', 'success');
        }

        if (profExpEditorCard) profExpEditorCard.style.display = 'none';
        renderFormExperiences();
      });
    }

    if (btnOpenProfileModal && profileModal) {
      btnOpenProfileModal.addEventListener('click', () => {
        const profile = window.appStorage.getProfile();
        populateProfileForm(profile);
        profileModal.classList.add('open');
      });
    }

    if (btnCloseProfileModal && profileModal) {
      btnCloseProfileModal.addEventListener('click', () => {
        profileModal.classList.remove('open');
      });
      profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) profileModal.classList.remove('open');
      });
    }

    if (btnTogglePasteProfile && pasteProfileArea) {
      btnTogglePasteProfile.addEventListener('click', () => {
        pasteProfileArea.style.display = pasteProfileArea.style.display === 'none' ? 'block' : 'none';
      });
    }

    async function processProfileText(text, filename) {
      if (!text || !text.trim()) {
        showToast('El archivo o texto está vacío o no contiene caracteres legibles', 'error');
        return;
      }

      if (profileExtractLoading) {
        profileExtractLoading.style.display = 'flex';
        const txtLabel = document.getElementById('profileLoadingText');
        if (txtLabel) txtLabel.textContent = `Analizando documento (${filename})...`;
      }

      try {
        const extracted = await window.aiParser.parseProfileFromText(text, filename);
        if (extracted) {
          const isMergeMode = document.getElementById('radioImportMerge')?.checked ?? true;

          if (isMergeMode && currentFormExperiences.length > 0) {
            // FUSIONAR: conservar historial anterior y sumar nuevas experiencias no repetidas
            const existingKeys = new Set(
              currentFormExperiences.map(e => `${(e.empresa || '').toLowerCase().trim()}|${(e.puesto || '').toLowerCase().trim()}`)
            );
            const newExps = (extracted.experiencias || []).filter(e => {
              const k = `${(e.empresa || '').toLowerCase().trim()}|${(e.puesto || '').toLowerCase().trim()}`;
              return !existingKeys.has(k);
            });

            currentFormExperiences = [...newExps, ...currentFormExperiences];

            // Fusionar habilidades sin duplicados
            const existingSkills = new Set(
              profHabilidades ? profHabilidades.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : []
            );
            (extracted.habilidades || []).forEach(skill => {
              existingSkills.add(skill.toLowerCase());
            });
            const mergedSkills = Array.from(existingSkills).map(s => s.charAt(0).toUpperCase() + s.slice(1));

            // Actualizar campos principales solo si están vacíos o por defecto
            if (profNombre && (!profNombre.value || profNombre.value === 'Usuario')) profNombre.value = extracted.nombre || profNombre.value;
            if (profTitular && (!profTitular.value || profTitular.value === 'Desarrollador de Software')) profTitular.value = extracted.titular || profTitular.value;
            if (profEmail && !profEmail.value) profEmail.value = extracted.email || '';
            if (profTelefono && !profTelefono.value) profTelefono.value = extracted.telefono || '';
            if (profUbicacion && !profUbicacion.value) profUbicacion.value = extracted.ubicacion || '';
            if (profLinkedin && !profLinkedin.value) profLinkedin.value = extracted.enlaces?.linkedin || '';
            if (profGithub && !profGithub.value) profGithub.value = extracted.enlaces?.github || '';
            if (profResumen && (!profResumen.value || profResumen.value.length < 30)) profResumen.value = extracted.resumen || profResumen.value;
            if (profHabilidades) profHabilidades.value = mergedSkills.join(', ');

            renderFormSkillsChips(mergedSkills);
            renderFormExperiences();

            const mergedProfile = {
              nombre: profNombre ? profNombre.value : extracted.nombre,
              titular: profTitular ? profTitular.value : extracted.titular,
              email: profEmail ? profEmail.value : '',
              telefono: profTelefono ? profTelefono.value : '',
              ubicacion: profUbicacion ? profUbicacion.value : '',
              enlaces: {
                linkedin: profLinkedin ? profLinkedin.value : '',
                github: profGithub ? profGithub.value : ''
              },
              resumen: profResumen ? profResumen.value : '',
              habilidades: mergedSkills,
              experiencias: currentFormExperiences,
              onboarding_completed: true
            };
            window.appStorage.saveProfile(mergedProfile, true);
            showToast(`¡CV procesado! Se combinaron ${newExps.length} nuevas experiencias con tu historial previo.`, 'success');
          } else {
            // REEMPLAZAR TODO
            extracted.onboarding_completed = true;
            populateProfileForm(extracted);
            window.appStorage.saveProfile(extracted, true);
            showToast(`¡Perfil de "${extracted.nombre}" extraído y guardado correctamente!`, 'success');
          }

          if (pasteProfileArea) pasteProfileArea.style.display = 'none';
        }
      } catch (err) {
        console.error('Error procesando texto de perfil:', err);
        showToast('Error procesando perfil: ' + err.message, 'error');
      } finally {
        if (profileExtractLoading) profileExtractLoading.style.display = 'none';
      }
    }

    if (btnProcessPastedProfile && profilePasteTextarea) {
      btnProcessPastedProfile.addEventListener('click', () => {
        processProfileText(profilePasteTextarea.value, 'PegadoManual.txt');
      });
    }

    async function handleIncomingProfileFile(file) {
      if (!file) return;

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        if (profileExtractLoading) {
          profileExtractLoading.style.display = 'flex';
          const txtLabel = document.getElementById('profileLoadingText');
          if (txtLabel) txtLabel.textContent = `Extrayendo texto del PDF (${file.name})...`;
        }
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfText = await window.aiParser.extractTextFromPdf(arrayBuffer);
          await processProfileText(pdfText, file.name);
        } catch (pdfErr) {
          console.error('Error leyendo PDF:', pdfErr);
          showToast('Error al leer el archivo PDF: ' + pdfErr.message, 'error');
          if (profileExtractLoading) profileExtractLoading.style.display = 'none';
        }
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          processProfileText(evt.target.result, file.name);
        };
        reader.readAsText(file);
      }
    }

    if (btnUploadProfileFile && profileFileInput) {
      btnUploadProfileFile.addEventListener('click', () => {
        profileFileInput.click();
      });

      profileFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleIncomingProfileFile(file);
        profileFileInput.value = '';
      });
    }

    // Soporte Drag & Drop sobre la tarjeta de importación
    const profileDropzoneCard = document.getElementById('profileDropzoneCard');
    if (profileDropzoneCard) {
      ['dragenter', 'dragover'].forEach(eventName => {
        profileDropzoneCard.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          profileDropzoneCard.style.borderColor = 'var(--hot-pink-vibrant)';
          profileDropzoneCard.style.background = 'rgba(77, 23, 214, 0.08)';
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        profileDropzoneCard.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          profileDropzoneCard.style.borderColor = 'var(--primary)';
          profileDropzoneCard.style.background = 'rgba(77, 23, 214, 0.03)';
        });
      });

      profileDropzoneCard.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt?.files?.[0];
        if (file) {
          handleIncomingProfileFile(file);
        }
      });
    }

    if (btnResetToAriannaProfile) {
      btnResetToAriannaProfile.addEventListener('click', () => {
        if (confirm('¿Cargar el perfil maestro predeterminado de Arianna Clemente?')) {
          populateProfileForm(ARIANNA_MASTER_PROFILE);
          showToast('Perfil de Arianna Clemente cargado en el formulario', 'info');
        }
      });
    }

    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', () => {
        const rawSkills = profHabilidades ? profHabilidades.value.split(',').map(s => s.trim()).filter(Boolean) : [];

        const updatedProfile = {
          nombre: profNombre ? profNombre.value.trim() : 'Usuario',
          titular: profTitular ? profTitular.value.trim() : 'Desarrollador Tech',
          email: profEmail ? profEmail.value.trim() : '',
          telefono: profTelefono ? profTelefono.value.trim() : '',
          ubicacion: profUbicacion ? profUbicacion.value.trim() : '',
          enlaces: {
            linkedin: profLinkedin ? profLinkedin.value.trim() : '',
            github: profGithub ? profGithub.value.trim() : '',
            portafolio: '',
            web: ''
          },
          resumen: profResumen ? profResumen.value.trim() : '',
          habilidades: rawSkills,
          experiencias: currentFormExperiences,
          onboarding_completed: true
        };

        window.appStorage.saveProfile(updatedProfile, true);
        showToast('¡Perfil guardado y sincronizado exitosamente!', 'success');
        updateHeaderProfileUI();
        updateCvPreview();
        if (window.jobRadar) window.jobRadar.render();
        if (profileModal) profileModal.classList.remove('open');
      });
    }

    // Subscribe to profile changes
    window.appStorage.subscribeProfile(() => {
      updateHeaderProfileUI();
    });

    updateHeaderProfileUI();
  }

  // Initial load
  renderKanban();
  renderTable();
  switchView('kanban');
  initCvPhoto();
  initCvTemplate();
  initUserProfileAndSettings();

  window.openProfileModal = function () {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
      const profile = (window.appStorage && typeof window.appStorage.getProfile === 'function')
        ? window.appStorage.getProfile()
        : null;
      profileModal.classList.add('open');
    }
  };
});
