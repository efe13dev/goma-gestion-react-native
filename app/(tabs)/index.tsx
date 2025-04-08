import {
	ActivityIndicator,
	Alert,
	Image,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
	type RubberColor,
	saveInventory,
	loadInventory,
	addNewColor,
	deleteColorFromInventory,
} from "@/data/colors";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

export default function HomeScreen() {
	const [inventory, setInventory] = useState<RubberColor[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [newColorName, setNewColorName] = useState("");
	const [newColorQuantity, setNewColorQuantity] = useState("");
	const [showForm, setShowForm] = useState(false);

	const loadData = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await loadInventory();
			setInventory(data);
		} catch (err) {
			setError(
				"Error al cargar el inventario desde la API. Intente nuevamente.",
			);
			console.error("Error loading data:", err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Load data when component mounts
	useEffect(() => {
		loadData();
	}, [loadData]);

	// Reload data when screen gets focus
	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData]),
	);

	const adjustQuantity = async (id: string, increment: number) => {
		try {
			const newInventory = inventory.map((color) =>
				color.id === id
					? { ...color, quantity: Math.max(0, color.quantity + increment) }
					: color,
			);
			setInventory(newInventory);
			await saveInventory(newInventory);
		} catch (err) {
			Alert.alert(
				"Error",
				"No se pudo actualizar el inventario en la API. Intente nuevamente.",
			);
			// Reload data to ensure consistency
			loadData();
			console.error("Error adjusting quantity:", err);
		}
	};

	const addColor = async () => {
		if (!newColorName.trim()) {
			Alert.alert("Error", "Debe ingresar un nombre para el color");
			return;
		}

		// Validate that the quantity is a valid number
		let quantity = 0;
		if (newColorQuantity.trim()) {
			quantity = Number.parseInt(newColorQuantity);
			if (Number.isNaN(quantity)) {
				Alert.alert("Error", "La cantidad debe ser un número válido");
				return;
			}
			if (quantity < 0) {
				Alert.alert("Error", "La cantidad no puede ser negativa");
				return;
			}
		}

		try {
			setIsLoading(true);
			await addNewColor(newColorName, quantity);
			// Clear the form
			setNewColorName("");
			setNewColorQuantity("");
			setShowForm(false);
			// Reload data
			await loadData();
			Alert.alert("Éxito", `Color ${newColorName} agregado correctamente`);
		} catch (err) {
			Alert.alert(
				"Error",
				"No se pudo agregar el color. Es posible que ya exista o haya un problema con la API.",
			);
			console.error("Error adding color:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const confirmDeleteColor = (color: RubberColor) => {
		Alert.alert(
			"Eliminar Color",
			`¿Está seguro que desea eliminar ${color.name}?`,
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Eliminar",
					style: "destructive",
					onPress: () => deleteColor(color.name),
				},
			],
		);
	};

	const deleteColor = async (name: string) => {
		try {
			setIsLoading(true);
			await deleteColorFromInventory(name);
			await loadData();
			Alert.alert("Éxito", `Color ${name} eliminado correctamente`);
		} catch (err) {
			Alert.alert("Error", "No se pudo eliminar el color. Intente nuevamente.");
			console.error("Error deleting color:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const reloadData = () => {
		loadData();
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#A1CEDC" />
				<ThemedText style={styles.loadingText}>
					Cargando inventario...
				</ThemedText>
			</View>
		);
	}

	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
			headerImage={
				<Image
					source={require("@/assets/images/palot.png")}
					style={styles.reactLogo}
				/>
			}
		>
			<ThemedView style={styles.titleContainer}>
				<ThemedText type="title">Stock</ThemedText>
				<TouchableOpacity onPress={reloadData} style={styles.reloadButton}>
					<ThemedText style={styles.reloadButtonText}>↻</ThemedText>
				</TouchableOpacity>
			</ThemedView>

			{error && (
				<ThemedView style={styles.errorContainer}>
					<ThemedText style={styles.errorText}>{error}</ThemedText>
					<TouchableOpacity onPress={reloadData} style={styles.retryButton}>
						<ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
					</TouchableOpacity>
				</ThemedView>
			)}

			<ThemedView style={styles.colorContainer}>
				<View style={styles.headerContainer}>
					<ThemedText type="subtitle" style={styles.subtitle}>
						Inventario de colores
					</ThemedText>
					<TouchableOpacity
						style={styles.addButton}
						onPress={() => setShowForm(!showForm)}
					>
						<ThemedText style={styles.addButtonText}>
							{showForm ? "✕" : "+"}
						</ThemedText>
					</TouchableOpacity>
				</View>

				{showForm && (
					<ThemedView style={styles.formContainer}>
						<TextInput
							style={styles.input}
							placeholder="Nombre del color"
							value={newColorName}
							onChangeText={setNewColorName}
							placeholderTextColor="#888"
						/>
						<TextInput
							style={styles.input}
							placeholder="Cantidad (opcional)"
							value={newColorQuantity}
							onChangeText={setNewColorQuantity}
							keyboardType="numeric"
							placeholderTextColor="#888"
						/>
						<TouchableOpacity style={styles.submitButton} onPress={addColor}>
							<ThemedText style={styles.submitButtonText}>
								Agregar Color
							</ThemedText>
						</TouchableOpacity>
					</ThemedView>
				)}

				{inventory.length === 0 ? (
					<ThemedView style={styles.emptyContainer}>
						<ThemedText style={styles.emptyText}>
							No hay colores en el inventario
						</ThemedText>
					</ThemedView>
				) : (
					inventory.map((color) => (
						<TouchableOpacity
							key={color.id}
							onPress={() =>
								setSelectedId(selectedId === color.id ? null : color.id)
							}
							onLongPress={() => confirmDeleteColor(color)}
						>
							<ThemedView style={styles.colorRow}>
								<ThemedText style={styles.colorName}>{color.name}</ThemedText>
								<View style={styles.quantityContainer}>
									{selectedId === color.id ? (
										<>
											<TouchableOpacity
												style={styles.button}
												onPress={() => adjustQuantity(color.id, -1)}
											>
												<ThemedText style={styles.buttonText}>-</ThemedText>
											</TouchableOpacity>

											<ThemedText style={styles.quantity}>
												{color.quantity}
											</ThemedText>

											<TouchableOpacity
												style={styles.button}
												onPress={() => adjustQuantity(color.id, 1)}
											>
												<ThemedText style={styles.buttonText}>+</ThemedText>
											</TouchableOpacity>
										</>
									) : (
										<ThemedText style={styles.quantity}>
											{color.quantity}
										</ThemedText>
									)}
								</View>
							</ThemedView>
						</TouchableOpacity>
					))
				)}

				{inventory.length > 0 && (
					<ThemedText style={styles.helpText}>
						Mantener presionado un color para eliminarlo
					</ThemedText>
				)}
			</ThemedView>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		marginTop: -20,
		marginBottom: 12,
	},
	colorContainer: {
		padding: 12,
		backgroundColor: "rgba(161, 206, 220, 0.1)",
		borderRadius: 12,
		marginVertical: 0,
		marginHorizontal: 6,
	},
	subtitle: {
		marginBottom: 16,
		fontSize: 22,
	},
	colorRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 20,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(161, 206, 220, 0.2)",
		marginVertical: 4,
	},
	colorName: {
		fontSize: 20,
	},
	quantityContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	button: {
		backgroundColor: "rgba(161, 206, 220, 0.2)",
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	buttonText: {
		fontSize: 22,
		fontWeight: "bold",
	},
	quantity: {
		fontSize: 22,
		fontWeight: "bold",
		minWidth: 36,
		textAlign: "center",
	},
	reactLogo: {
		width: "60%",
		height: "80%",
		resizeMode: "contain",
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: [{ translateX: -120 }, { translateY: -50 }],
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
	},
	errorContainer: {
		backgroundColor: "rgba(255, 0, 0, 0.1)",
		padding: 12,
		borderRadius: 8,
		margin: 6,
		alignItems: "center",
	},
	errorText: {
		color: "red",
		marginBottom: 8,
	},
	retryButton: {
		backgroundColor: "rgba(161, 206, 220, 0.3)",
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
	},
	retryButtonText: {
		fontWeight: "bold",
	},
	reloadButton: {
		marginLeft: 8,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(161, 206, 220, 0.2)",
		justifyContent: "center",
		alignItems: "center",
	},
	reloadButtonText: {
		fontSize: 20,
		fontWeight: "bold",
	},
	emptyContainer: {
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyText: {
		fontSize: 16,
		fontStyle: "italic",
		opacity: 0.7,
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	addButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(161, 206, 220, 0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	addButtonText: {
		fontSize: 24,
		fontWeight: "bold",
	},
	formContainer: {
		backgroundColor: "rgba(161, 206, 220, 0.1)",
		padding: 16,
		borderRadius: 8,
		marginBottom: 16,
	},
	input: {
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
		fontSize: 16,
	},
	submitButton: {
		backgroundColor: "rgba(161, 206, 220, 0.5)",
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
	},
	submitButtonText: {
		fontSize: 16,
		fontWeight: "bold",
	},
	helpText: {
		textAlign: "center",
		fontSize: 14,
		fontStyle: "italic",
		opacity: 0.7,
		marginTop: 16,
	},
});
