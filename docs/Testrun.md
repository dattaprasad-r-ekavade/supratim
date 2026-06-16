# Sarvam Model Loop Reliability — Phase 0 Test Run

**Date:** 2026-06-16  
**Question:** Can `sarvam-105b` and `sarvam-30b` reliably drive Supratim's agentic tool-use loop?  
**Status:** ✅ Phase 0 + Phase 0b complete

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

### Pass 3 — Guards live + BOM fix + T5/T6 rerun

> **Root cause of prior failures resolved:** PowerShell's `Set-Content -Encoding UTF8` writes a UTF-8 BOM, which breaks `JSON.parse` on `~/.supratim/models.json`. Every run from Pass 2 onwards was failing immediately after the validation ping because the model registry couldn't load its config. Fixed by writing with `[System.Text.UTF8Encoding]::new($false)`.

| Model | Task | Elapsed | Turns | Output tokens | Cost (₹) | Outcome |
|-------|------|---------|-------|---------------|----------|---------|
| sarvam-105b + guards | T5 | 99 s | 30 (cut) | 3,022 | 0.92 | **Cut by turn-limit** — loop, partial edit |
| sarvam-105b + guards | T6 | 55 s | 30 (cut) | 2,871 | 1.24 | **Cut by turn-limit** — loop, no output |

**Turn-limit guard proved effective:** T5 and T6 were cut at 30 turns instead of running to 185+ turns. Without the guard these would have burned the account's hourly quota again.

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

### 5 — sarvam-105b also loops on complex tasks

The loop pattern is not exclusive to 30b. In Pass 3, 105b on both T5 and T6 showed the same signature:

```
T1: out=1,170  tools=1   ← productive
T2: out=300    tools=1   ← productive
T3: out=11     tools=1   ← collapsing
T4: out=330    tools=1   ← brief recovery
T5-T14: out=21-22  tools=1  ← loop (9 consecutive turns)
T15: out=294   tools=1   ← brief recovery
T16-T30: out=19-43  tools=1  ← loop (cut by guard)
```

T6 (cross-file) collapsed after turn 2 and never recovered, generating 14–19 tokens per turn for the remaining 28 turns. The tsc-verify gate caused brief recoveries in T5 (the model re-reads and re-tries) but the model cannot sustain convergence on multi-file tasks requiring sustained reasoning.

The 30-turn default allows 3–5 productive attempts with recovery before the guard fires. This is appropriate: complex tasks either succeed within 25 turns or aren't succeeding at all.

### 6 — PowerShell UTF-8 BOM corruption blocked all Pass 2b runs

All T5/T6 retry attempts after Pass 2 returned "Sarvam models not available" — attributed to rate-limiting but actually caused by a BOM (`0xEF 0xBB 0xBF`) at the start of `~/.supratim/models.json`. PowerShell's `Set-Content -Encoding UTF8` (Windows PowerShell 5.x) writes UTF-8 with BOM by default. The eval harness wrote it during the `MaxTokens` patch-and-restore step; `JSON.parse` then failed. Fixed by using `[System.Text.UTF8Encoding]::new($false)` throughout the harness.

### 8 — Token reporting is live (friction #12 resolved)

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
| 1 | **Both 30b and 105b loop on multi-file tasks.** 105b collapses to 21-token tool calls after 2–6 productive turns; 30b collapses to 22-49 tokens from turn 2. |
| 2 | **105b remains the better default.** It makes more productive turns (1,170 tokens on T5 turn 1) and partially implements changes before collapsing. |
| 3 | **Turn-limit guard is essential for both models — now shipped.** Pass 3 confirmed: cuts 105b loop at 30 turns (₹0.92) rather than 185+ (₹4+). |
| 4 | **tsc-verify gate causes brief recoveries but cannot prevent the loop.** Valuable for surfacing errors; insufficient alone to achieve convergence. |
| 5 | **maxTokens is immovable at 4096** on the starter tier. |
| 6 | **PowerShell UTF-8 BOM corrupts models.json silently.** All harness writes must use `UTF8NoBOM`. |
| 7 | **T6 (cross-file) needs structured exploration within token budget.** 298K input tokens for 30 turns is unsustainable. |

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
