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
