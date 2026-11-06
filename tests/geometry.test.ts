import { describe, it, expect } from "vitest";
import { SriYantraGeometry } from "../src/engines/visual/SriYantraGeometry";

describe("SriYantraGeometry", () => {
  it("defines exactly 9 primary interlocking triangles (4 Shiva, 5 Shakti)", () => {
    const triangles = SriYantraGeometry.TRIANGLES;
    expect(triangles).toHaveLength(9);

    const upward = triangles.filter((t) => t.isUpward);
    const downward = triangles.filter((t) => !t.isUpward);

    expect(upward).toHaveLength(4);
    expect(downward).toHaveLength(5);
  });

  it("contains the central Trikona pointing downward (D5)", () => {
    const trikona = SriYantraGeometry.TRIANGLES.find((t) => t.id === "D5");
    expect(trikona).toBeDefined();
    expect(trikona?.isUpward).toBe(false);
    expect(trikona?.apexY).toBeGreaterThan(0); // pointing downward
  });

  it("projects 3D coordinates with perspective scale correctly", () => {
    const fov = 500;
    const cx = 200;
    const cy = 200;

    const projected = SriYantraGeometry.project(0, 0, 0, 0, 0, fov, cx, cy);
    expect(projected.x).toBe(cx);
    expect(projected.y).toBe(cy);
    expect(projected.scale).toBe(1.0);
  });

  it("projects elevation without negative scale or divide-by-zero", () => {
    const fov = 500;
    const cx = 300;
    const cy = 300;

    const pElevated = SriYantraGeometry.project(50, -50, 40, 0.4, 0.2, fov, cx, cy);
    expect(Number.isFinite(pElevated.x)).toBe(true);
    expect(Number.isFinite(pElevated.y)).toBe(true);
    expect(pElevated.scale).toBeGreaterThan(0);
  });
});
