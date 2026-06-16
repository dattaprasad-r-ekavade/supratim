#!/usr/bin/env node
import {
	AuthStorage,
	createAgentSessionFromServices,
	createAgentSessionRuntime,
	createAgentSessionServices,
	InteractiveMode,
	runPrintMode,
	SessionManager,
	type CreateAgentSessionRuntimeFactory,
} from "@earendil-works/pi-coding-agent";
import chalk from "chalk";
import {
	DEFAULT_MODEL,
	ensureAgentDir,
	ENV_AGENT_DIR,
	getAgentDir,
	readLocalApiKeyFile,
	SARVAM_PROVIDER,
	VERSION,
} from "./config.js";
import { runOnboardingWizard } from "./onboarding.js";
import { getStoredApiKey, storeApiKey } from "./secure-storage.js";
import sarvamCompatExtension from "./extensions/sarvam-compat.js";
import usageHudExtension from "./extensions/usage-hud.js";
import { verifySarvamApiKey } from "./sarvam-verify.js";

function printBanner(): void {
	console.log(chalk.bold.cyan(`Supratim v${VERSION}`));
	console.log(chalk.dim("Model-agnostic coding agent — Sarvam showcased by default"));
}

async function resolveApiKey(): Promise<string | undefined> {
	let apiKey = await getStoredApiKey();
	if (apiKey) return apiKey;

	apiKey = process.env.SARVAM_API_KEY;
	if (apiKey) {
		await storeApiKey(apiKey);
		return apiKey;
	}

	apiKey = readLocalApiKeyFile();
	if (apiKey) {
		await storeApiKey(apiKey);
		return apiKey;
	}

	return undefined;
}

async function ensureApiKey(interactive: boolean): Promise<string | undefined> {
	let apiKey = await resolveApiKey();
	if (apiKey) return apiKey;

	if (!interactive || !process.stdin.isTTY) {
		console.error(
			chalk.red(
				"No Sarvam API key found. Run interactively to set up, or set SARVAM_API_KEY / add sarvamapi.txt.",
			),
		);
		process.exit(1);
	}

	printBanner();
	const result = await runOnboardingWizard();
	if (!result.ok) {
		console.log(chalk.dim("Setup cancelled."));
		process.exit(0);
	}
	return result.apiKey;
}

async function verifyExistingKey(apiKey: string): Promise<boolean> {
	const result = await verifySarvamApiKey(apiKey, DEFAULT_MODEL);
	if (!result.ok) {
		console.error(chalk.red(`Sarvam API key validation failed: ${result.message}`));
		return false;
	}
	console.log(
		chalk.green(
			`Sarvam API connected (${DEFAULT_MODEL}, ${result.usage?.totalTokens ?? 0} tokens in validation call)`,
		),
	);
	return true;
}

function setupAgentEnvironment(): void {
	ensureAgentDir();
	const agentDir = getAgentDir();
	process.env[ENV_AGENT_DIR] = agentDir;
	process.env.PI_CODING_AGENT_DIR = agentDir;
	process.env.PI_OFFLINE = "1";
	process.env.PI_SKIP_VERSION_CHECK = "1";
	process.env.PI_TELEMETRY = "0";
}

async function main(argv: string[]): Promise<void> {
	const args = argv.slice(2);
	const printMode = args.includes("-p") || args.includes("--print");
	const verifyOnly = args.includes("--verify-key");
	const setupOnly = args.includes("--setup-key");
	const help = args.includes("-h") || args.includes("--help");
	const interactive = !printMode && !verifyOnly && !setupOnly;

	if (help) {
		printBanner();
		console.log(`
Usage:
  supratim [options] [message]

Options:
  -p, --print          Single-shot mode (non-interactive)
  --verify-key         Validate stored Sarvam API key and exit
  --setup-key          Run API key onboarding wizard
  -h, --help           Show help

Config directory: ${getAgentDir()} (override with ${ENV_AGENT_DIR})
`);
		return;
	}

	setupAgentEnvironment();
	const agentDir = getAgentDir();
	const cwd = process.cwd();

	if (verifyOnly) {
		const apiKey = await resolveApiKey();
		if (!apiKey) {
			console.error(chalk.red("No API key stored."));
			process.exit(1);
		}
		const ok = await verifyExistingKey(apiKey);
		process.exit(ok ? 0 : 1);
	}

	let apiKey: string | undefined;
	if (setupOnly) {
		const result = await runOnboardingWizard();
		if (!result.ok) process.exit(0);
		apiKey = result.apiKey;
		const ok = await verifyExistingKey(apiKey);
		process.exit(ok ? 0 : 1);
	} else {
		apiKey = await ensureApiKey(interactive);
	}

	if (!apiKey) process.exit(1);

	const authStorage = AuthStorage.create();
	authStorage.setRuntimeApiKey(SARVAM_PROVIDER, apiKey);

	const createRuntime: CreateAgentSessionRuntimeFactory = async ({
		cwd: runtimeCwd,
		agentDir: runtimeAgentDir,
		sessionManager,
		sessionStartEvent,
	}) => {
		const services = await createAgentSessionServices({
			cwd: runtimeCwd,
			agentDir: runtimeAgentDir,
			authStorage,
			resourceLoaderOptions: {
				extensionFactories: [sarvamCompatExtension, usageHudExtension],
			},
		});

		const { modelRegistry, settingsManager } = services;
		const available = await modelRegistry.getAvailable();
		const sarvamModel =
			available.find((m) => m.provider === SARVAM_PROVIDER && m.id === DEFAULT_MODEL) ??
			available.find((m) => m.provider === SARVAM_PROVIDER);

		if (!sarvamModel) {
			throw new Error("Sarvam models are not available. Check models.json and API key.");
		}

		const created = await createAgentSessionFromServices({
			services,
			sessionManager,
			sessionStartEvent,
			model: sarvamModel,
			thinkingLevel: settingsManager.getDefaultThinkingLevel() ?? "medium",
			scopedModels: [
				{ model: sarvamModel, thinkingLevel: "medium" },
				...(available
					.filter((m) => m.provider === SARVAM_PROVIDER && m.id !== sarvamModel.id)
					.map((m) => ({ model: m, thinkingLevel: "medium" as const })) ?? []),
			],
		});

		return {
			...created,
			services,
			diagnostics: services.diagnostics,
		};
	};

	const ok = await verifyExistingKey(apiKey);
	if (!ok) process.exit(1);

	const runtime = await createAgentSessionRuntime(createRuntime, {
		cwd,
		agentDir,
		sessionManager: SessionManager.create(cwd),
	});

	const initialMessage = args.filter((a) => !a.startsWith("-")).join(" ").trim();

	if (printMode) {
		await runPrintMode(runtime, {
			mode: "text",
			initialMessage: initialMessage || "List the files in the current directory.",
			initialImages: [],
			messages: [],
		});
		return;
	}

	const mode = new InteractiveMode(runtime, {
		migratedProviders: [],
		initialMessage: initialMessage || undefined,
		initialImages: [],
		initialMessages: [],
	});

	await mode.run();
}

main(process.argv).catch((error) => {
	console.error(chalk.red(error instanceof Error ? error.message : String(error)));
	process.exit(1);
});