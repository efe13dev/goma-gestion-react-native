import type { Formula, Ingrediente } from "@/data/formulas";

// API base URL
const API_URL = "https://api-rubber-hono.onrender.com";
// Formulas endpoint
const FORMULAS_ENDPOINT = "/formulas";

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

			console.log(
				`Ingrediente: ${nombre}, Unidad: ${unidad}, Original: ${ing.name}`,
			);

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

// Get all formulas
export const getFormulas = async (): Promise<Formula[]> => {
	try {
		const response = await fetch(`${API_URL}${FORMULAS_ENDPOINT}`);
		if (!response.ok) {
			console.error(`Error en la respuesta de la API: ${response.status}`);
			return [];
		}

		let data: unknown;
		try {
			data = await response.json();
		} catch (parseError) {
			console.error("Error al parsear la respuesta JSON:", parseError);
			return [];
		}

		if (!Array.isArray(data)) {
			console.log("La API no devolvió un array:", data);
			return [];
		}

		return data.map(mapApiToLocal);
	} catch (error) {
		console.error("Error al obtener las fórmulas:", error);
		return [];
	}
};

// Get formula by ID
export const getFormulaById = async (id: string): Promise<Formula | null> => {
	try {
		// En la API, se busca por nombre, no por ID
		// Convertimos el ID a un nombre para la API (quitando guiones y capitalizando)
		const name = id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

		const response = await fetch(
			`${API_URL}${FORMULAS_ENDPOINT}/${encodeURIComponent(name)}`,
		);

		if (!response.ok) {
			if (response.status === 404) {
				console.log(`Fórmula ${name} no encontrada`);
				return null;
			}
			console.error(`Error en la respuesta de la API: ${response.status}`);
			return null;
		}

		let data: unknown;
		try {
			data = await response.json();
		} catch (parseError) {
			console.error("Error al parsear la respuesta JSON:", parseError);
			return null;
		}

		if (!data || typeof data !== "object") {
			console.log("La API devolvió un formato inesperado:", data);
			return null;
		}

		return mapApiToLocal(data as FormulaAPI);
	} catch (error) {
		console.error(`Error al obtener la fórmula ${id}:`, error);
		return null;
	}
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

// Update an existing formula
export const updateFormula = async (
	id: string,
	formula: Formula,
): Promise<boolean> => {
	try {
		const apiFormula = mapLocalToApi(formula);

		// En la API, se busca por nombre, no por ID
		// Convertimos el ID a un nombre para la API (quitando guiones y capitalizando)
		const name = id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

		const response = await fetch(
			`${API_URL}${FORMULAS_ENDPOINT}/${encodeURIComponent(name)}`,
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
				`Error al actualizar la fórmula ${name}:`,
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

// Delete a formula
export const deleteFormula = async (id: string): Promise<boolean> => {
	try {
		// En la API, se busca por nombre, no por ID
		// Convertimos el ID a un nombre para la API (quitando guiones y capitalizando)
		const name = id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

		const response = await fetch(
			`${API_URL}${FORMULAS_ENDPOINT}/${encodeURIComponent(name)}`,
			{
				method: "DELETE",
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			console.error(
				`Error al eliminar la fórmula ${name}:`,
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
): Promise<boolean> => {
	try {
		// Para añadir un ingrediente, obtenemos la fórmula actual
		const formula = await getFormulaById(formulaId);
		if (!formula) return false;

		// Añadimos el nuevo ingrediente
		formula.ingredientes.push(ingredient);

		// Actualizamos la fórmula completa
		return await updateFormula(formulaId, formula);
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
): Promise<boolean> => {
	try {
		// Para actualizar un ingrediente, obtenemos la fórmula actual
		const formula = await getFormulaById(formulaId);
		if (
			!formula ||
			ingredientIndex < 0 ||
			ingredientIndex >= formula.ingredientes.length
		) {
			return false;
		}

		// Actualizamos el ingrediente
		formula.ingredientes[ingredientIndex] = updatedIngredient;

		// Actualizamos la fórmula completa
		return await updateFormula(formulaId, formula);
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
): Promise<boolean> => {
	try {
		// Para eliminar un ingrediente, obtenemos la fórmula actual
		const formula = await getFormulaById(formulaId);
		if (
			!formula ||
			ingredientIndex < 0 ||
			ingredientIndex >= formula.ingredientes.length
		) {
			return false;
		}

		// Eliminamos el ingrediente
		formula.ingredientes.splice(ingredientIndex, 1);

		// Actualizamos la fórmula completa
		return await updateFormula(formulaId, formula);
	} catch (error) {
		console.error(
			`Error al eliminar ingrediente de la fórmula ${formulaId}:`,
			error,
		);
		return false;
	}
};
