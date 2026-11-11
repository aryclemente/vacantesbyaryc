/**
 * onboarding-tour.js - Controlador del Tutorial Interactivo de 7 Pasos
 * Guía al nuevo usuario después de autenticarse a través de todo el flujo de Vacantes by AryC.
 */

class OnboardingTourController {
  constructor() {
    this.totalSteps = 7;
    this.currentStep = 1;
    this.isActive = false;
    this.highlightedEls = [];
    this.cardEl = null;
    this.initialized = false;

    this.steps = [
      {
        step: 1,
        badge: 'Paso 1 de 7 • Tu Base',
        title: '1. Rellena tu Perfil Profesional',
        description: 'Sube tu CV en PDF, Markdown o TXT (o completa tus datos manualmente). Esta información alimenta el cálculo de compatibilidad ATS y la generación de CVs.',
        hint: 'Haz clic en "Guardar Perfil" al terminar para avanzar automáticamente al siguiente paso.',
        primaryBtnText: 'Abrir Mi Perfil',
        highlights: ['#btnOpenProfileModal'],
        onEnter: (ctx) => {
          // Si aún no está abierto el modal de perfil, abrirlo para facilitar el paso 1
          const profileModal = document.getElementById('profileModal');
          if (profileModal && !profileModal.classList.contains('open')) {
            if (typeof window.openProfileModal === 'function') {
              window.openProfileModal();
            }
          }
        },
        onPrimaryAction: () => {
          if (typeof window.openProfileModal === 'function') {
            window.openProfileModal();
          }
        }
      },
      {
        step: 2,
        badge: 'Paso 2 de 7 • Ingesta Inteligente',
        title: '2. Smart Intake o Nueva Vacante',
        description: '¿Encontraste una oferta interesante? Pega el texto, URL o captura de pantalla aquí en Smart Intake (o usa "+ Nueva Vacante") para que la IA extraiga empresa, puesto, salario y requisitos.',
        hint: 'Puedes probar pegando una vacante o continuar para descubrir el Radar de Empleos.',
        primaryBtnText: 'Ir a Smart Intake',
        highlights: ['#btnOpenIntake', '[data-view="intake"]', '#intakeDropzone'],
        onEnter: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('intake');
        },
        onPrimaryAction: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('intake');
          const txt = document.getElementById('intakeText');
          if (txt) txt.focus();
        }
      },
      {
        step: 3,
        badge: 'Paso 3 de 7 • Descubrimiento',
        title: '3. Explora el Radar de Empleos',
        description: 'Busca ofertas reales en Remoto, España y LATAM. Cada tarjeta calcula automáticamente tu Score de Compatibilidad ATS (%) frente a tu perfil.',
        hint: 'Haz clic en "+ Guardar en Kanban" sobre tu empleo ideal para avanzar al tablero principal.',
        primaryBtnText: 'Buscar en Radar',
        highlights: ['[data-view="jobsearch"]', '#btnRadarSearch'],
        onEnter: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('jobsearch');
        },
        onPrimaryAction: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('jobsearch');
          const btn = document.getElementById('btnRadarSearch');
          if (btn) btn.click();
        }
      },
      {
        step: 4,
        badge: 'Paso 4 de 7 • Gestión y Estrategia',
        title: '4. Tablero Kanban, Vista Lista y Asesor IA',
        description: 'Organiza tus postulaciones arrastrando tarjetas en el Tablero Kanban o revisándolas en Vista Lista. Además, el botón "Asesor IA ATS" analiza tu embudo y redacta mensajes para reclutadores.',
        hint: 'Alterna entre Kanban y Vista Lista o abre el Asesor IA en la esquina inferior derecha.',
        primaryBtnText: 'Abrir Asesor IA',
        highlights: ['[data-view="kanban"]', '[data-view="list"]', '#btnAtsCopilotToolbar', '#btnFloatingCopilot'],
        onEnter: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('kanban');
        },
        onPrimaryAction: () => {
          const copilotBtn = document.getElementById('btnAtsCopilotToolbar') || document.getElementById('btnFloatingCopilot');
          if (copilotBtn) copilotBtn.click();
        }
      },
      {
        step: 5,
        badge: 'Paso 5 de 7 • CV a la Medida',
        title: '5. Entra en la Vacante y Adapta tu CV',
        description: 'Haz clic en cualquier vacante del tablero para abrir su ficha, o entra aquí al Generador CV, selecciona tu vacante, adapta el contenido con IA y descarga tu PDF optimizado para ATS.',
        hint: 'Pulsa "Descargar PDF" cuando tu currículum esté listo para pasar a los correos y cartas.',
        primaryBtnText: 'Ir a Generador CV',
        highlights: ['[data-view="cv"]', '#cvVacancySelect', '#btnTailorCvAi', '#btnPrintCv'],
        onEnter: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('cv');
        },
        onPrimaryAction: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('cv');
          const tailorBtn = document.getElementById('btnTailorCvAi');
          if (tailorBtn) tailorBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      {
        step: 6,
        badge: 'Paso 6 de 7 • Contacto Efectivo',
        title: '6. Correos y Cartas de Presentación',
        description: 'Ya con tu CV descargado, genera una Carta de Presentación personalizada y un Email de Postulación listo para copiar y enviar a los reclutadores.',
        hint: 'Prueba abrir cualquiera de los dos generadores debajo de la barra del CV.',
        primaryBtnText: 'Generar Email de Postulación',
        highlights: ['#btnOpenCoverLetterModal', '#btnOpenEmailModal'],
        onEnter: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('cv');
        },
        onPrimaryAction: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('cv');
          const emailBtn = document.getElementById('btnOpenEmailModal');
          if (emailBtn) emailBtn.click();
        }
      },
      {
        step: 7,
        badge: 'Paso 7 de 7 • Cierre Exitoso',
        title: '7. Sesión de Entrevistas con IA',
        description: 'Prepárate para destacar antes de la llamada: genera preguntas frecuentes técnicas y de RRHH según la vacante y practica en el simulador de entrevista interactivo.',
        hint: '¡Último paso! Puedes abrir el simulador ahora o finalizar el tutorial.',
        primaryBtnText: 'Abrir Simulador de Entrevista',
        highlights: ['#btnOpenInterviewModal', '#btnDetailInterviewCoach'],
        onEnter: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('cv');
        },
        onPrimaryAction: (ctx) => {
          if (typeof ctx.switchView === 'function') ctx.switchView('cv');
          const intBtn = document.getElementById('btnOpenInterviewModal');
          if (intBtn) intBtn.click();
        }
      }
    ];
  }

  init(callbacks = {}) {
    if (this.initialized) return;
    this.callbacks = callbacks;
    this.cardEl = document.getElementById('onboardingTourCard');
    this.bindEvents();
    this.initialized = true;
  }

  getStorageKey() {
    const user = window.appSupabase ? window.appSupabase.getUser() : null;
    return user ? `aryc_tour_state_${user.id}` : 'aryc_tour_state_guest';
  }

  getState() {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      return raw ? JSON.parse(raw) : { step: 1, completed: false, dismissed: false };
    } catch {
      return { step: 1, completed: false, dismissed: false };
    }
  }

  saveState(partial) {
    const current = this.getState();
    const next = { ...current, ...partial };
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(next));
    } catch (e) {}
    return next;
  }

  bindEvents() {
    const btnPrev = document.getElementById('btnTourPrev');
    const btnNext = document.getElementById('btnTourNext');
    const btnPrimary = document.getElementById('btnTourPrimaryAction');
    const btnSkip = document.getElementById('btnTourSkip');
    const btnClose = document.getElementById('btnTourClose');
    const btnRestart = document.getElementById('btnRestartTour');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.currentStep > 1) {
          this.goToStep(this.currentStep - 1);
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (this.currentStep < this.totalSteps) {
          this.goToStep(this.currentStep + 1);
        } else {
          this.completeTour();
        }
      });
    }

    if (btnPrimary) {
      btnPrimary.addEventListener('click', () => {
        const def = this.steps.find(s => s.step === this.currentStep);
        if (def && typeof def.onPrimaryAction === 'function') {
          def.onPrimaryAction(this.callbacks);
        }
      });
    }

    const dismissHandler = () => this.dismissTour();
    if (btnSkip) btnSkip.addEventListener('click', dismissHandler);
    if (btnClose) btnClose.addEventListener('click', dismissHandler);

    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.startTour(1, true);
      });
    }

    // Disparadores automáticos por hitos reales del usuario
    window.addEventListener('aryc:profile-saved', () => {
      if (!this.isActive) return;
      if (this.currentStep === 1) {
        this.goToStep(2);
      }
    });

    window.addEventListener('aryc:vacancy-added', () => {
      if (!this.isActive) return;
      if (this.currentStep === 2) {
        if (typeof this.callbacks?.showToast === 'function') {
          this.callbacks.showToast('¡Primera vacante guardada! Ahora conoce el Radar de Empleos.', 'success');
        }
        this.goToStep(3);
      } else if (this.currentStep === 3) {
        if (typeof this.callbacks?.showToast === 'function') {
          this.callbacks.showToast('¡Excelente! Vacante añadida. Veamos tu Tablero Kanban y Asesor IA.', 'success');
        }
        this.goToStep(4);
      }
    });

    window.addEventListener('aryc:cv-downloaded', () => {
      if (!this.isActive) return;
      if (this.currentStep === 5) {
        this.goToStep(6);
      }
    });
  }

  startIfNeeded() {
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) {
      this.hideTour();
      return;
    }

    const user = window.appSupabase.getUser();
    const profile = window.appStorage ? window.appStorage.getProfile() : null;
    const state = this.getState();

    // Si el usuario ya completó o pausó el tutorial, no interrumpir automáticamente
    if (state.completed || state.dismissed) {
      return;
    }

    // Para la cuenta maestra histórica de Arianna ya completada, solo mostrar si lo pide con "? Guía"
    const isArianna = user?.email && (user.email.toLowerCase().includes('ary') || user.email.toLowerCase().includes('arianna'));
    if (isArianna && profile?.onboarding_completed) {
      return;
    }

    // Determinar paso inicial según progreso real
    let initialStep = state.step || 1;
    const hasProfileData = profile && profile.onboarding_completed && Array.isArray(profile.habilidades) && profile.habilidades.length > 0;
    const vacancies = window.appStorage ? window.appStorage.getVacancies() : [];

    if (!hasProfileData) {
      initialStep = 1;
    } else if (initialStep === 1 && hasProfileData) {
      initialStep = vacancies.length > 0 ? 4 : 2;
    }

    this.startTour(initialStep, false);
  }

  startTour(step = 1, forceReset = false) {
    if (!window.appSupabase || !window.appSupabase.isAuthenticated()) return;
    if (forceReset) {
      this.saveState({ completed: false, dismissed: false, step });
    }
    this.isActive = true;
    this.goToStep(step);
  }

  goToStep(stepNumber) {
    const clamped = Math.max(1, Math.min(this.totalSteps, stepNumber));
    this.currentStep = clamped;
    this.isActive = true;
    this.saveState({ step: clamped, dismissed: false });

    const def = this.steps.find(s => s.step === clamped);
    if (!def) return;

    this.clearHighlights();
    if (typeof def.onEnter === 'function') {
      try {
        def.onEnter(this.callbacks);
      } catch (e) {
        console.warn('Error en onEnter del tutorial:', e);
      }
    }

    this.renderStep(def);

    // Aplicar resaltado tras un breve tick por si acaba de cambiar de vista
    setTimeout(() => {
      if (this.isActive && this.currentStep === clamped) {
        this.applyHighlights(def.highlights || []);
      }
    }, 120);
  }

  renderStep(def) {
    if (!this.cardEl) return;

    const badgeEl = document.getElementById('tourStepBadge');
    const titleEl = document.getElementById('tourStepTitle');
    const descEl = document.getElementById('tourStepDesc');
    const hintEl = document.getElementById('tourStepHint');
    const progressEl = document.getElementById('tourProgressBar');
    const btnPrev = document.getElementById('btnTourPrev');
    const btnNext = document.getElementById('btnTourNext');
    const btnPrimary = document.getElementById('btnTourPrimaryAction');

    if (badgeEl) badgeEl.textContent = def.badge;
    if (titleEl) titleEl.textContent = def.title;
    if (descEl) descEl.textContent = def.description;
    if (hintEl) hintEl.textContent = def.hint || '';
    if (progressEl) {
      progressEl.style.width = `${Math.round((def.step / this.totalSteps) * 100)}%`;
    }

    if (btnPrev) {
      btnPrev.style.display = def.step > 1 ? 'inline-flex' : 'none';
    }
    if (btnNext) {
      btnNext.textContent = def.step === this.totalSteps ? 'Finalizar ✓' : 'Siguiente →';
    }
    if (btnPrimary) {
      if (def.primaryBtnText) {
        btnPrimary.style.display = 'inline-flex';
        btnPrimary.textContent = def.primaryBtnText;
      } else {
        btnPrimary.style.display = 'none';
      }
    }

    this.cardEl.style.display = 'block';
    this.cardEl.classList.add('open');
  }

  applyHighlights(selectors) {
    this.clearHighlights();
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.classList.add('tour-highlight');
        this.highlightedEls.push(el);
      }
    });
  }

  clearHighlights() {
    this.highlightedEls.forEach(el => {
      el.classList.remove('tour-highlight');
    });
    this.highlightedEls = [];
  }

  hideTour() {
    this.isActive = false;
    this.clearHighlights();
    if (this.cardEl) {
      this.cardEl.classList.remove('open');
      this.cardEl.style.display = 'none';
    }
  }

  dismissTour() {
    this.saveState({ dismissed: true });
    this.hideTour();
    if (typeof this.callbacks?.showToast === 'function') {
      this.callbacks.showToast('Tutorial pausado. Puedes reabrirlo desde el botón "? Guía" en la cabecera.', 'info');
    }
  }

  completeTour() {
    this.saveState({ completed: true, dismissed: false, step: this.totalSteps });
    this.hideTour();
    if (typeof this.callbacks?.showToast === 'function') {
      this.callbacks.showToast('🎉 ¡Tutorial completado! Ya dominas todas las herramientas de Vacantes by AryC.', 'success');
    }
  }
}

window.onboardingTour = new OnboardingTourController();
