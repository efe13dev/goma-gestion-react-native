import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ColorGoma {
	id: string;
	nombre: string;
	cantidad: number;
}

export const coloresGoma: ColorGoma[] = [
	{ id: "negro", nombre: "Negro", cantidad: 0 },
	{ id: "negro-pega", nombre: "Negro Pega", cantidad: 0 },
	{ id: "marino", nombre: "Marino", cantidad: 0 },
	{ id: "crudo", nombre: "Crudo", cantidad: 0 },
	{ id: "blanco", nombre: "Blanco", cantidad: 0 },
	{ id: "beige", nombre: "Beige", cantidad: 0 },
];

export const guardarInventario = async (inventario: ColorGoma[]) => {
	try {
		await AsyncStorage.setItem("inventario", JSON.stringify(inventario));
	} catch (error) {
		console.error("Error al guardar el inventario:", error);
	}
};

export const cargarInventario = async (): Promise<ColorGoma[]> => {
	try {
		const inventarioGuardado = await AsyncStorage.getItem("inventario");
		if (inventarioGuardado) {
			return JSON.parse(inventarioGuardado);
		}
	} catch (error) {
		console.error("Error al cargar el inventario:", error);
	}
	return coloresGoma;
};
