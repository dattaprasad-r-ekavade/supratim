import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const APP_NAME = "supratim";
export const VERSION = "0.1.0";
export const SARVAM_PROVIDER = "sarvam";
export const DEFAULT_MODEL = "sarvam-30b";
export const ENV_AGENT_DIR = "SUPRATIM_AGENT_DIR";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

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

export function readLocalApiKeyFile(): string | undefined {
	const candidates = [
		join(packageRoot, "sarvamapi.txt"),
		join(process.cwd(), "sarvamapi.txt"),
	];

	for (const candidate of candidates) {
		if (!existsSync(candidate)) continue;
		const content = readFileSync(candidate, "utf8");
		const match = content.match(/key\s*=\s*(sk_[^\s\r\n]+)/i);
		if (match?.[1]) return match[1].trim();
	}
	return undefined;
}