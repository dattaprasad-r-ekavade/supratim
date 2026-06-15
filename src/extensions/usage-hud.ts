import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { SARVAM_PROVIDER } from "../config.js";

function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

function formatInr(amount: number): string {
	if (amount < 0.01) return "₹0.00";
	if (amount < 1) return `₹${amount.toFixed(3)}`;
	return `₹${amount.toFixed(2)}`;
}

function installUsageFooter(ctx: ExtensionContext): void {
	ctx.ui.setFooter((_tui, theme, footerData) => {
		const unsub = footerData.onBranchChange(() => _tui.requestRender());

		return {
			dispose: unsub,
			invalidate() {},
			render(width: number): string[] {
				let totalInput = 0;
				let totalOutput = 0;
				let totalCacheRead = 0;
				let totalCacheWrite = 0;
				let totalCost = 0;
				let requestCount = 0;

				for (const entry of ctx.sessionManager.getEntries()) {
					if (entry.type === "message" && entry.message.role === "assistant") {
						const message = entry.message as AssistantMessage;
						requestCount += 1;
						totalInput += message.usage.input;
						totalOutput += message.usage.output;
						totalCacheRead += message.usage.cacheRead;
						totalCacheWrite += message.usage.cacheWrite;
						totalCost += message.usage.cost.total;
					}
				}

				const contextUsage = ctx.getContextUsage();
				const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
				const contextPercent = contextUsage?.percent !== null ? contextUsage?.percent?.toFixed(1) : "?";
				const percentValue = contextUsage?.percent ?? 0;

				let pwd = ctx.cwd;
				const home = process.env.HOME || process.env.USERPROFILE;
				if (home && pwd.startsWith(home)) {
					pwd = `~${pwd.slice(home.length)}`;
				}

				const branch = footerData.getGitBranch();
				if (branch) pwd = `${pwd} (${branch})`;

				const statsParts: string[] = [];
				if (totalInput) statsParts.push(`↑${formatTokens(totalInput)}`);
				if (totalOutput) statsParts.push(`↓${formatTokens(totalOutput)}`);
				if (totalCacheRead) statsParts.push(`R${formatTokens(totalCacheRead)}`);
				if (totalCacheWrite) statsParts.push(`W${formatTokens(totalCacheWrite)}`);
				if (requestCount) statsParts.push(`req ${requestCount}`);

				const isSarvam = ctx.model?.provider === SARVAM_PROVIDER;
				if (totalCost > 0 || isSarvam) {
					statsParts.push(isSarvam ? formatInr(totalCost) : `$${totalCost.toFixed(3)}`);
				}

				const autoIndicator = "";
				const contextPercentDisplay =
					contextPercent === "?"
						? `?/${formatTokens(contextWindow)}${autoIndicator}`
						: `${contextPercent}%/${formatTokens(contextWindow)}${autoIndicator}`;

				const colorizeContext = (text: string): string => {
					if (percentValue >= 90) return theme.fg("error", text);
					if (percentValue >= 75) return theme.fg("warning", text);
					return text;
				};

				const modelId = ctx.model?.id ?? "no-model";
				const left = truncateToWidth(pwd, Math.max(10, Math.floor(width * 0.45)), "…");
				const right = theme.fg(
					"dim",
					[statsParts.join(" "), colorizeContext(contextPercentDisplay), modelId].join(" • "),
				);

				const gap = Math.max(1, width - visibleWidth(left) - visibleWidth(right));
				return [truncateToWidth(left + " ".repeat(gap) + right, width)];
			},
		};
	});
}

export default function usageHudExtension(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		installUsageFooter(ctx);
	});
}