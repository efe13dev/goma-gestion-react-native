import type { Formula, Ingrediente } from "@/types/formulas";
import { API_URL, FORMULAS_ENDPOINT, fetchWithTimeout } from "./config";

// Interface para API data según la documentación
interface FormulaAPI {
	name: string;
	ingredients: IngredientAPI[];
}

interface IngredientAPI {
	name: string;
	quantity: number;
}

// Function to convert from API format to local format
const mapApiToLocal = (apiFormula: FormulaAPI): Formula => {
	return {
		id: apiFormula.name.toLowerCase().replace(/\s+/g, "-"),
		nombreColor: apiFormula.name,
		ingredientes: apiFormula.ingredients.map((ing) => {
			// Extraer la unidad del nombre si existe (mejorado para capturar L correctamente)
			const match = ing.name.match(/\[(gr|kg|L)\]$/i);
			let nombre = ing.name;
			let unidad = "gr"; // Valor por defecto

			if (match) {
				// Si hay una unidad en el nombre, extraerla
				unidad = match[1];
				// Asegurarnos de que L siempre es mayúscula
				if (unidad.toLowerCase() === "l") unidad = "L";
				nombre = ing.name.replace(/\s*\[(gr|kg|L)\]$/i, "");
			}

			return {
				nombre,
				cantidad: ing.quantity,
				unidad,
			};
		}),
	};
};

// Function to convert from local format to API format
const mapLocalToApi = (localFormula: Formula): FormulaAPI => {
	return {
		name: localFormula.nombreColor,
		ingredients: localFormula.ingredientes.map((ing) => {
			// Asegurarnos de que la unidad sea correcta
			let unidad = ing.unidad;
			// Asegurarnos de que L siempre es mayúscula
			if (unidad.toLowerCase() === "l") unidad = "L";

			// Incluir la unidad en el nombre del ingrediente
			const nameWithUnit = `${ing.nombre} [${unidad}]`;

			return {
				name: nameWithUnit,
				quantity: ing.cantidad,
			};
		}),
	};
};

// Interface para nombres de fórmulas (endpoint optimizado)
interface FormulaName {
	id: string;
	name: string;
}

// Get formula names only (optimized for listing).
// Lanza un error en fallos de red/API para que la UI pueda mostrar el estado
// de error real en lugar de una lista vacía.
export const getFormulaNames = async (): Promise<FormulaName[]> => {
	const response = await fetchWithTimeout(`${API_URL}${FORMULAS_ENDPOINT}/names`);
	if (!response.ok) {
		throw new Error(`Error en la respuesta de la API: ${response.status}`);
	}

	const data: unknown = await response.json();

	if (!Array.isArray(data)) {
		throw new Error("La API no devolvió un array de nombres de fórmulas");
	}

	return data.map((item: any) => ({
		id: item.name.toLowerCase().replace(/\s+/g, "-"),
		name: item.name,
	}));
};

// Get all formulas. Lanza un error en fallos de red/API.
export const getFormulas = async (): Promise<Formula[]> => {
	const response = await fetchWithTimeout(`${API_URL}${FORMULAS_ENDPOINT}`);
	if (!response.ok) {
		throw new Error(`Error en la respuesta de la API: ${response.status}`);
	}

	const data: unknown = await response.json();

	if (!Array.isArray(data)) {
		throw new Error("La API no devolvió un array de fórmulas");
	}

	return data.map(mapApiToLocal);
};

// Resuelve el nombre real de la fórmula para la API.
// La API busca por nombre, no por id. Reconstruir el nombre desde el id es
// frágil (acentos, dobles espacios, guiones), por eso se prioriza el nombre
// real cuando la pantalla lo proporciona; la reconstrucción queda como fallback.
const resolveFormulaName = (id: string, name?: string): string => {
	if (name && name.trim()) return name;
	return id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Get formula by ID (o por nombre real si se proporciona).
// Devuelve null solo si la fórmula no existe (404); en cualquier otro fallo
// lanza un error para que la UI distinga "no encontrada" de "error de red".
export const getFormulaById = async (
	id: string,
	name?: string,
): Promise<Formula | null> => {
	const resolvedName = resolveFormulaName(id, name);

	const response = await fetchWithTimeout(
		`${API_URL}${FORMULAS_ENDPOINT}/${encodeURIComponent(resolvedName)}`,
	);

	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error(`Error en la respuesta de la API: ${response.status}`);
	}

	const data: unknown = await response.json();

	if (!data || typeof data !== "object") {
		throw new Error("La API devolvió un formato inesperado");
	}

	return mapApiToLocal(data as FormulaAPI);
};

// Add a new formula
export const addFormula = async (formula: Formula): Promise<boolean> => {
	try {
		const apiFormula = mapLocalToApi(formula);

		const response = await fetch(`${API_URL}${FORMULAS_ENDPOINT}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(apiFormula),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			console.error(
				"Error al agregar la fórmula:",
				errorData || response.status,
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error("Error al agregar la fórmula:", error);
		return false;
	}
};

// Update an existing formula (por id, o por nombre real si se proporciona)
export const updateFormula = async (
	id: string,
	formula: Formula,
	name?: string,
): Promise<boolean> => {
	try {
		const apiFormula = mapLocalToApi(formula);
		const resolvedName = resolveFormulaName(id, name);

		const response = await fetch(
			`${API_URL}${FORMULAS_ENDPOINT}/${encodeURIComponent(resolvedName)}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(apiFormula),
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			console.error(
				`Error al actualizar la fórmula ${resolvedName}:`,
				errorData || response.status,
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error(`Error al actualizar la fórmula ${id}:`, error);
		return false;
	}
};

// Delete a formula (por id, o por nombre real si se proporciona)
export const deleteFormula = async (
	id: string,
	name?: string,
): Promise<boolean> => {
	try {
		const resolvedName = resolveFormulaName(id, name);

		const response = await fetch(
			`${API_URL}${FORMULAS_ENDPOINT}/${encodeURIComponent(resolvedName)}`,
			{
				method: "DELETE",
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			console.error(
				`Error al eliminar la fórmula ${resolvedName}:`,
				errorData || response.status,
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error(`Error al eliminar la fórmula ${id}:`, error);
		return false;
	}
};

// Add an ingredient to a formula
export const addIngredient = async (
	formulaId: string,
	ingredient: Ingrediente,
	formulaName?: string,
): Promise<boolean> => {
	try {
		// Para añadir un ingrediente, obtenemos la fórmula actual
		const formula = await getFormulaById(formulaId, formulaName);
		if (!formula) return false;

		// Añadimos el nuevo ingrediente
		formula.ingredientes.push(ingredient);

		// Actualizamos la fórmula completa usando el nombre real devuelto por la API
		return await updateFormula(formulaId, formula, formula.nombreColor);
	} catch (error) {
		console.error(
			`Error al agregar ingrediente a la fórmula ${formulaId}:`,
			error,
		);
		return false;
	}
};

// Update an ingredient in a formula
export const updateIngredient = async (
	formulaId: string,
	ingredientIndex: number,
	updatedIngredient: Ingrediente,
	formulaName?: string,
): Promise<boolean> => {
	try {
		// Para actualizar un ingrediente, obtenemos la fórmula actual
		const formula = await getFormulaById(formulaId, formulaName);
		if (
			!formula ||
			ingredientIndex < 0 ||
			ingredientIndex >= formula.ingredientes.length
		) {
			return false;
		}

		// Actualizamos el ingrediente
		formula.ingredientes[ingredientIndex] = updatedIngredient;

		// Actualizamos la fórmula completa usando el nombre real devuelto por la API
		return await updateFormula(formulaId, formula, formula.nombreColor);
	} catch (error) {
		console.error(
			`Error al actualizar ingrediente en la fórmula ${formulaId}:`,
			error,
		);
		return false;
	}
};

// Delete an ingredient from a formula
export const deleteIngredient = async (
	formulaId: string,
	ingredientIndex: number,
	formulaName?: string,
): Promise<boolean> => {
	try {
		// Para eliminar un ingrediente, obtenemos la fórmula actual
		const formula = await getFormulaById(formulaId, formulaName);
		if (
			!formula ||
			ingredientIndex < 0 ||
			ingredientIndex >= formula.ingredientes.length
		) {
			return false;
		}

		// Eliminamos el ingrediente
		formula.ingredientes.splice(ingredientIndex, 1);

		// Actualizamos la fórmula completa usando el nombre real devuelto por la API
		return await updateFormula(formulaId, formula, formula.nombreColor);
	} catch (error) {
		console.error(
			`Error al eliminar ingrediente de la fórmula ${formulaId}:`,
			error,
		);
		return false;
	}
};
