import type { IVisualScene, VisualState } from '../../../types';
import { SriYantraGeometry } from '../SriYantraGeometry';

interface PranaEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  pulsePhase: number;
}

export class DivineLightScene implements IVisualScene {
  public id = 'divine-light' as const;
  public name = 'Divine Light';

  private width: number = 0;
  private height: number = 0;
  private embers: PranaEmber[] = [];
  private time: number = 0;
  private rotationAngle: number = 0;

  private readonly NUM_EMBERS = 90;
  private readonly NUM_RAYS = 12;

  public init(_ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.rotationAngle = 0;
    this.spawnEmbers();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.spawnEmbers();
  }

  public render(ctx: CanvasRenderingContext2D, delta: number, state: VisualState): void {
    const dt = Math.min(delta, 100) * 0.001;
    this.time += dt * 0.1;
    this.rotationAngle += dt * 0.02 * state.rotationSpeed;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const minDim = Math.min(this.width, this.height);
    const yantraRadius = minDim * 0.40;

    // 1. Deep Radiant Background
    const bgGrad = ctx.createRadialGradient(cx, cy, minDim * 0.05, cx, cy, minDim * 0.85);
    bgGrad.addColorStop(0, '#1c150c');
    bgGrad.addColorStop(0.5, '#12100d');
    bgGrad.addColorStop(1, '#0c0b09');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Volumetric Prana Light Rays
    ctx.save();
    ctx.translate(cx, cy);
    const rayMaxR = minDim * 0.95;

    for (let i = 0; i < this.NUM_RAYS; i++) {
      const angle = (i * Math.PI * 2) / this.NUM_RAYS + this.time * 0.06;
      const rayAlpha = (Math.sin(this.time * 0.8 + i * 1.5) * 0.04 + 0.06) * state.glowIntensity;
      const rayWidth = (Math.PI * 2) / (this.NUM_RAYS * 2.8);

      const rayGrad = ctx.createRadialGradient(0, 0, yantraRadius * 0.2, 0, 0, rayMaxR);
      rayGrad.addColorStop(0, `rgba(245, 140, 40, ${rayAlpha * 1.8})`);
      rayGrad.addColorStop(0.4, `rgba(223, 168, 143, ${rayAlpha * 0.9})`);
      rayGrad.addColorStop(1, 'rgba(245, 78, 0, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, rayMaxR, angle - rayWidth, angle + rayWidth);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 3. Floating Golden Prana Embers
    ctx.save();
    for (let i = 0; i < this.embers.length; i++) {
      const e = this.embers[i];
      e.y += e.vy * dt * 25;
      e.x += e.vx * dt * 25;
      e.pulsePhase += dt * 0.8;

      if (e.y < -20) e.y = this.height + 20;
      if (e.x < -20) e.x = this.width + 20;
      if (e.x > this.width + 20) e.x = -20;

      const alpha = (Math.sin(e.pulsePhase) * 0.35 + 0.65) * e.maxAlpha;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 180, 80, ${alpha})`;
      ctx.shadowColor = 'rgba(245, 100, 30, 0.45)';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.restore();

    // 4. Breathing Rhythm
    let breathScale = 1.0;
    if (state.breathing !== 'static') {
      const breathPeriod = 16.0;
      const breathProgress = (Math.sin((this.time * Math.PI * 2) / breathPeriod - Math.PI / 2) + 1) / 2;
      breathScale = 0.965 + 0.05 * breathProgress;
    }

    // 5. Render Geometry
    SriYantraGeometry.render(ctx, cx, cy, yantraRadius, {
      rotation: this.rotationAngle,
      petalCounterRotation: state.counterRotatePetals ? -this.rotationAngle * 0.6 : 0,
      scale: breathScale,
      highlightAvarana: state.highlightAvarana,
      glowIntensity: state.glowIntensity * 1.3,
      baseColor: '#e0aa55',
      shivaColor: '#f59038',
      shaktiColor: '#e06b20',
    });
  }

  private spawnEmbers(): void {
    this.embers = [];
    for (let i = 0; i < this.NUM_EMBERS; i++) {
      this.embers.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.7 - 0.2, // Drifting upwards like incense smoke
        radius: Math.random() * 2.0 + 0.8,
        alpha: 0,
        maxAlpha: Math.random() * 0.5 + 0.25,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  public destroy(): void {
    this.embers = [];
  }
}
