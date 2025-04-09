import {
	ActivityIndicator,
	Image,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
	Animated,
	Alert, // Import Alert from react-native
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
	type RubberColor,
	saveInventory,
	loadInventory,
	addNewColor,
	deleteColorFromInventory,
	updateInventoryOrder,
	getColorOrder,
	updateColorOrder,
} from "@/data/colors";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import DraggableFlatList, {
	ScaleDecorator,
} from "react-native-draggable-flatlist";
import {
	GestureHandlerRootView,
	Swipeable,
} from "react-native-gesture-handler";
import { showError, showSuccess } from "@/utils/toast"; // Removed showConfirmation

export default function HomeScreen() {
	const [inventory, setInventory] = useState<RubberColor[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [newColorName, setNewColorName] = useState("");
	const [newColorQuantity, setNewColorQuantity] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [colorOrder, setColorOrder] = useState<string[]>([]);

	// Función para cargar los datos
	const loadData = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await loadInventory();
			// Cargar el orden guardado de AsyncStorage
			const savedOrder = await getColorOrder();

			// Si ya tenemos un orden guardado, ordenamos los colores según ese orden
			if (savedOrder.length > 0) {
				// Guardamos el orden en el estado
				setColorOrder(savedOrder);
				
				// Primero ordenamos los colores que ya conocemos
				const orderedColors = [...data].sort((a, b) => {
					const indexA = savedOrder.indexOf(a.id);
					const indexB = savedOrder.indexOf(b.id);

					// Si ambos colores están en el orden guardado
					if (indexA !== -1 && indexB !== -1) {
						return indexA - indexB;
					}

					// Si solo uno de los colores está en el orden guardado
					if (indexA !== -1) return -1;
					if (indexB !== -1) return 1;

					// Si ninguno está en el orden guardado, mantener el orden original
					return 0;
				});

				setInventory(orderedColors);
			} else {
				// Si no tenemos un orden guardado, simplemente establecemos los datos
				setInventory(data);
				// Y guardamos el orden actual
				const newOrder = data.map((color) => color.id);
				setColorOrder(newOrder);
				// También lo guardamos en AsyncStorage
				await updateColorOrder(data);
			}
		} catch (err) {
			setError(
				"No se pudo cargar el inventario. Verifique su conexión e intente nuevamente."
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

	const adjustQuantity = useCallback(
		async (id: string, increment: number) => {
			try {
				const newInventory = inventory.map((color) =>
					color.id === id
						? { ...color, quantity: Math.max(0, color.quantity + increment) }
						: color,
				);
				setInventory(newInventory);
				await saveInventory(newInventory);
			} catch (err) {
				showError(
					"Error",
					"No se pudo actualizar el inventario en la API. Intente nuevamente.",
				);
				// Reload data to ensure consistency
				loadData();
				console.error("Error adjusting quantity:", err);
			}
		},
		[inventory, loadData],
	);

	const addColor = async () => {
		if (!newColorName.trim()) {
			showError("Error", "Debe ingresar un nombre para el color");
			return;
		}

		// Validate that the quantity is a valid number
		let quantity = 0;
		if (newColorQuantity.trim()) {
			quantity = Number.parseInt(newColorQuantity);
			if (Number.isNaN(quantity)) {
				showError("Error", "La cantidad debe ser un número válido");
				return;
			}
			if (quantity < 0) {
				showError("Error", "La cantidad no puede ser negativa");
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
			showSuccess("¡Añadido!", `Color ${newColorName} agregado`);
		} catch (err) {
			showError(
				"Error",
				"No se pudo agregar el color. Es posible que ya exista o haya un problema con la API.",
			);
			console.error("Error adding color:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const deleteColor = useCallback(
		async (name: string) => {
			try {
				setIsLoading(true);
				await deleteColorFromInventory(name);
				await loadData();
				showSuccess("¡Eliminado!", `Color ${name} eliminado`);
			} catch (err) {
				showError("Error", "No se pudo eliminar el color. Intente nuevamente.");
				console.error("Error deleting color:", err);
			} finally {
				setIsLoading(false);
			}
		},
		[loadData],
	);

	const confirmDeleteColor = useCallback(
		(color: RubberColor) => {
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
		},
		[deleteColor],
	);

	const reloadData = () => {
		loadData();
	};

	// Función para manejar el reordenamiento de colores
	const handleDragEnd = async ({ data }: { data: RubberColor[] }) => {
		try {
			setInventory(data);
			// Guardar el nuevo orden
			setColorOrder(data.map((color) => color.id));
			await updateInventoryOrder(data);
		} catch (err) {
			showError(
				"Error",
				"No se pudo actualizar el orden en la API. Intente nuevamente.",
			);
			console.error("Error updating order:", err);
		}
	};

	// Renderizar cada elemento de la lista
	const renderItem = useCallback(
		({
			item,
			drag,
			isActive,
		}: {
			item: RubberColor;
			drag: () => void;
			isActive: boolean;
		}) => {
			const handleAdjustQuantity = (id: string, increment: number) => {
				adjustQuantity(id, increment);
			};

			// Renderizar acciones de deslizamiento (eliminar)
			const renderRightActions = (
				progress: Animated.AnimatedInterpolation<number>,
			) => {
				const trans = progress.interpolate({
					inputRange: [0, 1],
					outputRange: [100, 0],
				});

				return (
					<Animated.View
						style={[
							styles.deleteAction,
							{
								transform: [{ translateX: trans }],
							},
						]}
					>
						<TouchableOpacity
							style={styles.deleteActionContent}
							onPress={() => confirmDeleteColor(item)}
						>
							<ThemedText style={styles.deleteActionText}>Eliminar</ThemedText>
						</TouchableOpacity>
					</Animated.View>
				);
			};

			return (
				<ScaleDecorator>
					<Swipeable
						renderRightActions={renderRightActions}
						enabled={!isActive}
					>
						<ThemedView
							style={[
								styles.colorRow,
								isActive && { opacity: 0.7, elevation: 4 },
							]}
						>
							<TouchableOpacity
								onLongPress={drag}
								disabled={isActive}
								style={styles.dragHandle}
							>
								<ThemedText style={styles.dragHandleText}>≡</ThemedText>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.colorNameContainer}
								onPress={() =>
									setSelectedId(selectedId === item.id ? null : item.id)
								}
							>
								<ThemedText style={styles.colorName}>
									{item.name.charAt(0).toUpperCase() + item.name.slice(1)}
								</ThemedText>
							</TouchableOpacity>

							<View style={styles.quantityContainer}>
								{selectedId === item.id ? (
									<>
										<TouchableOpacity
											style={styles.button}
											onPress={() => handleAdjustQuantity(item.id, -1)}
										>
											<ThemedText style={styles.buttonText}>-</ThemedText>
										</TouchableOpacity>

										<ThemedText style={styles.quantity}>
											{item.quantity}
										</ThemedText>

										<TouchableOpacity
											style={styles.button}
											onPress={() => handleAdjustQuantity(item.id, 1)}
										>
											<ThemedText style={styles.buttonText}>+</ThemedText>
										</TouchableOpacity>
									</>
								) : (
									<ThemedText style={styles.quantity}>
										{item.quantity}
									</ThemedText>
								)}
							</View>
						</ThemedView>
					</Swipeable>
				</ScaleDecorator>
			);
		},
		[selectedId, adjustQuantity, confirmDeleteColor],
	);

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
		<GestureHandlerRootView style={{ flex: 1 }}>
			<View style={styles.container}>
				{/* Cabecera */}
				<View style={styles.header}>
					<Image
						source={require("@/assets/images/palot.png")}
						style={styles.reactLogo}
					/>
				</View>

				{/* Contenido */}
				<View style={styles.content}>
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
								<ThemedText style={styles.retryButtonText}>
									Reintentar
								</ThemedText>
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
								<TouchableOpacity
									style={styles.submitButton}
									onPress={addColor}
								>
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
							<DraggableFlatList
								data={inventory}
								onDragEnd={handleDragEnd}
								keyExtractor={(item) => item.id}
								renderItem={renderItem}
								contentContainerStyle={styles.flatListContent}
								ListFooterComponent={<View style={styles.listFooter} />}
							/>
						)}

						{inventory.length > 0 && (
							<ThemedText style={styles.helpText}>
								Mantener presionado un color para arrastrarlo y reordenarlo
							</ThemedText>
						)}
					</ThemedView>
				</View>
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		backgroundColor: "#A1CEDC",
		height: 150,
		justifyContent: "center",
		alignItems: "center",
	},
	content: {
		flex: 1,
		paddingHorizontal: 6,
		paddingTop: 10,
	},
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
		flex: 1,
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
		paddingHorizontal: 16,
		borderRadius: 12,
		marginVertical: 6,
		borderWidth: 1,
		borderColor: "rgba(161, 206, 220, 0.2)",
		backgroundColor: "rgba(161, 206, 220, 0.05)",
	},
	colorNameContainer: {
		flex: 1,
	},
	colorName: {
		fontSize: 20,
		fontWeight: "500",
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
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	addButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(161, 206, 220, 0.2)",
		justifyContent: "center",
		alignItems: "center",
	},
	addButtonText: {
		fontSize: 24,
		fontWeight: "bold",
	},
	formContainer: {
		backgroundColor: "rgba(161, 206, 220, 0.05)",
		padding: 16,
		borderRadius: 12,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "rgba(161, 206, 220, 0.2)",
	},
	input: {
		backgroundColor: "#fff",
		padding: 12,
		borderRadius: 6,
		marginBottom: 12,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(161, 206, 220, 0.3)",
		color: "#333",
	},
	submitButton: {
		backgroundColor: "#A1CEDC",
		padding: 12,
		borderRadius: 6,
		alignItems: "center",
	},
	submitButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	emptyContainer: {
		padding: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyText: {
		fontSize: 16,
		textAlign: "center",
		opacity: 0.6,
	},
	helpText: {
		textAlign: "center",
		marginTop: 16,
		fontSize: 14,
		opacity: 0.7,
		fontStyle: "italic",
	},
	dragHandle: {
		marginRight: 12,
		padding: 5,
	},
	dragHandleText: {
		fontSize: 24,
		opacity: 0.5,
	},
	deleteAction: {
		backgroundColor: "#FF6B6B",
		justifyContent: "center",
		alignItems: "center",
		width: 100,
		height: "100%",
		borderTopRightRadius: 12,
		borderBottomRightRadius: 12,
	},
	deleteActionContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	deleteActionText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 16,
	},
	flatListContent: {
		paddingBottom: 16,
	},
	listFooter: {
		height: 80, // Espacio adicional al final de la lista
	},
});
