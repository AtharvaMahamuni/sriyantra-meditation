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

  private targetTiltX: number = 0.08;
  private targetTiltY: number = 0.0;
  private currentTiltX: number = 0.08;
  private currentTiltY: number = 0.0;

  private readonly FOV = 550;
  private readonly NUM_EMBERS = 32;
  private readonly NUM_RAYS = 8;

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
    this.targetTiltX = normY * 0.14;
    this.targetTiltY = normX * 0.18;
  }

  public render(ctx: CanvasRenderingContext2D, delta: number, state: VisualState): void {
    const dt = Math.min(delta, 100) * 0.001;
    this.time += dt * 0.08 * state.rotationSpeed;

    this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.035;
    this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.035;

    const cx = this.width / 2;
    const isPortrait = this.height > this.width;
    const minDim = Math.min(this.width, this.height);
    // Dynamic plane anchor responding smoothly from both top side and bottom side
    const cy = this.height * (isPortrait ? 0.518 : 0.528) + Math.sin(this.currentTiltX) * 22;
    // Scaled safely so Bhupura corners never clip in full screen or at extreme 3D tilts
    const yantraRadius = isPortrait ? minDim * 0.35 : minDim * 0.205;

    // 1. OLED Pure Black Background
    if (state.isFullScreen) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const bgGrad = ctx.createRadialGradient(cx, cy, minDim * 0.05, cx, cy, minDim * 0.85);
      bgGrad.addColorStop(0, '#100c07');
      bgGrad.addColorStop(0.5, '#050403');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Subtle, Ethereal Volumetric Rays in 3D Perspective
    ctx.save();
    ctx.translate(cx, cy);
    const rayMaxR = minDim * 0.90;

    for (let i = 0; i < this.NUM_RAYS; i++) {
      const angle = (i * Math.PI * 2) / this.NUM_RAYS + this.time * 0.02;
      const rayAlpha = (Math.sin(this.time * 0.4 + i * 1.2) * 0.012 + 0.020) * state.glowIntensity;
      const rayWidth = (Math.PI * 2) / (this.NUM_RAYS * 3.2);

      const rayGrad = ctx.createRadialGradient(0, 0, yantraRadius * 0.2, 0, 0, rayMaxR);
      rayGrad.addColorStop(0, `rgba(255, 175, 70, ${rayAlpha * 1.5})`);
      rayGrad.addColorStop(0.4, `rgba(245, 90, 15, ${rayAlpha * 0.5})`);
      rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, rayMaxR, angle - rayWidth, angle + rayWidth);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 3. Floating Micro-Embers (Whisper-Soft)
    ctx.save();
    for (let i = 0; i < this.embers.length; i++) {
      const e = this.embers[i];
      e.y += e.vy * dt * 9;
      e.x += e.vx * dt * 9;
      e.pulsePhase += dt * 0.4;

      if (e.y < -15) e.y = this.height + 15;
      if (e.x < -15) e.x = this.width + 15;
      if (e.x > this.width + 15) e.x = -15;

      const alpha = (Math.sin(e.pulsePhase) * 0.3 + 0.7) * e.maxAlpha;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 195, 90, ${alpha})`;
      ctx.shadowColor = 'rgba(245, 100, 30, 0.3)';
      ctx.shadowBlur = 3;
      ctx.fill();
    }
    ctx.restore();

    // 4. Subtle Living Breath Rhythm
    let breathScale = 1.0;
    if (state.breathing !== 'static') {
      const breathProgress = (Math.sin((this.time * Math.PI * 2) / 16 - Math.PI / 2) + 1) / 2;
      breathScale = 0.985 + 0.025 * breathProgress;
    }

    // 5. Render 3D Sri Yantra
    SriYantraGeometry.render3D(ctx, cx, cy, yantraRadius, {
      time: this.time,
      pitch: this.currentTiltX,
      yaw: this.currentTiltY,
      fov: this.FOV,
      scale: breathScale,
      speed: state.rotationSpeed,
      depth3D: state.depth3D ?? 1.0,
      motionStyle: state.motionStyle ?? 'alternating',
      paletteId: state.palette ?? 'cursor-gold',
      showYantra: state.showYantra ?? true,
      highlightAvarana: state.highlightAvarana,
      glowIntensity: state.glowIntensity * 0.85,
    });
  }

  private spawnEmbers(): void {
    this.embers = [];
    for (let i = 0; i < this.NUM_EMBERS; i++) {
      this.embers.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.45 - 0.1,
        radius: Math.random() * 1.2 + 0.6,
        alpha: 0,
        maxAlpha: Math.random() * 0.35 + 0.15,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  public destroy(): void {
    this.embers = [];
  }
}
