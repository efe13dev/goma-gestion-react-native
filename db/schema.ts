import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stockTable = sqliteTable("stock_table", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	cantidad: int().notNull(),
});
