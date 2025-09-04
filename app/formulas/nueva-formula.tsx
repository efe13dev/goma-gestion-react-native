import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	View,
} from "react-native";
import { useRouter } from "expo-router";
import { Spacing, BorderRadius } from "@/constants/Spacing";
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
import { useNavigation } from "@react-navigation/native";
import uuid from "react-native-uuid";

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
		const ingredienteConId = { ...nuevoIngrediente, id: uuid.v4().toString() };
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
				id: uuid.v4().toString(),
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
									<Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
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
														<Text variant="bodyMedium" style={[styles.ingredientQuantity, { color: theme.colors.onSurfaceVariant }]}>
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

								<Surface style={[styles.addIngredientSection, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
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
								</Surface>
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
		padding: Spacing.md,
	},
	formCard: {
		marginBottom: Spacing.md,
		borderRadius: BorderRadius.md, // MD3 standard para cards
	},
	sectionTitle: {
		marginBottom: Spacing.md,
	},
	input: {
		marginBottom: Spacing.sm,
	},
	emptyText: {
		fontStyle: "italic",
		marginBottom: Spacing.md,
	},
	ingredientsList: {
		marginBottom: Spacing.md,
	},
	ingredientCard: {
		marginBottom: Spacing.sm,
		borderRadius: BorderRadius.md, // MD3 standard para cards
	},
	ingredientContent: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacing.sm,
	},
	ingredientInfo: {
		flex: 1,
	},
	ingredientName: {
		// Removido fontWeight, se usa variant del Text
	},
	ingredientQuantity: {
		marginTop: Spacing.xs,
	},
	addIngredientSection: {
		borderRadius: BorderRadius.lg, // MD3 para elementos destacados
		padding: Spacing.md,
		marginTop: Spacing.sm,
	},
	addIngredientTitle: {
		marginBottom: Spacing.md,
	},
	quantityRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: Spacing.md,
	},
	unitsSection: {
		marginBottom: Spacing.md,
	},
	unitsLabel: {
		marginBottom: Spacing.sm,
	},
	segmentedButtons: {
		marginBottom: Spacing.sm,
	},
	addIngredientButton: {
		marginTop: Spacing.sm,
	},
	submitButton: {
		marginTop: Spacing.md,
		marginBottom: Spacing.lg,
		borderRadius: BorderRadius.lg, // MD3 para botones destacados
	},
	submitButtonContent: {
		paddingVertical: Spacing.sm,
	},
});
