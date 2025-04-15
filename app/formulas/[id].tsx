import React, { useState, useEffect } from "react";
import { StyleSheet, ActivityIndicator, TouchableOpacity, Modal, View, TextInput, Button, Alert, useColorScheme } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getFormulaById, updateIngredient, deleteIngredient } from "@/api/formulasApi";
import type { Formula, Ingrediente } from "@/data/formulas";
import { showSuccess, showError } from "@/utils/toast";

// Función para capitalizar la primera letra de un string
function capitalizeFirstLetter(text: string) {
	if (!text) return "";
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function FormulaDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const [formula, setFormula] = useState<Formula | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedIngredient, setSelectedIngredient] = useState<{
		ingrediente: Ingrediente;
		index: number;
	} | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [editedIngredient, setEditedIngredient] = useState<Ingrediente>({
		nombre: "",
		cantidad: 0,
		unidad: "gr",
	});

	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

	// --- Agrega la función de estilos dinámicos para ingredientes ---
	const getIngredientStyles = (isDark: boolean) => ({
		ingredientContainer: {
			flexDirection: "row" as const,
			justifyContent: "space-between" as const,
			alignItems: "center" as const,
			padding: 12,
			marginVertical: 4,
			borderRadius: 8,
			backgroundColor: isDark ? "#222E39" : "#F4F9FB",
			borderWidth: 1,
			borderColor: isDark ? "#444A" : "#C2C7CC",
		},
		ingredientName: {
			color: isDark ? "#fff" : "#222",
			fontSize: 18,
			fontWeight: 500 as const,
			opacity: 0.95,
		},
		ingredientQuantity: {
			color: isDark ? "#A1CEDC" : "#2E7D9B",
			fontWeight: "bold" as const,
			fontSize: 18,
			opacity: 0.9,
		},
	});

	const ingredientStyles = getIngredientStyles(isDark);

	useEffect(() => {
		if (id) {
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
		setSelectedIngredient({ ingrediente, index });
		setEditedIngredient({ ...ingrediente });
		setModalVisible(true);
	};

	const handleUpdateIngredient = async () => {
		if (!selectedIngredient || !formula || !id) return;

		setIsLoading(true);
		try {
			const success = await updateIngredient(
				id as string,
				selectedIngredient.index,
				editedIngredient
			);

			if (success) {
				showSuccess("Ingrediente actualizado", "El ingrediente se actualizó correctamente");
				fetchFormula(); // Recargar la fórmula para mostrar los cambios
			} else {
				showError("Error", "No se pudo actualizar el ingrediente");
			}
		} catch (error) {
			console.error("Error al actualizar ingrediente:", error);
			showError("Error", "Ocurrió un error al actualizar el ingrediente");
		} finally {
			setModalVisible(false);
			setIsLoading(false);
		}
	};

	const handleDeleteIngredient = async () => {
		if (!selectedIngredient || !formula || !id) return;

		// Confirmar antes de eliminar
		Alert.alert(
			"Confirmar eliminación",
			`¿Estás seguro de que deseas eliminar el ingrediente "${selectedIngredient.ingrediente.nombre}"?`,
			[
				{
					text: "Cancelar",
					style: "cancel",
				},
				{
					text: "Eliminar",
					style: "destructive",
					onPress: async () => {
						setIsLoading(true);
						try {
							const success = await deleteIngredient(
								id as string,
								selectedIngredient.index
							);

							if (success) {
								showSuccess("Ingrediente eliminado", "El ingrediente se eliminó correctamente");
								fetchFormula(); // Recargar la fórmula para mostrar los cambios
							} else {
								showError("Error", "No se pudo eliminar el ingrediente");
							}
						} catch (error) {
							console.error("Error al eliminar ingrediente:", error);
							showError("Error", "Ocurrió un error al eliminar el ingrediente");
						} finally {
							setModalVisible(false);
							setIsLoading(false);
						}
					},
				},
			]
		);
	};

	if (isLoading) {
		return (
			<ThemedView style={[styles.container, styles.center]}>
				<ActivityIndicator size="large" />
			</ThemedView>
		);
	}

	if (error) {
		return (
			<ThemedView style={styles.container}>
				<ThemedText style={styles.errorText}>{error}</ThemedText>
			</ThemedView>
		);
	}

	if (!formula) {
		return (
			<ThemedView style={styles.container}>
				<ThemedText>No se encontró la fórmula.</ThemedText>
			</ThemedView>
		);
	}

	let ingredientsContent: JSX.Element | JSX.Element[];
	if (formula.ingredientes && formula.ingredientes.length > 0) {
		ingredientsContent = formula.ingredientes.map(
			(ingrediente: Ingrediente, index: number) => {
				const name = ingrediente.nombre || "Nombre no disponible";
				const quantity =
					ingrediente.cantidad !== null && ingrediente.cantidad !== undefined
						? ingrediente.cantidad
						: "-";
				const unit = ingrediente.unidad || "";

				return (
					<TouchableOpacity
						key={`${formula?.id || "formula"}-${index}`}
						onPress={() => handleIngredientPress(ingrediente, index)}
					>
						<View style={ingredientStyles.ingredientContainer}>
							<ThemedText style={ingredientStyles.ingredientName}>{capitalizeFirstLetter(name)}</ThemedText>
							<ThemedText style={ingredientStyles.ingredientQuantity}>
								{quantity} {unit}
							</ThemedText>
						</View>
					</TouchableOpacity>
				);
			},
		);
	} else {
		ingredientsContent = (
			<ThemedText>No hay ingredientes para esta fórmula.</ThemedText>
		);
	}

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.title}>
				{formula ? capitalizeFirstLetter(formula.nombreColor) : ""}
			</ThemedText>
			<ThemedText style={styles.subtitle}>Ingredientes:</ThemedText>
			{ingredientsContent}

			{/* Modal para editar o eliminar ingrediente */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<ThemedText style={styles.modalTitle}>
							Editar Ingrediente
						</ThemedText>
						
						<ThemedText style={styles.label}>Nombre:</ThemedText>
						<TextInput
							style={styles.input}
							value={editedIngredient.nombre}
							onChangeText={(text) =>
								setEditedIngredient({ ...editedIngredient, nombre: text })
							}
							placeholder="Nombre del ingrediente"
						/>
						
						<ThemedText style={styles.label}>Cantidad:</ThemedText>
						<TextInput
							style={styles.input}
							value={editedIngredient.cantidad?.toString() || ""}
							onChangeText={(text) =>
								setEditedIngredient({
									...editedIngredient,
									cantidad: text === "" ? 0 : Number.parseFloat(text),
								})
							}
							keyboardType="numeric"
							placeholder="Cantidad"
						/>
						
						<ThemedText style={styles.label}>Unidad:</ThemedText>
						<View style={styles.unitButtonsContainer}>
							{["gr", "kg", "L"].map((unit) => (
								<TouchableOpacity
									key={unit}
									style={[
										styles.unitButton,
										editedIngredient.unidad === unit && styles.selectedUnitButton,
									]}
									onPress={() =>
										setEditedIngredient({ ...editedIngredient, unidad: unit })
									}
								>
									<ThemedText
										style={[
											styles.unitButtonText,
											editedIngredient.unidad === unit && styles.selectedUnitButtonText,
										]}
									>
										{unit}
									</ThemedText>
								</TouchableOpacity>
							))}
						</View>
						
						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={[styles.button, styles.cancelButton]}
								onPress={() => setModalVisible(false)}
							>
								<ThemedText style={styles.buttonText}>Cancelar</ThemedText>
							</TouchableOpacity>
							
							<TouchableOpacity
								style={[styles.button, styles.deleteButton]}
								onPress={handleDeleteIngredient}
							>
								<ThemedText style={styles.buttonText}>Eliminar</ThemedText>
							</TouchableOpacity>
							
							<TouchableOpacity
								style={[styles.button, styles.saveButton]}
								onPress={handleUpdateIngredient}
							>
								<ThemedText style={styles.buttonText}>Guardar</ThemedText>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	center: {
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		marginBottom: 20,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 20,
		fontWeight: "bold",
		marginTop: 15,
		marginBottom: 12,
	},
	errorText: {
		color: "red",
		textAlign: "center",
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	modalContent: {
		width: "85%",
		backgroundColor: "#1E2A38",
		borderRadius: 12,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
		color: "#A1CEDC",
	},
	label: {
		fontSize: 16,
		marginBottom: 5,
		color: "#FFFFFF",
	},
	input: {
		backgroundColor: "#2C3E50",
		borderRadius: 8,
		padding: 12,
		marginBottom: 15,
		color: "#FFFFFF",
		fontSize: 16,
	},
	unitButtonsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	unitButton: {
		flex: 1,
		padding: 10,
		margin: 5,
		borderRadius: 8,
		backgroundColor: "#2C3E50",
		alignItems: "center",
	},
	selectedUnitButton: {
		backgroundColor: "#2E7D9B",
	},
	unitButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
	},
	selectedUnitButtonText: {
		fontWeight: "bold",
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 10,
	},
	button: {
		flex: 1,
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
		marginHorizontal: 5,
	},
	saveButton: {
		backgroundColor: "#2E7D9B",
	},
	deleteButton: {
		backgroundColor: "#E74C3C",
	},
	cancelButton: {
		backgroundColor: "#7F8C8D",
	},
	buttonText: {
		color: "#FFFFFF",
		fontWeight: "bold",
		fontSize: 16,
	},
});
