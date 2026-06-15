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

1. **Dual auth headers** — Sarvam accepts both `Authorization: Bearer` and `api-subscription-key`; Pi `models.json` supports custom `headers`, so both are set.
2. **Cost currency** — Pi footer defaults to `$`; Sarvam prices are in ₹. Phase 1 adds a custom usage HUD extension showing INR for Sarvam models.
3. **Key storage** — Pi stores keys in `auth.json` (plaintext). Phase 1 uses OS credential manager (`keytar`) instead.
4. **Config dir** — Pi uses `~/.pi/agent`; Sarvam Agent uses `~/.sarvam-agent` via `SARVAM_AGENT_DIR` / `PI_CODING_AGENT_DIR`.
5. **No native MCP** — Confirmed; deferred to Phase 2 as planned.
6. **Reasoning** — Sarvam supports `reasoning_effort`; `thinkingLevelMap` maps Pi levels to Sarvam values; `off` is unsupported.
7. **User message format** — Pi sends user `content` as a content-block array; Sarvam requires plain strings. Fixed via `sarvam-compat` extension (`before_provider_request` hook flattens user content).
8. **max_tokens tier cap** — Starter tier limits `sarvam-30b` to 4096 max output tokens; default 8192 in models.json was rejected. Set `maxTokens: 4096` in bundled config.

## Decision

**Depend on Pi packages** (`pi-agent-core`, `pi-ai`, `pi-tui`, `pi-coding-agent` SDK). No fork needed for Phase 0–1 scope.

## Next (Phase 1 shipped)

- Own CLI (`sarvam`) with Sarvam default provider
- Secure key onboarding (OS credential manager)
- Live token + cost HUD in INR