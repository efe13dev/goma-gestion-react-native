import { deleteFormula, getFormulaNames } from "@/api/formulasApi";
import { BorderRadius, Spacing } from "@/constants/Spacing";

// Tipo para el listado optimizado de fórmulas
interface FormulaListItem {
	id: string;
	name: string;
}
import { showError, showSuccess } from "@/utils/toast";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withDelay,
	withSpring,
} from "react-native-reanimated";
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

export default function FormulasScreen() {
	const theme = useTheme();
	const { themeMode, toggleTheme } = useCustomTheme();
	const router = useRouter();
	const [formulas, setFormulas] = useState<FormulaListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [formulaToDelete, setFormulaToDelete] = useState<FormulaListItem | null>(null);

	// Animaciones de entrada
	const headerOpacity = useSharedValue(0);
	const headerTranslateY = useSharedValue(-50);
	const contentOpacity = useSharedValue(0);
	const contentTranslateY = useSharedValue(30);
	const fabScale = useSharedValue(0);
	const [animationsStarted, setAnimationsStarted] = useState(false);

	const loadFormulas = useCallback(async (showRefresh = false) => {
		if (showRefresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}
		setError(null);
		try {
			const fetchedFormulas = await getFormulaNames();
			setFormulas(fetchedFormulas);
		} catch (err) {
			const errorMessage = "Error al cargar las fórmulas. Inténtalo de nuevo.";
			setError(errorMessage);
			console.error(err);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	const handleDeleteFormula = async (id: string, nombreColor: string) => {
		try {
			setIsLoading(true);
			const success = await deleteFormula(id);
			if (success) {
				showSuccess("¡Eliminada!", `Fórmula ${nombreColor} eliminada.`);
				await loadFormulas();
			} else {
				showError("Error", "No se pudo eliminar la fórmula.");
			}
		} catch (err) {
			console.error("Error deleting formula:", err);
			showError("Error", "Ocurrió un error al intentar eliminar la fórmula.");
		} finally {
			setIsLoading(false);
		}
	};

	const confirmDeleteFormula = useCallback((formula: FormulaListItem) => {
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
			// Resetear la animación cada vez que la pantalla gana foco
			setAnimationsStarted(false);
			headerOpacity.value = 0;
			headerTranslateY.value = -50;
			contentOpacity.value = 0;
			contentTranslateY.value = 30;
			fabScale.value = 0;

			// Cargar los datos
			loadFormulas();
		}, [loadFormulas]), // No es necesario añadir los shared values a las dependencias
	);

	// Iniciar animaciones cuando los datos estén cargados
	useEffect(() => {
		if (!loading && !animationsStarted) {
			setAnimationsStarted(true);
			// Animación del header
			headerOpacity.value = withTiming(1, { duration: 300 });
			headerTranslateY.value = withSpring(0, {
				damping: 15,
				stiffness: 150,
			});

			// Animación del contenido con delay
			contentOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
			contentTranslateY.value = withDelay(100, withSpring(0, {
				damping: 15,
				stiffness: 120,
			}));

			// Animación del FAB con más delay
			fabScale.value = withDelay(350, withSpring(1, {
				damping: 12,
				stiffness: 200,
			}));
		}
	}, [loading, animationsStarted]);

	const renderFormulaItem = ({ item }: { item: FormulaListItem }) => (
		<Card
			style={styles.formulaCard}
			mode="elevated"
			elevation={1}
			onPress={() => router.push(`/formulas/${item.id}`)}
			onLongPress={() => confirmDeleteFormula(item)}
		>
			<Card.Content>
				<View style={styles.cardContent}>
					<View style={styles.formulaInfo}>
						<Text variant="titleMedium" style={[styles.formulaName, { color: theme.colors.onSurface }]}>
							{item.name.charAt(0).toUpperCase() + item.name.slice(1)}
						</Text>
					</View>
					<IconButton
						icon="chevron-right"
						size={20}
						iconColor={theme.colors.onSurfaceVariant}
						onPress={() => router.push(`/formulas/${item.id}`)}
					/>
				</View>
			</Card.Content>
		</Card>
	);

	// Estilos animados
	const animatedHeaderStyle = useAnimatedStyle(() => {
		return {
			opacity: headerOpacity.value,
			transform: [{ translateY: headerTranslateY.value }],
		};
	});

	const animatedContentStyle = useAnimatedStyle(() => {
		return {
			opacity: contentOpacity.value,
			transform: [{ translateY: contentTranslateY.value }],
		};
	});

	const animatedFabStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: fabScale.value }],
		};
	});

	return (
		<Surface style={styles.container}>
			{/* Appbar con Material Design 3 */}
			<Animated.View style={animatedHeaderStyle}>
				<Appbar.Header elevated mode="center-aligned" style={styles.appBar}>
					<Appbar.Action 
						icon={themeMode === 'auto' ? 'theme-light-dark' : themeMode === 'dark' ? 'weather-night' : 'white-balance-sunny'} 
						onPress={toggleTheme}
					/>
					<Appbar.Content title="Fórmulas" titleStyle={styles.appBarTitle} />
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
			) : loading ? (
				<View style={styles.loadingContainer}>
					<PaperActivityIndicator animating={true} size="large" />
					<Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
						Cargando fórmulas...
					</Text>
				</View>
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
