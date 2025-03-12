import React from 'react';
import { StyleSheet, Image, TouchableOpacity } from "react-native";
import { Link, router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { formulas } from "@/data/formulas";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Ionicons } from "@expo/vector-icons";

export default function FormulasScreen() {
	return (
		<>
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
					<ThemedText type="title">Fórmulas</ThemedText>
				</ThemedView>

				<ThemedView style={styles.formulasContainer}>
					{formulas.map((formula) => (
						<TouchableOpacity
							key={formula.id}
							onPress={() =>
								router.push({
									pathname: "/formula/[id]",
									params: { id: formula.id },
								})
							}
						>
							<ThemedView style={styles.formulaCard}>
								<ThemedText style={styles.colorName}>
									{formula.nombreColor}
								</ThemedText>
							</ThemedView>
						</TouchableOpacity>
					))}
				</ThemedView>
			</ParallaxScrollView>
			
			<TouchableOpacity 
				style={styles.fab}
				onPress={() => router.push("/nueva-formula")}
			>
				<Ionicons name="add" size={30} color="white" />
			</TouchableOpacity>
		</>
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
	formulasContainer: {
		padding: 12,
		gap: 12,
	},
	formulaCard: {
		backgroundColor: "rgba(161, 206, 220, 0.1)",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
	},
	colorName: {
		fontSize: 20,
		fontWeight: "500",
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
	fab: {
		position: 'absolute',
		width: 60,
		height: 60,
		alignItems: 'center',
		justifyContent: 'center',
		right: 20,
		bottom: 20,
		backgroundColor: '#A1CEDC',
		borderRadius: 30,
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.30,
		shadowRadius: 4.65,
	},
});
