export interface OllamaVerifyResult {
	ok: boolean;
	model?: string;
	message?: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

export async function verifyOllamaApiKey(
	apiKey: string,
	model: string = "qwen3-coder-next",
): Promise<OllamaVerifyResult> {
	try {
		const response = await fetch("https://ollama.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				messages: [{ role: "user", content: "Reply with exactly: OK" }],
				max_tokens: 5,
				stream: false,
			}),
		});

		const body = (await response.json()) as {
			choices?: Array<{ message?: { content?: string | null } }>;
			usage?: {
				prompt_tokens?: number;
				completion_tokens?: number;
				total_tokens?: number;
			};
			error?: string | { message?: string };
		};

		if (!response.ok) {
			const errMsg =
				typeof body.error === "string"
					? body.error
					: (body.error?.message ?? `HTTP ${response.status}`);
			return { ok: false, message: errMsg };
		}

		const content = body.choices?.[0]?.message?.content?.trim();
		return {
			ok: true,
			model,
			message: content,
			usage: {
				promptTokens: body.usage?.prompt_tokens ?? 0,
				completionTokens: body.usage?.completion_tokens ?? 0,
				totalTokens: body.usage?.total_tokens ?? 0,
			},
		};
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}
