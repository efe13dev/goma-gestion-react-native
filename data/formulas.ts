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
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "negro-pega",
		nombreColor: "Negro Pega",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "marino",
		nombreColor: "Marino",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "crudo",
		nombreColor: "Crudo",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "blanco",
		nombreColor: "Blanco",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "beige",
		nombreColor: "Beige",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
];
