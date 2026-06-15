# Sarvam Agent — Build Plan & Timeline (built on Pi)

*Open-source, model-agnostic agentic coding tool. Sarvam showcased by default. Built on the Pi toolkit (Earendil Works), dogfood-first: CLI → full coding agent → dual-mode GUI.*

---

## 1. Overview

We build our own coding agent — CLI first, GUI later — on top of **Pi**, the open-source TypeScript agent toolkit by Mario Zechner / Earendil Works. Pi ships its agent runtime, provider layer, terminal UI, and web-UI components as separate npm packages explicitly meant to be built on. That maps almost one-to-one onto the architecture we want, so instead of assembling an engine from a general-purpose SDK, we stand on a coding-agent-specific foundation and spend our effort on what's actually ours: the Sarvam integration, the MCP layer, the usage/cost HUD, onboarding, and the dual-mode GUI.

Principles carried forward: **dogfood-first** (your daily use is the only benchmark), **model-agnostic with Sarvam showcased** (Pi is already bring-your-own-key across many providers + local), **production-ready over demo**, **MIT from commit one**, and **don't rebuild the commodity parts**.

---

## 2. Why Pi as the foundation

Pi decomposes into packages that line up with the layers we need:

| Pi package | What it gives us | Our layer |
|------------|------------------|-----------|
| `@earendil-works/pi-agent-core` | Agent runtime: tool-calling loop, state management | Core engine |
| `@earendil-works/pi-ai` | Unified LLM API across OpenAI / Anthropic / Google / DeepSeek / local | Provider layer (Sarvam plugs in here) |
| `@earendil-works/pi-tui` | Terminal UI with differential rendering | CLI surface |
| `@earendil-works/pi-web-ui` | Web components for AI chat interfaces | GUI surface (Phase 4+) |
| `@earendil-works/pi-coding-agent` | The reference interactive CLI | Phase 0 dogfood + reference |

Pi's core ships a minimal four-tool set — Read, Write, Edit, Bash — that self-extends at runtime, and it operates inside your actual project directory. So **basic tool calling and project-folder access exist out of the box** — two items off our feature list before we write a line.

What we get for free: the agent loop, multi-provider abstraction, terminal rendering, the four core tools, project-directory operation, and web-UI primitives for the desktop phase.

What we build on top: the Sarvam provider preset, secure key onboarding, the usage/cost HUD, **an MCP layer (see §3)**, context compaction, feature-parity polish, and the dual-mode GUI.

### Depend, don't fork
Because Pi exposes these as packages, we **depend on them and build our own CLI/GUI on top** — we do not fork the Pi repo. This keeps us on upstream updates and keeps our code ours. Fork only if we later need to change Pi internals (we likely won't — Pi is designed to extend via tools/skills/extensions).

---

## 3. The one real gap: MCP

Pi deliberately has **no native MCP support** (its philosophy favors a minimal tool core that self-extends via CLI tools, skills, and extensions). It also omits built-in sub-agents (the recommended pattern is spawning extra instances via tmux) and plan-loading (use markdown plan files).

This matters because MCP is on our feature list and is central to the GUI's Agent mode ("MCPs connecting to it"). So **the MCP client layer is our single largest custom build** — we add it on top of Pi's extension model. The upside: Pi's self-extending tool design gives us a clean seam to attach it. The honest watch-item: budget real time here, because this is the one place we're not getting a head start.

Sub-agents we treat as optional (Pi's tmux pattern is enough); LSP we skip (Pi's author is pointedly against it, and we're matching Claude Code on *features that matter*, not every feature).

---

## 4. Architecture

- **Provider layer (`pi-ai`):** Sarvam added as a custom OpenAI-compatible provider (`https://api.sarvam.ai/v1`, models `sarvam-105b` / `sarvam-30b`), pre-selected and showcased. All other providers and **local AI** (Ollama / LM Studio) flow through the same layer — Pi is already BYOK and provider-agnostic. *Verify exact Sarvam provider config during Phase 0.*
- **Core engine (`pi-agent-core`):** drives the loop and tools. We extend it with the MCP layer and hooks.
- **Usage/cost:** a module we own, reading token counts from the loop and computing cost from a per-model price table — surfaced live in both CLI and GUI (priority feature).
- **Surfaces:** CLI on `pi-tui`; GUI on `pi-web-ui` inside a Tauri shell (lighter than Electron, shared core).
- **Security:** keys in OS-native secure storage (keychain / credential manager); never plaintext.

**Stack:** TypeScript, Pi packages, Tauri (GUI), MCP (custom layer), OS secure-storage lib.

---

## 5. Phase plan

Each phase ends in something you'd actually use and can post as a weekly update. Feature-list items from your spec are tagged `[#n]`.

### Phase 0 — Spike & foundation check (Week 0–1)
- Install `pi-coding-agent`; wire Sarvam as a custom provider in `pi-ai`; do real work in a real repo.
- Validates three things at once: can Sarvam drive the loop, is Pi the right base, how does Sarvam plug into `pi-ai`.
- Decide depend-vs-fork (default: depend). Keep a friction log → it seeds Phase 2.

### Phase 1 — Your CLI on Pi: provider, key, usage (Week 1–3) `[#1, #2]`
- Own CLI package depending on `pi-agent-core` + `pi-ai` + `pi-tui`.
- Sarvam as default/showcased provider; **secure OS-agnostic key onboarding in the TUI** `[#1]`.
- **Live token + cost usage** surfaced in the TUI `[#2]`.
- Ship MIT, `npx`-runnable — dogfooding starts. (Fast, because chat loop + TUI + core tools are Pi's.)

### Phase 2 — MCP + agentic depth (Week 3–7) `[#3, #4]`
- **Build the MCP client layer** on Pi's extension model `[#3]` — the heaviest custom milestone.
- Hooks (pre/post tool execution) `[#3]`.
- Sub-agents via Pi's tmux pattern, optional `[#3]`.
- Project-folder access `[#4]` already provided by Pi's core — verify and expose (ignore rules, project config file).
- Done when it runs a real multi-step task in your repo using MCP tools.

### Phase 3 — Compaction + feature parity → CLI v1 (Week 7–10) `[#5, #6]`
- **Context compaction** for long sessions `[#5]`.
- Feature-parity pass `[#6]`: slash commands, session save/resume, plan mode (markdown plan files, Pi-style), diff approval UX, config files. "Match features, not capability."
- → **CLI v1 / real OSS launch (~week 10).**

### Phase 4 — GUI foundation (Week 10–14) `[#7]`
- Tauri shell + `pi-web-ui` + `pi-agent-core`.
- **Agent mode** first: chat-only screen, inline tool calls + MCP connections.
- **Onboarding** (add Sarvam key, proceed) and the **in-chat usage HUD**.

### Phase 5 — Dual modes: Agent + Developer (Week 14–18) `[#10]`
- **Agent mode** (minimal) + **Developer mode** (VS Code-lite: file tree, editor, diff view, terminal, chat panel).

### Phase 6 — Footprint + packaging → v1.0 (Week 18–22) `[#8, #9]`
- **Reduce RAM / footprint** `[#8]` (Tauri helps; optimize core + lazy-load).
- **Polished packaging** `[#9]`: signed installers (mac/win/linux), auto-update, brew/npm, docs site.
- → **v1.0 (~week 22).**

Building on Pi compresses the CLI arc (engine, tools, TUI, provider come pre-built): CLI v1 lands ~week 10 instead of ~13, and the saved effort shifts onto the MCP layer and the GUI.

---

## 6. GUI specification

**Two modes** (LM Studio-style audience split), one toggle, same engine + session.

- **Agent mode (normal + power users):** single chat screen; tool calls and MCP activity inline; usage HUD docked; no editor.
- **Developer mode (developers):** file tree, editor pane with diff view (approve/reject agent edits), integrated terminal, chat side panel.

**Onboarding (priority):** first-run wizard → Sarvam featured/pre-selected (or "use local AI" / get-a-key link) → paste key → live validation → pick default model → land in chosen mode. Keys in secure storage.

**In-chat usage HUD (priority):** always visible, no tab switching — live session tokens (prompt/completion/total), running cost, request count; inline regulation controls (session budget cap with warn/stop, quick model switch e.g. 105B→30B, context-size limit, `reasoning_effort` toggle). Cost from a per-model price table.

---

## 7. Timeline at a glance

| Phase | Weeks | Output | Feature items |
|-------|-------|--------|---------------|
| 0 | 0–1 | Pi + Sarvam spike; friction log | — |
| 1 | 1–3 | CLI on Pi: key onboarding + usage | #1, #2 |
| 2 | 3–7 | MCP layer + hooks (+ subagents opt.) | #3, #4 |
| 3 | 7–10 | Compaction + parity → **CLI v1** | #5, #6 |
| 4 | 10–14 | GUI foundation (Agent mode, onboarding, HUD) | #7 |
| 5 | 14–18 | Dual modes (Agent + Developer) | #10 |
| 6 | 18–22 | Footprint + packaging → **v1.0** | #8, #9 |

*Estimates for solo, part-time work — they will move. The sequence is the deliverable, not the dates. Each phase is sized to roughly one or more weekly build-in-public updates.*

---

## 8. Open decisions & risks

- **MCP layer effort** — the main custom build and the main schedule risk; validate the attach-point in Phase 0/early Phase 2.
- **Sarvam agentic reliability** — answered by the Phase 0 spike before heavy investment; model-agnostic design means the tool stays useful regardless.
- **Sarvam provider config in `pi-ai`** — confirm custom OpenAI-compatible endpoint support in Phase 0.
- **Track upstream Pi** — depending on packages means watching for breaking changes; pin versions.
- **Naming** — undecided (leading candidates tracked separately).
- **"Works for me" → "works for many"** — guard against your own motivated-tester bias; hold the zero-stake bar.

---

## 9. Build-in-public cadence

Weekly updates on X, each tied to a shipped increment (not narration). When you hit the wall — most likely the MCP layer or Sarvam's loop reliability — post the wall, don't go quiet. Working through friction in public is both better content and the antidote to the start-new-when-it-gets-hard pattern.