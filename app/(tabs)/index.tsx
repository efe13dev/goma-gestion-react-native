import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
	coloresGoma,
	type ColorGoma,
	guardarInventario,
	cargarInventario,
} from "@/data/colors";
import { useState, useEffect } from "react";

export default function HomeScreen() {
	const [inventario, setInventario] = useState<ColorGoma[]>(coloresGoma);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	useEffect(() => {
		const cargarDatos = async () => {
			const datos = await cargarInventario();
			setInventario(datos);
		};
		cargarDatos();
	}, []);

	const ajustarCantidad = async (id: string, incremento: number) => {
		const nuevoInventario = inventario.map((color) =>
			color.id === id
				? { ...color, cantidad: Math.max(0, color.cantidad + incremento) }
				: color,
		);
		setInventario(nuevoInventario);
		await guardarInventario(nuevoInventario);
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
					<TouchableOpacity
						key={color.id}
						onPress={() =>
							setSelectedId(selectedId === color.id ? null : color.id)
						}
					>
						<ThemedView style={styles.colorRow}>
							<ThemedText style={styles.colorName}>{color.nombre}</ThemedText>
							<View style={styles.cantidadContainer}>
								{selectedId === color.id ? (
									<>
										<TouchableOpacity
											style={styles.button}
											onPress={() => ajustarCantidad(color.id, -1)}
										>
											<ThemedText style={styles.buttonText}>-</ThemedText>
										</TouchableOpacity>

										<ThemedText style={styles.cantidad}>
											{color.cantidad}
										</ThemedText>

										<TouchableOpacity
											style={styles.button}
											onPress={() => ajustarCantidad(color.id, 1)}
										>
											<ThemedText style={styles.buttonText}>+</ThemedText>
										</TouchableOpacity>
									</>
								) : (
									<ThemedText style={styles.cantidad}>
										{color.cantidad}
									</ThemedText>
								)}
							</View>
						</ThemedView>
					</TouchableOpacity>
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
		padding: 12,
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
		paddingVertical: 20,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(161, 206, 220, 0.2)",
		marginVertical: 4,
	},
	colorName: {
		fontSize: 20,
	},
	cantidadContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
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
		fontSize: 22,
		fontWeight: "bold",
	},
	cantidad: {
		fontSize: 22,
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
