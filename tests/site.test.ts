import { describe, it, expect } from "vitest";
import { url, absoluteUrl, SITE_ORIGIN, AUTHOR_NAME } from "../src/lib/site";

describe("Site Utilities & Routing", () => {
  it("resolves basic paths using url helper", () => {
    const rootPath = url("/");
    expect(rootPath).toMatch(/^\//);

    const geoPath = url("/geometry/");
    expect(geoPath).toContain("geometry");
  });

  it("does not duplicate base path if already supplied", () => {
    const custom = url("/geometry/");
    const reevaluated = url(custom);
    expect(reevaluated).toBe(custom);
  });

  it("produces valid absolute URLs with scheme and hostname", () => {
    const abs = absoluteUrl("/faq/");
    expect(abs.startsWith("http://") || abs.startsWith("https://")).toBe(true);
    expect(abs).toContain("/faq/");
  });

  it("attributes author Atharva Mahamuni", () => {
    expect(AUTHOR_NAME).toBe("Atharva Mahamuni");
    expect(SITE_ORIGIN).toBeDefined();
  });
});
