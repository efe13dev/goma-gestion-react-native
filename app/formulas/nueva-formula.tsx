import React, { useState } from "react";
import {
	StyleSheet,
	View,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { addFormula } from "@/api/formulasApi";
import { showSuccess, showError } from "@/utils/toast";

export default function NuevaFormulaScreen() {
	const [nombreColor, setNombreColor] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleAddFormula = async () => {
		if (!nombreColor.trim()) {
			showError("Error", "Por favor, ingresa un nombre de color.");
			return;
		}
		setIsLoading(true);
		try {
			await addFormula({ nombreColor }); // FIXME: Ajustar tipo si es necesario
			showSuccess("Éxito", "Fórmula añadida correctamente.");
			router.back();
		} catch (error) {
			showError("Error", "No se pudo añadir la fórmula.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ThemedView style={styles.container}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{ flex: 1 }}
			>
				<View style={styles.formContainer}>
					<ThemedText style={styles.label}>Nombre del color</ThemedText>
					<TextInput
						style={styles.input}
						value={nombreColor}
						onChangeText={setNombreColor}
						placeholder="Ejemplo: Azul cielo"
					/>
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
			</KeyboardAvoidingView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#A1CEDC",
	},
	formContainer: {
		backgroundColor: "white",
		borderRadius: 16,
		padding: 24,
		width: 320,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 5,
	},
	label: {
		fontSize: 18,
		marginBottom: 8,
		color: "#2E7D9B",
		fontWeight: "bold",
	},
	input: {
		borderWidth: 1,
		borderColor: "#A1CEDC",
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		marginBottom: 16,
		backgroundColor: "#F4F9FB",
	},
	button: {
		backgroundColor: "#2E7D9B",
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: "center",
	},
	buttonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
});
