/**
 * API debug extension — activated by SUPRATIM_DEBUG=1.
 * Logs raw request payloads, response status, message content, and per-turn
 * token counts to docs/eval-transcripts/debug-<timestamp>.jsonl.
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SARVAM_PROVIDER } from "../config.js";

export default function apiDebugExtension(pi: ExtensionAPI) {
	if (!process.env.SUPRATIM_DEBUG) return;

	const logDir  = join(process.cwd(), "docs", "eval-transcripts");
	const logFile = join(logDir, `debug-${Date.now()}.jsonl`);

	function log(obj: unknown): void {
		try {
			mkdirSync(logDir, { recursive: true });
			appendFileSync(logFile, JSON.stringify(obj) + "\n");
		} catch { /* ignore write errors */ }
	}

	process.stderr.write(`[debug] logging to ${logFile}\n`);

	pi.on("before_provider_request", (event) => {
		const payload = event.payload as Record<string, unknown>;
		const messages = Array.isArray(payload?.messages) ? payload.messages : [];
		log({
			event: "before_provider_request",
			ts: Date.now(),
			model: (payload as { model?: string })?.model,
			max_tokens: (payload as { max_tokens?: number })?.max_tokens,
			reasoning_effort: (payload as { reasoning_effort?: string })?.reasoning_effort,
			message_count: messages.length,
			last_user_message_chars: (() => {
				const last = [...messages].reverse().find((m: { role?: string }) => m.role === "user");
				return last ? JSON.stringify(last).length : 0;
			})(),
		});
	});

	pi.on("after_provider_response", (event) => {
		log({
			event: "after_provider_response",
			ts: Date.now(),
			status: event.status,
			content_type: event.headers["content-type"],
		});
	});

	pi.on("turn_end", (event, ctx) => {
		const msg = event.message;
		const isAssistant = msg.role === "assistant";
		const usage = isAssistant ? (msg as AssistantMessage).usage : null;
		log({
			event: "turn_end",
			ts: Date.now(),
			turnIndex: event.turnIndex,
			role: msg.role,
			usage: usage
				? {
						in: usage.input,
						out: usage.output,
						cacheRead: usage.cacheRead,
						cost: usage.cost.total,
					}
				: null,
			tool_result_count: event.toolResults.length,
			model: ctx.model?.id,
		});
	});

	pi.on("agent_end", (_event, ctx) => {
		let totalIn = 0, totalOut = 0, totalCost = 0, requests = 0;
		for (const entry of ctx.sessionManager.getEntries()) {
			if (entry.type === "message" && entry.message.role === "assistant") {
				const m = entry.message as AssistantMessage;
				requests++; totalIn += m.usage.input; totalOut += m.usage.output; totalCost += m.usage.cost.total;
			}
		}
		const isSarvam = ctx.model?.provider === SARVAM_PROVIDER;
		log({
			event: "agent_end",
			ts: Date.now(),
			model: ctx.model?.id,
			requests,
			totalIn,
			totalOut,
			totalCost,
			currency: isSarvam ? "INR" : "USD",
		});
	});
}
