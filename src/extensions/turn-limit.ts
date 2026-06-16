/**
 * Turn-limit guard.
 *
 * Aborts the agent loop after SUPRATIM_MAX_TURNS tool-call turns to
 * prevent infinite dispatch loops (observed with sarvam-30b on complex
 * tasks). Default: 30 turns. Disable with: SUPRATIM_MAX_TURNS=0
 *
 * The limit counts assistant turns (each turn = one LLM call). A
 * "normal" complex task uses 5–25 turns; >30 is almost certainly a loop.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DEFAULT_MAX_TURNS = 30;

export default function turnLimitExtension(pi: ExtensionAPI) {
	const raw = process.env.SUPRATIM_MAX_TURNS;
	const maxTurns = raw !== undefined ? parseInt(raw, 10) : DEFAULT_MAX_TURNS;

	if (maxTurns === 0) return; // explicitly disabled

	pi.on("turn_end", (event, ctx) => {
		// turnIndex is 0-based, so turnIndex 29 = 30th turn
		if (event.turnIndex >= maxTurns - 1) {
			process.stderr.write(
				`[turn-limit] Reached ${maxTurns} turns (index ${event.turnIndex}) — aborting loop.\n`,
			);
			ctx.abort();
		}
	});
}
