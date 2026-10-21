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
  const cvTogglePhoto = document.getElementById('cvTogglePhoto');
  const btnUploadPhoto = document.getElementById('btnUploadPhoto');
  const cvPhotoInput = document.getElementById('cvPhotoInput');
  const cvPhotoContainer = document.getElementById('cvPhotoContainer');
  const cvPhotoImg = document.getElementById('cvPhotoImg');
  const btnPrintCv = document.getElementById('btnPrintCv');
  const btnToggleEditCv = document.getElementById('btnToggleEditCv');
  const editCvBtnText = document.getElementById('editCvBtnText');
  const btnResetCvContent = document.getElementById('btnResetCvContent');
  const cvHeaderRole = document.getElementById('cvHeaderRole');
  const cvSummaryText = document.getElementById('cvSummaryText');
  const cvExperienceBullets = document.getElementById('cvExperienceBullets');
  const cvSkillsList = document.getElementById('cvSkillsList');

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
          <span style="color:var(--primary); font-weight:700;">Ver &rarr;</span>
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
          <td style="color:var(--text-muted); font-size:0.8125rem;">${v.fecha || '-'}</td>
          <td>
            <button class="btn btn-outline" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="window.openVacancyModal('${v.id}')">
              Detalle
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

      <div style="background:var(--surface-container-low); padding:0.75rem 1rem; border-radius:var(--radius-lg); display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.8125rem; font-weight:600; color:var(--text-dark-secondary);">¿Generar CV adaptado para esta vacante?</span>
        <button class="btn btn-purple" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="window.generateCvForVacancy('${vacancy.id}')">
          Adaptar CV &rarr;
        </button>
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
    inputApiKey.value = current.geminiApiKey || '';
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
    window.appStorage.saveSettings({ geminiApiKey: key });
    settingsModal.classList.remove('open');
    showToast('Configuración guardada en tu navegador', 'success');
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

  // --- Photo Management ---
  function initCvPhoto() {
    const savedPhoto = localStorage.getItem('aryc_cv_photo');
    const photoEnabled = localStorage.getItem('aryc_cv_photo_enabled') === 'true';

    if (savedPhoto && cvPhotoImg) {
      cvPhotoImg.src = savedPhoto;
    }

    if (cvTogglePhoto) {
      cvTogglePhoto.checked = photoEnabled && !!savedPhoto;
      applyPhotoVisibility(cvTogglePhoto.checked);
    }
  }

  function applyPhotoVisibility(show) {
    if (!cvPaper || !cvPhotoContainer) return;
    const hasPhoto = cvPhotoImg && cvPhotoImg.src && !cvPhotoImg.src.endsWith('/#') && cvPhotoImg.src !== window.location.href;

    if (show && hasPhoto) {
      cvPaper.classList.remove('no-photo');
      cvPhotoContainer.style.display = 'block';
    } else {
      cvPaper.classList.add('no-photo');
      cvPhotoContainer.style.display = 'none';
    }
    localStorage.setItem('aryc_cv_photo_enabled', show ? 'true' : 'false');
  }

  if (cvTogglePhoto) {
    cvTogglePhoto.addEventListener('change', () => {
      const hasPhoto = cvPhotoImg && cvPhotoImg.src && !cvPhotoImg.src.endsWith('/#') && cvPhotoImg.src !== window.location.href;
      if (cvTogglePhoto.checked && !hasPhoto) {
        cvPhotoInput.click();
      } else {
        applyPhotoVisibility(cvTogglePhoto.checked);
      }
    });
  }

  if (btnUploadPhoto) {
    btnUploadPhoto.addEventListener('click', () => {
      cvPhotoInput.click();
    });
  }

  if (cvPhotoInput) {
    cvPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const b64 = evt.target.result;
          cvPhotoImg.src = b64;
          localStorage.setItem('aryc_cv_photo', b64);
          cvTogglePhoto.checked = true;
          applyPhotoVisibility(true);
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
    const reqs = (vacancy.requisitos && vacancy.requisitos.length > 0)
      ? vacancy.requisitos
      : ['JavaScript', 'PHP', 'Laravel', 'React', 'SQL', 'Git'];

    return {
      role: `${puesto} | Arianna Clemente`,
      summary: `Especialista en Desarrollo de Soluciones Web y TI con amplia trayectoria optimizando plataformas escalables, sistemas transaccionales e integración de Inteligencia Artificial. Perfil altamente compatible con los estándares y requerimientos técnicos de ${empresa}, destacando en entrega continua, calidad de código, resolución de incidentes y diseño de arquitecturas eficientes orientadas a resultados.`,
      experiences: MASTER_CV.experiences.map(exp => ({
        company: exp.company,
        role: exp.role,
        period: exp.period,
        location: exp.location,
        bullets: [...exp.bullets]
      })),
      skills: {
        relevant: `${reqs.join(', ')}`,
        core: 'JavaScript (ES6+), React, PHP, Laravel, Python, PostgreSQL (RLS), MySQL, REST APIs, Git/GitHub, Netlify, Supabase Cloud.',
        methodologies: 'Scrum, Kanban, Metodologías Ágiles, Optimización ATS, SEO Técnico, Seguridad TI, Continuidad Operativa.'
      }
    };
  }

  function applyTailoredCvData(data, vacancy) {
    cvHeaderRole.textContent = data.role || `${vacancy.puesto || 'Full Stack Developer'} | Arianna Clemente`;
    cvSummaryText.textContent = data.summary || MASTER_CV.summary;

    const expContainer = document.getElementById('cvExperienceContainer');
    if (expContainer) {
      const experiences = (Array.isArray(data.experiences) && data.experiences.length > 0)
        ? data.experiences
        : MASTER_CV.experiences;

      expContainer.innerHTML = experiences.map(job => `
        <div class="cv-job">
          <div class="cv-job-header">
            <span class="cv-job-role">${escapeHtml(job.role)}</span>
            <span class="cv-job-period">${escapeHtml(job.period)}</span>
          </div>
          <div class="cv-job-sub">
            <span class="cv-job-company"><strong>${escapeHtml(job.company)}</strong></span>
            <span class="cv-job-location">${escapeHtml(job.location || 'Remoto')}</span>
          </div>
          <ul class="cv-bullets">
            ${(job.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
          </ul>
        </div>
      `).join('');

      if (isCvEditMode) {
        expContainer.querySelectorAll('.cv-job-role, .cv-job-period, .cv-job-company, .cv-job-location, .cv-bullets li').forEach(el => {
          el.setAttribute('contenteditable', 'true');
        });
      }
    }

    if (data.skills && typeof data.skills === 'object') {
      cvSkillsList.innerHTML = `
        <strong>Tecnologías Clave para ${escapeHtml(vacancy.empresa || 'el puesto')}:</strong> ${escapeHtml(data.skills.relevant || '')}<br>
        <strong>Stack &amp; Arquitectura:</strong> ${escapeHtml(data.skills.core || '')}<br>
        <strong>Metodologías &amp; Prácticas:</strong> ${escapeHtml(data.skills.methodologies || '')}
      `;
    }
  }

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

        let res = await fetch('/api/tailor-cv', {
          method: 'POST',
          headers,
          body: JSON.stringify({ vacancy })
        }).catch(() => null);

        if (!res || !res.ok) {
          res = await fetch('/.netlify/functions/tailor-cv', {
            method: 'POST',
            headers,
            body: JSON.stringify({ vacancy })
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
        showToast(`¡CV adaptado exitosamente con IA para ${vacancy.empresa}!`, 'success');
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
      expContainer.querySelectorAll('.cv-job-role, .cv-job-period, .cv-job-company, .cv-job-location, .cv-bullets li').forEach(el => {
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

      let res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers,
        body: JSON.stringify({ vacancy })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/.netlify/functions/generate-cover-letter', {
          method: 'POST',
          headers,
          body: JSON.stringify({ vacancy })
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

      let res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers,
        body: JSON.stringify({ vacancy })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/.netlify/functions/generate-cover-letter', {
          method: 'POST',
          headers,
          body: JSON.stringify({ vacancy })
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

      let res = await fetch('/api/interview-coach', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate_faqs', vacancy })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/.netlify/functions/interview-coach', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'generate_faqs', vacancy })
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

      let res = await fetch('/api/interview-coach', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'chat',
          vacancy: currentCoachVacancy,
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

    formMagicLink.style.display = 'none';
    formPassword.style.display = 'block';
  });

  // Magic Link Submit
  formMagicLink.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputMagicEmail.value.trim();
    if (!email) return;

    try {
      btnSendMagicLink.disabled = true;
      btnSendMagicLink.innerHTML = '<span>Enviando enlace...</span>';
      await window.appSupabase.signInWithOtp(email);
      showToast('¡Enlace de acceso enviado! Revisa tu bandeja de correo.', 'success');
      inputMagicEmail.value = '';
    } catch (err) {
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
      showToast('Por favor completa tu correo y contraseña', 'error');
      return;
    }

    try {
      btnSignInPassword.disabled = true;
      btnSignInPassword.textContent = 'Iniciando...';
      await window.appSupabase.signIn(email, password);
      showToast('¡Sesión iniciada con éxito! Sincronizando datos...', 'success');
      updateAuthUI();
    } catch (err) {
      showToast(err.message || 'Error al iniciar sesión', 'error');
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
      showToast('Por favor completa correo y contraseña para registrarte', 'error');
      return;
    }

    try {
      btnSignUpPassword.disabled = true;
      btnSignUpPassword.textContent = 'Creando cuenta...';
      await window.appSupabase.signUp(email, password);
      showToast('¡Cuenta creada! Revisa tu correo de confirmación o inicia sesión.', 'success');
      updateAuthUI();
    } catch (err) {
      showToast(err.message || 'Error al crear cuenta', 'error');
    } finally {
      btnSignUpPassword.disabled = false;
      btnSignUpPassword.textContent = 'Crear Cuenta';
    }
  });

  // Sign Out
  btnSignOut.addEventListener('click', async () => {
    if (window.appSupabase) {
      await window.appSupabase.signOut();
      showToast('Sesión cerrada. Ahora estás en modo local.', 'info');
      updateAuthUI();
    }
  });

  // Migrate Seed Vacancies to Cloud
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

  // Manual Sync
  btnManualSync.addEventListener('click', async () => {
    showToast('Sincronizando con Supabase...', 'info');
    await window.appStorage.syncWithSupabase();
    showToast('Sincronización completada', 'success');
  });

  // Listeners for Supabase Auth and Sync Status
  window.appStorage.onSyncStatusChange((status) => {
    updateCloudStatusUI(status);
  });

  if (window.appSupabase) {
    window.appSupabase.onAuthStateChange(() => {
      updateAuthUI();
    });
  }

  // Initial Auth & Cloud state check
  setTimeout(() => {
    updateAuthUI();
  }, 300);

  // =========================================================================
  // Reactive Storage Subscription
  // =========================================================================
  window.appStorage.subscribe(() => {
    renderKanban();
    renderTable();
    populateCvSelector();
  });

  // Initial load
  renderKanban();
  renderTable();
  initCvPhoto();
  initCvTemplate();
});
