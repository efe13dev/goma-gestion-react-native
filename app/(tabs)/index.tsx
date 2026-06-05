import {
	addColor,
	deleteColor as apiDeleteColor,
	getStock,
	updateColor,
} from "@/api/stockApi";
import AnimatedQuantity from "@/components/AnimatedQuantity";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme as useCustomTheme } from "@/contexts/ThemeContext";
import type { RubberColor } from "@/types/colors";
import { showError, showSuccess } from "@/utils/toast";
import { useFocusEffect } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	FlatList,
	Image,
	RefreshControl,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import {
	Appbar,
	Button,
	Card,
	Dialog,
	FAB,
	IconButton,
	ActivityIndicator as PaperActivityIndicator,
	Portal,
	Surface,
	Text,
	TextInput,
	useTheme
} from "react-native-paper";
import Animated from "react-native-reanimated";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";

// Duración mínima (ms) que se mantiene visible el indicador de recarga manual
// para que el feedback se perciba intencional y no como un parpadeo.
const MIN_REFRESH_INDICATOR_MS = 600;

export default function HomeScreen() {
	const theme = useTheme();
	const { themeMode, toggleTheme } = useCustomTheme();
	const [inventory, setInventory] = useState<RubberColor[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [newColorName, setNewColorName] = useState("");
	const [newColorQuantity, setNewColorQuantity] = useState("");
	const [dialogVisible, setDialogVisible] = useState(false);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [colorToDelete, setColorToDelete] = useState<RubberColor | null>(null);

	// Animaciones de entrada
	const {
		animationsStarted,
		start: startEntranceAnimation,
		reset: resetEntranceAnimation,
		headerStyle: animatedHeaderStyle,
		contentStyle: animatedContentStyle,
		fabStyle: animatedFabStyle,
	} = useEntranceAnimation();

	const quantityDebounceTimers = useRef<
		Record<string, ReturnType<typeof setTimeout> | undefined>
	>({});
	const pendingQuantityUpdates = useRef<Record<string, RubberColor | undefined>>(
		{},
	);
	const quantityDebounceMs = 300;

	useEffect(() => {
		return () => {
			Object.values(quantityDebounceTimers.current).forEach((t) => {
				if (t) clearTimeout(t);
			});
			quantityDebounceTimers.current = {};
			pendingQuantityUpdates.current = {};
		};
	}, []);

	// Función para cargar los datos
	const loadData = useCallback(async (showRefresh = false) => {
		if (showRefresh) {
			setRefreshing(true);
		} else {
			setIsLoading(true);
		}
		setError(null);
		// Marca de tiempo para garantizar una duración mínima visible del indicador
		// de recarga y evitar el parpadeo cuando la API responde muy rápido.
		const startedAt = Date.now();
		try {
			const data = await getStock();
			setInventory(data);
		} catch (err) {
			setError(
				"No se pudo cargar el inventario. Verifique su conexión e intente nuevamente.",
			);
			console.error("Error loading data:", err);
		} finally {
			if (showRefresh) {
				const remaining = MIN_REFRESH_INDICATOR_MS - (Date.now() - startedAt);
				if (remaining > 0) {
					await new Promise((resolve) => setTimeout(resolve, remaining));
				}
			}
			setIsLoading(false);
			setRefreshing(false);
		}
	}, []);

	// Load data when component mounts
	useEffect(() => {
		loadData();
	}, [loadData]);

	// Iniciar animaciones cuando los datos estén cargados y el modal esté cerrado
	useEffect(() => {
		if (!isLoading && !dialogVisible && !deleteDialogVisible) {
			// Solo ocultar splash screen y ejecutar animaciones si no se han ejecutado antes
			if (!animationsStarted) {
				SplashScreen.hideAsync(); // Ocultar splash screen aquí
				startEntranceAnimation();
			}
		}
	}, [
		isLoading,
		dialogVisible,
		deleteDialogVisible,
		animationsStarted,
		startEntranceAnimation,
	]);

	// Reload data when screen gets focus
	useFocusEffect(
		useCallback(() => {
			// Resetear la animación cada vez que la pantalla gana foco, pero solo si no hay modales abiertos
			if (!dialogVisible && !deleteDialogVisible) {
				resetEntranceAnimation();
			}

			// Cargar los datos
			loadData();
		}, [loadData, dialogVisible, deleteDialogVisible, resetEntranceAnimation]),
	);

	const adjustQuantity = useCallback(
		async (id: string, increment: number) => {
			try {
				let updatedColor: RubberColor | null = null;

				setInventory((prev) => {
					const current = prev.find((color) => color.id === id);
					if (!current) return prev;

					updatedColor = {
						...current,
						quantity: Math.max(0, current.quantity + increment),
					};

					return prev.map((color) => (color.id === id ? updatedColor! : color));
				});

				if (!updatedColor) return;
				pendingQuantityUpdates.current[id] = updatedColor;
				const existingTimer = quantityDebounceTimers.current[id];
				if (existingTimer) clearTimeout(existingTimer);

				quantityDebounceTimers.current[id] = setTimeout(async () => {
					const colorToSend = pendingQuantityUpdates.current[id];
					pendingQuantityUpdates.current[id] = undefined;
					quantityDebounceTimers.current[id] = undefined;
					if (!colorToSend) return;
					try {
						await updateColor(colorToSend);
					} catch (err) {
						showError(
							"Error",
							"No se pudo actualizar el inventario en la API. Intente nuevamente.",
						);
						loadData();
						console.error("Error adjusting quantity:", err);
					}
				}, quantityDebounceMs);
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
		[loadData],
	);

	const handleAddColor = useCallback(async () => {
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
			quantity = Number.parseInt(newColorQuantity, 10);
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
			setDialogVisible(false);
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
	}, [newColorName, newColorQuantity, inventory, loadData]);

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
			setColorToDelete(color);
			setDeleteDialogVisible(true);
		},
		[],
	);

	const handleConfirmDelete = async () => {
		if (colorToDelete) {
			setDeleteDialogVisible(false);
			await handleDeleteColor(colorToDelete.name);
			setColorToDelete(null);
		}
	};

	const closeDialog = useCallback(() => {
		setDialogVisible(false);
		setNewColorName("");
		setNewColorQuantity("");
		// Reiniciar animaciones si no hay otros modales abiertos
		if (!deleteDialogVisible) {
			resetEntranceAnimation();
		}
	}, [deleteDialogVisible, resetEntranceAnimation]);

	const reloadData = () => {
		loadData(true);
	};


	// Renderizar cada elemento de la lista con Material Design 3
	const renderItem = useCallback(
		({ item }: { item: RubberColor }) => {
			return (
				<Card
					style={styles.colorCard}
					mode="elevated"
					elevation={1}
				>
					<Card.Content>
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<View style={{ flex: 1 }}>
								<Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 4 }}>
									{item.name}
								</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<IconButton
									icon="minus-circle"
									size={24}
									onPress={() => adjustQuantity(item.id, -1)}
									mode="contained-tonal"
								/>
								<AnimatedQuantity 
									quantity={item.quantity} 
									variant="headlineSmall"
									style={{ marginHorizontal: 8, fontWeight: 'bold' }}
								/>
								<IconButton
									icon="plus-circle"
									size={24}
									onPress={() => adjustQuantity(item.id, 1)}
									mode="contained-tonal"
								/>
								<IconButton
									icon="delete"
									size={24}
									onPress={() => confirmDeleteColor(item)}
									iconColor={theme.colors.error}
								/>
							</View>
						</View>
					</Card.Content>
				</Card>
			);
		},
		[adjustQuantity, confirmDeleteColor, theme],
	);

	return (
		<Surface style={styles.container}>
				{/* Appbar con Material Design 3 */}
				<Animated.View style={animatedHeaderStyle}>
					<Appbar.Header elevated mode="center-aligned" style={styles.appBar}>
					<Appbar.Action 
						icon={themeMode === 'auto' ? 'theme-light-dark' : themeMode === 'dark' ? 'weather-night' : 'white-balance-sunny'} 
						onPress={toggleTheme}
					/>
					<Appbar.Content title="Stock" titleStyle={styles.appBarTitle} />
					<Appbar.Action 
						icon={refreshing ? "loading" : "refresh"} 
						onPress={reloadData}
						disabled={refreshing}
					/>
					</Appbar.Header>
				</Animated.View>

				{/* Contenido principal */}
				{error ? (
					<ScrollView 
						style={styles.content}
						contentContainerStyle={{ paddingBottom: 16 }}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={reloadData}
								colors={[theme.colors.primary]}
							/>
						}
					>
						<Card style={styles.errorCard} mode="outlined">
							<Card.Content>
								<Text variant="bodyLarge" style={styles.errorText}>
									{error}
								</Text>
							</Card.Content>
							<Card.Actions>
								<Button mode="contained" onPress={reloadData}>
									Reintentar
								</Button>
							</Card.Actions>
						</Card>
					</ScrollView>
				) : isLoading ? (
					<View style={styles.loadingContainer}>
						<PaperActivityIndicator animating={true} size="large" />
						<Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
							Cargando inventario...
						</Text>
					</View>
				) : (
					<Animated.View style={[{ flex: 1 }, animatedContentStyle]}>
						<FlatList
							data={inventory}
							keyExtractor={(item) => item.id}
							renderItem={renderItem}
							ListHeaderComponent={
								<Surface style={styles.headerCard} elevation={2}>
								<Image
									source={require("../../assets/images/palot.png")}
									style={styles.headerImage}
									resizeMode="contain"
								/>
								<View style={styles.headerTextContainer}>
									<Text variant="headlineMedium" style={styles.headerTitle}>
										Stock
									</Text>
									<Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
										{inventory.length} colores disponibles
									</Text>
								</View>
							</Surface>
						}
						ListEmptyComponent={
							<Card style={styles.emptyCard}>
								<Card.Content style={styles.emptyContent}>
									<Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
										No hay colores en el inventario
									</Text>
									<Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
										Pulsa + para agregar tu primer color
									</Text>
								</Card.Content>
							</Card>
						}
						contentContainerStyle={styles.listContent}
						ListFooterComponent={<View style={{ height: 80 }} />}
						showsVerticalScrollIndicator={false}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={reloadData}
								colors={[theme.colors.primary]}
								/>
							}
						/>
					</Animated.View>
				)}

				{/* FAB para agregar nuevo color */}
				<Animated.View style={[styles.fabContainer, animatedFabStyle]}>
					<FAB
						icon="plus"
						style={styles.fab}
						onPress={() => setDialogVisible(true)}
					/>
				</Animated.View>

				{/* Dialog para agregar color */}
				<Portal>
					<Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
						<Dialog.Title>Agregar Nuevo Color</Dialog.Title>
						<Dialog.Content>
							<TextInput
								label="Nombre del color"
								defaultValue={newColorName}
								onChangeText={setNewColorName}
								mode="outlined"
								style={styles.dialogInput}
							/>
							<TextInput
								label="Cantidad inicial"
								defaultValue={newColorQuantity}
								onChangeText={setNewColorQuantity}
								keyboardType="numeric"
								mode="outlined"
								style={styles.dialogInput}
							/>
						</Dialog.Content>
						<Dialog.Actions>
							<Button onPress={closeDialog}>
								Cancelar
							</Button>
							<Button mode="contained" onPress={() => {
								handleAddColor();
								setDialogVisible(false);
							}}>
								Agregar
							</Button>
						</Dialog.Actions>
					</Dialog>

					{/* Dialog para confirmar eliminación */}
					<Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
						<Dialog.Title>Confirmar Eliminación</Dialog.Title>
						<Dialog.Content>
							<Text variant="bodyLarge">
								¿Está seguro que desea eliminar {colorToDelete?.name}?
							</Text>
						</Dialog.Content>
						<Dialog.Actions>
							<Button onPress={() => setDeleteDialogVisible(false)}>
								Cancelar
							</Button>
							<Button mode="contained" buttonColor={theme.colors.error} onPress={handleConfirmDelete}>
								Eliminar
							</Button>
						</Dialog.Actions>
					</Dialog>
				</Portal>
		</Surface>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	appBar: {
		elevation: 0,
	},
	appBarTitle: {
		fontWeight: 'bold',
	},
	content: {
		flex: 1,
	},
	headerCard: {
		margin: Spacing.md,
		padding: Spacing.md,
		borderRadius: BorderRadius.lg,
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerImage: {
		width: 80,
		height: 80,
		marginRight: Spacing.md,
	},
	headerTextContainer: {
		flex: 1,
	},
	headerTitle: {
		fontWeight: 'bold',
		marginBottom: Spacing.xs,
	},
	headerSubtitle: {
		// Se aplicará color del tema en el componente
	},
	colorCard: {
		marginHorizontal: Spacing.md,
		marginVertical: Spacing.sm,
		borderRadius: BorderRadius.md,
	},
	activeCard: {},
	cardContent: {
		paddingVertical: Spacing.sm,
	},
	cardRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	dragIcon: {
		marginLeft: -Spacing.sm,
	},
	colorInfo: {
		flex: 1,
		marginLeft: Spacing.sm,
	},
	colorName: {
		fontWeight: '600',
		marginBottom: Spacing.xs,
	},
	quantityChip: {
		marginTop: Spacing.xs,
	},
	actionButtons: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: Spacing.xl,
	},
	loadingText: {
		marginTop: Spacing.md,
		// Se aplicará color del tema en el componente
	},
	errorCard: {
		margin: Spacing.md,
	},
	errorText: {
		marginBottom: Spacing.sm,
	},
	emptyCard: {
		margin: Spacing.md,
		minHeight: 200,
	},
	emptyContent: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: Spacing.xl,
	},
	emptyTitle: {
		textAlign: 'center',
		marginBottom: Spacing.sm,
		// Se aplicará color del tema en el componente
	},
	emptySubtitle: {
		textAlign: 'center',
		// Se aplicará color del tema en el componente
	},
	listContent: {
		paddingBottom: Spacing.md,
	},
	fabContainer: {
		position: 'absolute',
		right: Spacing.md,
		bottom: Spacing.md,
	},
	fab: {
		// El FAB ahora está dentro del contenedor animado
	},
	dialogInput: {
		marginBottom: Spacing.md,
	},
});
