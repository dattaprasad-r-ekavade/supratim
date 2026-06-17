# Ollama Cloud Model Comparison — Phase 0c

**Date:** 2026-06-17  
**Provider:** Ollama Cloud (`https://ollama.com/v1`)  
**Models:** `qwen3-coder:480b`, `devstral-2:123b`  
**Baseline:** Sarvam `sarvam-105b` from [`Testrun.md`](Testrun.md)

Same 6-task battery, same harness (`scripts/run-eval.ps1`), same guards (`ts-verify`, `turn-limit` at 30 turns).

---

## Setup

```powershell
powershell -File scripts\run-eval.ps1 -Provider ollama-cloud -Model "qwen3-coder:480b" -Tasks 1,2,3,4,5,6 -TimeoutSec 600 -MaxTurns 30
powershell -File scripts\run-eval.ps1 -Provider ollama-cloud -Model "devstral-2:123b" -Tasks 1,2,3,4,5,6 -TimeoutSec 600 -MaxTurns 30
```

Key: `ollamakey.txt` (gitignored). Env: `SUPRATIM_PROVIDER=ollama-cloud`, `SUPRATIM_MODEL=<model>`, `OLLAMA_API_KEY`.

**Pricing note:** Runs used **Ollama Cloud free tier** — no per-token cost, so this pass compares **speed and loop reliability only**, not dollars. Token counts below are workload volume, not spend.

---

## Timing — wall clock per task

| Task | sarvam-105b | qwen3-coder:480b | devstral-2:123b |
|------|-------------|------------------|-----------------|
| T1 Read/summarise | 25 s | **19 s** | 26 s |
| T2 TODO/FIXME grep | **11 s** | 29 s | **12 s** |
| T3 Edit + error handling | **12 s** | 54 s | **15 s** |
| T4 Build + fix | 41 s | 111 s | **18 s** |
| T5 `--dry-run` flag | 99 s (loop, cut) | **107 s (done)** | 123 s (loop, cut) |
| T6 Cross-file exports | 55 s (loop, cut) | **251 s (done)** | **55 s (done)** |
| **Total** | ~243 s + failures | **571 s** | **249 s** |

---

## Token volume per task

| Task | qwen3-coder:480b (in / out / turns) | devstral-2:123b (in / out / turns) |
|------|-------------------------------------|-------------------------------------|
| T1 | 5,378 / 338 / 2 | 5,064 / 319 / 2 |
| T2 | 5,608 / 298 / 3 | 3,073 / 84 / 2 |
| T3 | 11,585 / 617 / 5 | 7,900 / 418 / 4 |
| T4 | 34,411 / 562 / 10 | 3,012 / 23 / 2 |
| T5 | 75,035 / 3,618 / 10 | 266,031 / 4,896 / **31 (cut)** |
| T6 | 225,464 / 2,170 / 25 | 163,921 / 1,392 / 21 |
| **Σ** | **357,481 / 7,603** | **449,001 / 7,132** |

Sarvam 105b T5 alone (Pass 2): 119,362 in / 3,666 out / 21 turns / **₹0.54**.

---

## Outcomes

### qwen3-coder:480b — completes hard tasks, slower on simple ones

- **T1–T4:** All passed with real output. T4 took 111 s (ran build + fixes) vs devstral's 18 s (reported pass without deep verification).
- **T5:** Completed in 10 turns. Added `--dry-run`, reported success. (T4's `npm run build` had rebuilt `dist/` mid-run — a harness artifact to watch for.)
- **T6:** **First model to fully complete cross-file analysis** — listed unused exports (`getModelsPath`, `OllamaVerifyResult`, etc.) in 25 turns, 251 s.
- **Loop risk:** No turn-limit fires on T1–T6. Converges on complex tasks.

### devstral-2:123b — fast on easy tasks, loops on T5

- **T1–T4:** Fastest on T2–T4 (12–18 s). Minimal token use on T4 (23 output tokens — likely shallow "build passed" without tool depth).
- **T5:** Hit 30-turn guard at 123 s (266K input tokens). Same loop signature as Sarvam — never emitted final answer.
- **T6:** Completed in 55 s, 21 turns — full unused-export table. Faster than qwen3 on cross-file despite smaller output.

### vs sarvam-105b

| Dimension | sarvam-105b | qwen3-coder:480b | devstral-2:123b |
|-----------|-------------|-----------------|-----------------|
| Simple tasks (T1–T3) | Fastest | Moderate | Fast |
| Build task (T4) | 41 s | Slow (111 s) | Fast but shallow |
| Multi-file edit (T5) | Loops | **Completes** | Loops |
| Cross-file (T6) | Never completes | Completes (slow) | **Completes (fast)** |
| Cost model | ₹ per token (~₹0.50/task) | **Free tier** — cost N/A | **Free tier** — cost N/A |
| Rate-limit risk | High (hourly quota) | Ollama usage caps (5h / 7d) | Same |

---

## Inferences

1. **Ollama Cloud coding models solve T6** — both qwen3 and devstral produced real cross-file analysis; Sarvam 105b never did in any pass.
2. **devstral-2:123b is the speed champion** on T1–T4 and T6, but **loops on T5** like Sarvam.
3. **qwen3-coder:480b is the reliability champion** — only model to complete all 6 tasks without hitting the turn guard.
4. **On Ollama free tier, cost is not the variable** — compare wall-clock time and whether the loop converges. qwen3 used more time but finished everything; devstral was faster on T6 but looped on T5.
5. **Harness caveat:** T4 runs `npm run build`, which overwrites `dist/` from `src/`. If `src/` is reverted mid-battery, later tasks can break. Keep `src/` stable across a full eval run.

---

## Raw transcripts

`docs/eval-transcripts/ollama-cloud-qwen3-coder-480b-task*.txt`  
`docs/eval-transcripts/ollama-cloud-devstral-2-123b-task*.txt`
