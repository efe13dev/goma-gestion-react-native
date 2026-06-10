import Constants from "expo-constants";

// URL base del backend (Hono + Turso desplegado en Render).
// Se lee de la configuración de Expo (app.json -> expo.extra.apiUrl) para
// poder diferenciar entornos sin tocar el código. Si no está definida, se
// usa el valor de producción por defecto.
const DEFAULT_API_URL = "https://api-rubber-hono.onrender.com";

export const API_URL: string =
	(Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? DEFAULT_API_URL;

// Endpoints
export const STOCK_ENDPOINT = "/stock";
export const FORMULAS_ENDPOINT = "/formulas";

// Tiempo máximo de espera para peticiones de lectura (ms). El backend en
// Render puede tardar en responder por cold starts; sin timeout, un fetch
// colgado dejaba la UI cargando indefinidamente.
const FETCH_TIMEOUT_MS = 20000;

// fetch con timeout vía AbortController. Lanza si se supera el tiempo límite.
export const fetchWithTimeout = async (
	url: string,
	options: RequestInit = {},
	timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<Response> => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
};
