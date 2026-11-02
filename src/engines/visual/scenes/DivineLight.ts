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
  public name = 'Divine Light 3D';

  private width: number = 0;
  private height: number = 0;
  private embers: PranaEmber[] = [];
  private time: number = 0;

  private targetTiltX: number = 0.2;
  private targetTiltY: number = 0.0;
  private currentTiltX: number = 0.2;
  private currentTiltY: number = 0.0;

  private readonly FOV = 550;
  private readonly NUM_EMBERS = 95;
  private readonly NUM_RAYS = 12;

  public init(_ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.spawnEmbers();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.spawnEmbers();
  }

  public onPointerMove(x: number, y: number): void {
    const normX = (x / this.width - 0.5) * 2;
    const normY = (y / this.height - 0.5) * 2;
    this.targetTiltX = normY * 0.45;
    this.targetTiltY = normX * 0.55;
  }

  public render(ctx: CanvasRenderingContext2D, delta: number, state: VisualState): void {
    const dt = Math.min(delta, 100) * 0.001;
    this.time += dt * 0.2 * state.rotationSpeed;

    this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.06;
    this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.06;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const minDim = Math.min(this.width, this.height);
    const yantraRadius = minDim * 0.42;

    // 1. Radiant Background
    const bgGrad = ctx.createRadialGradient(cx, cy, minDim * 0.05, cx, cy, minDim * 0.9);
    bgGrad.addColorStop(0, '#1a1309');
    bgGrad.addColorStop(0.5, '#110f0c');
    bgGrad.addColorStop(1, '#090807');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Volumetric Prana Light Rays in 3D Perspective
    ctx.save();
    ctx.translate(cx, cy);
    const rayMaxR = minDim * 0.95;

    for (let i = 0; i < this.NUM_RAYS; i++) {
      const angle = (i * Math.PI * 2) / this.NUM_RAYS + this.time * 0.08;
      const rayAlpha = (Math.sin(this.time * 1.2 + i * 1.5) * 0.04 + 0.07) * state.glowIntensity;
      const rayWidth = (Math.PI * 2) / (this.NUM_RAYS * 2.6);

      const rayGrad = ctx.createRadialGradient(0, 0, yantraRadius * 0.15, 0, 0, rayMaxR);
      rayGrad.addColorStop(0, `rgba(255, 160, 40, ${rayAlpha * 2.0})`);
      rayGrad.addColorStop(0.4, `rgba(245, 78, 0, ${rayAlpha * 0.9})`);
      rayGrad.addColorStop(1, 'rgba(245, 78, 0, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, rayMaxR, angle - rayWidth, angle + rayWidth);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 3. Floating Golden Embers
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
      ctx.fillStyle = `rgba(255, 190, 80, ${alpha})`;
      ctx.shadowColor = 'rgba(245, 100, 30, 0.5)';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.restore();

    // 4. Breathing Rhythm
    let breathScale = 1.0;
    if (state.breathing !== 'static') {
      const breathProgress = (Math.sin((this.time * Math.PI * 2) / 16 - Math.PI / 2) + 1) / 2;
      breathScale = 0.965 + 0.05 * breathProgress;
    }

    // 5. Render 3D Sri Yantra
    SriYantraGeometry.render3D(ctx, cx, cy, yantraRadius, {
      time: this.time,
      pitch: this.currentTiltX,
      yaw: this.currentTiltY,
      fov: this.FOV,
      scale: breathScale,
      speed: state.rotationSpeed,
      depth3D: state.depth3D ?? 1.1,
      motionMode: state.motionMode ?? 'vortex',
      highlightAvarana: state.highlightAvarana,
      glowIntensity: state.glowIntensity * 1.3,
      baseColor: '#e0aa55',
      shivaColor: '#ffaa3b',
      shaktiColor: '#f54e00',
    });
  }

  private spawnEmbers(): void {
    this.embers = [];
    for (let i = 0; i < this.NUM_EMBERS; i++) {
      this.embers.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.8 - 0.2,
        radius: Math.random() * 2.0 + 0.8,
        alpha: 0,
        maxAlpha: Math.random() * 0.55 + 0.25,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  public destroy(): void {
    this.embers = [];
  }
}
