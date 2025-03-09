import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { coloresGoma, type ColorGoma } from "../data/colors";
import { useState } from "react";

export default function HomeScreen() {
	const [inventario, setInventario] = useState<ColorGoma[]>(coloresGoma);

	const ajustarCantidad = (id: string, incremento: number) => {
		setInventario(
			inventario.map((color) =>
				color.id === id
					? { ...color, cantidad: Math.max(0, color.cantidad + incremento) }
					: color,
			),
		);
	};

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
				<ThemedText type="title">Stock</ThemedText>
			</ThemedView>

			<ThemedView style={styles.colorContainer}>
				<ThemedText type="subtitle" style={styles.subtitle}>
					Inventario de Colores
				</ThemedText>
				{inventario.map((color) => (
					<ThemedView key={color.id} style={styles.colorRow}>
						<ThemedText style={styles.colorName}>{color.nombre}</ThemedText>
						<View style={styles.cantidadContainer}>
							<TouchableOpacity
								style={styles.button}
								onPress={() => ajustarCantidad(color.id, -1)}
							>
								<ThemedText style={styles.buttonText}>-</ThemedText>
							</TouchableOpacity>

							<ThemedText style={styles.cantidad}>{color.cantidad}</ThemedText>

							<TouchableOpacity
								style={styles.button}
								onPress={() => ajustarCantidad(color.id, 1)}
							>
								<ThemedText style={styles.buttonText}>+</ThemedText>
							</TouchableOpacity>
						</View>
					</ThemedView>
				))}
			</ThemedView>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		marginTop: -20,
		marginBottom: 12,
	},
	colorContainer: {
		padding: 20,
		backgroundColor: "rgba(161, 206, 220, 0.1)",
		borderRadius: 12,
		marginVertical: 0,
		marginHorizontal: 6,
	},
	subtitle: {
		marginBottom: 16,
		fontSize: 22,
	},
	colorRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(161, 206, 220, 0.2)",
	},
	colorName: {
		fontSize: 20,
	},
	cantidadContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
	},
	button: {
		backgroundColor: "rgba(161, 206, 220, 0.2)",
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	buttonText: {
		fontSize: 26,
		fontWeight: "bold",
	},
	cantidad: {
		fontSize: 20,
		fontWeight: "bold",
		minWidth: 36,
		textAlign: "center",
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
