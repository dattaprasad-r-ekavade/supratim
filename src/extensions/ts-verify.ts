/**
 * TypeScript verification gate.
 *
 * After every edit/write to a .ts or .tsx file, automatically runs
 * `tsc --noEmit` and appends the result to the tool output so the
 * model sees compilation errors immediately and can fix them before
 * claiming success.
 *
 * Disable with: SUPRATIM_TSC_VERIFY=0
 */
import type { TextContent } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function tsVerifyExtension(pi: ExtensionAPI) {
	if (process.env.SUPRATIM_TSC_VERIFY === "0") return;

	pi.on("tool_result", async (event, ctx) => {
		if (event.isError) return;
		if (event.toolName !== "edit" && event.toolName !== "write") return;

		const filePath = String((event.input as { path?: unknown }).path ?? "");
		if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return;

		try {
			const result = await pi.exec("node", ["node_modules/.bin/tsc", "--noEmit", "--pretty", "false"], {
				cwd: ctx.cwd,
				timeout: 30_000,
			});

			const raw = (result.stdout + result.stderr).trim();
			const passed = result.code === 0;
			const summary = passed
				? "[tsc] ✓ No type errors — edit is type-safe."
				: `[tsc] ✗ Type errors after edit:\n${raw}\nPlease fix these errors before proceeding.`;

			const append: TextContent = { type: "text", text: `\n\n${summary}` };
			return { content: [...event.content, append] };
		} catch {
			// tsc unavailable — silently skip
		}
	});
}
