import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	View,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
	Appbar,
	Surface,
	Card,
	Text,
	TextInput,
	Button,
	FAB,
	List,
	IconButton,
	ActivityIndicator,
	SegmentedButtons,
	useTheme,
	Chip,
} from "react-native-paper";
import { addFormula, getFormulas } from "@/api/formulasApi";
import { showSuccess, showError } from "@/utils/toast";
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
	const theme = useTheme();
	const navigation = useNavigation();

	// Opciones de unidad disponibles
	const unidades = ["gr", "kg", "L"];

	useEffect(() => {
		navigation.setOptions({ 
			headerBackTitle: "Volver",
			header: () => (
				<Appbar.Header elevated mode="center-aligned">
					<Appbar.BackAction onPress={() => router.back()} />
					<Appbar.Content title="Nueva Fórmula" />
				</Appbar.Header>
			)
		});
	}, [navigation, router]);

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
		<Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{ flex: 1 }}
			>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.content}>
						<Card style={styles.formCard}>
							<Card.Content>
								<Text variant="titleLarge" style={styles.sectionTitle}>
									Información de la Fórmula
								</Text>
								
								<TextInput
									label="Nombre del color"
									value={nombreColor}
									onChangeText={setNombreColor}
									mode="outlined"
									placeholder="Ejemplo: Azul cielo"
									style={styles.input}
								/>

								<Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 24 }]}>
									Ingredientes
								</Text>
								
								{ingredientes.length === 0 ? (
									<Text variant="bodyMedium" style={styles.emptyText}>
										Agrega al menos un ingrediente
									</Text>
								) : (
									<View style={styles.ingredientsList}>
										{ingredientes.map((ing, index) => (
											<Card key={ing.id} style={styles.ingredientCard} mode="outlined">
												<Card.Content style={styles.ingredientContent}>
													<View style={styles.ingredientInfo}>
														<Text variant="bodyLarge" style={styles.ingredientName}>
															{ing.nombre}
														</Text>
														<Text variant="bodyMedium" style={styles.ingredientQuantity}>
															{ing.cantidad} {ing.unidad}
														</Text>
													</View>
													<IconButton
														icon="delete"
														size={20}
														iconColor={theme.colors.error}
														onPress={() => handleRemoveIngredient(index)}
													/>
												</Card.Content>
											</Card>
										))}
									</View>
								)}

								<View style={styles.addIngredientSection}>
									<Text variant="titleSmall" style={styles.addIngredientTitle}>
										Nuevo ingrediente:
									</Text>
									
									<TextInput
										label="Nombre del ingrediente"
										value={nuevoIngrediente.nombre}
										onChangeText={(text) => handleChangeNuevo("nombre", text)}
										mode="outlined"
										style={styles.input}
									/>
									
									<View style={styles.quantityRow}>
										<TextInput
											label="Cantidad"
											value={nuevoIngrediente.cantidad}
											onChangeText={(text) => {
												const filtered = text.replace(/[^0-9.]/g, "");
												handleChangeNuevo("cantidad", filtered);
											}}
											mode="outlined"
											keyboardType="numeric"
											style={[styles.input, { flex: 1, marginRight: 12 }]}
										/>
									</View>
									
									<View style={styles.unitsSection}>
										<Text variant="bodyMedium" style={styles.unitsLabel}>
											Unidad:
										</Text>
										<SegmentedButtons
											value={nuevoIngrediente.unidad}
											onValueChange={(value) => handleChangeNuevo("unidad", value)}
											buttons={unidades.map(unidad => ({
												value: unidad,
												label: unidad,
											}))}
											style={styles.segmentedButtons}
										/>
									</View>
									
									<Button
										mode="contained-tonal"
										onPress={handleAddIngredient}
										icon="plus"
										style={styles.addIngredientButton}
									>
										Agregar Ingrediente
									</Button>
								</View>
							</Card.Content>
						</Card>

						<Button
							mode="contained"
							onPress={handleAddFormula}
							loading={isLoading}
							disabled={isLoading || !nombreColor.trim() || ingredientes.length === 0}
							style={styles.submitButton}
							contentStyle={styles.submitButtonContent}
						>
							{isLoading ? "Añadiendo..." : "Añadir Fórmula"}
						</Button>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Surface>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	formCard: {
		marginBottom: 16,
	},
	sectionTitle: {
		fontWeight: "bold",
		marginBottom: 12,
	},
	input: {
		marginBottom: 8,
	},
	emptyText: {
		color: "#666",
		fontStyle: "italic",
		marginBottom: 16,
	},
	ingredientsList: {
		marginBottom: 16,
	},
	ingredientCard: {
		marginBottom: 8,
	},
	ingredientContent: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 4,
	},
	ingredientInfo: {
		flex: 1,
	},
	ingredientName: {
		fontWeight: "500",
	},
	ingredientQuantity: {
		color: "#666",
		marginTop: 2,
	},
	addIngredientSection: {
		backgroundColor: "#f5f5f5",
		borderRadius: 8,
		padding: 16,
		marginTop: 8,
	},
	addIngredientTitle: {
		fontWeight: "600",
		marginBottom: 12,
	},
	quantityRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	unitsSection: {
		marginBottom: 16,
	},
	unitsLabel: {
		marginBottom: 8,
		fontWeight: "500",
	},
	segmentedButtons: {
		marginBottom: 8,
	},
	addIngredientButton: {
		marginTop: 8,
	},
	submitButton: {
		marginTop: 16,
		marginBottom: 32,
	},
	submitButtonContent: {
		paddingVertical: 8,
	},
});
