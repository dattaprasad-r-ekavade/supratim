/**
 * Phase 0 spike: verify Sarvam API + Pi models.json wiring.
 * Uses minimal tokens (max_tokens: 5).
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AuthStorage, ModelRegistry } from "@earendil-works/pi-coding-agent";
import { completeSimple } from "@earendil-works/pi-ai";
import { readLocalApiKeyFile } from "../src/config.js";
import { verifySarvamApiKey } from "../src/sarvam-verify.js";

const agentDir = join(homedir(), ".supratim");
mkdirSync(agentDir, { recursive: true });

const modelsSrc = join(process.cwd(), "config", "models.json");
const modelsDst = join(agentDir, "models.json");
if (existsSync(modelsSrc) && !existsSync(modelsDst)) {
	copyFileSync(modelsSrc, modelsDst);
}

const apiKey = readLocalApiKeyFile();
if (!apiKey) {
	console.error("No API key found in sarvamapi.txt");
	process.exit(1);
}

console.log("1) Direct Sarvam API verification…");
const direct = await verifySarvamApiKey(apiKey);
if (!direct.ok) {
	console.error("FAILED:", direct.message);
	process.exit(1);
}
console.log(`   OK — model=${direct.model}, tokens=${direct.usage?.totalTokens}`);

console.log("2) Pi ModelRegistry + pi-ai complete()…");
const authStorage = AuthStorage.inMemory();
authStorage.setRuntimeApiKey("sarvam", apiKey);
const registry = ModelRegistry.create(authStorage, modelsDst);
const model = registry.find("sarvam", "sarvam-30b");
if (!model) {
	console.error("FAILED: sarvam-30b not found in ModelRegistry");
	process.exit(1);
}

const response = await completeSimple(
	model,
	{ messages: [{ role: "user", content: "Reply OK" }] },
	{ maxTokens: 5, reasoning: "low", apiKey },
);

const text = response.content
	.filter((c) => c.type === "text")
	.map((c) => (c.type === "text" ? c.text : ""))
	.join("");
console.log(`   OK — response="${text.trim()}", tokens=${response.usage.totalTokens}`);
console.log("\nPhase 0 spike passed. Pi + Sarvam integration works.");