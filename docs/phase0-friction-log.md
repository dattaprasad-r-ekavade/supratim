# Phase 0 — Friction Log

*Spike: Pi + Sarvam provider integration. Decision: **depend, don't fork**.*

## Validated

| Check | Result |
|-------|--------|
| `pi-coding-agent` installs on Windows (Node 22) | ✅ |
| Sarvam plugs into `pi-ai` via `models.json` (`openai-completions`) | ✅ |
| Sarvam API key auth (`Bearer` + `api-subscription-key`) | ✅ |
| Tool-capable models (`sarvam-30b`, `sarvam-105b`) selectable | ✅ |
| Agent loop + TUI + core tools available without fork | ✅ |

## Provider config (final)

```json
{
  "providers": {
    "sarvam": {
      "baseUrl": "https://api.sarvam.ai/v1",
      "api": "openai-completions",
      "apiKey": "$SARVAM_API_KEY",
      "authHeader": true,
      "headers": { "api-subscription-key": "$SARVAM_API_KEY" },
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": true
      }
    }
  }
}
```

## Friction points

| # | Issue | Status |
|---|-------|--------|
| 1 | **Dual auth headers** — Sarvam accepts both `Authorization: Bearer` and `api-subscription-key`; both are set via `models.json` `headers` | ✅ Resolved |
| 2 | **Cost currency** — Pi footer defaults to `$`; Sarvam prices are in ₹ | ✅ Resolved — custom `usage-hud` extension shows INR |
| 3 | **Key storage** — Pi stores keys in `auth.json` (plaintext); replaced with OS credential manager | ✅ Resolved — `keytar` |
| 4 | **Config dir** — Pi uses `~/.pi/agent`; Supratim uses `~/.supratim/` via `SUPRATIM_AGENT_DIR` | ✅ Resolved |
| 5 | **No native MCP** — Confirmed; deferred to Phase 2 as planned | ⏳ Phase 2 |
| 6 | **Reasoning** — Sarvam supports `reasoning_effort`; `thinkingLevelMap` maps Pi levels to Sarvam values; `off` is unsupported | ✅ Resolved |
| 7 | **User message format** — Pi sends user `content` as a content-block array; Sarvam requires plain strings | ✅ Resolved — `sarvam-compat` extension flattens user content via `before_provider_request` |
| 8 | **max\_tokens tier cap** — Starter tier limits output to 4096 tokens; `maxTokens > 4096` hard-rejects | ✅ Documented — `maxTokens: 4096` in bundled config; cannot be raised |
| 9 | **Pi AbortSignal leak** — `MaxListenersExceededWarning` on every multi-tool session | ⚠️ Open — upstream Pi issue |
| 10 | **sarvam-30b infinite loop** — On multi-step tasks, 30b dispatches tools indefinitely (185+ turns observed); never emits final text | ⚠️ Open — turn-limit guard required |
| 11 | **No per-turn token count in print mode** | ✅ Resolved — `[tokens]` line to stderr via `usage-hud` `agent_end` handler |
| 12 | **Rate-limit cascade** — A looping or high-volume session exhausts Sarvam rate limits and poisons subsequent runs | ⚠️ Open — add cooldown / guard |
| 13 | **105b hallucinates code correctness** — Completes multi-file edits but doesn't run `tsc`; claims success on broken code | ⚠️ Open — post-edit verification step needed |

## Decision

**Depend on Pi packages** (`pi-agent-core`, `pi-ai`, `pi-tui`, `pi-coding-agent` SDK). No fork needed for Phase 0–1 scope.

## Model reliability verdict

Full test methodology, raw results, and project implications: [`docs/Testrun.md`](Testrun.md)  
Ollama Cloud comparison (`qwen3-coder:480b`, `devstral-2:123b`): [`docs/Testrun-ollama.md`](Testrun-ollama.md)

**Summary:**
- `sarvam-105b` — reliable loop up to ~20 tool calls; use as default from Phase 2 onward
- `sarvam-30b` — infinite tool-dispatch loop on multi-step tasks; suitable for single-turn queries only
