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

  // CV elements
  const cvPaper = document.getElementById('cvPaper');
  const cvVacancySelect = document.getElementById('cvVacancySelect');
  const btnPrintCv = document.getElementById('btnPrintCv');
  const btnToggleEditCv = document.getElementById('btnToggleEditCv');
  const editCvBtnText = document.getElementById('editCvBtnText');
  const btnResetCvContent = document.getElementById('btnResetCvContent');
  const cvHeaderRole = document.getElementById('cvHeaderRole');
  const cvSummaryText = document.getElementById('cvSummaryText');
  const cvExperienceBullets = document.getElementById('cvExperienceBullets');
  const cvSkillsList = document.getElementById('cvSkillsList');

  // =========================================================================
  // Toast Notification System
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

    aiExtractionSourceBadge.textContent = job.aiGenerated 
      ? 'Extracción multimodal exitosa vía Google Gemini API' 
      : 'Extracción inteligente local (Heurística)';

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
  // CV Generator (Tailored Content & Inline Edit)
  // =========================================================================
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
      cvHeaderRole.textContent = 'Full Stack Developer & TI Specialist';
      cvSummaryText.textContent = 'Especialista en Desarrollo de Soluciones Tecnológicas, aplicaciones web escalables y optimización de plataformas de gestión. Amplia experiencia en desarrollo Frontend y Backend, integración de APIs de Inteligencia Artificial, y diseño de flujos operativos para plataformas educativas y bancarias.';
      cvExperienceBullets.innerHTML = `
        <li>Diseño e implementación de arquitecturas web modernas con optimización de rendimiento y SEO técnico.</li>
        <li>Desarrollo de integraciones automatizadas con modelos de IA para ingesta de datos y aceleración de flujos.</li>
        <li>Gestión de plataformas de misión crítica (LMS Moodle, OJS, ecosistemas PHP/JavaScript).</li>
        <li>Liderazgo en resolución de incidentes técnicos y despliegue ágil con Git y CI/CD.</li>
      `;
      cvSkillsList.innerHTML = `
        <strong>Frontend & Web:</strong> JavaScript (ES6+), HTML5 Semántico, CSS3 Moderno, Responsive Design, React, WordPress.<br>
        <strong>Backend & Datos:</strong> PHP, Python, REST APIs, JSON, SQL, Optimización de Rendimiento.<br>
        <strong>Especialidades:</strong> Integración IA (Gemini API), SEO Técnico, Git/GitHub, Netlify, ModernCV / ATS Optimization.
      `;
    } else {
      const vacancies = window.appStorage.getVacancies();
      const vacancy = vacancies.find(v => v.id === selectedId);
      if (vacancy) {
        cvHeaderRole.textContent = `${vacancy.puesto} | Arianna Clemente`;
        
        // Auto-tailored summary
        cvSummaryText.textContent = `Especialista en ${vacancy.puesto} con enfoque orientado a resultados para ${vacancy.empresa}. Sólida trayectoria optimizando procesos tecnológicos, desarrollo de plataformas de alta disponibilidad y soluciones adaptadas a los estándares de ${vacancy.empresa}. Dominio comprobado en trabajo en equipo ágil y entrega continua.`;

        // Highlight company requirements in bullets
        const reqsText = (vacancy.requisitos && vacancy.requisitos.length > 0)
          ? vacancy.requisitos.slice(0, 3).join(', ')
          : 'desarrollo full stack y metodologías ágiles';

        cvExperienceBullets.innerHTML = `
          <li>Adaptación y entrega de soluciones para <strong>${escapeHtml(vacancy.empresa)}</strong> aplicando ${escapeHtml(reqsText)}.</li>
          <li>Desarrollo de integraciones eficientes, APIs y modernización de interfaces web de alto rendimiento.</li>
          <li>Estrategias de despliegue continuo, buenas prácticas de desarrollo ágil y aseguramiento de calidad.</li>
          <li>Optimización de flujos de trabajo con automatizaciones y resolución proactiva de incidentes.</li>
        `;

        // Tailored skills
        const topSkills = (vacancy.requisitos || []).join(', ');
        cvSkillsList.innerHTML = `
          <strong>Tecnologías Relevantes para ${escapeHtml(vacancy.empresa)}:</strong> ${topSkills ? topSkills + ', ' : ''}JavaScript, PHP, React, REST APIs, SQL.<br>
          <strong>Habilidades Clave:</strong> Desarrollo Web Ágil, Integración de IA, Optimización SEO, Git, Trabajo Remoto Internacional.<br>
          <strong>Metodologías:</strong> SCRUM, Testing, Documentación Técnica, Enfoque en Escalabilidad.
        `;
      }
    }
  }

  // Toggle inline editing on the CV paper
  btnToggleEditCv.addEventListener('click', () => {
    isCvEditMode = !isCvEditMode;
    cvPaper.classList.toggle('editing-mode', isCvEditMode);

    const editableElements = [cvHeaderRole, cvSummaryText, cvExperienceBullets, cvSkillsList];
    editableElements.forEach(el => {
      el.setAttribute('contenteditable', isCvEditMode ? 'true' : 'false');
    });

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
    // If edit mode was on, turn it off for a pristine print
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
});
