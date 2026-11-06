import { readFile, access } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist");

const pages = [
  ["index.html", "The Living Architecture of Consciousness"],
  ["404.html", "Beyond the Nine Enclosures"],
  ["about/index.html", "About Sri Yantra Meditation"],
  ["faq/index.html", "Sri Yantra Knowledge Base"],
  ["geometry/index.html", "The Sacred Geometry of Sri Yantra: The Mathematical Concurrency of 9 Interlocking Triangles"],
  ["materials/index.html", "Original Sphatik Sri Yantra vs Copper & 3D Meru: The Complete Authenticity Guide"],
  ["meditation/index.html", "How to Meditate on the Sri Yantra: The Complete Bindu Trataka & Mantra Guide"],
  ["vastu/index.html", "Where to Place Sri Yantra in Your Home: The Complete Vastu & Worship Guide"],
];

const requiredStaticFiles = [
  ".nojekyll",
  "robots.txt",
  "llms.txt",
  "llms-full.txt",
  "ai.txt",
  "ai.json",
  "brand.txt",
  "faq-ai.txt",
  "identity.json",
  "robots-ai.txt",
  "sitemap.xml",
  "favicon.svg",
];

let failed = 0;

function fail(message) {
  failed += 1;
  console.error(`❌ ${message}`);
}

// 1. Verify all pages and H1 tags
for (const [file, expectedH1] of pages) {
  const full = path.join(root, file);
  let html;
  try {
    html = await readFile(full, "utf8");
  } catch {
    fail(`Missing output file: ${file}`);
    continue;
  }

  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) =>
    match[1].replace(/<[^>]+>/g, "").trim(),
  );

  if (h1Matches.length !== 1) {
    fail(`${file} expected 1 <h1>, found ${h1Matches.length}`);
  } else if (!h1Matches[0].includes(expectedH1) && !expectedH1.includes(h1Matches[0])) {
    fail(`${file} <h1> mismatch. Found "${h1Matches[0]}", expected to include "${expectedH1}"`);
  }

  if (!html.includes("<title>")) {
    fail(`${file} is missing <title> tag`);
  }
}

// 2. Verify all required static files exist
for (const staticFile of requiredStaticFiles) {
  try {
    await access(path.join(root, staticFile));
  } catch {
    fail(`Missing required static file in dist: ${staticFile}`);
  }
}

if (failed > 0) {
  console.error(`\nBuild verification failed with ${failed} error(s).`);
  process.exit(1);
}

console.log(`✅ Build verification passed: all ${pages.length} pages and ${requiredStaticFiles.length} static discovery files verified.`);
