import { defineConfig } from "astro/config";

const isGithubPages = Boolean(process.env.GITHUB_ACTIONS && !process.env.ASTRO_CUSTOM_DOMAIN);

const site =
  process.env.ASTRO_SITE ??
  (isGithubPages ? "https://atharvamahamuni.github.io" : "https://sriyantrameditation.com");

const base =
  process.env.ASTRO_BASE_PATH ??
  (isGithubPages ? "/sriyantra-meditation" : undefined);

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
});
