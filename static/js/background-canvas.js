/**
 * BACKGROUND CANVAS ENGINE - Interactive Constellation Background
 * Lightweight, zero dependencies, responsive, high-DPI support.
 */

class InteractiveBackground {
  constructor(options = {}) {
    this.canvasId = options.canvasId || 'bg-canvas';
    this.mode = options.mode || 'constellation';
    this.accentColor = options.color || '#4ef2d2';
    this.particleCount = options.particleCount || 85;
    this.maxDistance = options.maxDistance || 140;
    this.mouseRadius = options.mouseRadius || 180;
    this.speed = options.speed || 0.65;

    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = this.canvasId;
      document.body.prepend(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000, active: false };

    this.setupStyles();
    this.resize();
    this.initParticles();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    console.log("🌌 InteractiveBackground initialized on #" + this.canvasId, "Color:", this.accentColor);
  }

  setupStyles() {
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '1'; // Positioned above body background, below content
    this.canvas.style.pointerEvents = 'none'; // Never block clicks to links or buttons
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.7 * this.speed,
        vy: (Math.random() - 0.5) * 0.7 * this.speed,
        radius: 1.8 + Math.random() * 2.0,
        alpha: 0.4 + Math.random() * 0.5
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.initParticles();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.active = false;
    });
  }

  update() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      // Mouse attraction
      if (this.mouse.active) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouseRadius && dist > 1) {
          const force = (1 - dist / this.mouseRadius) * 0.95;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.mode === 'constellation') {
      this.ctx.lineWidth = 0.9;
      for (let i = 0; i < this.particles.length; i++) {
        const p1 = this.particles[i];
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < this.maxDistance) {
            const lineAlpha = (1 - dist / this.maxDistance) * 0.4;
            this.ctx.strokeStyle = this.hexToRgba(this.accentColor, lineAlpha);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
          }
        }

        // Filament connection to mouse
        if (this.mouse.active) {
          const mouseDist = Math.hypot(p1.x - this.mouse.x, p1.y - this.mouse.y);
          if (mouseDist < this.mouseRadius) {
            const mouseLineAlpha = (1 - mouseDist / this.mouseRadius) * 0.65;
            this.ctx.strokeStyle = this.hexToRgba(this.accentColor, mouseLineAlpha);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(this.mouse.x, this.mouse.y);
            this.ctx.stroke();
          }
        }
      }
    }

    // Render particle dots
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.fillStyle = this.hexToRgba(this.accentColor, p.alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  animate() {
    this.update();
    this.render();
    requestAnimationFrame(this.animate);
  }
}

window.InteractiveBackground = InteractiveBackground;
