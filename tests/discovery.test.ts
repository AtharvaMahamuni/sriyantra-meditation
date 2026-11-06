import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

describe("Discovery & Machine-Readable AI Standards", () => {
  const publicDir = path.resolve("public");

  it("includes .nojekyll for GitHub Pages asset compatibility", () => {
    expect(existsSync(path.join(publicDir, ".nojekyll"))).toBe(true);
  });

  it("includes robots.txt with sitemap reference and agent rules", () => {
    const robots = readFileSync(path.join(publicDir, "robots.txt"), "utf8");
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Sitemap:");
    expect(robots).toContain("GPTBot");
  });

  it("includes llms.txt and llms-full.txt conforming to LLM standards", () => {
    const llms = readFileSync(path.join(publicDir, "llms.txt"), "utf8");
    expect(llms).toContain("Sri Yantra");
    expect(llms).toContain("Atharva Mahamuni");

    const llmsFull = readFileSync(path.join(publicDir, "llms-full.txt"), "utf8");
    expect(llmsFull.length).toBeGreaterThan(llms.length);
  });

  it("includes valid identity.json with schema.org data", () => {
    const raw = readFileSync(path.join(publicDir, "identity.json"), "utf8");
    const parsed = JSON.parse(raw);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(Array.isArray(parsed["@graph"])).toBe(true);
  });
});
