import { getStock, updateColor, addColor, deleteColor } from "@/api/stockApi";

export interface RubberColor {
	id: string;
	name: string;
	quantity: number;
}

// Save inventory (update in the API)
export const saveInventory = async (inventory: RubberColor[]) => {
	try {
		// Update in the API
		for (const color of inventory) {
			try {
				await updateColor(color);
			} catch (error) {
				console.error(`Error updating ${color.name} in the API:`, error);
				// Continue with the next colors even if there's an error
			}
		}
	} catch (error) {
		console.error("Error saving inventory:", error);
		throw error;
	}
};

// Load inventory from the API
export const loadInventory = async (): Promise<RubberColor[]> => {
	try {
		// Load from the API
		const stockAPI = await getStock();
		return stockAPI;
	} catch (error) {
		console.error("Error loading inventory from the API:", error);
		throw error;
	}
};

// Add a new color to the inventory
export const addNewColor = async (
	name: string,
	quantity: number,
): Promise<void> => {
	try {
		// Ensure the quantity is a valid number
		const numericQuantity = Number.isNaN(quantity)
			? 0
			: Math.max(0, Math.floor(quantity));

		const newColor: RubberColor = {
			id: name.toLowerCase().replace(/\s+/g, "-"),
			name,
			quantity: numericQuantity,
		};

		await addColor(newColor);
	} catch (error) {
		console.error(`Error adding color ${name}:`, error);
		throw error;
	}
};

// Delete a color from the inventory
export const deleteColorFromInventory = async (name: string): Promise<void> => {
	try {
		await deleteColor(name);
	} catch (error) {
		console.error(`Error deleting color ${name}:`, error);
		throw error;
	}
};
