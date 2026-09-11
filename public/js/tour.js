/**
 * Aviator Interactive Auto-Tour Controller
 * Automatically guides new players through the 5 essential game rules in a smooth, video-like sequence.
 * Each step lasts 1.5 - 2.0 seconds with dynamic spotlighting, animated hand pointer, and pulse rings.
 */

class AviatorAutoTour {
  constructor() {
    this.overlay = document.getElementById('tourOverlay');
    this.tooltip = document.getElementById('tourTooltip');
    this.spotlight = document.getElementById('tourSpotlight');

    this.stepIconEl = document.getElementById('tourStepIcon');
    this.stepBadgeEl = document.getElementById('tourStepBadge');
    this.titleEl = document.getElementById('tourTitle');
    this.descEl = document.getElementById('tourDesc');
    this.dotsContainer = document.getElementById('tourDots');
    this.actionBtn = document.getElementById('tourActionBtn');
    this.closeBtn = document.getElementById('closeTourBtn');
    this.progressBar = document.getElementById('tourProgressBar');

    this.currentStepIndex = 0;
    this.autoPlayTimer = null;
    this.stepDuration = 1800; // 1.8 seconds per step (1 - 2s requirement)
    this.isActive = false;

    this.steps = [
      {
        stepNum: 1,
        title: "Set your stake",
        desc: "Tap − or + to choose how much rides on the round.",
        targetSelector: "#stepperRow",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
        placement: "top",
        pointerPosition: "top"
      },
      {
        stepNum: 2,
        title: "Launch the round",
        desc: "Hit 'Take Off' to place your stake and launch the flight.",
        targetSelector: "#mainBetBtn",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.13 2.18c-3.13.91-5.74 3.19-7.07 6.17-.67 1.5-.96 3.11-.96 4.75 0 .7.08 1.39.23 2.05L2 18.5V22h3.5l3.35-3.33c.66.15 1.35.23 2.05.23 1.64 0 3.25-.29 4.75-.96 2.98-1.33 5.26-3.94 6.17-7.07.13-.43.18-.88.18-1.34 0-.48-.06-.95-.19-1.41l-8.68-6.14zM9.5 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
        placement: "top",
        pointerPosition: "top"
      },
      {
        stepNum: 3,
        title: "Watch it climb",
        desc: "The multiplier starts at 1.00x and speeds up as it rises.",
        targetSelector: "#multiplierDisplay",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>`,
        placement: "bottom",
        pointerPosition: "bottom"
      },
      {
        stepNum: 4,
        title: "Cash out in time",
        desc: "Tap the same button mid-flight. Too late and the bet is gone.",
        targetSelector: "#mainBetBtn",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>`,
        placement: "top",
        pointerPosition: "top"
      },
      {
        stepNum: 5,
        title: "Practice, not prediction",
        desc: "Both flights and the activity feed are simulated. Credits have no cash value.",
        targetSelector: ".legal-summary",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>`,
        placement: "left",
        pointerPosition: "left"
      }
    ];

    this.initEvents();
  }

  initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.endTour());
    }

    if (this.actionBtn) {
      this.actionBtn.addEventListener('click', () => {
        if (this.currentStepIndex < this.steps.length - 1) {
          this.goToStep(this.currentStepIndex + 1);
        } else {
          this.endTour();
        }
      });
    }

    // Light dismiss on clicking background
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.endTour();
        }
      });
    }

    // Keyboard ESC to cancel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.endTour();
      }
    });

    // Window resize reposition
    window.addEventListener('resize', () => {
      if (this.isActive) {
        this.positionElements(this.steps[this.currentStepIndex]);
      }
    });
  }

  startTour(options = { autoPlay: true, stepDuration: 1800 }) {
    this.isActive = true;
    this.stepDuration = options.stepDuration || 1800;
    this.currentStepIndex = 0;

    if (this.overlay) {
      this.overlay.classList.add('active');
    }

    this.goToStep(0);
  }

  goToStep(index) {
    if (!this.isActive) return;
    if (index >= this.steps.length) {
      this.endTour();
      return;
    }

    this.currentStepIndex = index;
    const step = this.steps[index];

    // Clear previous timer
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
    }

    // Play subtle UI tick sound
    if (window.aviatorAudio) {
      window.aviatorAudio.playClick();
    }

    // 1. Update Content
    if (this.stepIconEl) this.stepIconEl.innerHTML = step.icon;
    if (this.stepBadgeEl) this.stepBadgeEl.textContent = (window.CMS?.text('tour.step', {step:step.stepNum,total:this.steps.length}) ?? `STEP ${step.stepNum} / ${this.steps.length}`);
    if (this.titleEl) this.titleEl.textContent = window.CMS?.get(`tour.${index}.title`) ?? step.title;
    if (this.descEl) this.descEl.textContent = window.CMS?.get(`tour.${index}.body`) ?? step.desc;

    // 2. Update Dots
    if (this.dotsContainer) {
      this.dotsContainer.innerHTML = '';
      this.steps.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = `tour-dot ${i === index ? 'active' : ''}`;
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.goToStep(i);
        });
        this.dotsContainer.appendChild(dot);
      });
    }

    // 3. Update Action Button Text
    if (this.actionBtn) {
      if (index === this.steps.length - 1) {
        this.actionBtn.textContent = window.CMS?.get('tour.done') ?? 'Done →';
        this.actionBtn.classList.add('done-btn');
      } else {
        this.actionBtn.textContent = window.CMS?.get('tour.next') ?? 'Next →';
        this.actionBtn.classList.remove('done-btn');
      }
    }

    // 4. Trigger Progress Bar Animation
    if (this.progressBar) {
      this.progressBar.style.transition = 'none';
      this.progressBar.style.width = '0%';
      requestAnimationFrame(() => {
        this.progressBar.style.transition = `width ${this.stepDuration}ms linear`;
        this.progressBar.style.width = '100%';
      });
    }

    // 5. Position Spotlight & Tooltip Card
    this.positionElements(step);

    // 6. Schedule Next Step Auto-Transition
    this.autoPlayTimer = setTimeout(() => {
      if (this.isActive) {
        this.goToStep(this.currentStepIndex + 1);
      }
    }, this.stepDuration);
  }

  positionElements(step) {
    const target = document.querySelector(step.targetSelector);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const padding = 8;

    // 1. Position Spotlight Box
    if (this.spotlight) {
      this.spotlight.style.top = `${rect.top - padding}px`;
      this.spotlight.style.left = `${rect.left - padding}px`;
      this.spotlight.style.width = `${rect.width + padding * 2}px`;
      this.spotlight.style.height = `${rect.height + padding * 2}px`;
      this.spotlight.classList.add('visible');
    }

    // 2. Position Tooltip Card
    if (this.tooltip) {
      const cardWidth = Math.min(320, window.innerWidth - 32);
      let cardX, cardY;

      if (step.stepNum === 1 || step.stepNum === 2 || step.stepNum === 4) {
        // Position above bottom bet controls
        cardX = window.innerWidth / 2 - cardWidth / 2;
        cardY = rect.top - 180;
        if (cardY < 60) cardY = rect.bottom + 20;
      } else if (step.stepNum === 3) {
        // Position below center multiplier
        cardX = window.innerWidth / 2 - cardWidth / 2;
        cardY = rect.bottom + 40;
      } else if (step.stepNum === 5) {
        // Position below or left of live winners panel
        if (window.innerWidth > 768) {
          cardX = rect.left - 20;
          cardY = rect.bottom + 16;
        } else {
          cardX = window.innerWidth / 2 - cardWidth / 2;
          cardY = window.innerHeight * 0.3;
        }
      }

      // Constrain within viewport
      cardX = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, cardX));
      cardY = Math.max(70, Math.min(window.innerHeight - 200, cardY));

      this.tooltip.style.top = `${cardY}px`;
      this.tooltip.style.left = `${cardX}px`;
      this.tooltip.style.width = `${cardWidth}px`;
      this.tooltip.classList.add('visible');
    }
  }

  endTour() {
    this.isActive = false;
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }

    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
    if (this.spotlight) {
      this.spotlight.classList.remove('visible');
    }

    // Mark tour as seen in localStorage so fresh reloads won't harass, but allow manual replay
    localStorage.setItem('aviator_tour_completed', 'true');
  }
}

window.AviatorAutoTour = AviatorAutoTour;
