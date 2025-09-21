import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	View,
	ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Appbar,
	Card,
	Text,
	TextInput,
	Button,
	Dialog,
	Portal,
	IconButton,
	ActivityIndicator,
	Surface,
	FAB,
	SegmentedButtons,
	useTheme,
} from "react-native-paper";
import { getFormulaById, updateFormula, addIngredient } from "@/api/formulasApi";
import type { Formula } from "@/types/formulas";
import { Spacing } from "@/constants/Spacing";
import { showSuccess, showError } from "@/utils/toast";

type Ingrediente = {
	nombre: string;
	cantidad: number;
	unidad: string;
};

// Función para capitalizar la primera letra de un string
function capitalizeFirstLetter(text: string) {
	if (!text) return "";
	return text.charAt(0).toUpperCase() + text.slice(1);
}

// Función para convertir cantidades a kilos
function convertToKilos(cantidad: number, unidad: string): number {
	switch (unidad.toLowerCase()) {
		case 'kg':
			return cantidad;
		case 'gr':
		case 'g':
			return cantidad / 1000;
		case 'l':
			// Asumimos densidad del agua (1 L = 1 kg) para líquidos
			return cantidad;
		default:
			return cantidad / 1000; // Por defecto asumimos gramos
	}
}

// Función para calcular el peso total en kilos
function calculateTotalWeight(ingredientes: Ingrediente[]): number {
	return ingredientes.reduce((total, ingrediente) => {
		const weightInKilos = convertToKilos(ingrediente.cantidad, ingrediente.unidad);
		return total + weightInKilos;
	}, 0);
}

export default function FormulaDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const theme = useTheme();
	const [formula, setFormula] = useState<Formula | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedIngredientIndex, setSelectedIngredientIndex] = useState<number | null>(null);
	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [editedIngredient, setEditedIngredient] = useState<Ingrediente>({
		nombre: "",
		cantidad: 0,
		unidad: "gr",
	});
	const [addDialogVisible, setAddDialogVisible] = useState(false);
	const [newIngredient, setNewIngredient] = useState({
		nombre: "",
		cantidad: "",
		unidad: "gr",
	});

	useEffect(() => {
		if (id && typeof id === 'string') {
			fetchFormula();
		} else {
			setError("No se proporcionó ID de fórmula.");
			setIsLoading(false);
		}
	}, [id]);

	const fetchFormula = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const fetchedFormula = await getFormulaById(id as string);
			if (fetchedFormula) {
				setFormula(fetchedFormula);
			} else {
				setError("No se encontró la fórmula.");
			}
		} catch (err) {
			setError("Error al cargar la fórmula.");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleIngredientPress = (ingrediente: Ingrediente, index: number) => {
		setSelectedIngredientIndex(index);
		setEditedIngredient({ ...ingrediente });
		setEditDialogVisible(true);
	};

	const handleUpdateIngredient = async () => {
		if (selectedIngredientIndex === null || !formula) return;

		const updatedIngredients = [...(formula.ingredientes || [])];
		updatedIngredients[selectedIngredientIndex] = editedIngredient as any;

		try {
			await updateFormula(id as string, { ...formula, ingredientes: updatedIngredients } as Formula);
			showSuccess(
				"Ingrediente actualizado",
				"El ingrediente se actualizó correctamente",
			);
			fetchFormula();
		} catch (error) {
			console.error("Error al actualizar ingrediente:", error);
			showError("Error", "Ocurrió un error al actualizar el ingrediente");
		} finally {
			setEditDialogVisible(false);
			setIsLoading(false);
		}
	};

	const handleConfirmDelete = () => {
		setEditDialogVisible(false);
		setDeleteDialogVisible(true);
	};

	const handleDeleteIngredient = async () => {
		if (selectedIngredientIndex === null || !formula || !id) return;

		setIsLoading(true);
		try {
			const updatedIngredients = formula.ingredientes.filter(
				(_, index) => index !== selectedIngredientIndex
			);
			await updateFormula(id as string, { ...formula, ingredientes: updatedIngredients } as Formula);

			showSuccess(
				"Ingrediente eliminado",
				"El ingrediente se eliminó correctamente",
			);
			fetchFormula();
		} catch (error) {
			console.error("Error al eliminar ingrediente:", error);
			showError("Error", "Ocurrió un error al eliminar el ingrediente");
		} finally {
			setDeleteDialogVisible(false);
			setIsLoading(false);
		}
	};

	const handleAddIngredient = () => {
		setNewIngredient({ nombre: "", cantidad: "", unidad: "gr" });
		setAddDialogVisible(true);
	};

	const handleSaveNewIngredient = async () => {
		if (!newIngredient.nombre.trim() || !newIngredient.cantidad.trim()) {
			showError("Error", "Completa el nombre y la cantidad del ingrediente");
			return;
		}
		setIsLoading(true);
		try {
			const ingredienteObj = {
				nombre: newIngredient.nombre.trim(),
				cantidad: Number(newIngredient.cantidad),
				unidad: newIngredient.unidad.trim() || "gr",
			};
			const success = await addIngredient(id as string, ingredienteObj);
			if (success) {
				showSuccess(
					"Ingrediente añadido",
					"El ingrediente se añadió correctamente",
				);
				fetchFormula();
				setAddDialogVisible(false);
				setNewIngredient({ nombre: "", cantidad: "", unidad: "gr" });
			} else {
				showError("Error", "No se pudo añadir el ingrediente");
			}
		} catch (error) {
			console.error("Error al añadir ingrediente:", error);
			showError("Error", "Ocurrió un error al añadir el ingrediente");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return (
			<Surface style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" />
					<Text style={styles.loadingText}>Cargando fórmula...</Text>
				</View>
			</Surface>
		);
	}

	if (error) {
		return (
			<Surface style={styles.container}>
				<Card style={styles.errorCard}>
					<Card.Content>
						<Text style={styles.errorText}>{error}</Text>
						<Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
							Volver
						</Button>
					</Card.Content>
				</Card>
			</Surface>
		);
	}

	if (!formula) {
		return (
			<Surface style={styles.container}>
				<Card style={styles.errorCard}>
					<Card.Content>
						<Text>No se encontró la fórmula.</Text>
						<Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
							Volver
						</Button>
					</Card.Content>
				</Card>
			</Surface>
		);
	}

	return (
		<Surface style={styles.container}>
			<Appbar.Header elevated mode="center-aligned" style={styles.appBar}>
				<Appbar.BackAction onPress={() => router.back()} />
				<Appbar.Content title={capitalizeFirstLetter(formula.nombreColor)} titleStyle={styles.appBarTitle} />
			</Appbar.Header>

			<ScrollView 
				style={styles.content}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<Card style={styles.formulaCard}>
					<Card.Content>
						<View style={styles.headerRow}>
							<View style={styles.headerLeft}>
								<Text variant="headlineSmall" style={styles.sectionTitle}>
									Ingredientes
								</Text>
								<Text variant="bodyMedium" style={styles.headerSubtitle}>
									{formula.ingredientes?.length || 0} ingredientes en total
								</Text>
							</View>
							<View style={styles.headerRight}>
								<View style={styles.weightContainer}>
									<IconButton 
										icon="scale" 
										size={24} 
										iconColor={theme.colors.primary}
										style={styles.weightIcon}
									/>
									<Text variant="titleLarge" style={[styles.weightText, { color: theme.colors.primary }]}>
										{calculateTotalWeight(formula.ingredientes || []).toFixed(2)} kg
									</Text>
								</View>
							</View>
						</View>
					</Card.Content>
				</Card>

				{formula.ingredientes && formula.ingredientes.length > 0 ? (
					formula.ingredientes.map((ingrediente: Ingrediente, index: number) => {
						const name = ingrediente.nombre || "Nombre no disponible";
						const quantity = ingrediente.cantidad !== null && ingrediente.cantidad !== undefined
							? ingrediente.cantidad
							: "-";
						const unit = ingrediente.unidad || "";

						return (
							<Card
								key={`${formula?.id || "formula"}-${index}`}
								style={styles.ingredientsCard}
								onPress={() => handleIngredientPress(ingrediente, index)}
								mode="elevated"
								elevation={1}
							>
								<Card.Content style={styles.ingredientsContent}>
									<View style={styles.nameSection}>
										<Text variant="titleMedium" style={[styles.ingredientsName, { color: theme.colors.onSurface }]}>
											{capitalizeFirstLetter(name)}
										</Text>
									</View>
									<View style={styles.quantitySection}>
										<View style={styles.quantityContainer}>
											<Text variant="titleLarge" style={[styles.quantityNumber, { color: theme.colors.primary }]}>
												{quantity}
											</Text>
											<Text variant="bodyMedium" style={[styles.quantityUnit, { color: theme.colors.onSurfaceVariant }]}>
												{unit}
											</Text>
										</View>
									</View>
									<View style={styles.buttonSection}>
										<IconButton 
											icon="pencil" 
											size={20} 
											iconColor={theme.colors.onSurfaceVariant}
											mode="contained-tonal"
										/>
									</View>
								</Card.Content>
							</Card>
						);
					})
				) : (
					<Card style={styles.emptyCard}>
						<Card.Content style={styles.emptyContent}>
							<Text variant="titleMedium" style={styles.emptyTitle}>
								No hay ingredientes
							</Text>
							<Text variant="bodyMedium" style={styles.emptySubtitle}>
								Agrega ingredientes para esta fórmula
							</Text>
						</Card.Content>
					</Card>
				)}
			</ScrollView>

			{/* FAB para agregar ingrediente */}
			<FAB
				icon="plus"
				style={styles.fab}
				onPress={handleAddIngredient}
			/>

			{/* Dialog para editar ingrediente */}
			<Portal>
				<Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)} style={styles.dialogContent}>
					<Dialog.Title>Editar Ingrediente</Dialog.Title>
					<Dialog.Content>
						<TextInput
							label="Nombre"
							defaultValue={editedIngredient.nombre}
							onChangeText={(text) =>
								setEditedIngredient({ ...editedIngredient, nombre: text })
							}
							style={styles.dialogInput}
						/>
						<TextInput
							label="Cantidad"
							defaultValue={editedIngredient.cantidad?.toString() || ""}
							onChangeText={(text) => {
								const num = Number.parseFloat(text);
								setEditedIngredient({
									...editedIngredient,
									cantidad: isNaN(num) ? 0 : num,
								});
							}}
							keyboardType="numeric"
							style={styles.dialogInput}
						/>
						<Text variant="labelMedium" style={styles.unitLabel}>Unidad:</Text>
						<SegmentedButtons
							value={editedIngredient.unidad || "gr"}
							onValueChange={(value) =>
								setEditedIngredient({ ...editedIngredient, unidad: value })
							}
							buttons={[
								{ value: "gr", label: "gr" },
								{ value: "kg", label: "kg" },
								{ value: "L", label: "L" },
							]}
							style={styles.segmentedButtons}
						/>
					</Dialog.Content>
					<Dialog.Actions style={styles.dialogActions}>
						<Button onPress={() => setEditDialogVisible(false)}>
							Cancelar
						</Button>
						<Button mode="contained" buttonColor={theme.colors.error} onPress={handleConfirmDelete}>
							Eliminar
						</Button>
						<Button mode="contained" onPress={handleUpdateIngredient}>
							Guardar
						</Button>
					</Dialog.Actions>
				</Dialog>

				{/* Dialog para confirmar eliminación */}
				<Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)} style={styles.dialogContent}>
					<Dialog.Title>Confirmar Eliminación</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyLarge">
							¿Estás seguro de que deseas eliminar el ingrediente "{editedIngredient.nombre}"?
						</Text>
					</Dialog.Content>
					<Dialog.Actions style={styles.dialogActions}>
						<Button onPress={() => setDeleteDialogVisible(false)}>
							Cancelar
						</Button>
						<Button mode="contained" buttonColor={theme.colors.error} onPress={handleDeleteIngredient}>
							Eliminar
						</Button>
					</Dialog.Actions>
				</Dialog>

				{/* Dialog para añadir ingrediente */}
				<Dialog visible={addDialogVisible} onDismiss={() => setAddDialogVisible(false)} style={styles.dialogContent}>
					<Dialog.Title>Nuevo Ingrediente</Dialog.Title>
					<Dialog.Content>
						<TextInput
							label="Nombre"
							defaultValue={newIngredient.nombre}
							onChangeText={(text) =>
								setNewIngredient({ ...newIngredient, nombre: text })
							}
							style={styles.dialogInput}
						/>
						<TextInput
							label="Cantidad"
							defaultValue={newIngredient.cantidad}
							onChangeText={(text) => {
								const cleanText = text.replace(/[^\d.]/g, '');
								setNewIngredient({ ...newIngredient, cantidad: cleanText });
							}}
							keyboardType="numeric"
							style={styles.dialogInput}
						/>
						<Text variant="labelMedium" style={styles.unitLabel}>Unidad:</Text>
						<SegmentedButtons
							value={newIngredient.unidad}
							onValueChange={(value) =>
								setNewIngredient({ ...newIngredient, unidad: value })
							}
							buttons={[
								{ value: "gr", label: "gr" },
								{ value: "kg", label: "kg" },
								{ value: "L", label: "L" },
							]}
							style={styles.segmentedButtons}
						/>
					</Dialog.Content>
					<Dialog.Actions style={styles.dialogActions}>
						<Button onPress={() => setAddDialogVisible(false)}>
							Cancelar
						</Button>
						<Button mode="contained" onPress={handleSaveNewIngredient}>
							Guardar
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
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: Spacing.xl,
	},
	loadingText: {
		marginTop: Spacing.md,
	},
	appBar: {
		elevation: 0,
	},
	appBarTitle: {
		fontWeight: 'bold',
	},
	content: {
		padding: 16,
	},
	scrollContent: {
		paddingBottom: 88, // Múltiplo de 4 + espacio para FAB
	},
	errorCard: {
		margin: Spacing.md,
	},
	errorText: {
		marginBottom: Spacing.sm,
		textAlign: 'center',
	},
	backButton: {
		marginTop: Spacing.sm,
	},
	formulaCard: {
		marginBottom: 16,
		borderRadius: 12,
	},
	sectionTitle: {
		fontWeight: "bold",
		marginBottom: Spacing.xs,
	},
	headerSubtitle: {},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerLeft: {
		flex: 1,
	},
	headerRight: {
		alignItems: 'flex-end',
	},
	weightContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	weightIcon: {
		margin: 0,
		marginRight: Spacing.xs,
	},
	weightText: {
		fontWeight: 'bold',
	},
	ingredientsList: {
		marginBottom: Spacing.sm,
	},
	ingredientsCard: {
		marginBottom: 8,
		borderRadius: 12,
	},
	ingredientsContent: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	ingredientsInfo: {
		flex: 1,
	},
	ingredientRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	nameSection: {
		flex: 1,
		justifyContent: 'center',
	},
	quantitySection: {
		flex: 1,
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	buttonSection: {
		flex: 1,
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	ingredientsName: {
		// Texto del nombre del ingrediente
	},
	ingredientsQuantity: {
		// Se aplicará color del tema en el componente
		marginTop: Spacing.sm,
	},
	quantityContainer: {
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	quantityNumber: {
		marginRight: 4,
	},
	quantityUnit: {
		// Color se aplicará desde el tema
	},
	totalCard: {
		marginTop: Spacing.sm,
		marginBottom: Spacing.md,
	},
	totalContent: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: Spacing.sm,
	},
	emptyCard: {
		margin: Spacing.md,
		minHeight: 150,
	},
	emptyContent: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: Spacing.xl,
	},
	emptyTitle: {
		textAlign: 'center',
		marginBottom: Spacing.sm,
	},
	emptySubtitle: {
		textAlign: 'center',
	},
	fab: {
		position: "absolute",
		right: Spacing.md,
		bottom: Spacing.md,
	},
	dialogInput: {
		marginBottom: Spacing.md,
	},
	unitLabel: {
		marginBottom: Spacing.sm,
		marginTop: Spacing.xs,
	},
	segmentedButtons: {
		marginBottom: Spacing.sm,
	},
	dialogContent: {
		padding: Spacing.md,
	},
	dialogActions: {
		padding: Spacing.md,
	},
});
