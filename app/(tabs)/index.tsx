import {
	addColor,
	deleteColor as apiDeleteColor,
	getStock,
	updateColor,
} from "@/api/stockApi";
import AnimatedQuantity from "@/components/AnimatedQuantity";
import AnimatedListItem from "@/components/AnimatedListItem";
import SkeletonList from "@/components/SkeletonCard";
import * as Haptics from "expo-haptics";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme as useCustomTheme } from "@/contexts/ThemeContext";
import { formatColorName, getColorSwatch, type RubberColor } from "@/types/colors";
import { showError, showSuccess } from "@/utils/toast";
import { useFocusEffect } from "@react-navigation/native";
import { useSplashDone } from "@/components/AnimatedSplash";
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
	const splashDone = useSplashDone();

	// Animaciones de entrada
	const {
		animationsStarted,
		start: startEntranceAnimation,
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
	// Indica si ya se cargaron datos al menos una vez. Evita mostrar el spinner
	// a pantalla completa (y desmontar la lista) en recargas posteriores.
	const hasLoadedRef = useRef(false);
	// Espejo del inventario para leer el valor más reciente fuera del ciclo de
	// render (taps rápidos y debounce) sin efectos secundarios en updaters.
	const inventoryRef = useRef<RubberColor[]>([]);

	useEffect(() => {
		inventoryRef.current = inventory;
	}, [inventory]);

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
		} else if (!hasLoadedRef.current) {
			setIsLoading(true);
		}
		setError(null);
		// Marca de tiempo para garantizar una duración mínima visible del indicador
		// de recarga y evitar el parpadeo cuando la API responde muy rápido.
		const startedAt = Date.now();
		try {
			const data = await getStock();
			setInventory(data);
			hasLoadedRef.current = true;
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

	// Arrancar las animaciones de entrada recién cuando el splash animado
	// terminó, para que no queden tapadas por el overlay. Mientras cargan los
	// datos se muestran los skeletons.
	useEffect(() => {
		if (splashDone && !animationsStarted) {
			startEntranceAnimation();
		}
	}, [splashDone, animationsStarted, startEntranceAnimation]);

	// Reload data when screen gets focus
	useFocusEffect(
		useCallback(() => {
			// Recargar los datos al ganar foco. La animación de entrada se ejecuta
			// solo en el primer montaje para evitar parpadeos al cambiar de pestaña.
			loadData();
		}, [loadData]),
	);

	const adjustQuantity = useCallback(
		(id: string, increment: number) => {
			const current = inventoryRef.current.find((color) => color.id === id);
			if (!current) return;

			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

			const updatedColor: RubberColor = {
				...current,
				quantity: Math.max(0, current.quantity + increment),
			};

			// Actualizar el espejo de forma síncrona para que taps rápidos
			// consecutivos lean siempre el valor más reciente.
			inventoryRef.current = inventoryRef.current.map((color) =>
				color.id === id ? updatedColor : color,
			);
			setInventory(inventoryRef.current);

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
		},
		[loadData],
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

		const newColor: RubberColor = {
			id: newColorName.toLowerCase().replace(/\s+/g, "-"),
			name: newColorName,
			quantity,
		};

		// Actualización optimista: añadir localmente y cerrar el diálogo sin
		// desmontar la lista; si la API falla, se revierte.
		setInventory((prev) => [...prev, newColor]);
		setNewColorName("");
		setNewColorQuantity("");
		setDialogVisible(false);

		try {
			await addColor(newColor);
			showSuccess("¡Añadido!", `Color ${newColorName} agregado`);
		} catch (err) {
			setInventory((prev) => prev.filter((color) => color.id !== newColor.id));
			showError(
				"Error",
				"No se pudo agregar el color. Es posible que ya exista o haya un problema con la API.",
			);
			console.error("Error adding color:", err);
		}
	};

	const handleDeleteColor = async (name: string) => {
		// Actualización optimista: quitar localmente y revertir si falla.
		const previousInventory = inventoryRef.current;
		setInventory((prev) => prev.filter((color) => color.name !== name));
		try {
			await apiDeleteColor(name);
			showSuccess("¡Eliminado!", `Color ${name} eliminado`);
		} catch (err) {
			setInventory(previousInventory);
			showError("Error", "No se pudo eliminar el color. Intente nuevamente.");
			console.error("Error deleting color:", err);
		}
	};

	const confirmDeleteColor = useCallback(
		(color: RubberColor) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

	// Cerrar el diálogo sin tocar las animaciones de entrada: reiniciarlas
	// aquí hacía que toda la pantalla "reapareciera" al cancelar el modal.
	const closeDialog = () => {
		setDialogVisible(false);
		setNewColorName("");
		setNewColorQuantity("");
	};

	const reloadData = () => {
		loadData(true);
	};


	// Renderizar cada elemento de la lista con Material Design 3
	const renderItem = useCallback(
		({ item, index }: { item: RubberColor; index: number }) => {
			const isOutOfStock = item.quantity === 0;
			return (
				<AnimatedListItem index={index}>
				<Card
					style={[
						styles.colorCard,
						{
							backgroundColor: theme.colors.surface,
							borderColor: theme.colors.outlineVariant,
						},
					]}
					mode="elevated"
					elevation={0}
					onLongPress={() => confirmDeleteColor(item)}
				>
					<Card.Content style={styles.cardContent}>
						<View style={styles.cardRow}>
							<View
								style={[
									styles.colorSwatch,
									{
										backgroundColor: getColorSwatch(item.name),
										borderColor: theme.colors.outlineVariant,
									},
								]}
							/>
							<View style={styles.colorInfo}>
								<Text variant="titleMedium" style={styles.colorName}>
									{formatColorName(item.name)}
								</Text>
								<Text
									variant="bodySmall"
									style={{
										color: isOutOfStock
											? theme.colors.error
											: theme.colors.onSurfaceVariant,
										fontWeight: isOutOfStock ? "600" : "400",
									}}
								>
									{isOutOfStock
										? "Sin stock disponible"
										: `${item.quantity} ${item.quantity === 1 ? "palot disponible" : "palots disponibles"}`}
								</Text>
							</View>
							<View style={styles.actionButtons}>
								<View
									style={[
										styles.stepperPill,
										{ backgroundColor: theme.colors.elevation.level3 },
									]}
								>
									<IconButton
										icon="minus"
										size={18}
										style={styles.stepperBtn}
										onPress={() => adjustQuantity(item.id, -1)}
										disabled={item.quantity === 0}
										accessibilityLabel={`Restar una unidad de ${item.name}`}
									/>
									<AnimatedQuantity 
										quantity={item.quantity} 
										variant="titleLarge"
										style={{
											minWidth: 32,
											textAlign: 'center',
											fontWeight: '700',
											color: isOutOfStock ? theme.colors.error : theme.colors.onSurface,
										}}
									/>
									<IconButton
										icon="plus"
										size={18}
										style={styles.stepperBtn}
										onPress={() => adjustQuantity(item.id, 1)}
										iconColor={theme.colors.primary}
										accessibilityLabel={`Sumar una unidad de ${item.name}`}
									/>
								</View>
								<IconButton
									icon="trash-can-outline"
									size={20}
									style={styles.deleteBtn}
									onPress={() => confirmDeleteColor(item)}
									iconColor={theme.colors.onSurfaceVariant}
									accessibilityLabel={`Eliminar ${item.name}`}
								/>
							</View>
						</View>
					</Card.Content>
				</Card>
				</AnimatedListItem>
			);
		},
		[adjustQuantity, confirmDeleteColor, theme],
	);

	const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
	const outOfStockCount = inventory.filter((item) => item.quantity === 0).length;

	return (
		<Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
				{/* Appbar con Material Design 3 */}
				<Animated.View style={animatedHeaderStyle}>
					<Appbar.Header mode="center-aligned" style={[styles.appBar, { backgroundColor: theme.colors.background }]}>
					<Appbar.Action 
						icon={themeMode === 'auto' ? 'theme-light-dark' : themeMode === 'dark' ? 'weather-night' : 'white-balance-sunny'} 
						onPress={toggleTheme}
						accessibilityLabel="Cambiar tema"
					/>
					<Appbar.Content title="Inventario" titleStyle={styles.appBarTitle} />
					{refreshing ? (
						<View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
							<PaperActivityIndicator animating size={20} />
						</View>
					) : (
						<Appbar.Action icon="refresh" onPress={reloadData} accessibilityLabel="Recargar inventario" />
					)}
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
				<SkeletonList count={6} />
				) : (
					<Animated.View style={[{ flex: 1 }, animatedContentStyle]}>
						<FlatList
							data={inventory}
							keyExtractor={(item) => item.id}
							renderItem={renderItem}
							ListHeaderComponent={
								<Surface
									style={[
										styles.headerCard,
										{
											backgroundColor: theme.colors.surface,
											borderColor: theme.colors.outlineVariant,
										},
									]}
									elevation={0}
								>
								<View
									style={[
										styles.headerIconBox,
										{ backgroundColor: theme.colors.primaryContainer },
									]}
								>
									<Image
										source={require("../../assets/images/palot.png")}
										style={styles.headerImage}
										resizeMode="contain"
									/>
								</View>
								<View style={styles.headerTextContainer}>
									<Text variant="titleLarge" style={styles.headerTitle}>
										Resumen de Stock
									</Text>
									<Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
										{totalUnits} palots · {inventory.length} colores
										{outOfStockCount > 0 ? ` · ${outOfStockCount} agotado${outOfStockCount > 1 ? "s" : ""}` : ""}
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
						accessibilityLabel="Agregar color"
					/>
				</Animated.View>

				{/* Dialog para agregar color */}
				<Portal>
					<Dialog
						visible={dialogVisible}
						onDismiss={closeDialog}
						style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
					>
						<Dialog.Title style={styles.dialogTitle}>Nuevo Color</Dialog.Title>
						<Dialog.Content>
							<View
								style={[
									styles.dialogPreviewChip,
									{
										backgroundColor: theme.colors.elevation.level2,
										borderColor: theme.colors.outlineVariant,
									},
								]}
							>
								<View
									style={[
										styles.colorSwatch,
										{
											backgroundColor: getColorSwatch(newColorName || "gris"),
											borderColor: theme.colors.outlineVariant,
										},
									]}
								/>
								<Text
									variant="bodyMedium"
									style={{
										marginLeft: 10,
										color: newColorName.trim()
											? theme.colors.onSurface
											: theme.colors.onSurfaceVariant,
										fontWeight: "600",
									}}
								>
									{newColorName.trim()
										? formatColorName(newColorName.trim())
										: "Vista previa del color"}
								</Text>
							</View>
							<TextInput
								label="Nombre del color"
								value={newColorName}
								onChangeText={setNewColorName}
								mode="outlined"
								outlineStyle={styles.inputOutline}
								style={styles.dialogInput}
							/>
							<TextInput
								label="Cantidad inicial (palots)"
								value={newColorQuantity}
								onChangeText={setNewColorQuantity}
								keyboardType="numeric"
								mode="outlined"
								outlineStyle={styles.inputOutline}
								style={styles.dialogInput}
							/>
						</Dialog.Content>
						<Dialog.Actions style={styles.dialogActions}>
							<Button mode="text" onPress={closeDialog}>
								Cancelar
							</Button>
							<Button
								mode="contained"
								icon="plus"
								style={styles.dialogPrimaryBtn}
								onPress={handleAddColor}
							>
								Agregar
							</Button>
						</Dialog.Actions>
					</Dialog>

					{/* Dialog para confirmar eliminación */}
					<Dialog
						visible={deleteDialogVisible}
						onDismiss={() => setDeleteDialogVisible(false)}
						style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
					>
						<Dialog.Icon icon="trash-can-outline" color={theme.colors.error} size={32} />
						<Dialog.Title style={styles.dialogTitleCentered}>
							Eliminar color
						</Dialog.Title>
						<Dialog.Content>
							{colorToDelete ? (
								<View
									style={[
										styles.dialogPreviewChip,
										{
											backgroundColor: theme.colors.elevation.level2,
											borderColor: theme.colors.outlineVariant,
											justifyContent: "center",
										},
									]}
								>
									<View
										style={[
											styles.colorSwatch,
											{
												backgroundColor: getColorSwatch(colorToDelete.name),
												borderColor: theme.colors.outlineVariant,
											},
										]}
									/>
									<Text
										variant="titleMedium"
										style={{ marginLeft: 10, fontWeight: "700" }}
									>
										{formatColorName(colorToDelete.name)}
									</Text>
									<Text
										variant="bodyMedium"
										style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}
									>
										({colorToDelete.quantity} palots)
									</Text>
								</View>
							) : null}
							<Text
								variant="bodyMedium"
								style={{
									textAlign: "center",
									color: theme.colors.onSurfaceVariant,
								}}
							>
								Esta acción quitará el color del inventario de forma permanente.
							</Text>
						</Dialog.Content>
						<Dialog.Actions style={styles.dialogActions}>
							<Button mode="text" onPress={() => setDeleteDialogVisible(false)}>
								Cancelar
							</Button>
							<Button
								mode="contained"
								icon="trash-can-outline"
								buttonColor={theme.colors.error}
								textColor={theme.colors.onError}
								style={styles.dialogPrimaryBtn}
								onPress={handleConfirmDelete}
							>
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
		marginHorizontal: Spacing.md,
		marginTop: Spacing.xs,
		marginBottom: Spacing.md,
		padding: Spacing.md,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerIconBox: {
		width: 56,
		height: 56,
		borderRadius: BorderRadius.md,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: Spacing.md,
	},
	headerImage: {
		width: 40,
		height: 40,
	},
	headerTextContainer: {
		flex: 1,
	},
	headerTitle: {
		fontWeight: '700',
		marginBottom: 2,
	},
	headerSubtitle: {
		// Se aplicará color del tema en el componente
	},
	colorCard: {
		marginHorizontal: Spacing.md,
		marginVertical: 5,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
	},
	activeCard: {},
	cardContent: {
		paddingVertical: 12,
		paddingHorizontal: Spacing.md,
	},
	cardRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	colorSwatch: {
		width: 18,
		height: 18,
		borderRadius: 9,
		borderWidth: 1,
	},
	dragIcon: {
		marginLeft: -Spacing.sm,
	},
	colorInfo: {
		flex: 1,
		marginLeft: 12,
		marginRight: Spacing.sm,
	},
	colorName: {
		fontWeight: '600',
		marginBottom: 2,
	},
	quantityChip: {
		marginTop: Spacing.xs,
	},
	actionButtons: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	stepperPill: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: BorderRadius.xl,
		paddingHorizontal: 2,
		paddingVertical: 2,
	},
	stepperBtn: {
		margin: 0,
		width: 34,
		height: 34,
	},
	deleteBtn: {
		margin: 0,
		marginLeft: 4,
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
	dialog: {
		borderRadius: BorderRadius.xl,
	},
	dialogTitle: {
		fontWeight: '700',
	},
	dialogTitleCentered: {
		fontWeight: '700',
		textAlign: 'center',
	},
	dialogPreviewChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: BorderRadius.md,
		borderWidth: 1,
		marginBottom: Spacing.md,
	},
	inputOutline: {
		borderRadius: BorderRadius.md,
	},
	dialogInput: {
		marginBottom: Spacing.sm,
	},
	dialogActions: {
		paddingHorizontal: Spacing.lg,
		paddingBottom: Spacing.md,
		gap: Spacing.xs,
	},
	dialogPrimaryBtn: {
		borderRadius: BorderRadius.lg,
	},
});
