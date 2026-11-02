export interface RenderOptions {
  rotation?: number;              // Overall rotation angle in radians
  petalCounterRotation?: number;  // Separate counter-rotation for outer 16 petals
  scale?: number;                 // Breathing scale multiplier (0.95 to 1.05)
  highlightAvarana?: number | null; // 1 to 9, or null for all
  baseColor?: string;             // Golden line color
  shivaColor?: string;            // Upward triangle color
  shaktiColor?: string;           // Downward triangle color
  glowColor?: string;             // Radial aura color
  glowIntensity?: number;         // 0 to 2
  lineWidth?: number;             // Base line thickness
}

export class SriYantraGeometry {
  /**
   * Primary 9 Mula Triangles (Normalized to inner triangle circle radius = 1)
   * 4 Upward (Shiva - Ascending consciousness)
   * 5 Downward (Shakti - Kinetic creation)
   */
  public static readonly TRIANGLES = [
    // 4 Upward Triangles (Shiva)
    { id: 'S1', isUpward: true,  apexY: -0.835, baseY: 0.585,  halfW: 0.775 },
    { id: 'S2', isUpward: true,  apexY: -0.635, baseY: 0.355,  halfW: 0.675 },
    { id: 'S3', isUpward: true,  apexY: -0.420, baseY: 0.760,  halfW: 0.615 },
    { id: 'S4', isUpward: true,  apexY: -0.220, baseY: 0.170,  halfW: 0.440 },

    // 5 Downward Triangles (Shakti)
    { id: 'K1', isUpward: false, apexY: 0.835,  baseY: -0.585, halfW: 0.775 },
    { id: 'K2', isUpward: false, apexY: 0.635,  baseY: -0.355, halfW: 0.675 },
    { id: 'K3', isUpward: false, apexY: 0.420,  baseY: -0.760, halfW: 0.615 },
    { id: 'K4', isUpward: false, apexY: 0.220,  baseY: -0.170, halfW: 0.440 },
    { id: 'K5', isUpward: false, apexY: 0.085,  baseY: -0.065, halfW: 0.180 }, // Central Trikona
  ];

  /**
   * Main render function for HTML5 Canvas
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    baseRadius: number,
    opts: RenderOptions = {}
  ): void {
    const {
      rotation = 0,
      petalCounterRotation = 0,
      scale = 1.0,
      highlightAvarana = null,
      baseColor = '#c89547',
      shivaColor = '#e88c38',
      shaktiColor = '#d46820',
      glowColor = 'rgba(245, 78, 0, 0.4)',
      glowIntensity = 1.0,
      lineWidth = 1.35,
    } = opts;

    const R = baseRadius * scale;
    const rTriangles = R * 0.46;
    const rInnerCircles = R * 0.49;
    const rLotus8 = R * 0.62;
    const rMidCircles = R * 0.65;
    const rLotus16 = R * 0.82;
    const rOuterCircles = R * 0.85;
    const rBhupuraInner = R * 0.94;
    const rBhupuraMid = R * 0.98;
    const rBhupuraOuter = R * 1.02;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Ambient Central Aura Glow (Volumetric Prana Bloom)
    if (glowIntensity > 0) {
      const auraGradient = ctx.createRadialGradient(0, 0, rTriangles * 0.1, 0, 0, R * 1.15);
      auraGradient.addColorStop(0, `rgba(245, 120, 40, ${0.16 * glowIntensity})`);
      auraGradient.addColorStop(0.35, `rgba(200, 149, 71, ${0.08 * glowIntensity})`);
      auraGradient.addColorStop(0.75, glowColor);
      auraGradient.addColorStop(1, 'rgba(20, 18, 16, 0)');

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Avarana 1: Bhupura (The 3-line Earth Citadel with 4 Cardinal Gateways)
    const isBhupuraActive = highlightAvarana === null || highlightAvarana === 1;
    if (isBhupuraActive) {
      ctx.save();
      ctx.rotate(rotation * 0.35); // Slow majestic rotation
      ctx.strokeStyle = highlightAvarana === 1 ? '#ff7a29' : baseColor;
      ctx.lineWidth = lineWidth * (highlightAvarana === 1 ? 2.0 : 1.1);

      this.drawBhupuraSquare(ctx, rBhupuraInner);
      this.drawBhupuraSquare(ctx, rBhupuraMid);
      this.drawBhupuraSquare(ctx, rBhupuraOuter);
      ctx.restore();
    }

    // 3. Outer Boundary Rings (3 Circles)
    ctx.save();
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = lineWidth * 0.85;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, rOuterCircles + i * (R * 0.015), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Avarana 2: 16-Petal Lotus (Shodasha Dala Padma)
    const isLotus16Active = highlightAvarana === null || highlightAvarana === 2;
    if (isLotus16Active) {
      ctx.save();
      ctx.rotate(rotation + petalCounterRotation);
      ctx.strokeStyle = highlightAvarana === 2 ? '#ff7a29' : baseColor;
      ctx.lineWidth = lineWidth * (highlightAvarana === 2 ? 1.8 : 1.0);
      this.drawLotusPetals(ctx, 16, rMidCircles * 1.02, rLotus16);
      ctx.restore();
    }

    // 5. Middle Boundary Rings (3 Circles)
    ctx.save();
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = lineWidth * 0.85;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, rMidCircles + i * (R * 0.012), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 6. Avarana 3: 8-Petal Lotus (Ashta Dala Padma)
    const isLotus8Active = highlightAvarana === null || highlightAvarana === 3;
    if (isLotus8Active) {
      ctx.save();
      ctx.rotate(rotation - petalCounterRotation * 0.5);
      ctx.strokeStyle = highlightAvarana === 3 ? '#ff7a29' : baseColor;
      ctx.lineWidth = lineWidth * (highlightAvarana === 3 ? 1.8 : 1.1);
      this.drawLotusPetals(ctx, 8, rInnerCircles * 1.02, rLotus8);
      ctx.restore();
    }

    // 7. Inner Boundary Rings (3 Circles - Mekhala)
    ctx.save();
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = lineWidth * 0.85;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, rInnerCircles + i * (R * 0.01), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 8. Avaranas 4 to 8: The 9 Primary Interlocking Triangles forming 43 Triangles
    ctx.save();
    ctx.rotate(rotation);

    for (let i = 0; i < this.TRIANGLES.length; i++) {
      const tri = this.TRIANGLES[i];
      const isCentral = tri.id === 'K5';

      let strokeColor = baseColor;
      let triLineWidth = lineWidth;

      if (highlightAvarana !== null) {
        if (highlightAvarana === 8 && isCentral) {
          strokeColor = '#ff5500';
          triLineWidth = lineWidth * 2.2;
        } else if (highlightAvarana >= 4 && highlightAvarana <= 7) {
          strokeColor = tri.isUpward ? shivaColor : shaktiColor;
          triLineWidth = lineWidth * 1.5;
        } else {
          strokeColor = 'rgba(200, 149, 71, 0.25)'; // Dimmed
        }
      } else {
        // Normal subtle chromatic hierarchy
        strokeColor = tri.isUpward ? shivaColor : shaktiColor;
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = triLineWidth;

      ctx.beginPath();
      const apexPt = { x: 0, y: tri.apexY * rTriangles };
      const baseLeft = { x: -tri.halfW * rTriangles, y: tri.baseY * rTriangles };
      const baseRight = { x: tri.halfW * rTriangles, y: tri.baseY * rTriangles };

      ctx.moveTo(apexPt.x, apexPt.y);
      ctx.lineTo(baseLeft.x, baseLeft.y);
      ctx.lineTo(baseRight.x, baseRight.y);
      ctx.closePath();
      ctx.stroke();
    }

    // 9. Avarana 9: The Supreme Central Point (Bindu)
    const isBinduActive = highlightAvarana === null || highlightAvarana === 9;
    if (isBinduActive) {
      const binduRadius = R * (highlightAvarana === 9 ? 0.018 : 0.012);

      // Bindu Prana Radial Glow
      const bGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, binduRadius * 6);
      bGlow.addColorStop(0, '#ffffff');
      bGlow.addColorStop(0.25, '#ffaa44');
      bGlow.addColorStop(0.65, 'rgba(245, 78, 0, 0.45)');
      bGlow.addColorStop(1, 'rgba(245, 78, 0, 0)');

      ctx.fillStyle = bGlow;
      ctx.beginPath();
      ctx.arc(0, 0, binduRadius * 6, 0, Math.PI * 2);
      ctx.fill();

      // Solid Bindu Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, binduRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f54e00';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }

  /**
   * Helper: Draw Sacred Lotus Petals with Bezier Curvature
   */
  private static drawLotusPetals(
    ctx: CanvasRenderingContext2D,
    count: number,
    innerRadius: number,
    outerRadius: number
  ): void {
    const angleStep = (Math.PI * 2) / count;
    const halfStep = angleStep / 2;

    for (let i = 0; i < count; i++) {
      const centerAngle = i * angleStep;
      const startAngle = centerAngle - halfStep;
      const endAngle = centerAngle + halfStep;

      // Base points on inner circle
      const x1 = Math.cos(startAngle) * innerRadius;
      const y1 = Math.sin(startAngle) * innerRadius;
      const x2 = Math.cos(endAngle) * innerRadius;
      const y2 = Math.sin(endAngle) * innerRadius;

      // Tip point on outer circle
      const tipX = Math.cos(centerAngle) * outerRadius;
      const tipY = Math.sin(centerAngle) * outerRadius;

      // Control points for organic petal bulge
      const ctrlDist = innerRadius + (outerRadius - innerRadius) * 0.75;
      const ctrl1X = Math.cos(centerAngle - halfStep * 0.45) * ctrlDist;
      const ctrl1Y = Math.sin(centerAngle - halfStep * 0.45) * ctrlDist;
      const ctrl2X = Math.cos(centerAngle + halfStep * 0.45) * ctrlDist;
      const ctrl2Y = Math.sin(centerAngle + halfStep * 0.45) * ctrlDist;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(ctrl1X, ctrl1Y, tipX, tipY);
      ctx.quadraticCurveTo(ctrl2X, ctrl2Y, x2, y2);
      ctx.stroke();

      // Inner petal vein line (spine)
      ctx.beginPath();
      ctx.moveTo((x1 + x2) * 0.5, (y1 + y2) * 0.5);
      ctx.lineTo(tipX * 0.88, tipY * 0.88);
      ctx.save();
      ctx.strokeStyle = 'rgba(200, 149, 71, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Helper: Draw Bhupura Square with 4 T-Shaped Cardinal Gates
   */
  private static drawBhupuraSquare(ctx: CanvasRenderingContext2D, radius: number): void {
    const s = radius;
    const gateW = s * 0.32;   // Gate width
    const gateD = s * 0.085;  // Gate depth outward
    const gateL = gateW * 0.42; // T-wing length

    ctx.beginPath();

    // 4 Sides: Top, Right, Bottom, Left
    for (let side = 0; side < 4; side++) {
      ctx.save();
      ctx.rotate((side * Math.PI) / 2);

      // Start at top-left corner
      ctx.moveTo(-s, -s);
      // Line to left edge of top gate
      ctx.lineTo(-gateW * 0.5, -s);
      // Step outward (T-gate)
      ctx.lineTo(-gateW * 0.5 - gateL, -s - gateD);
      ctx.lineTo(gateW * 0.5 + gateL, -s - gateD);
      ctx.lineTo(gateW * 0.5, -s);
      // Line to top-right corner
      ctx.lineTo(s, -s);

      ctx.stroke();
      ctx.restore();
    }
  }
}
