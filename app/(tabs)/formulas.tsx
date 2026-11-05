import { deleteFormula, getFormulaNames } from "@/api/formulasApi";
import SkeletonList from "@/components/SkeletonCard";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { formatColorName, getColorSwatch } from "@/types/colors";
import * as Haptics from "expo-haptics";
import { showError, showSuccess } from "@/utils/toast";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import AnimatedListItem from "@/components/AnimatedListItem";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";
import { useTheme as useCustomTheme } from "@/contexts/ThemeContext";
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
	useTheme,
} from "react-native-paper";

// Tipo para el listado optimizado de fórmulas
interface FormulaListItem {
	id: string;
	name: string;
}

// Duración mínima (ms) que se mantiene visible el indicador de recarga manual
// para que el feedback se perciba intencional y no como un parpadeo.
const MIN_REFRESH_INDICATOR_MS = 600;

// Tarjeta de fórmula con feedback táctil (scale al pulsar) y entrada animada.
function FormulaCard({
	item,
	index,
	textColor,
	chevronColor,
	onOpen,
	onDelete,
}: {
	item: FormulaListItem;
	index: number;
	textColor: string;
	chevronColor: string;
	onOpen: () => void;
	onDelete: () => void;
}) {
	const theme = useTheme();
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));
	const pressConfig = { damping: 18, stiffness: 260 } as const;

	return (
		<AnimatedListItem index={index}>
			<Animated.View style={animatedStyle}>
				<Card
					style={[
						styles.formulaCard,
						{
							backgroundColor: theme.colors.surface,
							borderColor: theme.colors.outlineVariant,
						},
					]}
					mode="elevated"
					elevation={0}
					onPress={onOpen}
					onLongPress={onDelete}
					onPressIn={() => {
						scale.value = withSpring(0.97, pressConfig);
					}}
					onPressOut={() => {
						scale.value = withSpring(1, pressConfig);
					}}
				>
					<Card.Content style={styles.cardInner}>
						<View style={styles.cardContent}>
							<View
								style={[
									styles.colorSwatch,
									{
										backgroundColor: getColorSwatch(item.name),
										borderColor: theme.colors.outlineVariant,
									},
								]}
							/>
							<View style={styles.formulaInfo}>
								<Text
									variant="titleMedium"
									style={[styles.formulaName, { color: textColor }]}
								>
									{formatColorName(item.name)}
								</Text>
								<Text
									variant="bodySmall"
									style={{ color: theme.colors.onSurfaceVariant }}
								>
									Ver ingredientes · Mantén para eliminar
								</Text>
							</View>
							<View
								style={[
									styles.chevronBadge,
									{ backgroundColor: theme.colors.elevation.level3 },
								]}
							>
								<IconButton
									icon="chevron-right"
									size={20}
									style={{ margin: 0, width: 32, height: 32 }}
									iconColor={chevronColor}
									onPress={onOpen}
									accessibilityLabel={`Abrir fórmula ${item.name}`}
								/>
							</View>
						</View>
					</Card.Content>
				</Card>
			</Animated.View>
		</AnimatedListItem>
	);
}

export default function FormulasScreen() {
	const theme = useTheme();
	const { themeMode, toggleTheme } = useCustomTheme();
	const router = useRouter();
	const [formulas, setFormulas] = useState<FormulaListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formulaToDelete, setFormulaToDelete] = useState<FormulaListItem | null>(null);
	// Evita mostrar el spinner a pantalla completa (y desmontar la lista) en
	// recargas posteriores a la primera carga.
	const hasLoadedRef = useRef(false);

	// Animaciones de entrada
	const {
		animationsStarted,
		start: startEntranceAnimation,
		headerStyle: animatedHeaderStyle,
		contentStyle: animatedContentStyle,
		fabStyle: animatedFabStyle,
	} = useEntranceAnimation();

	const loadFormulas = useCallback(async (showRefresh = false) => {
		if (showRefresh) {
			setRefreshing(true);
		} else if (!hasLoadedRef.current) {
			setLoading(true);
		}
		setError(null);
		// Marca de tiempo para garantizar una duración mínima visible del indicador
		// de recarga y evitar el parpadeo cuando la API responde muy rápido.
		const startedAt = Date.now();
		try {
			const fetchedFormulas = await getFormulaNames();
			setFormulas(fetchedFormulas);
			hasLoadedRef.current = true;
		} catch (err) {
			const errorMessage = "Error al cargar las fórmulas. Inténtalo de nuevo.";
			setError(errorMessage);
			console.error(err);
		} finally {
			if (showRefresh) {
				const remaining = MIN_REFRESH_INDICATOR_MS - (Date.now() - startedAt);
				if (remaining > 0) {
					await new Promise((resolve) => setTimeout(resolve, remaining));
				}
			}
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	const handleDeleteFormula = async (id: string, nombreColor: string) => {
		// Actualización optimista: quitar localmente y revertir si la API falla.
		const previousFormulas = formulas;
		setFormulas((prev) => prev.filter((formula) => formula.id !== id));
		try {
			const success = await deleteFormula(id, nombreColor);
			if (success) {
				showSuccess("¡Eliminada!", `Fórmula ${nombreColor} eliminada.`);
			} else {
				setFormulas(previousFormulas);
				showError("Error", "No se pudo eliminar la fórmula.");
			}
		} catch (err) {
			setFormulas(previousFormulas);
			console.error("Error deleting formula:", err);
			showError("Error", "Ocurrió un error al intentar eliminar la fórmula.");
		}
	};

	const confirmDeleteFormula = (formula: FormulaListItem) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setFormulaToDelete(formula);
		setDeleteDialogVisible(true);
	};

	const handleConfirmDelete = async () => {
		if (formulaToDelete) {
			setDeleteDialogVisible(false);
			await handleDeleteFormula(formulaToDelete.id, formulaToDelete.name);
			setFormulaToDelete(null);
		}
	};

	const reloadData = () => {
		loadFormulas(true);
	};

	useFocusEffect(
		useCallback(() => {
			// Recargar al ganar foco; la animación de entrada se ejecuta solo en el
			// primer montaje para evitar parpadeos al cambiar de pestaña.
			loadFormulas();
		}, [loadFormulas]),
	);

	// Iniciar animaciones al montar, sin esperar a la API (se muestran skeletons)
	useEffect(() => {
		if (!animationsStarted) {
			startEntranceAnimation();
		}
	}, [animationsStarted, startEntranceAnimation]);

	const renderFormulaItem = ({
		item,
		index,
	}: {
		item: FormulaListItem;
		index: number;
	}) => (
		<FormulaCard
			item={item}
			index={index}
			textColor={theme.colors.onSurface}
			chevronColor={theme.colors.onSurfaceVariant}
			onOpen={() =>
				router.push({
					pathname: "/formulas/[id]",
					params: { id: item.id, name: item.name },
				})
			}
			onDelete={() => confirmDeleteFormula(item)}
		/>
	);

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
					<Appbar.Content title="Fórmulas" titleStyle={styles.appBarTitle} />
					{refreshing ? (
						<View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
							<PaperActivityIndicator animating size={20} />
						</View>
					) : (
						<Appbar.Action icon="refresh" onPress={reloadData} accessibilityLabel="Recargar fórmulas" />
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
			) : loading ? (
				<SkeletonList count={6} />
			) : (
				<Animated.View style={[{ flex: 1 }, animatedContentStyle]}>
					<FlatList
					data={formulas}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderFormulaItem}
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
									source={require("@/assets/images/chemical.png")}
									style={styles.headerImage}
									resizeMode="contain"
								/>
							</View>
							<View style={styles.headerTextContainer}>
								<Text variant="titleLarge" style={styles.headerTitle}>
									Recetario de Goma
								</Text>
								<Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
									{formulas.length} fórmulas registradas
								</Text>
							</View>
						</Surface>
					}
					ListEmptyComponent={
						<Card style={styles.emptyCard}>
							<Card.Content style={styles.emptyContent}>
								<Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
									No hay fórmulas disponibles
								</Text>
								<Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
									Pulsa + para crear tu primera fórmula
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
			</Animated.View>)}

			{/* FAB para agregar nueva fórmula */}
			<Animated.View style={[styles.fabContainer, animatedFabStyle]}>
				<FAB
					icon="plus"
					style={styles.fab}
					onPress={() => router.push("/formulas/nueva-formula")}
					accessibilityLabel="Crear nueva fórmula"
				/>
			</Animated.View>

			{/* Dialog para confirmar eliminación */}
			<Portal>
				<Dialog
					visible={deleteDialogVisible}
					onDismiss={() => setDeleteDialogVisible(false)}
					style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
				>
					<Dialog.Icon icon="trash-can-outline" color={theme.colors.error} size={32} />
					<Dialog.Title style={styles.dialogTitleCentered}>
						Eliminar fórmula
					</Dialog.Title>
					<Dialog.Content>
						{formulaToDelete ? (
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
											backgroundColor: getColorSwatch(formulaToDelete.name),
											borderColor: theme.colors.outlineVariant,
											marginRight: 10,
										},
									]}
								/>
								<Text variant="titleMedium" style={{ fontWeight: "700" }}>
									{formatColorName(formulaToDelete.name)}
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
							Se eliminará esta fórmula y todos sus ingredientes de forma permanente.
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
	formulaCard: {
		marginHorizontal: Spacing.md,
		marginVertical: 5,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
	},
	cardInner: {
		paddingVertical: 12,
		paddingHorizontal: Spacing.md,
	},
	cardContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	colorSwatch: {
		width: 18,
		height: 18,
		borderRadius: 9,
		borderWidth: 1,
		marginRight: 12,
	},
	formulaInfo: {
		flex: 1,
	},
	formulaName: {
		// Usa la variante nativa de MD3
		fontWeight: '600',
		marginBottom: 2,
	},
	chevronBadge: {
		borderRadius: BorderRadius.xl,
		marginLeft: Spacing.sm,
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
		borderRadius: BorderRadius.md,
	},
	errorText: {
		marginBottom: Spacing.sm,
	},
	emptyCard: {
		margin: Spacing.md,
		minHeight: 200,
		borderRadius: BorderRadius.md,
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
	dialogTitleCentered: {
		fontWeight: '700',
		textAlign: 'center',
	},
	dialogPreviewChip: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: BorderRadius.md,
		borderWidth: 1,
		marginBottom: Spacing.md,
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
