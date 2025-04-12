import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
	getFormulaById,
	addIngredient,
	updateIngredient,
	deleteIngredient as deleteIngredientAPI,
} from "@/api/formulasApi";
import type { Ingrediente, Formula } from "@/data/formulas";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
	Alert,
	Image,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
	Animated,
	Modal,
	KeyboardAvoidingView,
	TouchableWithoutFeedback,
	Keyboard,
	Platform,
	ActivityIndicator,
} from "react-native";
import {
	Swipeable,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "react-native";

export default function FormulaScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();

	// Estados para manejar la fórmula y sus ingredientes
	const [formula, setFormula] = useState<Formula | null>(null);
	const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Estado unificado para el formulario (tanto para añadir como editar)
	const [mostrarFormulario, setMostrarFormulario] = useState(false);
	const [ingredienteNombre, setIngredienteNombre] = useState("");
	const [ingredienteCantidad, setIngredienteCantidad] = useState("");
	const [ingredienteUnidad, setIngredienteUnidad] = useState("gr");
	const [editandoIndex, setEditandoIndex] = useState<number | null>(null);

	// Referencias a los componentes Swipeable para cerrarlos cuando sea necesario
	const swipeableRefs = useRef<Array<Swipeable | null>>([]);

	// Obtener el color del texto según el tema
	const textColor = useThemeColor({}, "text");
	const backgroundColor = useThemeColor({}, "background");
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

	// Cargar la fórmula desde la API
	useEffect(() => {
		const loadFormula = async () => {
			if (!id) return;

			setIsLoading(true);
			setError(null);

			try {
				const formulaData = await getFormulaById(id as string);

				if (formulaData) {
					setFormula(formulaData);
					setIngredientes(formulaData.ingredientes);
				} else {
					setError("Fórmula no encontrada");
				}
			} catch (err) {
				console.error("Error al cargar la fórmula:", err);
				setError("Error al cargar la fórmula");
			} finally {
				setIsLoading(false);
			}
		};

		loadFormula();
	}, [id]);

	// Si está cargando, mostrar un indicador de carga
	if (isLoading) {
		return (
			<ThemedView style={[styles.container, styles.centerContent]}>
				<ActivityIndicator size="large" color="#A1CEDC" />
				<ThemedText style={styles.loadingText}>Cargando fórmula...</ThemedText>
			</ThemedView>
		);
	}

	// Si hay un error o no se encontró la fórmula
	if (error || !formula) {
		return (
			<ThemedView style={[styles.container, styles.centerContent]}>
				<ThemedText style={styles.errorText}>
					{error || "Fórmula no encontrada"}
				</ThemedText>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<ThemedText style={styles.backButtonText}>Volver</ThemedText>
				</TouchableOpacity>
			</ThemedView>
		);
	}

	// Función para iniciar la edición de un ingrediente
	const iniciarEdicion = (index: number) => {
		// Cerrar todos los swipeables abiertos
		closeAllSwipeables();

		const ingrediente = ingredientes[index];
		setIngredienteNombre(ingrediente.nombre);
		setIngredienteCantidad(ingrediente.cantidad.toString());
		setIngredienteUnidad(ingrediente.unidad);
		setEditandoIndex(index);
		setMostrarFormulario(true);
	};

	// Función para guardar el ingrediente (ya sea nuevo o editado)
	const guardarIngrediente = async () => {
		if (!ingredienteNombre.trim()) {
			Alert.alert("Error", "El nombre del ingrediente es obligatorio");
			return;
		}

		if (
			!ingredienteCantidad.trim() ||
			Number.isNaN(Number(ingredienteCantidad))
		) {
			Alert.alert("Error", "La cantidad debe ser un número válido");
			return;
		}

		const nuevoIngrediente: Ingrediente = {
			nombre: ingredienteNombre.trim(),
			cantidad: Number(ingredienteCantidad),
			unidad: ingredienteUnidad.trim() || "gr",
		};

		setIsLoading(true);

		try {
			if (editandoIndex !== null && formula) {
				// Estamos editando un ingrediente existente
				const resultado = await updateIngredient(
					formula.id,
					editandoIndex,
					nuevoIngrediente,
				);

				if (resultado) {
					// Actualizar la fórmula después de la modificación
					const formulaActualizada = await getFormulaById(formula.id);
					if (formulaActualizada) {
						setFormula(formulaActualizada);
						setIngredientes(formulaActualizada.ingredientes);
					}
				} else {
					Alert.alert("Error", "No se pudo actualizar el ingrediente");
				}
			} else if (formula) {
				// Estamos añadiendo un nuevo ingrediente
				const resultado = await addIngredient(formula.id, nuevoIngrediente);

				if (resultado) {
					// Actualizar la fórmula después de añadir el ingrediente
					const formulaActualizada = await getFormulaById(formula.id);
					if (formulaActualizada) {
						setFormula(formulaActualizada);
						setIngredientes(formulaActualizada.ingredientes);
					}
				} else {
					Alert.alert("Error", "No se pudo agregar el ingrediente");
				}
			}
		} catch (err) {
			console.error("Error al guardar el ingrediente:", err);
			Alert.alert("Error", "Ocurrió un error al guardar el ingrediente");
		} finally {
			setIsLoading(false);
			// Limpiar el formulario y cerrar
			cancelarFormulario();
		}
	};

	// Función para cancelar el formulario
	const cancelarFormulario = () => {
		setEditandoIndex(null);
		setIngredienteNombre("");
		setIngredienteCantidad("");
		setIngredienteUnidad("gr");
		setMostrarFormulario(false);
	};

	// Función para mostrar el formulario para añadir un nuevo ingrediente
	const mostrarFormularioAgregar = () => {
		setIngredienteNombre("");
		setIngredienteCantidad("");
		setIngredienteUnidad("gr");
		setEditandoIndex(null);
		setMostrarFormulario(true);
	};

	// Función para eliminar un ingrediente
	const eliminarIngrediente = async (index: number) => {
		Alert.alert(
			"Confirmar eliminación",
			"¿Estás seguro de que quieres eliminar este ingrediente?",
			[
				{
					text: "Cancelar",
					style: "cancel",
					onPress: () => {
						// Cerrar el swipeable después de cancelar
						closeAllSwipeables();
					},
				},
				{
					text: "Eliminar",
					style: "destructive",
					onPress: async () => {
						if (formula) {
							setIsLoading(true);

							try {
								const resultado = await deleteIngredientAPI(formula.id, index);

								if (resultado) {
									// Cerrar todos los swipeables
									closeAllSwipeables();

									// Actualizar la fórmula después de eliminar el ingrediente
									const formulaActualizada = await getFormulaById(formula.id);
									if (formulaActualizada) {
										setFormula(formulaActualizada);
										setIngredientes(formulaActualizada.ingredientes);
									}
								} else {
									Alert.alert("Error", "No se pudo eliminar el ingrediente");
								}
							} catch (err) {
								console.error("Error al eliminar el ingrediente:", err);
								Alert.alert(
									"Error",
									"Ocurrió un error al eliminar el ingrediente",
								);
							} finally {
								setIsLoading(false);
							}
						}
					},
				},
			],
		);
	};

	// Función para guardar la referencia del swipeable
	const saveSwipeableRef = (ref: Swipeable | null, index: number) => {
		if (swipeableRefs.current.length <= index) {
			swipeableRefs.current = [
				...swipeableRefs.current,
				...Array(index - swipeableRefs.current.length + 1).fill(null),
			];
		}
		swipeableRefs.current[index] = ref;
	};

	// Función para cerrar todos los swipeables
	const closeAllSwipeables = () => {
		for (const ref of swipeableRefs.current) {
			if (ref) ref.close();
		}
	};

	// Renderizar el lado derecho del swipeable (acción de eliminar)
	const renderRightActions = (
		progress: Animated.AnimatedInterpolation<number>,
		dragX: Animated.AnimatedInterpolation<number>,
		index: number,
	) => {
		const trans = dragX.interpolate({
			inputRange: [-101, -100, -50, 0],
			outputRange: [0, 0, 0, 100],
			extrapolate: "clamp",
		});

		const opacity = dragX.interpolate({
			inputRange: [-100, -50],
			outputRange: [1, 0.5],
			extrapolate: "clamp",
		});

		return (
			<Animated.View
				style={[
					styles.deleteAction,
					{
						transform: [{ translateX: trans }],
						opacity: opacity,
					},
				]}
			>
				<TouchableOpacity
					style={styles.deleteActionContent}
					onPress={() => eliminarIngrediente(index)}
				>
					<MaterialIcons name="delete-outline" size={24} color="white" />
					<ThemedText style={styles.deleteActionText}>Eliminar</ThemedText>
				</TouchableOpacity>
			</Animated.View>
		);
	};

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ParallaxScrollView
				headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
				headerHeight={100}
				withNavHeader={true}
				headerImage={
					<View style={styles.headerTitleContainer}>
						<ThemedText type="title" style={styles.headerTitle}>
							{formula.nombreColor.charAt(0).toUpperCase() +
								formula.nombreColor.slice(1)}
						</ThemedText>
					</View>
				}
			>
				<ThemedView style={styles.ingredientesContainer}>
					<ThemedText type="subtitle" style={styles.subtitle}>
						Ingredientes:
					</ThemedText>

					{ingredientes.length === 0 ? (
						<ThemedText style={styles.emptyText}>
							No hay ingredientes. Añade uno para comenzar.
						</ThemedText>
					) : (
						ingredientes.map((ingrediente, index) => (
							<Swipeable
								key={`${formula?.id}-${ingrediente.nombre}-${index}`}
								ref={(ref) => saveSwipeableRef(ref, index)}
								renderRightActions={(progress, dragX) =>
									renderRightActions(progress, dragX, index)
								}
								containerStyle={styles.swipeableContainer}
								overshootRight={false}
							>
								<TouchableOpacity onPress={() => iniciarEdicion(index)}>
									<ThemedView style={styles.ingredienteRow}>
										<ThemedText style={styles.ingredienteNombre}>
											{ingrediente.nombre.charAt(0).toUpperCase() +
												ingrediente.nombre.slice(1)}
										</ThemedText>
										<ThemedText style={styles.cantidad}>
											{ingrediente.cantidad} {ingrediente.unidad}
										</ThemedText>
									</ThemedView>
								</TouchableOpacity>
							</Swipeable>
						))
					)}

					{/* Botón para mostrar el formulario de añadir */}
					{!mostrarFormulario && (
						<TouchableOpacity
							style={styles.botonAgregar}
							onPress={mostrarFormularioAgregar}
							activeOpacity={0.7}
						>
							<Ionicons name="add-circle" size={24} color="#A1CEDC" />
							<ThemedText style={styles.botonAgregarTexto}>
								Añadir ingrediente
							</ThemedText>
						</TouchableOpacity>
					)}
				</ThemedView>

				{/* Modal para añadir o editar ingredientes */}
				<Modal
					visible={mostrarFormulario}
					transparent={true}
					animationType="fade"
					onRequestClose={cancelarFormulario}
				>
					{/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
						<View style={styles.modalOverlay}>
							<ThemedView style={styles.modalContainer}>
								<ThemedView style={styles.modalHeader}>
									<ThemedText type="subtitle" style={styles.subtitleForm}>
										{editandoIndex !== null
											? "Editar Ingrediente"
											: "Añadir Ingrediente"}
									</ThemedText>
									<TouchableOpacity
										onPress={cancelarFormulario}
										style={styles.closeButton}
									>
										<Ionicons name="close" size={24} color={textColor} />
									</TouchableOpacity>
								</ThemedView>

								<ThemedView style={styles.inputRow}>
									<ThemedText style={styles.label}>Nombre:</ThemedText>
									<TextInput
										style={[
											styles.input,
											{
												color: textColor,
												backgroundColor: isDark
													? "rgba(50, 50, 50, 0.8)"
													: "rgba(255, 255, 255, 0.8)",
												borderColor: isDark
													? "rgba(161, 206, 220, 0.7)"
													: "rgba(161, 206, 220, 0.5)",
											},
										]}
										value={ingredienteNombre}
										onChangeText={setIngredienteNombre}
										placeholder="Nombre del ingrediente"
										placeholderTextColor={
											isDark
												? "rgba(200, 200, 200, 0.8)"
												: "rgba(150, 150, 150, 0.8)"
										}
										editable={true}
										autoCapitalize="sentences"
									/>
								</ThemedView>

								<ThemedView style={styles.inputRow}>
									<ThemedText style={styles.label}>Cantidad:</ThemedText>
									<TextInput
										style={[
											styles.input,
											{
												color: textColor,
												backgroundColor: isDark
													? "rgba(50, 50, 50, 0.8)"
													: "rgba(255, 255, 255, 0.8)",
												borderColor: isDark
													? "rgba(161, 206, 220, 0.7)"
													: "rgba(161, 206, 220, 0.5)",
											},
										]}
										value={ingredienteCantidad}
										onChangeText={setIngredienteCantidad}
										placeholder="Cantidad"
										keyboardType="numeric"
										placeholderTextColor={
											isDark
												? "rgba(200, 200, 200, 0.8)"
												: "rgba(150, 150, 150, 0.8)"
										}
										editable={true}
									/>
								</ThemedView>

								<ThemedView style={styles.inputRow}>
									<ThemedText style={styles.label}>Unidad:</ThemedText>
									<ThemedView style={styles.unidadSelectorContainer}>
										<TouchableOpacity
											style={[
												styles.unidadButton,
												ingredienteUnidad === "gr" &&
													styles.unidadButtonSelected,
												{
													backgroundColor: isDark
														? "rgba(50, 50, 50, 0.8)"
														: "rgba(255, 255, 255, 0.8)",
												},
											]}
											onPress={() => setIngredienteUnidad("gr")}
										>
											<ThemedText
												style={[
													styles.unidadButtonText,
													ingredienteUnidad === "gr" &&
														styles.unidadButtonTextSelected,
													{ color: textColor },
												]}
											>
												gr
											</ThemedText>
										</TouchableOpacity>

										<TouchableOpacity
											style={[
												styles.unidadButton,
												ingredienteUnidad === "kg" &&
													styles.unidadButtonSelected,
												{
													backgroundColor: isDark
														? "rgba(50, 50, 50, 0.8)"
														: "rgba(255, 255, 255, 0.8)",
												},
											]}
											onPress={() => setIngredienteUnidad("kg")}
										>
											<ThemedText
												style={[
													styles.unidadButtonText,
													ingredienteUnidad === "kg" &&
														styles.unidadButtonTextSelected,
													{ color: textColor },
												]}
											>
												kg
											</ThemedText>
										</TouchableOpacity>

										<TouchableOpacity
											style={[
												styles.unidadButton,
												ingredienteUnidad === "L" &&
													styles.unidadButtonSelected,
												{
													backgroundColor: isDark
														? "rgba(50, 50, 50, 0.8)"
														: "rgba(255, 255, 255, 0.8)",
												},
											]}
											onPress={() => setIngredienteUnidad("L")}
										>
											<ThemedText
												style={[
													styles.unidadButtonText,
													ingredienteUnidad === "L" &&
														styles.unidadButtonTextSelected,
													{ color: textColor },
												]}
											>
												L
											</ThemedText>
										</TouchableOpacity>
									</ThemedView>
								</ThemedView>

								<ThemedView style={styles.botonesContainer}>
									<TouchableOpacity
										style={[styles.boton, styles.botonCancelar]}
										onPress={cancelarFormulario}
									>
										<ThemedText style={styles.botonTexto}>Cancelar</ThemedText>
									</TouchableOpacity>

									<TouchableOpacity
										style={[styles.boton, styles.botonGuardar]}
										onPress={guardarIngrediente}
									>
										<ThemedText style={styles.botonTexto}>Guardar</ThemedText>
									</TouchableOpacity>
								</ThemedView>
							</ThemedView>
						</View>
					{/* </TouchableWithoutFeedback> */}
				</Modal>
			</ParallaxScrollView>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	centerContent: {
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
	},
	errorText: {
		fontSize: 18,
		color: "#FF6B6B",
		marginBottom: 20,
	},
	backButton: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		backgroundColor: "#A1CEDC",
		borderRadius: 6,
	},
	backButtonText: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333",
	},
	emptyText: {
		textAlign: "center",
		marginVertical: 20,
		fontStyle: "italic",
		opacity: 0.7,
	},
	headerTitleContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	headerTitle: {
		textAlign: "center",
		color: "white",
		fontSize: 30,
		fontWeight: "bold",
		textShadowColor: "rgba(0, 0, 0, 0.3)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 3,
	},
	ingredientesContainer: {
		backgroundColor: "rgba(161, 206, 220, 0.1)",
		borderRadius: 12,
		padding: 16,
		marginVertical: 8,
		marginHorizontal: 6,
		marginBottom: 70,
	},
	subtitle: {
		marginBottom: 16,
	},
	subtitleForm: {
		marginBottom: 12,
		textAlign: "center",
	},
	ingredienteRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(161, 206, 220, 0.2)",
		backgroundColor: "rgba(255, 255, 255, 0.05)",
	},
	ingredienteNombre: {
		fontSize: 20,
		fontWeight: "500",
	},
	cantidad: {
		fontSize: 18,
		fontWeight: "bold",
		minWidth: 36,
		textAlign: "right",
	},
	formularioContainer: {
		marginTop: 16,
		padding: 12,
		backgroundColor: "rgba(161, 206, 220, 0.05)",
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "rgba(161, 206, 220, 0.3)",
	},
	inputRow: {
		marginBottom: 12,
	},
	label: {
		marginBottom: 4,
		fontSize: 16,
	},
	input: {
		borderRadius: 6,
		padding: 10,
		fontSize: 16,
		borderWidth: 1,
	},
	botonesContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 16,
	},
	boton: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 6,
		alignItems: "center",
		flex: 1,
		marginHorizontal: 4,
	},
	botonCancelar: {
		backgroundColor: "rgba(200, 200, 200, 0.8)",
	},
	botonGuardar: {
		backgroundColor: "#A1CEDC",
	},
	botonTexto: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333",
	},
	botonAgregar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 16,
		padding: 12,
		backgroundColor: "rgba(161, 206, 220, 0.1)",
		borderRadius: 8,
		borderWidth: 1,
		borderStyle: "dashed",
		borderColor: "rgba(161, 206, 220, 0.5)",
	},
	botonAgregarTexto: {
		marginLeft: 8,
		fontSize: 16,
		color: "#A1CEDC",
	},
	unidadSelectorContainer: {
		flexDirection: "row",
		justifyContent: "flex-start",
		marginTop: 4,
		flexWrap: "wrap",
	},
	unidadButton: {
		paddingVertical: 8,
		paddingHorizontal: 24,
		borderRadius: 6,
		marginRight: 12,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "rgba(161, 206, 220, 0.5)",
	},
	unidadButtonSelected: {
		backgroundColor: "#A1CEDC",
		borderColor: "#A1CEDC",
	},
	unidadButtonText: {
		fontSize: 16,
		color: "#666",
	},
	unidadButtonTextSelected: {
		color: "#333",
		fontWeight: "bold",
	},
	accionesContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	deleteAction: {
		backgroundColor: "#FF6B6B",
		justifyContent: "center",
		alignItems: "center",
		width: 100,
		height: "100%",
	},
	deleteActionContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	deleteActionText: {
		color: "white",
		fontWeight: "bold",
		marginTop: 4,
	},
	swipeableContainer: {
		backgroundColor: "transparent",
		marginVertical: 4,
		borderRadius: 12,
		overflow: "hidden",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		width: "100%",
		maxWidth: 500,
		borderRadius: 12,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	closeButton: {
		padding: 4,
	},
});
