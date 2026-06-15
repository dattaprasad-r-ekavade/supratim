import { Editor, ProcessTerminal, Text, TUI } from "@earendil-works/pi-tui";
import chalk from "chalk";
import { DEFAULT_MODEL, SARVAM_PROVIDER } from "./config.js";
import { verifySarvamApiKey } from "./sarvam-verify.js";
import { storeApiKey } from "./secure-storage.js";

type OnboardingResult =
	| { ok: true; apiKey: string; model: string }
	| { ok: false; reason: "cancelled" };

const editorTheme = {
	borderColor: (text: string) => chalk.cyan(text),
	selectList: {
		selectedPrefix: (text: string) => chalk.cyan(text),
		selectedText: (text: string) => chalk.bold(text),
		description: (text: string) => chalk.dim(text),
		scrollInfo: (text: string) => chalk.dim(text),
		noMatch: (text: string) => chalk.yellow(text),
	},
};

export async function runOnboardingWizard(): Promise<OnboardingResult> {
	return new Promise((resolve) => {
		const terminal = new ProcessTerminal();
		const tui = new TUI(terminal, false);
		tui.setClearOnShrink(true);

		const title = new Text(chalk.bold.cyan("Supratim — API key setup"));
		const subtitle = new Text(
			chalk.dim(
				"Sarvam is the default provider. Paste your API key (sk_…). It will be stored in your OS credential manager.",
			),
		);
		const status = new Text("");
		const editor = new Editor(tui, editorTheme, { paddingX: 1 });

		let selectedModel = DEFAULT_MODEL;
		let busy = false;

		const setStatus = (text: string) => {
			status.setText(text);
			tui.requestRender();
		};

		const finish = (result: OnboardingResult) => {
			tui.stop();
			resolve(result);
		};

		editor.onSubmit = async (text) => {
			if (busy) return;
			const apiKey = text.trim();
			if (!apiKey) {
				setStatus(chalk.yellow("Enter your Sarvam API key to continue."));
				return;
			}
			if (!apiKey.startsWith("sk_")) {
				setStatus(chalk.yellow("Expected a Sarvam key starting with sk_"));
				return;
			}

			busy = true;
			setStatus(chalk.dim(`Validating key against ${SARVAM_PROVIDER}/${selectedModel}…`));
			const result = await verifySarvamApiKey(apiKey, selectedModel);
			busy = false;

			if (!result.ok) {
				setStatus(chalk.red(`Validation failed: ${result.message ?? "unknown error"}`));
				return;
			}

			await storeApiKey(apiKey);
			const usage = result.usage;
			const usageText = usage
				? ` (${usage.totalTokens} tokens used for validation)`
				: "";
			setStatus(chalk.green(`Key verified${usageText}. Starting Supratim…`));
			finish({ ok: true, apiKey, model: selectedModel });
		};

		const modelHint = new Text(
			chalk.dim(
				`Default model: ${selectedModel}. Change later with /model. Press Ctrl+C twice to cancel.`,
			),
		);

		tui.addChild(title);
		tui.addChild(subtitle);
		tui.addChild(modelHint);
		tui.addChild(status);
		tui.addChild(editor);
		tui.setFocus(editor);
		tui.start();

		const handleSigint = () => finish({ ok: false, reason: "cancelled" });
		process.once("SIGINT", handleSigint);
	});
}