/**
 * Site configuration and path helpers for Sri Yantra Meditation.
 * Supports root deployment (custom domain) and GitHub Pages subpath deployment.
 */

export const SITE_ORIGIN =
  process.env.ASTRO_SITE ??
  (process.env.GITHUB_ACTIONS && !process.env.ASTRO_CUSTOM_DOMAIN
    ? "https://atharvamahamuni.github.io"
    : "https://sriyantrameditation.com");

export const BASE_PATH =
  process.env.ASTRO_BASE_PATH ??
  (process.env.GITHUB_ACTIONS && !process.env.ASTRO_CUSTOM_DOMAIN
    ? "/sriyantra-meditation"
    : "");

export const SITE_NAME = "Sri Yantra Meditation";
export const AUTHOR_NAME = "Atharva Mahamuni";
export const AUTHOR_TWITTER = "https://x.com/athmatwt";
export const AUTHOR_GITHUB = "https://github.com/AtharvaMahamuni";

/**
 * Normalizes an internal path by prepending Astro's configured BASE_URL when applicable.
 */
export function url(path: string = "/"): string {
  const rawBase = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL)
    ? import.meta.env.BASE_URL
    : BASE_PATH;

  const base = rawBase.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;

  if (!base || base === "") {
    return clean;
  }

  if (clean === base || clean.startsWith(`${base}/`)) {
    return clean;
  }

  return `${base}${clean}`;
}

/**
 * Returns the fully qualified canonical URL.
 */
export function absoluteUrl(path: string = "/"): string {
  const resolved = url(path);
  const origin = SITE_ORIGIN.replace(/\/$/, "");
  return `${origin}${resolved.startsWith("/") ? resolved : `/${resolved}`}`;
}
