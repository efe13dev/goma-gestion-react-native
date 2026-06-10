import type { Ingrediente } from "@/types/formulas";

// Convierte una cantidad a kilos según su unidad.
export function convertToKilos(cantidad: number, unidad: string): number {
	switch (unidad.toLowerCase()) {
		case "kg":
			return cantidad;
		case "gr":
		case "g":
			return cantidad / 1000;
		case "l":
			// Asumimos densidad del agua (1 L = 1 kg) para líquidos
			return cantidad;
		default:
			return cantidad / 1000; // Por defecto asumimos gramos
	}
}

// Calcula el peso total en kilos de una lista de ingredientes.
export function calculateTotalWeight(ingredientes: Ingrediente[]): number {
	return ingredientes.reduce((total, ingrediente) => {
		return total + convertToKilos(ingrediente.cantidad, ingrediente.unidad);
	}, 0);
}
