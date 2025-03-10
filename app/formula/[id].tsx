import { StyleSheet, View, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { formulas } from "@/data/formulas";
import ParallaxScrollView from "@/components/ParallaxScrollView";

export default function FormulaScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const formula = formulas.find((f) => f.id === id);

	if (!formula) {
		return (
			<ThemedView style={styles.container}>
				<ThemedText>Fórmula no encontrada</ThemedText>
			</ThemedView>
		);
	}

	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
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
				{formula.ingredientes.map((ingrediente, index) => (
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
		width: "60%",
		height: "80%",
		resizeMode: "contain",
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: [{ translateX: -120 }, { translateY: -50 }],
	},
});
