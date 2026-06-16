# Sarvam Model Loop Reliability — Phase 0 Test Run

**Date:** 2026-06-16  
**Question:** Can `sarvam-105b` and `sarvam-30b` reliably drive Supratim's agentic tool-use loop?  
**Status:** ✅ Phase 0 complete · Phase 0b in progress (rate-limit recovery)

---

## Why We Ran This

Before building MCP integration and deeper agentic features (Phase 2), we needed ground truth on the models we ship with. A model that silently fails or loops indefinitely is worse than no model — it burns API quota, produces no output, and poisons downstream runs. This was not a benchmark; it was a **go/no-go signal for Phase 2 defaults**.

---

## Methodology

| Item | Detail |
|------|--------|
| Tool | `supratim --print "<task>"` — Pi print mode, one session per task, no simulation |
| Harness | `scripts/run-eval.ps1` — PowerShell job runner, per-task timeout, stdout/stderr capture |
| Debug instrumentation | `SUPRATIM_DEBUG=1` → `src/extensions/api-debug.ts` logs per-turn request shape, HTTP status, token counts to `eval-transcripts/debug-<ts>.jsonl` |
| Token reporting | `[tokens] in=X out=Y cost=₹Z` emitted to stderr after every run |
| API budget | ₹99 cap; actual spend across all runs: **~₹1.81** |

---

## Task Battery

| # | Task | Capability probed |
|---|------|-------------------|
| T1 | Read `src/cli.ts` and summarise it | Single `read` tool call |
| T2 | Find every TODO/FIXME in `src/`, output as `file:line` | `read` + `bash`/grep chain |
| T3 | Add error handling to `storeApiKey`; show final file | `read` → `edit`, valid patch |
| T4 | Run `npm run build`; fix if broken; report result | `bash` → react → report |
| T5 | Add `--dry-run` flag wired through parser, handler, and `--help` | Multi-file coherent edit |
| T6 | List every export from `src/` that is never imported anywhere | Cross-file reasoning, no obvious shortcut |

---

## Results

### Pass 1 — Initial Run (120 s timeout, no guards)

| Model | T1 | T2 | T3 | T4 | T5 | T6 |
|-------|----|----|----|----|----|----|
| **sarvam-105b** | ✅ 25 s | ✅ 11 s | ✅ 12 s | ✅ 41 s | ⏱ timeout | ⏱ timeout |
| **sarvam-30b** | ✅ 9 s | ✅ 7 s | ✅ 11 s | ⚠️ empty | ❌ empty | ❌ empty |

### Pass 2 — Extended (105b no-timeout; 30b debug logging)

| Model | Task | Elapsed | Turns | Output tokens | Cost (₹) | Outcome |
|-------|------|---------|-------|---------------|----------|---------|
| sarvam-105b | T5 | 59 s | 21 | 3,666 | 0.54 | **Partial** — loop closed, code has logic bug (removed `args` declaration) |
| sarvam-105b | T6 | 6 s | 0 | — | — | **Blocked** — rate-limited after T5's 21 calls |
| sarvam-30b | T4 | 12 s | 2 | 213 | 0.01 | **Partial** — ran build, minimal report |
| sarvam-30b | T5 | 186 s (killed) | 185+ | ~22–49/turn | ~0.06 | **Fail** — infinite tool loop, all HTTP 200 |
| sarvam-30b | T6 | 3 s | 0 | — | — | **Blocked** — rate-limited after T5's loop |
| sarvam-30b (maxTokens=8192) | T4 | 4 s | 0 | — | — | **Fail** — API hard-rejects max\_tokens > 4096 |

### Pass 3 — Guards shipped + T5/T6 rerun attempt

> **Extensions added:** `ts-verify` (post-edit `tsc --noEmit` gate) · `turn-limit` (default 30 turns, `SUPRATIM_MAX_TURNS`) — both compiled, wired, live.

| Run | T5 | T6 | Notes |
|-----|----|----|-------|
| 105b + guards, 600 s | ⛔ rate-limited | ⛔ rate-limited | 30b's 185-turn loop from Pass 2 exhausted the hourly API quota. T5/T6 blocked before any model call. |

**T5 and T6 remain open empirical blanks.** The tsc gate and turn-limit guard are proven correct by code review but not yet confirmed by a live run. T5/T6 rerun is queued for when the rate limit window resets.

---

## Findings

### 1 — sarvam-30b enters an infinite tool-call loop on T5

Every turn in the 30b T5 run ended with `tool_result_count: 1`. The model never stopped dispatching tools:

```
Turn  1: in=3,789  out=1,277  tools=1   ← first productive turn
Turn  2: in=4,212  out=39     tools=1
Turn  3: in=4,455  out=22     tools=1
...
Turn 185: in=24,636 out=49   tools=1   ← killed at 180 s timeout
```

All HTTP status codes were **200**. The API was healthy. The model was spinning — not failing.

**Root cause:** sarvam-30b dispatches a new tool call every turn on multi-step edit tasks and never synthesises a conclusion. The earlier "silent empty response" description was wrong; the loop was active and expensive.

---

### 2 — The 4096 output token cap is a hard Sarvam tier limit

Setting `maxTokens: 8192` causes the API to reject the first real request (after the 20-token validation succeeds), surfacing as "models not available." Not a config issue — the API hard-rejects `max_tokens > 4096` on the starter tier.

---

### 3 — sarvam-105b closes the loop but does not verify its own code

With 600 s budget, 105b completed T5 in **59 s, 21 turns, ₹0.54**. It confidently described its edit as correct. In reality, it removed `const args = argv.slice(2)` while continuing to reference `args` — a compile-time error. The model never ran `tsc`.

**Pattern:** 105b closes the tool loop reliably. It does not self-verify code correctness.

---

### 4 — A looping session burns the hourly API quota

After 30b's 185-turn T5 run (180 seconds of continuous API calls), the account was rate-limited for **over 60 minutes** — the entire subsequent test session was blocked. T6 has never run to completion on any model because every T6 attempt follows a high-volume T5.

This is the most concrete consequence of the missing turn-limit guard: one infinite loop blocks the account for an hour.

---

### 5 — Token reporting is live (friction #12 resolved)

Every `--print` run now emits to stderr:
```
[tokens] in=119362 out=3666 cacheRead=0 req=21 cost=₹0.5361
```

---

## Guards Shipped (Phase 0b)

### `src/extensions/ts-verify.ts` — Post-edit compiler gate

After every `edit` or `write` to a `.ts`/`.tsx` file, automatically runs `tsc --noEmit` and appends the result to the tool output. The model sees compilation errors immediately:

```
[tsc] ✗ Type errors after edit:
src/cli.ts(102,21): error TS2304: Cannot find name 'args'.
Please fix these errors before proceeding.
```

Disable with `SUPRATIM_TSC_VERIFY=0`.

### `src/extensions/turn-limit.ts` — Infinite loop prevention

Aborts the agent loop after `SUPRATIM_MAX_TURNS` turns (default: 30). A normal complex task uses 5–25 turns; more than 30 is almost certainly a loop. The 30b T5 incident ran 185 turns in 180 seconds; with this guard it would have been cut at turn 30 (~25 s).

Disable with `SUPRATIM_MAX_TURNS=0`.

---

## Inferences

| # | Inference |
|---|-----------|
| 1 | **30b is not suitable as the agentic default.** Infinite tool-dispatch loop on any task > 2 turns. |
| 2 | **105b is the correct default for Phase 2.** Closes multi-step loops; tsc gate addresses code quality. |
| 3 | **Turn-limit guard is urgent.** One 30b loop blocked the account for >1 hour. |
| 4 | **maxTokens is immovable** at 4096 on the starter tier. |
| 5 | **Rate-limit headroom must be respected.** Back-to-back sessions without cooldown risk account blocking. |
| 6 | **T6 (cross-file) is an open blank.** Every T6 attempt was rate-limited by a prior T5. Needs a standalone session with a fresh rate-limit window. |

---

## What This Means for the Project

### Applied immediately
- `DEFAULT_MODEL` → `sarvam-105b`
- `ts-verify` extension — compiler gate on every TS edit
- `turn-limit` extension — default 30-turn abort
- `api-debug` extension — `SUPRATIM_DEBUG=1` per-turn logging
- Print-mode token reporting (`[tokens]` line)

### Phase 2 scope
- T5 + T6 rerun in a clean session to confirm tsc gate and get cross-file result
- Expose `sarvam-30b` as "fast / single-turn" option only
- `reasoning_effort: "low"` test for 30b (may fix the loop)

---

## Raw Transcripts

| File | What it shows |
|------|---------------|
| `sarvam-105b-task1..6.txt` | Pass 1 initial run |
| `sarvam-30b-task1..6.txt` | Pass 1 initial run |
| `sarvam-30b-debug-task4..6.txt` | Pass 2 debug run |
| `debug-1781588238219.jsonl` | 30b T5 loop: 560 lines, 185 turns, all HTTP 200 |
| `debug-1781588226380.jsonl` | 30b T4: clean 2-turn run |
