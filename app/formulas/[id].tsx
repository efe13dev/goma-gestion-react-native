import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	ActivityIndicator,
	TouchableOpacity,
	Modal,
	View,
	TextInput,
	Alert,
	useColorScheme,
	Text,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
	getFormulaById,
	updateIngredient,
	deleteIngredient,
	addIngredient,
} from "@/api/formulasApi";
import type { Formula, Ingrediente } from "@/types/formulas";
import { showSuccess, showError } from "@/utils/toast";

// Función para capitalizar la primera letra de un string
function capitalizeFirstLetter(text: string) {
	if (!text) return "";
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function FormulaDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
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
	const [addModalVisible, setAddModalVisible] = useState(false);
	const [newIngredient, setNewIngredient] = useState({
		nombre: "",
		cantidad: "",
		unidad: "gr",
	});

	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

	// --- Agrega la función de estilos dinámicos para ingredientes ---
	const getIngredientStyles = (isDark: boolean) => ({
		ingredientContainer: {
			flexDirection: "row" as import("react-native").ViewStyle["flexDirection"],
			justifyContent: "space-between" as import(
				"react-native"
			).ViewStyle["justifyContent"],
			alignItems: "center" as import("react-native").ViewStyle["alignItems"],
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
			fontWeight: "500" as import("react-native").TextStyle["fontWeight"],
			opacity: 0.95,
		},
		ingredientQuantity: {
			color: isDark ? "#A1CEDC" : "#2E7D9B",
			fontWeight: "bold" as import("react-native").TextStyle["fontWeight"],
			fontSize: 18,
			opacity: 0.9,
		},
	});

	const ingredientStyles = getIngredientStyles(isDark);

	// --- Función de estilos dinámicos para el modal de añadir ingrediente ---
	const getModalStyles = (isDark: boolean) => {
		return {
			modalOverlay: {
				flex: 1,
				justifyContent: "center" as import(
					"react-native"
				).ViewStyle["justifyContent"],
				alignItems: "center" as import("react-native").ViewStyle["alignItems"],
				backgroundColor: isDark
					? "rgba(0, 0, 0, 0.7)"
					: "rgba(44, 62, 80, 0.3)",
			},
			modalContent: {
				width: "85%" as import("react-native").ViewStyle["width"],
				backgroundColor: isDark ? "#1E2A38" : "#F4F9FB",
				borderRadius: 12,
				padding: 20,
				shadowColor: isDark ? "#000" : "#A1CEDC",
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
				fontWeight: "bold" as import("react-native").TextStyle["fontWeight"],
				marginBottom: 20,
				textAlign: "center" as import("react-native").TextStyle["textAlign"],
				color: isDark ? "#A1CEDC" : "#2E7D9B",
			},
			label: {
				fontSize: 16,
				marginBottom: 5,
				color: isDark ? "#FFFFFF" : "#2E7D9B",
			},
			input: {
				backgroundColor: isDark ? "#2C3E50" : "#fff",
				borderRadius: 8,
				padding: 12,
				marginBottom: 15,
				color: isDark ? "#FFFFFF" : "#2E7D9B",
				fontSize: 16,
				borderWidth: 1,
				borderColor: isDark ? "#2E7D9B" : "#A1CEDC",
			},
			unitButtonsContainer: {
				flexDirection: "row" as import(
					"react-native"
				).ViewStyle["flexDirection"],
				justifyContent: "space-between" as import(
					"react-native"
				).ViewStyle["justifyContent"],
				marginBottom: 20,
			},
			unitButton: {
				flex: 1,
				padding: 10,
				margin: 5,
				borderRadius: 8,
				backgroundColor: isDark ? "#2C3E50" : "#F4F9FB",
				alignItems: "center" as import("react-native").ViewStyle["alignItems"],
				borderWidth: 1,
				borderColor: isDark ? "#2E7D9B" : "#A1CEDC",
			},
			selectedUnitButton: {
				backgroundColor: isDark ? "#2E7D9B" : "#A1CEDC",
			},
			unitButtonText: {
				color: isDark ? "#FFFFFF" : "#2E7D9B",
				fontSize: 16,
			},
			selectedUnitButtonText: {
				fontWeight: "bold" as import("react-native").TextStyle["fontWeight"],
			},
			buttonContainer: {
				flexDirection: "row" as import(
					"react-native"
				).ViewStyle["flexDirection"],
				justifyContent: "space-between" as import(
					"react-native"
				).ViewStyle["justifyContent"],
				marginTop: 10,
			},
			button: {
				flex: 1,
				padding: 12,
				borderRadius: 8,
				alignItems: "center" as import("react-native").ViewStyle["alignItems"],
				marginHorizontal: 5,
			},
			saveButton: {
				backgroundColor: isDark ? "#2E7D9B" : "#3780B8",
			},
			deleteButton: {
				backgroundColor: "#E74C3C",
			},
			cancelButton: {
				backgroundColor: isDark ? "#7F8C8D" : "#C2C7CC",
			},
			buttonText: {
				color: "#FFFFFF",
				fontWeight: "bold" as import("react-native").TextStyle["fontWeight"],
				fontSize: 16,
			},
		};
	};

	const modalStyles = getModalStyles(isDark);

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
				editedIngredient,
			);

			if (success) {
				showSuccess(
					"Ingrediente actualizado",
					"El ingrediente se actualizó correctamente",
				);
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
								selectedIngredient.index,
							);

							if (success) {
								showSuccess(
									"Ingrediente eliminado",
									"El ingrediente se eliminó correctamente",
								);
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
			],
		);
	};

	const handleAddIngredient = () => {
		setAddModalVisible(true);
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
				fetchFormula(); // Recargar la fórmula para mostrar los cambios
				setAddModalVisible(false);
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
							<ThemedText style={ingredientStyles.ingredientName}>
								{capitalizeFirstLetter(name)}
							</ThemedText>
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
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 8,
				}}
			>
				<ThemedText style={styles.subtitle}>Ingredientes:</ThemedText>
				<TouchableOpacity
					style={{
						backgroundColor: "#2E7D9B",
						borderRadius: 16,
						width: 32,
						height: 32,
						alignItems: "center",
						justifyContent: "center",
						marginLeft: 8,
					}}
					onPress={handleAddIngredient}
				>
					<Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
						+
					</Text>
				</TouchableOpacity>
			</View>
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
										editedIngredient.unidad === unit &&
											styles.selectedUnitButton,
									]}
									onPress={() =>
										setEditedIngredient({ ...editedIngredient, unidad: unit })
									}
								>
									<ThemedText
										style={[
											styles.unitButtonText,
											editedIngredient.unidad === unit &&
												styles.selectedUnitButtonText,
										]}
									>
										{unit}
									</ThemedText>
								</TouchableOpacity>
							))}
						</View>

						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={[styles.button, styles.saveButton]}
								onPress={handleUpdateIngredient}
							>
								<ThemedText style={styles.buttonText}>Guardar</ThemedText>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.deleteButton]}
								onPress={handleDeleteIngredient}
							>
								<ThemedText style={styles.buttonText}>Eliminar</ThemedText>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.cancelButton]}
								onPress={() => setModalVisible(false)}
							>
								<ThemedText style={styles.buttonText}>Cancelar</ThemedText>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Modal para añadir nuevo ingrediente */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={addModalVisible}
				onRequestClose={() => setAddModalVisible(false)}
			>
				<View style={modalStyles.modalOverlay}>
					<View style={modalStyles.modalContent}>
						<ThemedText style={modalStyles.modalTitle}>
							Nuevo Ingrediente
						</ThemedText>
						<ThemedText style={modalStyles.label}>Nombre:</ThemedText>
						<TextInput
							style={modalStyles.input}
							value={newIngredient.nombre}
							onChangeText={(text) =>
								setNewIngredient({ ...newIngredient, nombre: text })
							}
							placeholder="Nombre del ingrediente"
							placeholderTextColor={isDark ? "#fff" : "#888"}
						/>
						<ThemedText style={modalStyles.label}>Cantidad:</ThemedText>
						<TextInput
							style={modalStyles.input}
							value={newIngredient.cantidad}
							onChangeText={(text) => {
								// Solo permitir números positivos
								if (/^\d*$/.test(text))
									setNewIngredient({ ...newIngredient, cantidad: text });
							}}
							placeholder="Cantidad"
							placeholderTextColor={isDark ? "#fff" : "#888"}
							keyboardType="numeric"
						/>
						<ThemedText style={modalStyles.label}>Unidad:</ThemedText>
						<View style={modalStyles.unitButtonsContainer}>
							{["gr", "kg", "L"].map((unit) => (
								<TouchableOpacity
									key={unit}
									style={[
										modalStyles.unitButton,
										newIngredient.unidad === unit &&
											modalStyles.selectedUnitButton,
									]}
									onPress={() =>
										setNewIngredient({ ...newIngredient, unidad: unit })
									}
								>
									<ThemedText
										style={[
											modalStyles.unitButtonText,
											newIngredient.unidad === unit &&
												modalStyles.selectedUnitButtonText,
										]}
									>
										{unit}
									</ThemedText>
								</TouchableOpacity>
							))}
						</View>
						<View style={modalStyles.buttonContainer}>
							<TouchableOpacity
								style={[modalStyles.button, modalStyles.saveButton]}
								onPress={handleSaveNewIngredient}
							>
								<ThemedText style={modalStyles.buttonText}>Guardar</ThemedText>
							</TouchableOpacity>
							<TouchableOpacity
								style={[modalStyles.button, modalStyles.cancelButton]}
								onPress={() => setAddModalVisible(false)}
							>
								<ThemedText style={modalStyles.buttonText}>Cancelar</ThemedText>
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
		backgroundColor: "rgba(0, 0, 0, 0.9)",
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
