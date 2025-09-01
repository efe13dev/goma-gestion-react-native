import React, { useState, useCallback } from "react";
import {
	View,
	StyleSheet,
	ScrollView,
	RefreshControl,
	Image,
	FlatList,
} from "react-native";
import {
	Appbar,
	Card,
	IconButton,
	Button,
	Text,
	Dialog,
	Portal,
	useTheme,
	FAB,
	Surface,
	ActivityIndicator as PaperActivityIndicator,
} from "react-native-paper";
import { getFormulas, deleteFormula } from "@/api/formulasApi";
import type { Formula } from "@/types/formulas";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { showSuccess, showError } from "@/utils/toast";

export default function FormulasScreen() {
	const theme = useTheme();
	const router = useRouter();
	const [formulas, setFormulas] = useState<Formula[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [formulaToDelete, setFormulaToDelete] = useState<Formula | null>(null);

	const loadFormulas = useCallback(async (showRefresh = false) => {
		if (showRefresh) {
			setRefreshing(true);
		} else {
			setIsLoading(true);
		}
		setError(null);
		try {
			const fetchedFormulas = await getFormulas();
			setFormulas(fetchedFormulas);
		} catch (err) {
			const errorMessage = "Error al cargar las fórmulas. Inténtalo de nuevo.";
			setError(errorMessage);
			console.error(err);
		} finally {
			setIsLoading(false);
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

	const confirmDeleteFormula = useCallback((formula: Formula) => {
		setFormulaToDelete(formula);
		setDeleteDialogVisible(true);
	}, []);

	const handleConfirmDelete = async () => {
		if (formulaToDelete) {
			setDeleteDialogVisible(false);
			await handleDeleteFormula(formulaToDelete.id, formulaToDelete.nombreColor);
			setFormulaToDelete(null);
		}
	};

	const reloadData = () => {
		loadFormulas(true);
	};

	useFocusEffect(
		useCallback(() => {
			loadFormulas();
		}, [loadFormulas]),
	);

	const renderFormulaItem = ({ item }: { item: Formula }) => (
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
						<Text variant="titleMedium" style={styles.formulaName}>
							{item.nombreColor.charAt(0).toUpperCase() + item.nombreColor.slice(1)}
						</Text>
					</View>
					<IconButton
						icon="chevron-right"
						size={24}
						onPress={() => router.push(`/formulas/${item.id}`)}
					/>
				</View>
			</Card.Content>
		</Card>
	);

	return (
		<Surface style={styles.container}>
			{/* Appbar con Material Design 3 */}
			<Appbar.Header elevated mode="center-aligned" style={styles.appBar}>
				<Appbar.Content title="Fórmulas" titleStyle={styles.appBarTitle} />
				<Appbar.Action 
					icon={refreshing ? "loading" : "refresh"} 
					onPress={reloadData}
					disabled={refreshing}
				/>
			</Appbar.Header>

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
					<PaperActivityIndicator 
						size="large" 
						color={theme.colors.primary} 
					/>
					<Text variant="bodyLarge" style={styles.loadingText}>
						Cargando fórmulas...
					</Text>
				</View>
			) : (
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
									Gestión de Fórmulas
								</Text>
								<Text variant="bodyMedium" style={styles.headerSubtitle}>
									{formulas.length} fórmulas disponibles
								</Text>
							</View>
						</Surface>
					}
					ListEmptyComponent={
						<Card style={styles.emptyCard}>
							<Card.Content style={styles.emptyContent}>
								<Text variant="titleLarge" style={styles.emptyTitle}>
									No hay fórmulas disponibles
								</Text>
								<Text variant="bodyMedium" style={styles.emptySubtitle}>
									Presiona el botón + para agregar tu primera fórmula
								</Text>
							</Card.Content>
						</Card>
					}
					contentContainerStyle={styles.listContent}
					ListFooterComponent={<View style={{ height: 100 }} />}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={reloadData}
							colors={[theme.colors.primary]}
						/>
					}
				/>
			)}

			{/* FAB para agregar nueva fórmula */}
			<FAB
				icon="plus"
				style={styles.fab}
				onPress={() => router.push("/formulas/nueva-formula")}
			/>

			{/* Dialog para confirmar eliminación */}
			<Portal>
				<Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
					<Dialog.Title>Confirmar Eliminación</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyLarge">
							¿Está seguro que desea eliminar la fórmula {formulaToDelete?.nombreColor}?
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
		margin: 16,
		padding: 16,
		borderRadius: 16,
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerImage: {
		width: 80,
		height: 80,
		marginRight: 16,
	},
	headerTextContainer: {
		flex: 1,
	},
	headerTitle: {
		fontWeight: 'bold',
		marginBottom: 4,
	},
	headerSubtitle: {
		opacity: 0.7,
	},
	formulaCard: {
		marginHorizontal: 16,
		marginVertical: 8,
		borderRadius: 12,
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
		fontWeight: '600',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 32,
	},
	loadingText: {
		marginTop: 16,
		opacity: 0.7,
	},
	errorCard: {
		margin: 16,
	},
	errorText: {
		marginBottom: 8,
	},
	emptyCard: {
		margin: 16,
		minHeight: 200,
	},
	emptyContent: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 32,
	},
	emptyTitle: {
		textAlign: 'center',
		marginBottom: 8,
		opacity: 0.8,
	},
	emptySubtitle: {
		textAlign: 'center',
		opacity: 0.6,
	},
	listContent: {
		paddingBottom: 16,
	},
	fab: {
		position: 'absolute',
		margin: 16,
		right: 0,
		bottom: 0,
	},
});
