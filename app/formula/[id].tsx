import { StyleSheet, View, Image, TextInput, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { formulas } from "@/data/formulas";
import type { Ingrediente } from "@/data/formulas";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function FormulaScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const formula = formulas.find((f) => f.id === id);
	
	// Estado para los ingredientes y los campos del nuevo ingrediente
	const [ingredientes, setIngredientes] = useState<Ingrediente[]>(
		formula?.ingredientes || []
	);
	const [nuevoNombre, setNuevoNombre] = useState("");
	const [nuevaCantidad, setNuevaCantidad] = useState("");
	const [nuevaUnidad, setNuevaUnidad] = useState("gr");
	const [mostrarFormulario, setMostrarFormulario] = useState(false);

	if (!formula) {
		return (
			<ThemedView style={styles.container}>
				<ThemedText>Fórmula no encontrada</ThemedText>
			</ThemedView>
		);
	}

	// Función para añadir un nuevo ingrediente
	const agregarIngrediente = () => {
		if (!nuevoNombre.trim()) {
			Alert.alert("Error", "El nombre del ingrediente es obligatorio");
			return;
		}

		if (!nuevaCantidad.trim() || Number.isNaN(Number(nuevaCantidad))) {
			Alert.alert("Error", "La cantidad debe ser un número válido");
			return;
		}

		const nuevoIngrediente: Ingrediente = {
			nombre: nuevoNombre.trim(),
			cantidad: Number(nuevaCantidad),
			unidad: nuevaUnidad.trim() || "gr",
		};

		setIngredientes([...ingredientes, nuevoIngrediente]);
		
		// Limpiar el formulario
		setNuevoNombre("");
		setNuevaCantidad("");
		setNuevaUnidad("gr");
		setMostrarFormulario(false);
	};

	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
			headerHeight={140}
			withNavHeader={true}
			headerImage={
				<Image
					source={require("@/assets/images/palot.png")}
					style={styles.reactLogo}
				/>
			}
		>
			<ThemedView style={styles.titleContainer}>
				<ThemedText type="title" style={styles.title}>
					{formula.nombreColor}
				</ThemedText>
			</ThemedView>

			<ThemedView style={styles.ingredientesContainer}>
				<ThemedText type="subtitle" style={styles.subtitle}>
					Ingredientes:
				</ThemedText>
				
				{ingredientes.map((ingrediente, index) => (
					<ThemedView 
						key={`${formula.id}-${ingrediente.nombre}-${index}`} 
						style={styles.ingredienteRow}
					>
						<ThemedText style={styles.ingredienteNombre}>
							{ingrediente.nombre}
						</ThemedText>
						<ThemedText style={styles.cantidad}>
							{ingrediente.cantidad} {ingrediente.unidad}
						</ThemedText>
					</ThemedView>
				))}
				
				{/* Formulario para añadir un nuevo ingrediente */}
				{mostrarFormulario && (
					<ThemedView style={styles.formularioContainer}>
						<ThemedView style={styles.inputRow}>
							<ThemedText style={styles.label}>Nombre:</ThemedText>
							<TextInput
								style={styles.input}
								value={nuevoNombre}
								onChangeText={setNuevoNombre}
								placeholder="Nombre del ingrediente"
								placeholderTextColor="rgba(150, 150, 150, 0.8)"
							/>
						</ThemedView>
						
						<ThemedView style={styles.inputRow}>
							<ThemedText style={styles.label}>Cantidad:</ThemedText>
							<TextInput
								style={styles.input}
								value={nuevaCantidad}
								onChangeText={setNuevaCantidad}
								placeholder="Cantidad"
								keyboardType="numeric"
								placeholderTextColor="rgba(150, 150, 150, 0.8)"
							/>
						</ThemedView>
						
						<ThemedView style={styles.inputRow}>
							<ThemedText style={styles.label}>Unidad:</ThemedText>
							<ThemedView style={styles.unidadSelectorContainer}>
								<TouchableOpacity 
									style={[
										styles.unidadButton, 
										nuevaUnidad === "gr" && styles.unidadButtonSelected
									]} 
									onPress={() => setNuevaUnidad("gr")}
								>
									<ThemedText 
										style={[
											styles.unidadButtonText,
											nuevaUnidad === "gr" && styles.unidadButtonTextSelected
										]}
									>
										gr
									</ThemedText>
								</TouchableOpacity>
								
								<TouchableOpacity 
									style={[
										styles.unidadButton, 
										nuevaUnidad === "kg" && styles.unidadButtonSelected
									]} 
									onPress={() => setNuevaUnidad("kg")}
								>
									<ThemedText 
										style={[
											styles.unidadButtonText,
											nuevaUnidad === "kg" && styles.unidadButtonTextSelected
										]}
									>
										kg
									</ThemedText>
								</TouchableOpacity>
								
								<TouchableOpacity 
									style={[
										styles.unidadButton, 
										nuevaUnidad === "L" && styles.unidadButtonSelected
									]} 
									onPress={() => setNuevaUnidad("L")}
								>
									<ThemedText 
										style={[
											styles.unidadButtonText,
											nuevaUnidad === "L" && styles.unidadButtonTextSelected
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
								onPress={() => setMostrarFormulario(false)}
							>
								<ThemedText style={styles.botonTexto}>Cancelar</ThemedText>
							</TouchableOpacity>
							
							<TouchableOpacity 
								style={[styles.boton, styles.botonGuardar]} 
								onPress={agregarIngrediente}
							>
								<ThemedText style={styles.botonTexto}>Guardar</ThemedText>
							</TouchableOpacity>
						</ThemedView>
					</ThemedView>
				)}
				
				{/* Botón para mostrar el formulario */}
				{!mostrarFormulario && (
					<TouchableOpacity 
						style={styles.botonAgregar} 
						onPress={() => setMostrarFormulario(true)}
					>
						<Ionicons name="add-circle" size={24} color="#A1CEDC" />
						<ThemedText style={styles.botonAgregarTexto}>
							Añadir ingrediente
						</ThemedText>
					</TouchableOpacity>
				)}
			</ThemedView>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		marginTop: -20,
		marginBottom: 12,
	},
	title: {
		textAlign: "center",
	},
	ingredientesContainer: {
		backgroundColor: "rgba(161, 206, 220, 0.1)",
		borderRadius: 12,
		padding: 16,
		marginVertical: 8,
	},
	subtitle: {
		marginBottom: 16,
	},
	ingredienteRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(161, 206, 220, 0.2)",
	},
	ingredienteNombre: {
		fontSize: 18,
	},
	cantidad: {
		fontSize: 18,
		fontWeight: "bold",
	},
	reactLogo: {
		width: "50%",
		height: "70%",
		resizeMode: "contain",
		position: "absolute",
		top: "45%",
		left: "50%",
		transform: [{ translateX: -100 }, { translateY: -40 }],
		opacity: 0.9,
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
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		borderRadius: 6,
		padding: 10,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(161, 206, 220, 0.5)",
		color: "#333",
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
		backgroundColor: "rgba(255, 255, 255, 0.8)",
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
		color: "#fff",
		fontWeight: "bold",
	},
});
