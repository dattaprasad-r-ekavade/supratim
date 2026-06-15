import keytar from "keytar";

const SERVICE_NAME = "supratim";
const ACCOUNT_NAME = "sarvam-api-key";

export async function getStoredApiKey(): Promise<string | undefined> {
	try {
		const key = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
		return key ?? undefined;
	} catch {
		return undefined;
	}
}

export async function storeApiKey(apiKey: string): Promise<void> {
	await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
}

export async function deleteStoredApiKey(): Promise<void> {
	await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
}

export async function hasStoredApiKey(): Promise<boolean> {
	const key = await getStoredApiKey();
	return Boolean(key);
}