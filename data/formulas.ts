export interface Ingrediente {
	nombre: string;
	cantidad: number;
	unidad: string;
}

export interface Formula {
	id: string;
	nombreColor: string;
	ingredientes: Ingrediente[];
}

export const formulas: Formula[] = [
	{
		id: "negro",
		nombreColor: "Negro",
		ingredientes: [
			{ nombre: "Base Negra", cantidad: 1, unidad: "kg" },
			{ nombre: "Acelerante", cantidad: 30, unidad: "g" },
			{ nombre: "Azufre", cantidad: 50, unidad: "g" },
		],
	},
	{
		id: "negro-pega",
		nombreColor: "Negro Pega",
		ingredientes: [
			{ nombre: "Base Negra", cantidad: 1, unidad: "kg" },
			{ nombre: "Acelerante Plus", cantidad: 40, unidad: "g" },
			{ nombre: "Azufre", cantidad: 60, unidad: "g" },
		],
	},
	{
		id: "marino",
		nombreColor: "Marino",
		ingredientes: [
			{ nombre: "Base Azul", cantidad: 800, unidad: "g" },
			{ nombre: "Negro", cantidad: 200, unidad: "g" },
			{ nombre: "Acelerante", cantidad: 25, unidad: "g" },
		],
	},
	{
		id: "crudo",
		nombreColor: "Crudo",
		ingredientes: [
			{ nombre: "Base Natural", cantidad: 1, unidad: "kg" },
			{ nombre: "Acelerante", cantidad: 20, unidad: "g" },
		],
	},
	{
		id: "blanco",
		nombreColor: "Blanco",
		ingredientes: [
			{ nombre: "Base Blanca", cantidad: 1, unidad: "kg" },
			{ nombre: "Acelerante", cantidad: 25, unidad: "g" },
			{ nombre: "Zinc", cantidad: 40, unidad: "g" },
		],
	},
	{
		id: "beige",
		nombreColor: "Beige",
		ingredientes: [
			{ nombre: "Base Natural", cantidad: 900, unidad: "g" },
			{ nombre: "Ocre", cantidad: 100, unidad: "g" },
			{ nombre: "Acelerante", cantidad: 25, unidad: "g" },
		],
	},
];
