import type { IVisualScene, VisualState } from '../../../types';
import { SriYantraGeometry } from '../SriYantraGeometry';

interface OrbitalElectron {
  trackRadiusRatio: number;
  angle: number;
  speed: number;
  size: number;
  zTrack: number;
  trail: { x: number; y: number; z: number }[];
  color: string;
}

export class QuantumAtomsScene implements IVisualScene {
  public id = 'quantum-atoms' as const;
  public name = 'Quantum Atoms 3D';

  private width: number = 0;
  private height: number = 0;
  private electrons: OrbitalElectron[] = [];
  private time: number = 0;

  private targetTiltX: number = 0.2;
  private targetTiltY: number = 0.0;
  private currentTiltX: number = 0.2;
  private currentTiltY: number = 0.0;

  private readonly FOV = 550;

  public init(_ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.spawnElectrons();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.spawnElectrons();
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

    // 1. Dark Quantum Vacuum
    ctx.fillStyle = '#0c0b0a';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Render 3D Orbital Electrons & Trails in Perspective
    ctx.save();
    for (let i = 0; i < this.electrons.length; i++) {
      const el = this.electrons[i];
      el.angle += el.speed * dt * state.rotationSpeed;
      const r = yantraRadius * el.trackRadiusRatio;
      const ex = Math.cos(el.angle) * r;
      const ey = Math.sin(el.angle) * r;
      const ez = el.zTrack * (state.depth3D ?? 1.0);

      el.trail.unshift({ x: ex, y: ey, z: ez });
      if (el.trail.length > 16) el.trail.pop();

      // Draw projected 3D trail
      ctx.beginPath();
      for (let t = 0; t < el.trail.length; t++) {
        const pt = el.trail[t];
        const proj = SriYantraGeometry.project(pt.x, pt.y, pt.z, this.currentTiltX, this.currentTiltY, this.FOV, cx, cy);
        const tAlpha = (1 - t / el.trail.length) * 0.5;
        ctx.strokeStyle = `rgba(245, 120, 40, ${tAlpha})`;
        ctx.lineWidth = Math.max(0.6, el.size * proj.scale * (1 - t / el.trail.length));
        if (t === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      ctx.stroke();

      // Projected particle head
      const headProj = SriYantraGeometry.project(ex, ey, ez, this.currentTiltX, this.currentTiltY, this.FOV, cx, cy);
      ctx.beginPath();
      ctx.arc(headProj.x, headProj.y, el.size * headProj.scale, 0, Math.PI * 2);
      ctx.fillStyle = el.color;
      ctx.shadowColor = el.color;
      ctx.shadowBlur = 9;
      ctx.fill();
    }
    ctx.restore();

    // 3. Breathing Rhythm
    let breathScale = 1.0;
    if (state.breathing !== 'static') {
      const breathProgress = (Math.sin((this.time * Math.PI * 2) / 16 - Math.PI / 2) + 1) / 2;
      breathScale = 0.965 + 0.05 * breathProgress;
    }

    // 4. Render 3D Sri Yantra
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
      highlightAvarana: state.highlightAvarana,
      glowIntensity: state.glowIntensity,
    });
  }

  private spawnElectrons(): void {
    this.electrons = [];
    const tracks = [0.35, 0.44, 0.60, 0.80, 0.93, 1.01];
    const zLayers = [-30, -15, 0, 15, 25, 35];

    for (let i = 0; i < 28; i++) {
      const track = tracks[i % tracks.length];
      const zTrack = zLayers[i % zLayers.length];
      const direction = i % 2 === 0 ? 1 : -1;
      this.electrons.push({
        trackRadiusRatio: track,
        angle: Math.random() * Math.PI * 2,
        speed: (0.4 + Math.random() * 0.4) * direction,
        size: Math.random() * 1.6 + 1.2,
        zTrack,
        trail: [],
        color: i % 3 === 0 ? '#ff8c3b' : i % 3 === 1 ? '#dfa88f' : '#ffffff',
      });
    }
  }

  public destroy(): void {
    this.electrons = [];
  }
}
