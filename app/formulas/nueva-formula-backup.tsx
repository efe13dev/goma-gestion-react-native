import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	View,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { addFormula, getFormulas } from "@/api/formulasApi";
import { showSuccess, showError } from "@/utils/toast";
import { useColorScheme } from "react-native";
import uuid from "react-native-uuid";
import { useNavigation } from "@react-navigation/native";

export default function NuevaFormulaScreen() {
	const [nombreColor, setNombreColor] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [ingredientes, setIngredientes] = useState<
		{
			id: string;
			nombre: string;
			cantidad: string;
			unidad: string;
		}[]
	>([]);
	const [nuevoIngrediente, setNuevoIngrediente] = useState({
		id: "",
		nombre: "",
		cantidad: "",
		unidad: "gr",
	});
	const router = useRouter();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const navigation = useNavigation();

	// Define el color de placeholder apagado según el tema
	const placeholderColor = isDark ? "#6C7A89" : "#B0B8C1";

	// Opciones de unidad disponibles
	const unidades = ["gr", "kg", "L"];

	useEffect(() => {
		navigation.setOptions({ headerBackTitle: "Volver" });
	}, [navigation]);

	const handleAddIngredient = () => {
		if (!nuevoIngrediente.nombre.trim() || !nuevoIngrediente.cantidad.trim()) {
			showError("Error", "Completa el nombre y la cantidad del ingrediente");
			return;
		}
		if (
			Number.isNaN(Number(nuevoIngrediente.cantidad)) ||
			Number(nuevoIngrediente.cantidad) <= 0
		) {
			showError("Error", "La cantidad debe ser un número mayor que cero");
			return;
		}
		const ingredienteConId = { ...nuevoIngrediente, id: uuid.v4() as string };
		setIngredientes([...ingredientes, ingredienteConId]);
		setNuevoIngrediente({ id: "", nombre: "", cantidad: "", unidad: "gr" });
	};

	const handleRemoveIngredient = (index: number) => {
		setIngredientes(ingredientes.filter((_, i) => i !== index));
	};

	const handleChangeNuevo = (field: string, value: string) => {
		setNuevoIngrediente({ ...nuevoIngrediente, [field]: value });
	};

	const handleAddFormula = async () => {
		if (!nombreColor.trim() || ingredientes.length === 0) {
			showError(
				"Error",
				"Completa el nombre del color y agrega al menos un ingrediente",
			);
			return;
		}

		// Validar si ya existe una fórmula con el mismo nombre (ignorando mayúsculas y espacios)
		setIsLoading(true);
		try {
			const formulasExistentes = await getFormulas();
			const existe = formulasExistentes.some(
				(f) => f.nombreColor.trim().toLowerCase() === nombreColor.trim().toLowerCase()
			);
			if (existe) {
				showError("Error", `La fórmula '${nombreColor}' ya existe.`);
				setIsLoading(false);
				return;
			}

			await addFormula({
				id: uuid.v4() as string,
				nombreColor,
				ingredientes: ingredientes.map(({ id, cantidad, ...rest }) => ({
					...rest,
					cantidad: Number(cantidad),
				})),
			});
			showSuccess("Éxito", "Fórmula añadida correctamente.");
			router.back();
		} catch (error) {
			showError("Error", "No se pudo añadir la fórmula.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ThemedView
			style={[
				styles.container,
				{ backgroundColor: isDark ? "#192734" : "#A1CEDC" },
			]}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{ flex: 1 }}
			>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
					keyboardShouldPersistTaps="handled"
				>
					<View
						style={[
							styles.formContainer,
							{
								backgroundColor: isDark ? "#22304A" : "white",
								shadowColor: isDark ? "#000" : "#000",
							},
						]}
					>
						<ThemedText style={styles.label}>Nombre del color</ThemedText>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: isDark ? "#1C2536" : "#F4F9FB",
									color: isDark ? "#F4F9FB" : "#2E7D9B",
									borderColor: isDark ? "#2E7D9B" : "#A1CEDC",
								},
							]}
							value={nombreColor}
							onChangeText={setNombreColor}
							placeholder="Ejemplo: Azul cielo"
							placeholderTextColor={placeholderColor}
						/>
						<ThemedText
							style={[styles.label, { color: isDark ? "#A1CEDC" : "#2E7D9B" }]}
						>
							Ingredientes
						</ThemedText>
						{ingredientes.length === 0 && (
							<ThemedText style={{ color: "#888", marginBottom: 8 }}>
								Agrega al menos un ingrediente
							</ThemedText>
						)}
						{ingredientes.map((ing) => (
							<View
								key={ing.id}
								style={[
									styles.ingredientCard,
									{ backgroundColor: isDark ? "#1C2536" : "#F4F9FB" },
								]}
							>
								<ThemedText
									style={[
										styles.ingredientText,
										{ color: isDark ? "#A1CEDC" : "#2E7D9B" },
									]}
								>
									{ing.nombre} - {ing.cantidad} {ing.unidad}
								</ThemedText>
								<TouchableOpacity
									onPress={() =>
										handleRemoveIngredient(ingredientes.indexOf(ing))
									}
									style={styles.deleteButton}
								>
									<ThemedText style={styles.deleteButtonText}>
										Eliminar
									</ThemedText>
								</TouchableOpacity>
							</View>
						))}
						<View style={styles.addIngredientRow}>
							<ThemedText
								style={[
									styles.ingredientInputLabel,
									{ color: isDark ? "#A1CEDC" : "#2E7D9B" },
								]}
							>
								Nuevo ingrediente:
							</ThemedText>
							<View style={styles.ingredientInputRow}>
								<TextInput
									style={[
										styles.ingredientNameInput,
										{
											backgroundColor: isDark ? "#1C2536" : "#F4F9FB",
											color: isDark ? "#F4F9FB" : "#2E7D9B",
											borderColor: isDark ? "#2E7D9B" : "#A1CEDC",
										},
									]}
									value={nuevoIngrediente.nombre}
									onChangeText={(text) => handleChangeNuevo("nombre", text)}
									placeholder="Nombre del ingrediente"
									placeholderTextColor={placeholderColor}
								/>
							</View>
							<View style={styles.ingredientQuantityRow}>
								<View style={{ flex: 1 }}>
									<TextInput
										style={[
											styles.ingredientQuantityInput,
											{
												backgroundColor: isDark ? "#1C2536" : "#F4F9FB",
												color: isDark ? "#F4F9FB" : "#2E7D9B",
												borderColor: isDark ? "#2E7D9B" : "#A1CEDC",
											},
										]}
										value={nuevoIngrediente.cantidad}
										onChangeText={(text) => {
											const filtered = text.replace(/[^0-9.]/g, "");
											handleChangeNuevo("cantidad", filtered);
										}}
										placeholder="Cantidad"
										keyboardType="numeric"
										placeholderTextColor={placeholderColor}
									/>
								</View>
							</View>
							<View
								style={[
									styles.unitOptionsRow,
									{ marginTop: 2, marginBottom: 8 },
								]}
							>
								<View style={{ flexDirection: "row", flex: 1 }}>
									{unidades.map((unidad) => (
										<TouchableOpacity
											key={unidad}
											style={[
												styles.unitChip,
												{
													backgroundColor:
														nuevoIngrediente.unidad === unidad
															? isDark
																? "#2E7D9B"
																: "#A1CEDC"
															: isDark
																? "#1C2536"
																: "#F4F9FB",
													borderColor:
														nuevoIngrediente.unidad === unidad
															? isDark
																? "#A1CEDC"
																: "#2E7D9B"
															: isDark
																? "#2E7D9B"
																: "#A1CEDC",
												},
											]}
											onPress={() => handleChangeNuevo("unidad", unidad)}
										>
											<ThemedText
												style={{
													color:
														nuevoIngrediente.unidad === unidad
															? isDark
																? "#192734"
																: "#2E7D9B"
															: isDark
																? "#A1CEDC"
																: "#2E7D9B",
													fontWeight: "bold",
												}}
											>
												{unidad}
											</ThemedText>
										</TouchableOpacity>
									))}
								</View>
								<TouchableOpacity
									onPress={handleAddIngredient}
									style={[styles.addCircle, { marginLeft: 24 }]}
								>
									<ThemedText style={styles.addCircleText}>+</ThemedText>
								</TouchableOpacity>
							</View>
						</View>
						<TouchableOpacity
							style={styles.button}
							onPress={handleAddFormula}
							disabled={isLoading}
						>
							<ThemedText style={styles.buttonText}>
								{isLoading ? "Añadiendo..." : "Añadir fórmula"}
							</ThemedText>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	formContainer: {
		backgroundColor: "white",
		borderRadius: 20,
		padding: 28,
		width: 350,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.13,
		shadowRadius: 12,
		elevation: 7,
		marginVertical: 30,
	},
	label: {
		fontSize: 20,
		marginBottom: 10,
		color: "#2E7D9B",
		fontWeight: "bold",
	},
	input: {
		borderWidth: 1,
		borderColor: "#A1CEDC",
		borderRadius: 10,
		padding: 14,
		fontSize: 17,
		marginBottom: 12,
		backgroundColor: "#F4F9FB",
	},
	ingredientCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F4F9FB",
		borderRadius: 10,
		padding: 10,
		marginBottom: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 2,
	},
	ingredientText: {
		flex: 1,
		color: "#2E7D9B",
		fontSize: 16,
		fontWeight: "500",
	},
	deleteButton: {
		backgroundColor: "#FF6B6B",
		paddingVertical: 4,
		paddingHorizontal: 10,
		borderRadius: 16,
		marginLeft: 8,
	},
	deleteButtonText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 14,
	},
	addIngredientRow: {
		flexDirection: "column",
		marginBottom: 18,
	},
	ingredientInputRow: {
		flexDirection: "row",
		marginBottom: 10,
	},
	ingredientNameInput: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#A1CEDC",
		borderRadius: 10,
		padding: 14,
		fontSize: 17,
		backgroundColor: "#F4F9FB",
		marginRight: 8,
	},
	ingredientQuantityRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	ingredientQuantityInput: {
		borderWidth: 1,
		borderColor: "#A1CEDC",
		borderRadius: 10,
		padding: 14,
		fontSize: 17,
		marginBottom: 8,
		marginRight: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 3.84,
		elevation: 2,
	},
	addCircle: {
		backgroundColor: "#2E7D9B",
		width: 45,
		height: 45,
		borderRadius: 22.5,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		alignSelf: "flex-end",
	},
	addCircleText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 24,
	},
	button: {
		backgroundColor: "#2E7D9B",
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 10,
	},
	buttonText: {
		color: "white",
		fontSize: 19,
		fontWeight: "bold",
	},
	ingredientInputLabel: {
		fontSize: 16,
		color: "#2E7D9B",
		fontWeight: "500",
		marginBottom: 6,
	},
	unitOptionsRow: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: 8,
	},
	unitChip: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 16,
		borderWidth: 2,
		marginHorizontal: 2,
		marginVertical: 2,
	},
});
