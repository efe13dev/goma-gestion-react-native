import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from "@env";

// Crear el cliente de libsql
const client = createClient({
	url: TURSO_DATABASE_URL,
	authToken: TURSO_AUTH_TOKEN,
});

// Crear la instancia de drizzle con el esquema
export const db = drizzle(client, { schema });

// Exportar el esquema para usarlo en otras partes de la aplicación
export { schema };
