import Constants from 'expo-constants';

// ponytail: API URL desde app.json extra.apiUrl (Constants), fallback hardcodeado
export const API_URL =
	(Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
	'https://api-rubber-hono.onrender.com';

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * fetch con timeout vía AbortController.
 * La API vive en render.com (cold start posible); sin timeout una petición
 * colgada queda indefinidamente.
 */
export async function fetchWithTimeout(
	input: string,
	init: RequestInit = {},
	timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(input, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}
