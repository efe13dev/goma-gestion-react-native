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
	getStock,
	addColor,
	updateColor,
	deleteColor as apiDeleteColor,
	getColorOrder,
	updateColorOrder,
} from "@/api/stockApi";
import type { RubberColor } from "@/types/colors";
import { useState, useEffect, useRef, useCallback } from "react";
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
	const [_colorOrder, setColorOrder] = useState<string[]>([]);

	// Función para cargar los datos
	const loadData = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await getStock();
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
				"No se pudo cargar el inventario. Verifique su conexión e intente nuevamente.",
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
				const colorToUpdate = inventory.find((color) => color.id === id);
				if (!colorToUpdate) return;
				const updatedColor: RubberColor = {
					...colorToUpdate,
					quantity: Math.max(0, colorToUpdate.quantity + increment),
				};
				setInventory((prev) =>
					prev.map((color) => (color.id === id ? updatedColor : color)),
				);
				await updateColor(updatedColor);
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

	const handleAddColor = async () => {
		if (!newColorName.trim()) {
			showError("Error", "Debe ingresar un nombre para el color");
			return;
		}

		// Validar si el color ya existe (por nombre, ignorando mayúsculas/minúsculas y espacios)
		const exists = inventory.some(
			(color) =>
				color.name.trim().toLowerCase() === newColorName.trim().toLowerCase(),
		);
		if (exists) {
			showError("Error", `El color '${newColorName}' ya existe.`);
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
			const newColor: RubberColor = {
				id: newColorName.toLowerCase().replace(/\s+/g, "-"),
				name: newColorName,
				quantity,
			};
			await addColor(newColor);
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

	const handleDeleteColor = useCallback(
		async (name: string) => {
			try {
				setIsLoading(true);
				await apiDeleteColor(name);
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
						onPress: () => handleDeleteColor(color.name),
					},
				],
			);
		},
		[handleDeleteColor],
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
			await updateColorOrder(data);
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

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<View style={styles.container}>
				{/* Header visual estilo Fórmulas */}
				<View style={styles.header}>
					<Image
						source={require("../../assets/images/palot.png")}
						style={styles.reactLogo}
						resizeMode="contain"
					/>
					<View style={styles.titleContainer}>
						<ThemedText style={styles.titleText}>Stock</ThemedText>
						<TouchableOpacity onPress={reloadData} style={styles.reloadButton}>
							{isLoading ? (
								<ActivityIndicator size="small" color="white" />
							) : (
								<ThemedText style={styles.reloadButtonText}>↻</ThemedText>
							)}
						</TouchableOpacity>
					</View>
				</View>

				{/* Contenido principal, incluyendo loader o lista */}
				<View style={styles.content}>
					{error ? (
						<View style={styles.emptyContainer}>
							<ThemedText style={styles.emptyText}>{error}</ThemedText>
							<TouchableOpacity
								onPress={reloadData}
								style={[styles.addButton, { backgroundColor: "#2E7D9B" }]}
							>
								<ThemedText style={styles.addButtonText}>Reintentar</ThemedText>
							</TouchableOpacity>
						</View>
					) : isLoading ? (
						<View
							style={[
								styles.loadingContainer,
								{ flex: 1, justifyContent: "center", alignItems: "center" },
							]}
						>
							<ActivityIndicator size="large" color="#2E7D9B" />
							<ThemedText
								style={{
									marginTop: 14,
									color: "#2E7D9B",
									fontWeight: "bold",
									fontSize: 18,
								}}
							>
								Cargando stock...
							</ThemedText>
						</View>
					) : (
						// Aquí va la lista y el resto del contenido
						<View style={styles.colorContainer}>
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
										onPress={handleAddColor}
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
									showsVerticalScrollIndicator={false}
								/>
							)}
						</View>
					)}
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
		height: 180,
		justifyContent: "flex-end",
		alignItems: "center",
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		paddingBottom: 5,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		paddingHorizontal: 20,
	},
	titleText: {
		fontSize: 28,
		fontWeight: "bold",
		color: "white",
		textShadowColor: "rgba(0, 0, 0, 0.2)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
		marginRight: 15,
		lineHeight: 35, // Aumenta la altura de la fuente
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
		width: 120,
		height: 120,
		resizeMode: "contain",
		marginBottom: -10,
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
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.5)",
	},
	reloadButtonText: {
		fontSize: 22,
		fontWeight: "bold",
		color: "white",
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
		alignSelf: "center",
		marginTop: -10,
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
		height: 80,
	},
});
