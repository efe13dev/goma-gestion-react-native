import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Cargar variables de entorno desde el archivo .env
import * as dotenv from "dotenv";
dotenv.config();

// Obtener las variables de entorno
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || "";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || "";

export default defineConfig({
	out: "./drizzle",
	schema: "./db/schema.ts",
	dialect: "turso",
	dbCredentials: {
		url: TURSO_DATABASE_URL,
		authToken: TURSO_AUTH_TOKEN,
	},
});
