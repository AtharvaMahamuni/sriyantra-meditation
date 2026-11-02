import type { IVisualScene, VisualState } from '../../../types';
import { SriYantraGeometry } from '../SriYantraGeometry';

interface CosmicStar {
  x: number;
  y: number;
  z: number;
  armAngle: number;
  radius: number;
  speed: number;
  size: number;
  baseAlpha: number;
  colorType: number;
}

export class CosmicGalaxyScene implements IVisualScene {
  public id = 'galaxy' as const;
  public name = 'Cosmic Galaxy 3D';

  private width: number = 0;
  private height: number = 0;
  private stars: CosmicStar[] = [];
  private time: number = 0;

  // 3D Perspective Camera Angles
  private targetTiltX: number = 0.25; // Pitch (up/down)
  private targetTiltY: number = 0.0;  // Yaw (left/right)
  private currentTiltX: number = 0.25;
  private currentTiltY: number = 0.0;

  private readonly FOV = 550;
  private readonly NUM_STARS = 480;
  private readonly NUM_ARMS = 3;

  public init(_ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.spawnGalaxy();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.spawnGalaxy();
  }

  public onPointerMove(x: number, y: number): void {
    // Convert mouse coordinates into interactive 3D perspective tilt
    const normX = (x / this.width - 0.5) * 2;
    const normY = (y / this.height - 0.5) * 2;

    this.targetTiltX = normY * 0.45; // Mouse Y tilts pitch (up/down perspective)
    this.targetTiltY = normX * 0.55; // Mouse X tilts yaw (left/right perspective)
  }

  public render(ctx: CanvasRenderingContext2D, delta: number, state: VisualState): void {
    const dt = Math.min(delta, 100) * 0.001;
    this.time += dt * 0.2 * state.rotationSpeed;

    // Smooth spring interpolation for camera angles
    this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.06;
    this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.06;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const minDim = Math.min(this.width, this.height);
    const yantraRadius = minDim * 0.42;

    // 1. Deep Space Obsidian Canvas
    ctx.fillStyle = '#0e0d0b';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Render 3D Background Galaxy Stars in Unified Perspective
    ctx.save();
    const cosX = Math.cos(this.currentTiltX);
    const sinX = Math.sin(this.currentTiltX);
    const cosY = Math.cos(this.currentTiltY);
    const sinY = Math.sin(this.currentTiltY);

    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const currentAngle = star.armAngle + this.time * star.speed * 0.4;

      const sx = Math.cos(currentAngle) * star.radius;
      const sz = Math.sin(currentAngle) * star.radius;
      const sy = star.y;

      // Rotate Y (Yaw)
      const rx1 = sx * cosY + sz * sinY;
      const rz1 = -sx * sinY + sz * cosY;

      // Rotate X (Pitch)
      const ry2 = sy * cosX - rz1 * sinX;
      const rz2 = sy * sinX + rz1 * cosX;

      const zDepth = rz2 + this.FOV;
      if (zDepth <= 20) continue;

      const scale = this.FOV / zDepth;
      const screenX = cx + rx1 * scale;
      const screenY = cy + ry2 * scale;

      if (screenX < -20 || screenX > this.width + 20 || screenY < -20 || screenY > this.height + 20) {
        continue;
      }

      const distFromCenter = Math.sqrt(rx1 * rx1 + ry2 * ry2);
      const twinkle = Math.sin(this.time * 3 + star.armAngle * 5) * 0.3 + 0.7;
      const depthAlpha = Math.max(0, Math.min(1, (1 - (distFromCenter / (minDim * 0.9))) * star.baseAlpha * twinkle));

      ctx.beginPath();
      ctx.arc(screenX, screenY, Math.max(0.6, star.size * scale), 0, Math.PI * 2);

      if (star.colorType === 0) {
        ctx.fillStyle = `rgba(245, 78, 0, ${depthAlpha * 0.7})`;
      } else if (star.colorType === 1) {
        ctx.fillStyle = `rgba(255, 180, 80, ${depthAlpha * 0.85})`;
      } else {
        ctx.fillStyle = `rgba(247, 247, 244, ${depthAlpha * 0.55})`;
      }
      ctx.fill();
    }
    ctx.restore();

    // 3. Sinusoidal Breathing Scale (16s Continuous Cycle)
    let breathScale = 1.0;
    if (state.breathing !== 'static') {
      const breathProgress = (Math.sin((this.time * Math.PI * 2) / 16 - Math.PI / 2) + 1) / 2;
      breathScale = 0.965 + 0.05 * breathProgress;
    }

    // 4. Render 3D Perspective Sri Yantra with Alternating Layer Rotations
    SriYantraGeometry.render3D(ctx, cx, cy, yantraRadius, {
      time: this.time,
      pitch: this.currentTiltX,
      yaw: this.currentTiltY,
      fov: this.FOV,
      scale: breathScale,
      speed: state.rotationSpeed,
      depth3D: state.depth3D ?? 1.0,
      motionMode: state.motionMode ?? 'vortex',
      highlightAvarana: state.highlightAvarana,
      glowIntensity: state.glowIntensity,
      baseColor: '#c89547',
      shivaColor: '#ffaa3b',
      shaktiColor: '#f54e00',
    });
  }

  private spawnGalaxy(): void {
    this.stars = [];
    const maxRadius = Math.min(this.width, this.height) * 0.88;

    for (let i = 0; i < this.NUM_STARS; i++) {
      const armIndex = i % this.NUM_ARMS;
      const armBaseAngle = (armIndex * 2 * Math.PI) / this.NUM_ARMS;
      const progress = Math.pow(Math.random(), 1.5);
      const radius = progress * maxRadius + 20;

      const spiralAngle = armBaseAngle + progress * 2.9;
      const scatterAngle = (Math.random() - 0.5) * 0.65;
      const finalAngle = spiralAngle + scatterAngle;

      this.stars.push({
        x: Math.cos(finalAngle) * radius,
        y: (Math.random() - 0.5) * 85 * (1 - progress * 0.5),
        z: Math.sin(finalAngle) * radius,
        armAngle: finalAngle,
        radius,
        speed: (0.15 + (1 - progress) * 0.25) * 0.35,
        size: Math.random() * 1.8 + 0.6,
        baseAlpha: Math.random() * 0.65 + 0.25,
        colorType: Math.random() < 0.4 ? 0 : Math.random() < 0.75 ? 1 : 2,
      });
    }
  }

  public destroy(): void {
    this.stars = [];
  }
}
