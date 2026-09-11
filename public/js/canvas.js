/**
 * Aviator 60FPS High-DPI Flight Canvas Engine
 * Renders cosmic sunburst rays, quadratic red trajectory curve, transparent red fill polygon,
 * rotating Aviator propeller plane sprite, exhaust particles, and dynamic visual states.
 */

class AviatorCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.planeImg = new Image();
    this.planeImg.src = window.CMS?.get('media.plane') || 'assets/raccoon-pilot-cartoon.png';
    document.addEventListener('cms:change', () => { this.planeImg.src = window.CMS.get('media.plane'); });
    this.planeLoaded = false;
    this.planeImg.onload = () => {
      this.planeLoaded = true;
    };
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.propellerPhase = 0;

    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;

    // Flight state
    this.state = 'IDLE'; // IDLE | FLYING | FLEW_AWAY | WON
    this.progress = 0; // 0 to 1
    this.multiplier = 1.00;
    this.targetMultiplier = 1.00;
    this.flyAwayX = 0;
    this.flyAwayY = 0;
    this.flyAwayAlpha = 1;

    // Particles
    this.stars = [];
    this.exhaustParticles = [];
    this.winParticles = [];
    this.smokeParticles = [];

    // Ray configuration (Sunburst radiating from origin)
    this.rayAngle = 0;
    this.numRays = 36;

    // Dimensions setup
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Init cosmic starfield
    this.initStars();

    // Start animation loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.initStars();
  }

  initStars() {
    this.stars = [];
    const count = Math.floor((this.width * this.height) / 8000);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
        twinkle: Math.random() * Math.PI
      });
    }
  }

  setState(state, data = {}) {
    this.state = state;
    document.querySelector('.app-container').dataset.flightState = state;
    if (state === 'IDLE') {
      this.progress = 0;
      this.multiplier = 1.00;
      this.exhaustParticles = [];
      this.smokeParticles = [];
    } else if (state === 'FLYING') {
      this.progress = 0;
      this.multiplier = 1.00;
      this.targetMultiplier = data.targetMultiplier || 2.0;
    } else if (state === 'FLEW_AWAY') {
      // Set initial fly-off trajectory
      const { px, py } = this.getPlanePosition(this.progress);
      this.flyAwayX = px;
      this.flyAwayY = py;
      this.flyAwayAlpha = 1;

      // Burst smoke / break particles at point of crash
      for (let i = 0; i < 35; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 6 + 2;
        this.smokeParticles.push({
          x: px,
          y: py,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          radius: Math.random() * 6 + 3,
          alpha: 1,
          color: Math.random() > 0.5 ? '#e50539' : '#ff7997'
        });
      }
    } else if (state === 'WON') {
      // Spawn win celebratory coins & stars
      this.spawnWinParticles();
    }
  }

  spawnWinParticles() {
    this.winParticles = [];
    for (let i = 0; i < 70; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 10 + 4;
      this.winParticles.push({
        x: this.width * 0.5 + (Math.random() * 100 - 50),
        y: this.height * 0.45 + (Math.random() * 80 - 40),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 3,
        gravity: 0.25,
        size: Math.random() * 8 + 4,
        color: ['#ffc700', '#ffd700', '#e50539', '#ff3366', '#ffffff'][Math.floor(Math.random() * 5)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
        life: 1
      });
    }
  }

  getSpriteSize() {
    const ratio = this.planeImg.naturalHeight / this.planeImg.naturalWidth || 2 / 3;
    const width = Math.min(240, Math.max(140, this.width * 0.29), this.height * 0.66 / ratio, this.width * 0.48) * 0.85;
    return { width, height: width * ratio };
  }

  // Calculate curve point at parameter t in [0, 1]
  // Bottom left origin (0, height) to target point (width * 0.82, height * 0.18)
  getCurvePoint(t) {
    const sprite = this.getSpriteSize();
    const startX = sprite.width * 0.5 + 12;
    const startY = this.height - sprite.height * 0.52 - 12;

    // Flight target anchor in top-right quadrant
    const endX = this.width - sprite.width * 0.61 - 12;
    const endY = Math.max(sprite.height * 0.65 + 8, this.height * 0.24);

    // Quadratic / Power trajectory curve
    // x(t) = startX + (endX - startX) * t
    // y(t) = startY - (startY - endY) * Math.pow(t, 1.45)
    const x = startX + (endX - startX) * t;
    const y = startY - (startY - endY) * Math.pow(t, 1.48);

    return { x, y };
  }

  getPlanePosition(t) {
    if (this.state === 'IDLE') {
      const point = this.getCurvePoint(0);
      const bob = this.reducedMotion.matches ? 0 : Math.sin(performance.now() * 0.002) * 3;
      return { px: point.x, py: point.y + bob, angle: -0.025 };
    }

    const clampedT = Math.max(0, Math.min(1, t));
    const pt = this.getCurvePoint(clampedT);

    // Calculate tangent slope for angle of attack
    const dt = 0.01;
    const ptBefore = this.getCurvePoint(Math.max(0, clampedT - dt));
    const ptNext = this.getCurvePoint(Math.min(1, clampedT + dt));
    const angle = Math.max(-0.35, Math.atan2(ptNext.y - ptBefore.y, ptNext.x - ptBefore.x));

    // Micro-wobble to simulate realistic aerodynamic flight
    const wobble = this.reducedMotion.matches ? 0 : Math.sin(performance.now() * 0.006) * 0.018;

    return {
      px: pt.x,
      py: pt.y,
      angle: angle + wobble
    };
  }

  // Main rendering frame
  animate(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Background (Deep radial cosmic gradient + Sunburst rays + Stars)
    this.drawBackground(timestamp);

    // 2. Draw Trajectory Curve & Red Area Fill (when flying or won)
    if (this.state === 'FLYING' || this.state === 'WON') {
      this.drawTrajectory(this.progress);
    }

    // 3. Draw Particles
    this.updateAndDrawParticles(dt);

    // 4. Draw Plane Sprite
    this.drawPlane(timestamp, dt);

    requestAnimationFrame(this.animate);
  }

  drawBackground(timestamp) {
    const w = this.width;
    const h = this.height;

    // Dark cosmic base gradient
    const bgGrad = this.ctx.createRadialGradient(
      w * 0.45, h * 0.35, 20,
      w * 0.5, h * 0.5, Math.max(w, h) * 0.9
    );
    bgGrad.addColorStop(0, window.CMS?.get('color.surface') || '#ffffff');
    bgGrad.addColorStop(0.5, window.CMS?.get('color.game') || '#f4f6fd');
    bgGrad.addColorStop(1, window.CMS?.get('color.game') || '#e5ebfb');

    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    // Sunburst fan rays radiating from bottom-left corner (0, h)
    this.ctx.save();
    const originX = 0;
    const originY = h;
    const maxRadius = Math.sqrt(w * w + h * h) * 1.3;
    const totalRays = 32;
    const rayWidth = (Math.PI * 0.55) / totalRays;

    for (let i = 0; i < totalRays; i++) {
      if (i % 2 === 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(originX, originY);
        const a1 = i * rayWidth - 0.05;
        const a2 = (i + 1) * rayWidth - 0.05;
        this.ctx.lineTo(originX + Math.cos(a1) * maxRadius, originY - Math.sin(a1) * maxRadius);
        this.ctx.lineTo(originX + Math.cos(a2) * maxRadius, originY - Math.sin(a2) * maxRadius);
        this.ctx.closePath();

        // Alternating translucent dark violet stripe
        this.ctx.fillStyle = 'rgba(34, 94, 248, 0.025)';
        this.ctx.fill();
      }
    }
    this.ctx.restore();

    // Twinkling stars
    for (const star of this.stars) {
      star.twinkle += star.speed;
      const alpha = star.alpha * (0.6 + 0.4 * Math.sin(star.twinkle));
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawTrajectory(t) {
    if (t <= 0) return;
    const w = this.width;
    const h = this.height;
    const steps = Math.max(15, Math.floor(t * 70));

    // 1. Draw Red Gradient Fill under curve
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);

    let lastPt = { x: 0, y: h };
    for (let i = 0; i <= steps; i++) {
      const stepT = (i / steps) * t;
      const pt = this.getCurvePoint(stepT);
      this.ctx.lineTo(pt.x, pt.y);
      lastPt = pt;
    }

    // Close polygon vertically down to baseline
    this.ctx.lineTo(lastPt.x, h);
    this.ctx.closePath();

    const fillGrad = this.ctx.createLinearGradient(0, lastPt.y, 0, h);
    fillGrad.addColorStop(0, (window.CMS?.color('flight',0.52) || 'rgba(229, 5, 57, 0.52)'));
    fillGrad.addColorStop(0.35, (window.CMS?.color('flight',0.28) || 'rgba(229, 5, 57, 0.28)'));
    fillGrad.addColorStop(1, (window.CMS?.color('flight',0.01) || 'rgba(229, 5, 57, 0.01)'));

    this.ctx.fillStyle = fillGrad;
    this.ctx.fill();

    // 2. Draw Glowing Trajectory Neon Red Stroke
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    for (let i = 0; i <= steps; i++) {
      const stepT = (i / steps) * t;
      const pt = this.getCurvePoint(stepT);
      this.ctx.lineTo(pt.x, pt.y);
    }

    this.ctx.strokeStyle = window.CMS?.get('color.flight') || '#e50539';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowColor = window.CMS?.get('color.flight') || '#ff2b5e';
    this.ctx.shadowBlur = 14;
    this.ctx.stroke();

    // 3. Trajectory lead drop-line (vertical guide to bottom)
    this.ctx.beginPath();
    this.ctx.moveTo(lastPt.x, lastPt.y);
    this.ctx.lineTo(lastPt.x, h);
    this.ctx.strokeStyle = 'rgba(229, 5, 57, 0.35)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.restore();
  }

  drawPlane(timestamp, dt) {
    if (!this.planeLoaded) return;

    let px, py, angle;

    if (this.state === 'FLEW_AWAY') {
      // Plane rockets off-screen towards top right
      this.flyAwayX += (this.width * 0.9) * dt * 2.2;
      this.flyAwayY -= (this.height * 0.6) * dt * 2.2;
      this.flyAwayAlpha = Math.max(0, this.flyAwayAlpha - dt * 2.5);

      if (this.flyAwayAlpha <= 0) return;

      px = this.flyAwayX;
      py = this.flyAwayY;
      angle = -0.45; // Upward rocket climb
    } else {
      const pos = this.getPlanePosition(this.progress);
      px = pos.px;
      py = pos.py;
      angle = pos.angle;
    }

    // Spawn exhaust particles while flying
    if (this.state === 'FLYING' && this.progress > 0.05) {
      const tailX = px - Math.cos(angle) * 45;
      const tailY = py - Math.sin(angle) * 45;
      for (let i = 0; i < 2; i++) {
        this.exhaustParticles.push({
          x: tailX + (Math.random() * 6 - 3),
          y: tailY + (Math.random() * 6 - 3),
          vx: -Math.cos(angle) * (Math.random() * 4 + 2) + (Math.random() * 2 - 1),
          vy: -Math.sin(angle) * (Math.random() * 4 + 2) + (Math.random() * 2 - 1),
          radius: Math.random() * 4 + 2,
          alpha: 0.9,
          color: Math.random() > 0.4 ? '#ff5722' : '#ffc107'
        });
      }
    }

    // Draw Plane Image
    this.ctx.save();
    this.ctx.translate(px, py);
    this.ctx.rotate(angle);

    if (this.state === 'FLEW_AWAY') {
      this.ctx.globalAlpha = this.flyAwayAlpha;
    }

    // Plane sprite size
    const { width: pWidth, height: pHeight } = this.getSpriteSize();

    // Separate cartoon blades rotate behind the sprite's fixed yellow nose hub.
    const running = this.state === 'FLYING' || this.state === 'FLEW_AWAY' || this.state === 'WON';
    if (!this.reducedMotion.matches) {
      this.propellerPhase = (this.propellerPhase + dt * (running ? 28 : 5)) % (Math.PI * 2);
    }
    this.drawPropeller(pWidth, pHeight, running);

    // Red plane shadow glow
    this.ctx.shadowColor = 'rgba(22, 43, 79, 0.16)';
    this.ctx.shadowBlur = 8;

    this.ctx.drawImage(this.planeImg, -pWidth * 0.5, -pHeight * 0.5, pWidth, pHeight);

    this.ctx.restore();
  }

  drawPropeller(width, height, running) {
    const ctx = this.ctx;
    const radius = height * 0.34;
    ctx.save();
    ctx.translate(width * 0.407, height * 0.062);
    if (running && !this.reducedMotion.matches) {
      ctx.fillStyle = 'rgba(34, 94, 248, 0.10)';
      ctx.strokeStyle = 'rgba(34, 94, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.23, radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // Project a rotating two-blade propeller into the plane's side-on perspective.
    ctx.scale(0.24, 1);
    ctx.rotate(this.reducedMotion.matches ? 0.15 : this.propellerPhase);
    for (let blade = 0; blade < 2; blade++) {
      ctx.save();
      ctx.rotate(blade * Math.PI);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.12, 0);
      ctx.bezierCurveTo(-radius * 0.26, -radius * 0.4, -radius * 0.32, -radius * 0.95, -radius * 0.08, -radius);
      ctx.bezierCurveTo(radius * 0.18, -radius * 1.03, radius * 0.26, -radius * 0.56, radius * 0.12, 0);
      ctx.closePath();
      ctx.fillStyle = '#225ef8';
      ctx.strokeStyle = '#10243c';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#ffc740';
      ctx.fillRect(-radius * 0.4, -radius * 1.05, radius * 0.8, radius * 0.28);
      ctx.restore();
      ctx.restore();
    }
    ctx.restore();
  }

  updateAndDrawParticles(dt) {
    // 1. Exhaust particles
    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      const p = this.exhaustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= dt * 2.2;
      p.radius = Math.max(0.5, p.radius - dt * 2);

      if (p.alpha <= 0 || p.radius <= 0.5) {
        this.exhaustParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 2. Smoke / Break particles (loss)
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.alpha -= dt * 1.5;

      if (p.alpha <= 0) {
        this.smokeParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 3. Win celebratory confetti & coins
    for (let i = this.winParticles.length - 1; i >= 0; i--) {
      const p = this.winParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= dt * 0.45;

      if (p.alpha <= 0 || p.y > this.height + 50) {
        this.winParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 4;
      this.ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size * 0.6);
      this.ctx.restore();
    }
  }

  // Update real-time flight progress (0.0 to 1.0) and current multiplier value
  updateFlight(progress, multiplier) {
    this.progress = progress;
    this.multiplier = multiplier;
  }
}

// Attach globally
window.AviatorCanvas = AviatorCanvas;
