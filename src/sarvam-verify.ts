export interface SarvamVerifyResult {
	ok: boolean;
	model?: string;
	message?: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

export async function verifySarvamApiKey(
	apiKey: string,
	model: string = "sarvam-30b",
): Promise<SarvamVerifyResult> {
	try {
		const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"api-subscription-key": apiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				messages: [{ role: "user", content: "Reply with exactly: OK" }],
				max_tokens: 5,
				temperature: 0,
				reasoning_effort: "low",
			}),
		});

		const body = (await response.json()) as {
			choices?: Array<{ message?: { content?: string | null } }>;
			usage?: {
				prompt_tokens?: number;
				completion_tokens?: number;
				total_tokens?: number;
			};
			error?: { message?: string; code?: string };
		};

		if (!response.ok) {
			return {
				ok: false,
				message: body.error?.message ?? `HTTP ${response.status}`,
			};
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