import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SARVAM_PROVIDER } from "../config.js";

type OpenAiMessage = {
	role: string;
	content?: unknown;
	[key: string]: unknown;
};

function flattenUserContent(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content
		.filter((part) => part && typeof part === "object" && (part as { type?: string }).type === "text")
		.map((part) => (part as { text?: string }).text ?? "")
		.join("");
}

function adaptPayloadForSarvam(payload: unknown): unknown {
	if (!payload || typeof payload !== "object") return payload;
	const body = payload as { messages?: OpenAiMessage[] };
	if (!Array.isArray(body.messages)) return payload;

	const messages = body.messages.map((message) => {
		if (message.role !== "user" || typeof message.content === "string") {
			return message;
		}
		return {
			...message,
			content: flattenUserContent(message.content),
		};
	});

	return { ...body, messages };
}

export default function sarvamCompatExtension(pi: ExtensionAPI) {
	pi.on("before_provider_request", (event, ctx) => {
		if (ctx.model?.provider !== SARVAM_PROVIDER) return;
		return adaptPayloadForSarvam(event.payload);
	});
}