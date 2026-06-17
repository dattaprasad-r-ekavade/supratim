import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const lp = path.join(root, "landing-page");
const stitch = path.join(
  root,
  "stitch_supratim_ai_interface_redesign/stitch_supratim_ai_interface_redesign"
);

const NAV = [
  { id: "tldr", href: "index.html#tldr", label: "TL;DR" },
  { id: "overview", href: "overview.html", label: "Overview" },
  { id: "architecture", href: "architecture.html", label: "Architecture" },
  { id: "roadmap", href: "roadmap.html", label: "Roadmap" },
  { id: "testrun", href: "testrun.html", label: "Test Run" },
  { id: "install", href: "install.html", label: "Install" },
  { id: "structure", href: "structure.html", label: "Structure" },
];

function readStitch(name) {
  return fs.readFileSync(path.join(stitch, name, "code.html"), "utf8");
}

function extractMain(html) {
  const start = html.indexOf("<main");
  const end = html.indexOf("</main>") + 7;
  return html.slice(start, end);
}

function head(title) {
  return `<!DOCTYPE html>
<html class="dark" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Supratim</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <script src="assets/js/tailwind-config.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/css/theme.css" />
</head>`;
}

function nav(active) {
  const links = NAV.map((item) => {
    const isActive = item.id === active;
    const cls = isActive
      ? "text-primary font-bold active-nav-glow relative"
      : "text-on-surface-variant font-medium hover:text-primary transition-colors duration-300";
    return `<a class="${cls} font-sans text-[11px] uppercase tracking-wide whitespace-nowrap" href="${item.href}">${item.label}</a>`;
  }).join("\n        ");

  return `<header class="glass-nav fixed top-0 w-full z-50 h-20">
  <div class="flex justify-between items-center w-full px-gutter max-w-[1280px] mx-auto h-full gap-4">
    <a href="index.html" class="flex items-center gap-3 flex-shrink-0">
      <span class="material-symbols-outlined text-primary text-2xl">terminal</span>
      <span class="font-display text-xl font-bold text-on-surface tracking-tighter">Supratim</span>
    </a>
    <nav class="hidden md:flex items-center gap-5 lg:gap-6 nav-scroll overflow-x-auto max-w-[58vw]">
        ${links}
    </nav>
    <a href="install.html" class="bg-primary-container text-on-primary-fixed font-bold px-5 py-2.5 rounded-lg hover:brightness-110 transition-all active:scale-95 text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0">Get Started</a>
  </div>
</header>`;
}

function footer() {
  return `<footer class="glass-footer mt-24">
  <div class="max-w-[1280px] mx-auto px-gutter py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
      <div class="md:col-span-2">
        <div class="flex items-center gap-3 mb-6">
          <span class="material-symbols-outlined text-primary text-xl">terminal</span>
          <span class="font-display text-2xl font-bold text-on-surface tracking-tighter">Supratim</span>
        </div>
        <p class="text-on-surface-variant text-sm max-w-sm mb-8 leading-relaxed">
          Open-source, model-agnostic agentic coding agent. Built on Pi, showcasing Sarvam AI by default.
        </p>
        <div class="flex gap-4">
          <a class="text-on-surface-variant hover:text-primary transition-colors" href="https://github.com/dattaprasad-r-ekavade/supratim" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <span class="material-symbols-outlined">code</span>
          </a>
          <a class="text-on-surface-variant hover:text-primary transition-colors" href="https://www.npmjs.com/package/supratim" target="_blank" rel="noopener noreferrer" aria-label="npm">
            <span class="material-symbols-outlined">package_2</span>
          </a>
        </div>
      </div>
      <div>
        <h5 class="font-sans text-[11px] text-primary uppercase tracking-wide mb-6">Pages</h5>
        <ul class="space-y-3 text-sm">
          <li><a class="text-on-surface-variant hover:text-on-surface" href="overview.html">Overview</a></li>
          <li><a class="text-on-surface-variant hover:text-on-surface" href="roadmap.html">Roadmap</a></li>
          <li><a class="text-on-surface-variant hover:text-on-surface" href="testrun.html">Test Run</a></li>
          <li><a class="text-on-surface-variant hover:text-on-surface" href="install.html">Install</a></li>
        </ul>
      </div>
      <div>
        <h5 class="font-sans text-[11px] text-primary uppercase tracking-wide mb-6">Ecosystem</h5>
        <ul class="space-y-3 text-sm">
          <li><a class="text-on-surface-variant hover:text-on-surface" href="https://pi.dev" target="_blank" rel="noopener noreferrer">Built on Pi</a></li>
          <li><a class="text-on-surface-variant hover:text-on-surface" href="https://www.sarvam.ai" target="_blank" rel="noopener noreferrer">Sarvam AI</a></li>
          <li><a class="text-on-surface-variant hover:text-on-surface" href="../LICENSE">MIT License</a></li>
          <li><a class="text-on-surface-variant hover:text-on-surface" href="../THIRD_PARTY_NOTICES.md">Third-party notices</a></li>
        </ul>
      </div>
    </div>
    <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-resplendent-border gap-4">
      <p class="font-sans text-xs text-on-surface-variant">© 2026 Dattaprasad Ekavade</p>
      <span class="font-sans text-xs text-on-surface-variant">v0.2.0</span>
    </div>
  </div>
</footer>`;
}

function page(title, active, body) {
  return `${head(title)}
<body class="selection:bg-primary-container selection:text-on-primary-fixed">
<div class="ambient-layer" aria-hidden="true">
  <div class="ambient-orb ambient-orb--coral"></div>
  <div class="ambient-orb ambient-orb--teal"></div>
  <div class="ambient-orb ambient-orb--warm"></div>
</div>
<div class="grain-overlay"></div>
${nav(active)}
${body}
${footer()}
<script src="assets/js/main.js"></script>
</body>
</html>`;
}

function patchHomeMain(main) {
  return main
    .replace(
      /<button class="w-full md:w-auto px-8 py-4 bg-primary[\s\S]*?Get Started\s*<\/button>/,
      `<a href="install.html" class="w-full md:w-auto px-8 py-4 bg-primary text-on-primary-fixed font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95 micro-chisel no-underline">
<span class="material-symbols-outlined">terminal</span>
                    Get Started
                </a>`
    )
    .replace(
      /<button class="w-full md:w-auto px-8 py-4 bg-transparent[\s\S]*?View on GitHub\s*<\/button>/,
      `<a href="https://github.com/dattaprasad-r-ekavade/supratim" target="_blank" rel="noopener noreferrer" class="w-full md:w-auto px-8 py-4 glass-btn-ghost text-on-surface font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 no-underline">
<span class="material-symbols-outlined">code</span>
                    View on GitHub
                </a>`
    )
    .replace(
      /<div class="relative flex items-center justify-between px-6 py-4 bg-surface-container-lowest border border-resplendent-border rounded-xl micro-chisel">/,
      `<div class="relative flex items-center justify-between px-6 py-4 glass-command rounded-xl micro-chisel cursor-pointer" data-copy="npx supratim" role="button" tabindex="0">`
    )
    .replace(
      /<button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">content_copy<\/button>/,
      `<span class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">content_copy</span>`
    )
    .replace(
      'href="testrun.html"',
      'href="testrun.html"'
    )
    .replace(
      /<a class="flex items-center gap-2 text-primary font-bold hover:underline" href="testrun.html">/,
      `<a class="flex items-center gap-2 text-primary font-bold hover:underline no-underline" href="testrun.html">`
    )
    .replace(
      /<span class="px-3 py-1 rounded-full bg-surface-container border border-resplendent-border/g,
      '<span class="glass-chip px-3 py-1 rounded-full'
    )
    .replace(
      /<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high border border-resplendent-border mb-8 backdrop-blur-sm">/,
      '<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-chip mb-8">'
    )
    .replace(
      /<!-- Next Phase Card -->[\s\S]*?<\/section>\s*<\/main>/,
      (block) =>
        block.replace(
          "</section>\n</main>",
          `<p class="mt-8 pt-4 border-t border-resplendent-border text-sm text-on-surface-variant font-sans text-center md:text-left px-2">
Details → <a href="testrun.html" class="text-primary hover:underline">Test Run</a>
· <a href="https://github.com/dattaprasad-r-ekavade/supratim/blob/main/docs/Testrun-ollama.md" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Ollama comparison doc</a>
</p>
</section>
</main>`
        )
    );
}

function indexPage() {
  let main = extractMain(readStitch("supratim_home_redesigned"));
  main = patchHomeMain(main);
  return page("Home", "tldr", main);
}

function architecturePage() {
  const layers = [
    ["CLI surface", "<code>supratim</code> CLI + <code>pi-tui</code> (InteractiveMode)"],
    ["Core engine", "<code>pi-agent-core</code> — tool loop, state, sessions"],
    ["Provider layer", "<code>pi-ai</code> + Sarvam / Ollama via <code>models.json</code>"],
    ["Extensions", "<code>sarvam-compat</code> · <code>usage-hud</code> · <code>api-debug</code> · <code>ts-verify</code> · <code>turn-limit</code>"],
    ["Security", "API keys in OS credential manager — never plaintext on disk"],
    ["Config dir", "<code>~/.supratim/</code> (override with <code>SUPRATIM_AGENT_DIR</code>)"],
  ];

  const layerRows = layers
    .map(
      ([layer, stack]) =>
        `<tr><td>${layer}</td><td>${stack}</td></tr>`
    )
    .join("\n");

  const body = `<main class="pt-32 pb-24 px-gutter max-w-[1280px] mx-auto relative">
<section class="mb-20 text-center md:text-left glass-panel p-8 md:p-10">
<div class="inline-flex items-center gap-2 px-3 py-1 glass-chip rounded-full mb-6">
<span class="w-2 h-2 rounded-full bg-primary biological-pulse"></span>
<span class="font-sans text-[10px] text-primary uppercase tracking-[0.2em]">System Integrity: Optimal</span>
</div>
<h1 class="font-display text-5xl md:text-6xl mb-6 text-on-surface leading-none tracking-tight">Architecture</h1>
<p class="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
Each layer maps onto a Pi package. Our custom code lives in the thin extension layer on top.
</p>
</section>

<div class="grid grid-cols-1 md:grid-cols-12 gap-bento-gap mb-12">
<div class="md:col-span-8 resplendent-card bg-surface-container-lowest/80 backdrop-blur-md rounded-xl p-8 relative overflow-hidden flex flex-col min-h-[420px]">
<div class="flex justify-between items-center mb-10">
<h3 class="font-sans text-[10px] text-primary tracking-[0.2em] uppercase">Core Interaction Matrix</h3>
<span class="font-sans text-sm text-on-surface-variant">v0.2.0</span>
</div>
<div class="flex-grow flex items-center justify-center">
<div class="grid grid-cols-3 gap-8 w-full max-w-2xl">
<div class="flex flex-col items-center gap-4">
<div class="w-20 h-20 rounded-xl bg-surface-container-high border border-resplendent-border flex items-center justify-center hover:border-primary transition-all">
<span class="material-symbols-outlined text-4xl text-on-surface-variant">hub</span>
</div>
<span class="font-sans text-[10px] uppercase tracking-widest text-on-surface">Pi Engine</span>
</div>
<div class="flex items-center justify-center">
<div class="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent relative">
<div class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full biological-pulse"></div>
</div>
</div>
<div class="flex flex-col items-center gap-4">
<div class="w-20 h-20 rounded-xl bg-surface-container-high border border-primary/40 flex items-center justify-center hero-glow-pulse">
<span class="material-symbols-outlined text-4xl text-primary">bolt</span>
</div>
<span class="font-sans text-[10px] uppercase tracking-widest text-primary">Sarvam AI</span>
</div>
</div>
<div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
<div class="h-16 w-px bg-gradient-to-b from-primary/50 to-transparent"></div>
<div class="p-4 bg-surface-container-high border border-resplendent-border rounded-lg flex items-center gap-3">
<span class="material-symbols-outlined text-on-surface-variant">cloud_queue</span>
<span class="font-sans text-sm">Ollama Cloud Layer</span>
</div>
</div>
</div>
</div>

<div class="md:col-span-4 resplendent-card bg-surface-container-low/80 backdrop-blur-md rounded-xl p-6 flex flex-col justify-between">
<div>
<h3 class="font-sans text-[10px] text-on-surface-variant tracking-[0.2em] uppercase mb-6">Model Agnostic</h3>
<p class="text-on-surface-variant mb-6 leading-relaxed text-sm">
Swap providers via environment variables. Sarvam showcased by default; Ollama Cloud for hard cross-file tasks.
</p>
</div>
<div class="space-y-3">
<div class="flex items-center justify-between p-3 bg-surface-container-highest rounded border border-resplendent-border font-mono text-xs">
<span>SUPRATIM_PROVIDER</span>
<span class="text-primary">ollama-cloud</span>
</div>
<div class="flex items-center justify-between p-3 bg-surface-container-highest rounded border border-resplendent-border font-mono text-xs">
<span>DEFAULT_MODEL</span>
<span class="text-primary">sarvam-105b</span>
</div>
</div>
</div>

<div class="md:col-span-6 resplendent-card bg-surface-container-low/80 backdrop-blur-md rounded-xl p-8">
<div class="p-3 bg-primary/10 rounded-lg border border-primary/20 inline-block mb-4">
<span class="material-symbols-outlined text-primary">autorenew</span>
</div>
<h3 class="font-display text-2xl mb-3 text-on-surface">Agentic Loop</h3>
<p class="text-on-surface-variant text-sm leading-relaxed">
<code>pi-agent-core</code> drives read → edit → bash cycles until the model synthesises a final answer or guards cut the loop.
</p>
</div>
<div class="md:col-span-6 resplendent-card bg-surface-container-low/80 backdrop-blur-md rounded-xl p-8">
<div class="p-3 bg-on-surface-variant/10 rounded-lg border border-resplendent-border inline-block mb-4">
<span class="material-symbols-outlined text-on-surface-variant">verified_user</span>
</div>
<h3 class="font-display text-2xl mb-3 text-on-surface">Verification Gates</h3>
<p class="text-on-surface-variant text-sm leading-relaxed">
<code>ts-verify</code> post-edit checks and <code>turn-limit</code> (30 turns) prevent infinite tool loops — shipped in Phase 0b.
</p>
</div>
</div>

<section class="content-section">
<h2 class="font-display text-3xl mb-2">Stack Layers</h2>
<table class="arch-table">
<thead><tr><th>Layer</th><th>Stack</th></tr></thead>
<tbody>${layerRows}</tbody>
</table>

<table class="models-table">
<thead><tr><th>Model</th><th>Context</th><th>Input / 1M tokens</th><th>Output / 1M tokens</th></tr></thead>
<tbody>
<tr><td>sarvam-105b <span class="default-badge">Default</span></td><td>128K</td><td>₹4</td><td>₹16</td></tr>
<tr><td>sarvam-30b</td><td>64K</td><td>₹2.5</td><td>₹10</td></tr>
</tbody>
</table>
</section>
</main>`;

  return page("Architecture", "architecture", body);
}

function roadmapPage() {
  const body = `<main class="pt-32 pb-24 px-gutter max-w-[1280px] mx-auto relative">
<section class="mb-16 text-center md:text-left glass-panel p-8 md:p-10">
<div class="inline-flex items-center gap-2 px-3 py-1 glass-chip rounded-full mb-6">
<span class="flex h-2 w-2 rounded-full bg-primary biological-pulse"></span>
<span class="font-sans text-[10px] uppercase tracking-widest">Phases 0 &amp; 1 Shipped</span>
</div>
<h1 class="font-display text-5xl md:text-6xl mb-6 text-on-surface tracking-tight">Build Roadmap</h1>
<p class="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
One shippable increment per phase. The sequence is the deliverable.
</p>
</section>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-bento-gap">
<aside class="lg:col-span-4 resplendent-card rounded-xl p-8 flex flex-col gap-6 glass-card">
<h3 class="font-sans text-[10px] text-primary tracking-[0.2em] uppercase">Mission Control</h3>
<div class="p-4 rounded-lg bg-surface-container-high border border-resplendent-border">
<span class="font-sans text-[10px] text-on-surface-variant mb-2 block uppercase">Current Version</span>
<div class="flex items-baseline gap-2">
<span class="font-display text-3xl text-primary">v0.2.0</span>
<span class="text-on-surface-variant text-sm font-sans">Stable</span>
</div>
</div>
<div class="p-6 rounded-lg bg-primary-container/10 border border-primary/20 mt-auto">
<p class="text-sm italic text-on-surface-variant mb-4">"Speed vs loop reliability — use Ollama for cross-file; Sarvam for T1–T4."</p>
<a href="testrun.html" class="text-primary text-sm font-bold flex items-center gap-1 no-underline hover:underline">Phase 0 results <span class="material-symbols-outlined text-sm">arrow_forward</span></a>
</div>
</aside>

<div class="lg:col-span-8">
<div class="timeline">
<div class="phase done">
<div class="phase-dot"><span class="material-symbols-outlined text-sm">check</span></div>
<div class="phase-body">
<div class="phase-header">
<span class="phase-title">Phase 0 — Spike &amp; Foundation</span>
<span class="tag shipped">Shipped</span>
</div>
<p class="phase-desc">Pi + Sarvam spike, friction log, model reliability test, tsc-verify + turn-limit guards · <a href="testrun.html" class="text-primary no-underline">see test run</a></p>
</div>
</div>
<div class="phase done">
<div class="phase-dot"><span class="material-symbols-outlined text-sm">check</span></div>
<div class="phase-body">
<div class="phase-header">
<span class="phase-title">Phase 1 — CLI + Provider + Usage + npm publish</span>
<span class="tag shipped">Shipped</span>
</div>
<p class="phase-desc">Secure key onboarding, live INR usage HUD, MIT CLI — published to npm</p>
</div>
</div>
<div class="phase active">
<div class="phase-dot"><span class="material-symbols-outlined text-sm">sync</span></div>
<div class="phase-body ring-1 ring-primary/20 border-primary/30">
<div class="phase-header">
<span class="phase-title">Phase 2 — MCP &amp; Agentic Depth</span>
<span class="tag active">In progress</span>
</div>
<p class="phase-desc">MCP client layer, structured exploration for T6-class tasks, BYOK polish · informed by Phase 0 test results</p>
</div>
</div>
<div class="phase">
<div class="phase-dot"><span class="material-symbols-outlined text-sm">layers</span></div>
<div class="phase-body">
<div class="phase-header">
<span class="phase-title">Phase 3 — Compaction + CLI v1</span>
<span class="tag planned">Planned</span>
</div>
<p class="phase-desc">Context compaction, feature parity, OSS launch</p>
</div>
</div>
<div class="phase">
<div class="phase-dot"><span class="material-symbols-outlined text-sm">desktop_windows</span></div>
<div class="phase-body">
<div class="phase-header">
<span class="phase-title">Phase 4–6 — GUI &amp; v1.0</span>
<span class="tag planned">Planned</span>
</div>
<p class="phase-desc">Tauri GUI, dual modes (Agent + Developer), packaging, docs site</p>
</div>
</div>
</div>
</div>
</div>
</main>`;

  return page("Roadmap", "roadmap", body);
}

function overviewPage() {
  const body = `<main class="pt-32 pb-24 px-gutter max-w-[1280px] mx-auto">
<section class="mb-16 glass-panel p-8 md:p-10">
<h1 class="font-display text-5xl md:text-6xl mb-6 text-on-surface tracking-tight">Overview</h1>
<p class="section-lead text-lg">A terminal-first coding agent: read, write, edit, and run commands in your project — powered by Sarvam AI out of the box. Built on the open-source <strong class="text-on-surface">Pi</strong> toolkit.</p>
</section>

<section class="content-section" id="overview">
<h2 class="font-display text-3xl">What is Supratim?</h2>
<div class="card-grid mt-8">
<div class="card resplendent-card glass-card">
<div class="card-icon icon-orange">🎯</div>
<h3>Dogfood-First</h3>
<p>Daily use in real repos is the only benchmark. Every phase ships something you'll actually use.</p>
</div>
<div class="card resplendent-card glass-card">
<div class="card-icon icon-teal">🔌</div>
<h3>Model-Agnostic</h3>
<p>Sarvam showcased by default. Swap to any provider or local model — Pi is already BYOK.</p>
</div>
<div class="card resplendent-card glass-card">
<div class="card-icon icon-blue">🧩</div>
<h3>Depend, Don't Fork</h3>
<p>Built on Pi packages. Stays aligned with upstream — we extend, not duplicate.</p>
</div>
</div>
</section>

<section class="content-section mt-16" id="features">
<h2 class="font-display text-3xl">What's Ready Today</h2>
<p class="section-lead">Phases 0 &amp; 1 are fully shipped and published.</p>
<div class="card-grid">
<div class="card resplendent-card glass-card">
<div class="card-icon icon-teal">🔑</div>
<h3>Secure Key Onboarding</h3>
<p>TUI wizard on first run. Keys stored in Windows Credential Manager / macOS Keychain via <code>keytar</code> — never written to disk.</p>
</div>
<div class="card resplendent-card glass-card">
<div class="card-icon icon-orange">📊</div>
<h3>Live Usage HUD</h3>
<p>Real-time token counts, running cost in ₹, context window %, current model — always visible in the footer.</p>
</div>
<div class="card resplendent-card glass-card">
<div class="card-icon icon-blue">🛠️</div>
<h3>Core Tools</h3>
<p><code>read</code>, <code>write</code>, <code>edit</code>, <code>bash</code> — all scoped to your project directory via Pi.</p>
</div>
<div class="card resplendent-card glass-card">
<div class="card-icon icon-green">⚡</div>
<h3>Sarvam Optimised</h3>
<p>Compat extension flattens Pi content blocks; handles Sarvam tier <code>max_tokens</code> limits automatically.</p>
</div>
</div>
</section>
</main>`;

  return page("Overview", "overview", body);
}

function installPage() {
  const body = `<main class="pt-32 pb-24 px-gutter max-w-[1280px] mx-auto">
<section class="mb-12 glass-panel p-8 md:p-10">
<h1 class="font-display text-5xl md:text-6xl mb-6 text-on-surface tracking-tight">Get Started</h1>
<p class="section-lead text-lg">You need a <a href="https://dashboard.sarvam.ai" target="_blank" rel="noopener noreferrer">Sarvam API key</a> (<code>sk_…</code>) and Node.js ≥ 20.6.</p>
</section>

<section class="content-section resplendent-card glass-card rounded-xl p-8" id="install">
<div class="install-tabs">
<button class="install-tab active" onclick="switchTab(this, 'tab-npx')">npx</button>
<button class="install-tab" onclick="switchTab(this, 'tab-global')">Global install</button>
<button class="install-tab" onclick="switchTab(this, 'tab-source')">From source</button>
</div>

<div id="tab-npx" class="install-block active">
<button type="button" class="copy-block-btn" onclick="copyBlock('tab-npx')"><span class="material-symbols-outlined text-sm">content_copy</span> Copy</button>
<div class="cmt"># Run instantly — no install step needed</div>
<div data-line="npx supratim"><span class="kw">$</span> <span class="cmd">npx <span class="pkg">supratim</span></span></div>
<div class="cmt"># One-shot print mode</div>
<div data-line='npx supratim -p "Summarise this repo"'><span class="kw">$</span> <span class="cmd">npx supratim -p <span class="str">"Summarise this repo"</span></span></div>
<div class="cmt"># Validate your API key</div>
<div data-line="npx supratim --verify-key"><span class="kw">$</span> <span class="cmd">npx supratim --verify-key</span></div>
</div>

<div id="tab-global" class="install-block">
<button type="button" class="copy-block-btn" onclick="copyBlock('tab-global')"><span class="material-symbols-outlined text-sm">content_copy</span> Copy</button>
<div class="cmt"># Install once, run anywhere</div>
<div data-line="npm install -g supratim"><span class="kw">$</span> <span class="cmd">npm install -g <span class="pkg">supratim</span></span></div>
<div class="cmt"># Then just</div>
<div data-line="supratim"><span class="kw">$</span> <span class="cmd">supratim</span>                 <span class="cmt"># interactive TUI</span></div>
<div data-line="supratim --verify-key"><span class="kw">$</span> <span class="cmd">supratim --verify-key</span>    <span class="cmt"># validate key</span></div>
<div data-line="supratim --setup-key"><span class="kw">$</span> <span class="cmd">supratim --setup-key</span>     <span class="cmt"># re-run wizard</span></div>
<div data-line="supratim --help"><span class="kw">$</span> <span class="cmd">supratim --help</span>          <span class="cmt"># all options</span></div>
</div>

<div id="tab-source" class="install-block">
<button type="button" class="copy-block-btn" onclick="copyBlock('tab-source')"><span class="material-symbols-outlined text-sm">content_copy</span> Copy</button>
<div class="cmt"># Clone and build</div>
<div data-line="git clone https://github.com/dattaprasad-r-ekavade/supratim.git"><span class="kw">$</span> <span class="cmd">git clone https://github.com/dattaprasad-r-ekavade/supratim.git</span></div>
<div data-line="cd supratim"><span class="kw">$</span> <span class="cmd">cd supratim</span></div>
<div data-line="npm install"><span class="kw">$</span> <span class="cmd">npm install</span></div>
<div data-line="npm run build"><span class="kw">$</span> <span class="cmd">npm run build</span></div>
<div class="cmt"># Run</div>
<div data-line="npm run dev"><span class="kw">$</span> <span class="cmd">npm run dev</span>              <span class="cmt"># interactive TUI</span></div>
<div data-line="npm run verify-key"><span class="kw">$</span> <span class="cmd">npm run verify-key</span>       <span class="cmt"># validate key</span></div>
</div>
</section>
</main>`;

  return page("Install", "install", body);
}

function structurePage() {
  const tree = `<pre class="tree"><span class="tr-dir">supratim/</span>
├── <span class="tr-dir">src/</span>
│   ├── <span class="tr-file">cli.ts</span>             <span class="tr-dim">Entry point, argument parsing, interactive + print modes</span>
│   ├── <span class="tr-file">config.ts</span>          <span class="tr-dim">Agent dir, version, model constants</span>
│   ├── <span class="tr-file">onboarding.ts</span>      <span class="tr-dim">TUI key wizard (first-run)</span>
│   ├── <span class="tr-file">secure-storage.ts</span>  <span class="tr-dim">OS credential manager via keytar</span>
│   ├── <span class="tr-file">sarvam-verify.ts</span>   <span class="tr-dim">Live API key validation</span>
│   └── <span class="tr-dir">extensions/</span>
│       ├── <span class="tr-file">sarvam-compat.ts</span>  <span class="tr-dim">Content block flattening for Sarvam</span>
│       ├── <span class="tr-file">usage-hud.ts</span>      <span class="tr-dim">Live token / cost footer (INR)</span>
│       └── <span class="tr-file">api-debug.ts</span>      <span class="tr-dim">Per-turn API logging (SUPRATIM_DEBUG=1)</span>
├── <span class="tr-dir">config/</span>
│   ├── <span class="tr-file">models.json</span>        <span class="tr-dim">Sarvam provider + model definitions</span>
│   └── <span class="tr-file">settings.json</span>      <span class="tr-dim">Default theme, thinking level</span>
├── <span class="tr-dir">docs/</span>
│   ├── <span class="tr-file">Testrun.md</span>         <span class="tr-dim">Sarvam model eval (→ <a href="testrun.html" class="text-primary no-underline">see test run</a>)</span>
│   ├── <span class="tr-file">Testrun-ollama.md</span>  <span class="tr-dim">Ollama Cloud free tier comparison</span>
│   └── <span class="tr-file">phase0-friction-log.md</span>
└── <span class="tr-dir">landing-page/</span>          <span class="tr-dim">Project overview site</span>
    ├── <span class="tr-file">index.html</span>         <span class="tr-dim">Home + TL;DR</span>
    ├── <span class="tr-file">overview.html</span>      <span class="tr-dim">Overview + features</span>
    ├── <span class="tr-file">architecture.html</span>  <span class="tr-dim">Stack &amp; models</span>
    ├── <span class="tr-file">roadmap.html</span>       <span class="tr-dim">Build phases</span>
    ├── <span class="tr-file">testrun.html</span>       <span class="tr-dim">Phase 0 eval results</span>
    ├── <span class="tr-file">install.html</span>       <span class="tr-dim">Get started</span>
    ├── <span class="tr-file">structure.html</span>     <span class="tr-dim">This page</span>
    └── <span class="tr-dir">assets/</span>              <span class="tr-dim">Shared CSS &amp; JS (theme.css)</span></pre>`;

  const body = `<main class="pt-32 pb-24 px-gutter max-w-[1280px] mx-auto">
<section class="mb-12 glass-panel p-8 md:p-10">
<h1 class="font-display text-5xl md:text-6xl mb-6 text-on-surface tracking-tight">Project Structure</h1>
<p class="section-lead text-lg">Thin on custom code — we stand on Pi and extend cleanly.</p>
</section>
<section class="content-section resplendent-card glass-card rounded-xl p-8" id="structure">
${tree}
</section>
</main>`;

  return page("Project Structure", "structure", body);
}

function testrunPage() {
  const contentFile = path.join(lp, "_content/testrun-body.html");
  let inner;
  if (fs.existsSync(contentFile)) {
    inner = fs.readFileSync(contentFile, "utf8");
  } else {
    const existing = fs.readFileSync(path.join(lp, "testrun.html"), "utf8");
    const match = existing.match(/<section id="testrun"[^>]*>([\s\S]*?)<\/section>/);
    inner = match ? match[1].trim() : "<p>Content missing — restore landing-page/_content/testrun-body.html</p>";
    if (match && !fs.existsSync(path.dirname(contentFile))) {
      fs.mkdirSync(path.dirname(contentFile), { recursive: true });
      fs.writeFileSync(contentFile, inner);
    }
  }

  const body = `<main class="pt-32 pb-24 px-gutter max-w-[1280px] mx-auto">
<section class="mb-10 glass-panel p-6 md:p-8">
<div class="inline-flex items-center gap-2 px-3 py-1 glass-chip rounded-full text-primary mb-6">
<span class="font-sans text-[10px] uppercase tracking-widest">Phase 0c complete</span>
</div>
<h1 class="font-display text-4xl md:text-5xl mb-4 text-on-surface tracking-tight">Model Reliability Test</h1>
</section>
<section id="testrun" class="content-section">${inner}</section>
</main>`;

  return page("Phase 0 Test Run", "testrun", body);
}

// Remove duplicate h2 from testrun inner if present
function finalizeTestrun(html) {
  return html.replace(
    /<h2>Phase 0 — Model Reliability Test<\/h2>\s*/,
    ""
  );
}

const pages = [
  ["index.html", indexPage()],
  ["overview.html", overviewPage()],
  ["architecture.html", architecturePage()],
  ["roadmap.html", roadmapPage()],
  ["install.html", installPage()],
  ["structure.html", structurePage()],
  ["testrun.html", finalizeTestrun(testrunPage())],
];

for (const [file, html] of pages) {
  fs.writeFileSync(path.join(lp, file), html);
}

// Remove old styles.css if present
const oldCss = path.join(lp, "assets/css/styles.css");
if (fs.existsSync(oldCss)) fs.unlinkSync(oldCss);

console.log("Built:", pages.map(([f]) => f).join(", "));
