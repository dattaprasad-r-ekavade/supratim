# Supratim

[![npm](https://img.shields.io/npm/v/supratim?color=ff6b35&style=flat-square)](https://www.npmjs.com/package/supratim)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg?style=flat-square)](LICENSE)
[![Node ≥ 20.6](https://img.shields.io/badge/node-%E2%89%A520.6-blue?style=flat-square)](https://nodejs.org)

Open-source, model-agnostic **agentic coding agent** — built on the [Pi](https://pi.dev) toolkit, showcasing [Sarvam AI](https://www.sarvam.ai) by default.

**Repository:** https://github.com/dattaprasad-r-ekavade/supratim  
**npm:** https://www.npmjs.com/package/supratim

Phases 0 & 1 are shipped: CLI, Sarvam provider, secure key onboarding, and live usage HUD in ₹.

> Full visual overview: open [`index.html`](index.html) in your browser.

## What is Supratim?

A terminal-first coding agent that helps you read, write, edit, and run commands in your project — powered by Sarvam AI models (`sarvam-30b`, `sarvam-105b`) out of the box.

Instead of building an agent engine from scratch, Supratim stands on **Pi** (Earendil Works) and focuses on what's uniquely ours: Sarvam integration, secure key onboarding, usage/cost tracking in INR, and (upcoming) an MCP client layer and dual-mode GUI.

| Principle | Description |
|-----------|-------------|
| **Dogfood-first** | Daily use in real repos is the benchmark. Each phase ships something you'd actually use. |
| **Model-agnostic** | Sarvam showcased by default. Swap to other providers or local AI via Pi's BYOK design. |
| **Depend, don't fork** | Depends on Pi npm packages; stays aligned with upstream updates. |

## Architecture

| Layer | Stack |
|-------|-------|
| CLI surface | `supratim` CLI + `pi-tui` (InteractiveMode) |
| Core engine | `pi-agent-core` — tool loop, state, sessions |
| Provider layer | `pi-ai` + Sarvam via `models.json` (OpenAI-compatible) |
| Extensions | `sarvam-compat` · `usage-hud` · onboarding · keytar |
| Security | API keys in OS credential manager — not plaintext |
| Config | `~/.supratim/` (override with `SUPRATIM_AGENT_DIR`) |

### Sarvam models

| Model | Context | Pricing (per 1M tokens) | Default |
|-------|---------|-------------------------|---------|
| `sarvam-30b` | 64K | ₹2.5 input / ₹10 output | Yes |
| `sarvam-105b` | 128K | ₹4 input / ₹16 output | — |

Endpoint: `https://api.sarvam.ai/v1`

## What's ready today

- **Secure key onboarding** — TUI wizard; keys stored in Windows Credential Manager / macOS Keychain via `keytar`
- **Live usage HUD** — Session tokens, request count, running cost in ₹, context %, current model
- **Core tools** — `read`, `write`, `edit`, `bash` (from Pi), scoped to your project directory
- **Sarvam compatibility** — Extension flattens Pi content blocks; handles tier `max_tokens` limits

## Getting started

### Prerequisites

- Node.js ≥ 20.6
- A [Sarvam API key](https://dashboard.sarvam.ai) (`sk_…`)

### Install via npm (recommended)

```bash
# Try instantly — no install required
npx supratim

# Or install globally
npm install -g supratim
supratim
```

### Install from source

```bash
git clone https://github.com/dattaprasad-r-ekavade/supratim.git
cd supratim
npm install
npm run build
node dist/cli.js
```

### Commands

```bash
supratim                              # Interactive TUI (onboarding on first run)
supratim --verify-key                 # Validate stored Sarvam API key
supratim --setup-key                  # Re-run key wizard
supratim -p "Summarize this repo"     # One-shot print mode
supratim --help                       # Show all options
```

Config directory: `~/.supratim/` (Windows: `%USERPROFILE%\.supratim\`).

> **API key formats accepted in `sarvamapi.txt`:**
> ```
> sk_live_abc123...          # bare key on its own line
> key = sk_live_abc123...    # key = value format
> ```

## Roadmap

| Phase | Status | Focus |
|-------|--------|-------|
| 0 — Spike & foundation | Shipped | Pi + Sarvam validation, friction log |
| 1 — CLI, provider, usage | Shipped | Key onboarding, INR usage HUD, MIT CLI |
| 2 — MCP & agentic depth | Next | MCP client layer, hooks |
| 3 — Compaction + CLI v1 | Planned | Context compaction, feature parity |
| 4–6 — GUI & v1.0 | Planned | Tauri + `pi-web-ui`, packaging |

See [`sarvam-agent-build-plan.md`](sarvam-agent-build-plan.md) and [`docs/phase0-friction-log.md`](docs/phase0-friction-log.md) for details.

## Project structure

```
supratim/
├── src/
│   ├── cli.ts
│   ├── onboarding.ts
│   ├── secure-storage.ts
│   ├── sarvam-verify.ts
│   └── extensions/
│       ├── sarvam-compat.ts
│       └── usage-hud.ts
├── config/
│   ├── models.json
│   └── settings.json
├── docs/phase0-friction-log.md
├── index.html
├── THIRD_PARTY_NOTICES.md
└── README.md
```

## Dependencies

| Package | Role |
|---------|------|
| `@earendil-works/pi-coding-agent` | SDK, InteractiveMode, sessions, tools |
| `@earendil-works/pi-agent-core` | Agent runtime, tool-calling loop |
| `@earendil-works/pi-ai` | Unified LLM API |
| `@earendil-works/pi-tui` | Terminal UI |
| `keytar` | OS-native secure credential storage |

## Licenses

**Supratim** is [MIT licensed](LICENSE) — Copyright (c) 2026 Dattaprasad Ekavade.

It is built on the [Pi](https://github.com/earendil-works/pi) toolkit (MIT) by Earendil Works.
Runtime dependencies (`pi-coding-agent`, `pi-ai`, `pi-agent-core`, `pi-tui`, `chalk`, `keytar`) are
all permissive (MIT and similar). Transitive deps include Apache-2.0 packages (mostly AWS SDK via `pi-ai`).

- Full attribution and distribution notes: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
- Regenerate dependency license report: `npm run licenses:report`

**Sarvam AI** is an external API service — users need their own API key and must follow [Sarvam's terms](https://www.sarvam.ai).

The [project overview page](index.html) uses [Google Fonts](https://fonts.google.com) (SIL OFL) and
[Font Awesome](https://fontawesome.com) (free license) via CDN.