import React, { useState, useCallback } from "react";
import {
	StyleSheet,
	Image,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	View,
	FlatList,
} from "react-native";
import { Link } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getFormulas, deleteFormula } from "@/api/formulasApi";
import type { Formula } from "@/data/formulas";
import { useFocusEffect } from "@react-navigation/native";
import { showSuccess, showError } from "@/utils/toast";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";

export default function FormulasScreen() {
	const [formulas, setFormulas] = useState<Formula[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const backgroundColor = useThemeColor({}, "background");
	const tintColor = useThemeColor({}, "tint");
	const textColor = useThemeColor({}, "text");
	const iconColor = useThemeColor({}, "icon");

	const loadFormulas = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const fetchedFormulas = await getFormulas();
			setFormulas(fetchedFormulas);
		} catch (err) {
			const errorMessage = "Error al cargar las fórmulas. Inténtalo de nuevo.";
			setError(errorMessage);
			showError("Error", errorMessage);
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleDeleteFormula = async (id: string, nombreColor: string) => {
		try {
			setIsLoading(true);
			const success = await deleteFormula(id);
			if (success) {
				showSuccess("¡Eliminada!", `Fórmula ${nombreColor} eliminada.`);
				await loadFormulas();
			} else {
				showError("Error", "No se pudo eliminar la fórmula.");
			}
		} catch (err) {
			console.error("Error deleting formula:", err);
			showError("Error", "Ocurrió un error al intentar eliminar la fórmula.");
		} finally {
			setIsLoading(false);
		}
	};

	const confirmDeleteFormula = (formula: Formula) => {
		Alert.alert(
			"Eliminar Fórmula",
			`¿Está seguro que desea eliminar la fórmula "${formula.nombreColor}"?`,
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Eliminar",
					style: "destructive",
					onPress: () => handleDeleteFormula(formula.id, formula.nombreColor),
				},
			],
		);
	};

	useFocusEffect(
		useCallback(() => {
			loadFormulas();
		}, [loadFormulas]),
	);

	return (
		<ThemedView style={styles.container}>
			<View style={[styles.headerContainer, { backgroundColor: "#A1CEDC" }]}>
				<Image
					source={require("@/assets/images/chemical.png")}
					style={styles.headerImage}
				/>
				<View style={styles.titleContainer}>
					<ThemedText style={styles.title}>
						Fórmulas
					</ThemedText>
					<TouchableOpacity
						onPress={loadFormulas}
						style={styles.refreshButton}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator size="small" color="white" />
						) : (
							<ThemedText style={styles.refreshButtonText}>
								↻
							</ThemedText>
						)}
					</TouchableOpacity>
				</View>
			</View>

			{error ? (
				<View style={styles.errorContainer}>
					<ThemedText style={styles.errorText}>{error}</ThemedText>
					<TouchableOpacity
						onPress={loadFormulas}
						style={[styles.retryButton, { backgroundColor: tintColor }]}
					>
						<ThemedText style={[styles.retryButtonText, { color: textColor }]}>
							Reintentar
						</ThemedText>
					</TouchableOpacity>
				</View>
			) : (
				<FlatList
					data={formulas}
					keyExtractor={(item) => item.id.toString()}
					onRefresh={loadFormulas}
					refreshing={isLoading}
					renderItem={({ item }) => (
						<Link
							href={{ pathname: "/formulas/[id]", params: { id: item.id } }}
							asChild
						>
							<TouchableOpacity
								style={styles.formulaContainer}
								onLongPress={() => confirmDeleteFormula(item)}
							>
								<View style={styles.formulaColorContainer}>
									<ThemedText style={styles.formulaColor}>
										{item.nombreColor}
									</ThemedText>
								</View>
								<Ionicons
									name="chevron-forward-outline"
									size={24}
									color="#fff"
								/>
							</TouchableOpacity>
						</Link>
					)}
					ListEmptyComponent={
						!isLoading ? (
							<View style={styles.emptyContainer}>
								<ThemedText style={[styles.emptyText, { color: textColor }]}>
									No hay fórmulas disponibles.
								</ThemedText>
							</View>
						) : null
					}
					contentContainerStyle={styles.listContentContainer}
				/>
			)}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerContainer: {
		width: "100%",
		height: 180,
		alignItems: "center",
		justifyContent: "flex-end",
		paddingBottom: 5,
	},
	headerImage: {
		width: "80%",
		height: "70%",
		resizeMode: "contain",
		marginBottom: -10,
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		paddingHorizontal: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "white",
		textShadowColor: "rgba(0, 0, 0, 0.2)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
		marginRight: 15,
		paddingTop: 8,
	},
	refreshButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.3)",
	},
	refreshButtonText: {
		fontSize: 22,
		fontWeight: "bold",
		color: "white",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingBottom: 16,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: "red",
		textAlign: "center",
		marginBottom: 10,
	},
	retryButton: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
	},
	retryButtonText: {
		fontWeight: "bold",
	},
	listContentContainer: {
		paddingHorizontal: 16,
		paddingBottom: 16,
		paddingTop: 16,
	},
	formulaContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 15,
		marginVertical: 8,
		borderRadius: 8,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.08,
		shadowRadius: 2,
		elevation: 2,
		marginHorizontal: 16,
		backgroundColor: "#2C3E50",
	},
	formulaColorContainer: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	formulaColor: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
	},
	emptyContainer: {
		padding: 24,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 20,
	},
	emptyText: {
		textAlign: "center",
		opacity: 0.7,
		fontSize: 16,
	},
});
