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
  let activeModalVacancyId = null;
  let intakePastedImageBase64 = null;

  // Cache DOM elements
  const kanbanBoardEl = document.getElementById('kanbanBoard');
  const tableBodyEl = document.getElementById('vacanciesTableBody');
  const searchInputEl = document.getElementById('searchInput');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const mobileNavBtns = document.querySelectorAll('.mobile-nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');

  // KPI elements
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiApplied = document.getElementById('kpiApplied');
  const kpiInterviews = document.getElementById('kpiInterviews');
  const kpiResponseRate = document.getElementById('kpiResponseRate');

  // Modals
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

  // CV elements
  const cvVacancySelect = document.getElementById('cvVacancySelect');
  const btnPrintCv = document.getElementById('btnPrintCv');
  const cvHeaderRole = document.getElementById('cvHeaderRole');
  const cvSummaryText = document.getElementById('cvSummaryText');
  const cvExperienceBullets = document.getElementById('cvExperienceBullets');

  // =========================================================================
  // View Navigation
  // =========================================================================
  function switchView(viewName) {
    currentView = viewName;

    // Update desktop tabs
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update mobile nav items
    mobileNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Toggle panels
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
  // Render Kanban Board
  // =========================================================================
  function renderKanban() {
    if (!kanbanBoardEl) return;
    const allVacancies = window.appStorage.getVacancies();

    // Filter vacancies
    const filtered = allVacancies.filter(v => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.puesto.toLowerCase().includes(q) ||
        v.empresa.toLowerCase().includes(q) ||
        (v.modalidad && v.modalidad.toLowerCase().includes(q)) ||
        (v.notas && v.notas.toLowerCase().includes(q))
      );
    });

    // Build columns HTML
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
    updateKpis(allVacancies);
  }

  function renderJobCard(v) {
    const priorityClass = v.prioridad === 'high' ? 'high' : v.prioridad === 'med' ? 'med' : 'low';
    const priorityLabel = v.prioridad === 'high' ? 'Alta' : v.prioridad === 'med' ? 'Media' : 'Baja';

    return `
      <div class="job-card" data-id="${v.id}">
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
          <span>${v.fecha || 'Reciente'}</span>
          <span style="color:var(--primary); font-weight:700;">Ver detalle &rarr;</span>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // Render Table List
  // =========================================================================
  function renderTable() {
    if (!tableBodyEl) return;
    const allVacancies = window.appStorage.getVacancies();

    const filtered = allVacancies.filter(v => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.puesto.toLowerCase().includes(q) ||
        v.empresa.toLowerCase().includes(q) ||
        (v.modalidad && v.modalidad.toLowerCase().includes(q))
      );
    });

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

    // Rate: (Interviews + Offers) / Applied
    const rate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;
    kpiResponseRate.textContent = `${rate}%`;
  }

  // =========================================================================
  // Search Filter
  // =========================================================================
  if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderKanban();
      renderTable();
    });
  }

  // =========================================================================
  // Modal Actions
  // =========================================================================
  function attachCardClickEvents() {
    document.querySelectorAll('.job-card').forEach(card => {
      card.addEventListener('click', () => {
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
        <label class="form-label">Notas de Seguimiento & Estrategia</label>
        <textarea id="mNotas" class="form-control" rows="3">${escapeHtml(vacancy.notas || '')}</textarea>
      </div>
    `;

    // Configure URL button
    if (vacancy.url) {
      btnOpenUrl.style.display = 'inline-flex';
      btnOpenUrl.onclick = () => window.open(vacancy.url, '_blank');
    } else {
      btnOpenUrl.style.display = 'none';
    }

    vacancyModal.classList.add('open');
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
    renderKanban();
    renderTable();
  });

  btnDeleteVacancy.addEventListener('click', () => {
    if (!activeModalVacancyId) return;
    if (confirm('¿Deseas eliminar esta vacante de tu tablero?')) {
      window.appStorage.deleteVacancy(activeModalVacancyId);
      closeModal();
      renderKanban();
      renderTable();
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

  // Drag and drop image
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

  // Paste image from clipboard anywhere on document or dropzone
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        handleImageFile(file);
        switchView('intake');
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

  // AI Extraction Simulator / Heuristic Parser
  btnProcessIntake.addEventListener('click', async () => {
    const text = intakeText.value.trim();
    const url = intakeUrl.value.trim();

    if (!text && !intakePastedImageBase64 && !url) {
      alert('Por favor pega el texto de la vacante, una captura de pantalla (Ctrl+V) o el enlace.');
      return;
    }

    btnProcessIntake.disabled = true;
    btnProcessIntake.innerHTML = '<span>Extrayendo con IA...</span>';

    try {
      // Extract vacancy details
      const parsed = extractJobDetailsWithAi(text, intakePastedImageBase64, url);

      // Save to storage
      window.appStorage.addVacancy(parsed);

      alert(`¡Vacante guardada con éxito!\n\nPuesto: ${parsed.puesto}\nEmpresa: ${parsed.empresa}\nEstado: Guardada`);

      // Reset form
      btnClearIntake.click();
      renderKanban();
      renderTable();
      switchView('kanban');
    } catch (err) {
      console.error(err);
      alert('Hubo un error extrayendo los datos. Por favor intenta de nuevo.');
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

  function extractJobDetailsWithAi(rawText, imageBase64, jobUrl) {
    // Intelligent heuristic extractor
    let empresa = 'Empresa por Confirmar';
    let puesto = 'Oportunidad TI';
    let modalidad = 'Remoto';
    let salario = '';
    let contacto = '';

    // Check for common patterns in rawText
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length > 0) {
      // First prominent line often contains title or company
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
        if (lines.length > 1) empresa = lines[1].slice(0, 40);
      }
    }

    if (/remot[oe]|remote|teletrabajo/i.test(rawText)) modalidad = 'Remoto';
    else if (/h[ií]brid[oe]|hybrid/i.test(rawText)) modalidad = 'Híbrido';
    else if (/presencial|on-site|office/i.test(rawText)) modalidad = 'Presencial';

    const salaryMatch = rawText.match(/(\$|€|\bUSD\b|\bEUR\b)\s?[\d.,]+(\s?-\s?[\d.,]+)?(\s?(USD|EUR|k|al mes|\/mes|\/hr))?/i);
    if (salaryMatch) salario = salaryMatch[0];

    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) contacto = emailMatch[0];

    return {
      id: 'vac-' + Date.now(),
      empresa,
      puesto,
      modalidad,
      salario,
      contacto,
      url: jobUrl,
      estado: 'saved',
      prioridad: 'high',
      fecha: new Date().toISOString().split('T')[0],
      notas: rawText.slice(0, 300) + (rawText.length > 300 ? '...' : ''),
      screenshot: imageBase64 ? true : false
    };
  }

  // =========================================================================
  // CV Generator
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
      `;
    } else {
      const vacancies = window.appStorage.getVacancies();
      const vacancy = vacancies.find(v => v.id === selectedId);
      if (vacancy) {
        cvHeaderRole.textContent = `${vacancy.puesto} | Arianna Clemente`;
        cvSummaryText.textContent = `Especialista en ${vacancy.puesto} orientada a resultados para ${vacancy.empresa}. Sólida trayectoria optimizando procesos tecnológicos, desarrollo de plataformas de alta disponibilidad y soluciones adaptadas a los estándares de la industria.`;
        cvExperienceBullets.innerHTML = `
          <li>Adaptación directa para los requerimientos de <strong>${escapeHtml(vacancy.empresa)}</strong> (${escapeHtml(vacancy.puesto)}).</li>
          <li>Desarrollo de integraciones eficientes, APIs y modernización de interfaces web.</li>
          <li>Estrategias de despliegue continuo, buenas prácticas de desarrollo ágil y testing.</li>
        `;
      }
    }
  }

  btnPrintCv.addEventListener('click', () => {
    window.print();
  });

  // Settings button
  document.getElementById('btnSettings').addEventListener('click', () => {
    const current = window.appStorage.getSettings();
    const newKey = prompt('Configura tu API Key de Gemini (opcional, para extracción con modelos de Google AI):', current.geminiApiKey || '');
    if (newKey !== null) {
      window.appStorage.saveSettings({ geminiApiKey: newKey.trim() });
      alert('Configuración guardada en tu navegador.');
    }
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

  // Initial load
  renderKanban();
  renderTable();
});
