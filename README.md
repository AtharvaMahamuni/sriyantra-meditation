# Sri Yantra Meditation & Sacred Geometry Engine

A tranquil, full-screen digital sanctuary featuring a mathematically precise rotating **Sri Yantra**, procedural **136.1 Hz Om Cosmic Drone**, **Bindu Trataka** focus guides, and authoritative research on sacred geometry and Vastu.

- **Author**: Atharva Mahamuni ([@athmatwt](https://x.com/athmatwt))
- **Live Target**: `https://sriyantrameditation.com` / `https://sriyantraonline.com`
- **Tech Stack**: Astro 5 (Static Site Generation), TypeScript, HTML5 Canvas 2D, Web Audio API, W3C Screen Wake Lock API.
- **Design Tokens**: Aligned with workspace `DESIGN.md` (Cursor Orange `#f54e00`, Warm Obsidian `#12110f`, Warm Cream `#f7f7f4`, Hairline `#e6e5e0`).

---

## Key Features

### 1. 60FPS Fullscreen Sacred Geometry Canvas
- **Sub-Pixel Concurrency Solver**: Precision vector paths calculating the exact intersections of the 4 upward *Shiva* and 5 downward *Shakti* primary triangles, resolving the Euclidean triple-intersection problem without distorted lines or slivers.
- **Dynamic Prana Breathing Pulse**: Sinusoidal scale and glow modulation synchronized with 16-second tidal breathing (4s inhale, 4s hold, 4s exhale, 4s hold).
- **4 Subtle Meditative Atmospheres**:
  - `Cosmic Galaxy`: 3D stardust spiral with gentle camera parallax.
  - `Divine Light`: Volumetric prana rays and soft floating golden embers.
  - `Quantum Atoms`: Orbiting electrons and energetic Nadi particle trails.
  - `Zen Void`: Pure obsidian minimalism for distraction-free Bindu Trataka gaze.

### 2. Procedural Web Audio Engine (Zero Downloads)
- **136.10 Hz Cosmic Octave**: The fundamental Earth orbital frequency (C#₃ / Sadja Sa) synthesized live using harmonic sine/sawtooth oscillators and resonant formant filtering (*"A-U-M"* envelope).
- **Procedural Tanpura Shimmer**: 4-string acoustic plucking (*Pa - Sa - Sa - Sa*) with natural resonant decay.
- **Tibetan Singing Bowl Bell**: Frequency Modulation (FM) mindfulness bell chime intervals.
- **Smooth Volume Ramps**: 2.5s linear gain transitions preventing abrupt audio cuts.

### 3. Screen Wake Lock & Zen Interaction
- **W3C Screen Wake Lock API**: Keeps mobile, tablet, and desktop displays awake throughout meditation without user interaction.
- **Auto-Hiding HUD**: Floating glassmorphic dock smoothly fades out after 3.5 seconds of cursor inactivity, leaving only the glowing, rotating Sri Yantra.
- **4K Wallpaper Generator**: One-click high-resolution wallpaper export for desktop and mobile displays.

### 4. SEO, GEO & AI Agent Discoverability
- **Structured JSON-LD `@graph`**: Contains `WebApplication`, `FAQPage`, `Article`, `Organization`, and `Person` (Atharva Mahamuni `@athmatwt`).
- **Comprehensive FAQ Engine**: 30+ questions addressing high-volume Google and Reddit search queries in English and Hindi/Hinglish variants.
- **AI Discovery Suite**: Complete specifications in `/public` including `llms.txt`, `llms-full.txt`, `robots-ai.txt`, `ai.txt`, `ai.json`, `brand.txt`, `faq-ai.txt`, and `identity.json`.
- **Affiliate-Ready Materials Guide**: Trust-building comparison of natural Sphatik (quartz crystal), copper plates, 3D Maha Meru pyramids, and silver lockets with physical authenticity verification tests.

---

## Directory Structure

```
sriyantra-meditation/
├── public/
│   ├── ai.json                 # Agent tool capabilities & schema
│   ├── ai.txt                  # Machine-readable context
│   ├── brand.txt               # Brand identity & phonetic variations
│   ├── faq-ai.txt              # Instant LLM Q&A repository
│   ├── favicon.svg             # Sacred Sri Yantra SVG favicon
│   ├── identity.json           # Linked JSON-LD author & org schema
│   ├── llms.txt                # Condensed AI site specification
│   ├── llms-full.txt           # Comprehensive mathematical & audio documentation
│   ├── robots-ai.txt           # AI crawler guidelines
│   ├── robots.txt              # Standard web crawler rules
│   └── sitemap.xml             # Complete XML sitemap
├── src/
│   ├── components/
│   │   ├── AffiliateShowcase.astro  # Verified materials & affiliate cards
│   │   ├── FaqAccordion.astro       # Interactive Q&A with category filters & schema
│   │   ├── Footer.astro             # Warm cream footer with credentials
│   │   ├── Header.astro             # Minimal editorial navigation
│   │   ├── MeditationCanvas.astro   # Fullscreen canvas viewport & controls
│   │   └── ZenControlsBar.astro     # Bottom floating glassmorphic dock
│   ├── engines/
│   │   ├── audio/
│   │   │   └── AudioEngine.ts       # 136.1 Hz Om, Tanpura & Singing bowl synth
│   │   ├── session/
│   │   │   ├── TimerManager.ts      # Countdown & interval bell management
│   │   │   └── WakeLockManager.ts   # Screen Wake Lock API wrapper
│   │   └── visual/
│   │       ├── SceneManager.ts      # Canvas DPR, render loop, wallpaper export
│   │       ├── SriYantraGeometry.ts # Vector concurrency & 9 Avarana paths
│   │       └── scenes/
│   │           ├── CosmicGalaxy.ts  # 3D starfield spiral
│   │           ├── DivineLight.ts   # Volumetric solar rays & embers
│   │           ├── QuantumAtoms.ts  # Orbiting Nadi electrons
│   │           └── ZenVoid.ts       # Pure obsidian Trataka mode
│   ├── layouts/
│   │   └── BaseLayout.astro         # Global HTML shell & JSON-LD
│   ├── pages/
│   │   ├── index.astro              # Fullscreen interactive meditation app
│   │   ├── geometry.astro           # Sacred geometry & Concurrency breakdown
│   │   ├── meditation.astro         # Bindu Trataka & Mantra practice guide
│   │   ├── vastu.astro              # Directions & Friday activation rituals
│   │   ├── materials.astro          # Natural Sphatik testing guide
│   │   ├── faq.astro                # 30+ Question searchable FAQ hub
│   │   └── about.astro              # Mission & 100% client-side privacy statement
│   ├── styles/
│   │   ├── global.css               # Typographic rhythm & responsive resets
│   │   └── tokens.css               # DESIGN.md color tokens & sacred styling
│   └── types/
│       └── index.ts                 # Shared TypeScript interfaces
├── astro.config.ts
├── package.json
└── tsconfig.json
```

---

## Development & Build Commands

```bash
# Run local dev server
npm run dev

# Verify types & template diagnostics
npm run check

# Build production static bundle (dist/)
npm run build

# Preview production build locally
npm run preview
```

---

## 100% Client-Side Privacy Guarantee

This application runs entirely on the client device. Audio synthesis and Canvas geometry are generated dynamically on your machine. Zero tracking cookies, zero analytics beacons, zero user accounts.
