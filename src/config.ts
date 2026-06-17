import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

function readPackageVersion(): string {
	try {
		const pkg = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as { version: string };
		return pkg.version;
	} catch {
		return "0.0.0";
	}
}

export const APP_NAME = "supratim";
export const VERSION = readPackageVersion();
export const SARVAM_PROVIDER = "sarvam";
export const OLLAMA_CLOUD_PROVIDER = "ollama-cloud";
export const DEFAULT_PROVIDER = process.env.SUPRATIM_PROVIDER ?? SARVAM_PROVIDER;
export const DEFAULT_MODEL =
	process.env.SUPRATIM_MODEL ??
	(DEFAULT_PROVIDER === OLLAMA_CLOUD_PROVIDER ? "qwen3-coder:480b" : "sarvam-105b");
export const ENV_AGENT_DIR = "SUPRATIM_AGENT_DIR";

export function expandTildePath(path: string): string {
	if (path.startsWith("~/") || path === "~") {
		return join(homedir(), path.slice(2));
	}
	return path;
}

export function getAgentDir(): string {
	const envDir = process.env[ENV_AGENT_DIR];
	if (envDir) {
		return expandTildePath(envDir);
	}
	return join(homedir(), ".supratim");
}

export function getModelsPath(): string {
	return join(getAgentDir(), "models.json");
}

export function getAuthPath(): string {
	return join(getAgentDir(), "auth.json");
}

export function getSettingsPath(): string {
	return join(getAgentDir(), "settings.json");
}

export function getBundledConfigPath(filename: string): string {
	return join(packageRoot, "config", filename);
}

export function ensureAgentDir(): void {
	const agentDir = getAgentDir();
	mkdirSync(agentDir, { recursive: true });

	for (const filename of ["models.json", "settings.json"]) {
		const target = join(agentDir, filename);
		if (!existsSync(target)) {
			copyFileSync(getBundledConfigPath(filename), target);
		}
	}
}

function readKeyFromFile(candidates: string[], patterns: RegExp[]): string | undefined {
	for (const candidate of candidates) {
		if (!existsSync(candidate)) continue;
		const content = readFileSync(candidate, "utf8");
		for (const pattern of patterns) {
			const match = content.match(pattern);
			if (match?.[1]) return match[1].trim();
		}
		const bare = content.trim();
		if (bare && !bare.includes("=")) return bare;
	}
	return undefined;
}

export function readLocalApiKeyFile(): string | undefined {
	return readKeyFromFile(
		[join(packageRoot, "sarvamapi.txt"), join(process.cwd(), "sarvamapi.txt")],
		[/key\s*=\s*(sk_[^\s\r\n]+)/i, /^(sk_\S+)$/m],
	);
}

export function readOllamaApiKeyFile(): string | undefined {
	return readKeyFromFile(
		[join(packageRoot, "ollamakey.txt"), join(process.cwd(), "ollamakey.txt")],
		[/key\s*=\s*([^\s\r\n]+)/i],
	);
}