import { deleteFormula, getFormulaNames } from "@/api/formulasApi";
import SkeletonList from "@/components/SkeletonCard";
import { BorderRadius, Spacing } from "@/constants/Spacing";
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
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));
	const pressConfig = { damping: 18, stiffness: 260 } as const;

	return (
		<AnimatedListItem index={index}>
			<Animated.View style={animatedStyle}>
				<Card
					style={styles.formulaCard}
					mode="elevated"
					elevation={1}
					onPress={onOpen}
					onLongPress={onDelete}
					onPressIn={() => {
						scale.value = withSpring(0.97, pressConfig);
					}}
					onPressOut={() => {
						scale.value = withSpring(1, pressConfig);
					}}
				>
					<Card.Content>
						<View style={styles.cardContent}>
							<View style={styles.formulaInfo}>
								<Text
									variant="titleMedium"
									style={[styles.formulaName, { color: textColor }]}
								>
									{item.name.charAt(0).toUpperCase() + item.name.slice(1)}
								</Text>
							</View>
							<IconButton
								icon="chevron-right"
								size={20}
								iconColor={chevronColor}
								onPress={onOpen}
								accessibilityLabel={`Abrir fórmula ${item.name}`}
							/>
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

	const confirmDeleteFormula = useCallback((formula: FormulaListItem) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setFormulaToDelete(formula);
		setDeleteDialogVisible(true);
	}, []);

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
		<Surface style={styles.container}>
			{/* Appbar con Material Design 3 */}
			<Animated.View style={animatedHeaderStyle}>
				<Appbar.Header elevated mode="center-aligned" style={styles.appBar}>
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
						<Surface style={styles.headerCard} elevation={2}>
							<Image
								source={require("@/assets/images/chemical.png")}
								style={styles.headerImage}
								resizeMode="contain"
							/>
							<View style={styles.headerTextContainer}>
								<Text variant="headlineMedium" style={styles.headerTitle}>
									Fórmulas
								</Text>
								<Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
									{formulas.length} fórmulas disponibles
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
				<Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
					<Dialog.Title>Confirmar Eliminación</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyLarge">
							¿Está seguro que desea eliminar la fórmula {formulaToDelete?.name}?
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
	formulaCard: {
		marginHorizontal: Spacing.md,
		marginVertical: Spacing.sm,
		borderRadius: BorderRadius.md,
	},
	cardContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	formulaInfo: {
		flex: 1,
	},
	formulaName: {
		// Usa la variante nativa de MD3
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
});
