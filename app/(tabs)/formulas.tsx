// @ts-nocheck
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
import { useColorScheme } from "react-native";

export default function FormulasScreen() {
	const [formulas, setFormulas] = useState<Formula[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

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

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: isDark ? "#192734" : "#F4F9FB",
		},
		header: {
			backgroundColor: "#A1CEDC",
			height: 180,
			justifyContent: "flex-end",
			alignItems: "center",
			borderBottomLeftRadius: 0,
			borderBottomRightRadius: 0,
			paddingBottom: 5,
			paddingTop: 10,
		},
		reactLogo: {
			width: 120,
			height: 120,
			resizeMode: "contain",
		},
		titleContainer: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			width: "100%",
			paddingHorizontal: 20,
		},
		titleText: {
			fontSize: 28,
			fontWeight: "bold",
			color: "white",
			textShadowColor: "rgba(0, 0, 0, 0.2)",
			textShadowOffset: { width: 1, height: 1 },
			textShadowRadius: 2,
			marginRight: 15,
		},
		reloadButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: "rgba(255, 255, 255, 0.3)",
			justifyContent: "center",
			alignItems: "center",
			borderWidth: 1,
			borderColor: "rgba(255, 255, 255, 0.5)",
		},
		reloadButtonText: {
			fontSize: 22,
			fontWeight: "bold",
			color: "white",
		},
		listContentContainer: {
			paddingHorizontal: 10,
			paddingTop: 12,
			paddingBottom: 24,
		},
		formulaContainer: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "flex-start",
			backgroundColor: isDark ? "#22304A" : "#F4F9FB",
			borderColor: isDark ? "#444" : "#C2C7CC", // Gris suave
			borderWidth: 1,
			borderRadius: 12,
			marginVertical: 8,
			marginHorizontal: 4,
			paddingVertical: 14,
			paddingHorizontal: 18,
			minHeight: 60,
			shadowColor: isDark ? "#000" : "#A1CEDC",
			shadowOpacity: 0.1,
			shadowOffset: { width: 0, height: 2 },
			shadowRadius: 4,
			elevation: 2,
		},
		formulaColor: {
			fontSize: 20,
			fontWeight: "500", // Igual que en stock
			color: isDark ? "#fff" : "#222",
			opacity: isDark ? 0.95 : 0.95, // Más suave
		},
		emptyContainer: {
			padding: 32,
			alignItems: "center",
			justifyContent: "center",
			marginTop: 32,
		},
		emptyText: {
			textAlign: "center",
			opacity: 0.7,
			fontSize: 16,
			color: isDark ? "#A1CEDC" : "#2E7D9B",
		},
		addButton: {
			backgroundColor: "#2E7D9B",
			paddingVertical: 10,
			paddingHorizontal: 24,
			borderRadius: 8,
			alignSelf: "center",
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 2,
		},
		addButtonText: {
			color: "white",
			fontSize: 16,
			fontWeight: "bold",
		},
	});

	return (
		<ThemedView style={styles.container}>
			<View style={styles.header}>
				<Image
					source={require("@/assets/images/chemical.png")}
					style={styles.reactLogo}
				/>
				<View style={styles.titleContainer}>
					<ThemedText type="title" style={styles.titleText}>
						Fórmulas
					</ThemedText>
					<TouchableOpacity onPress={loadFormulas} style={styles.reloadButton}>
						{isLoading ? (
							<ActivityIndicator size="small" color="white" />
						) : (
							<ThemedText style={styles.reloadButtonText}>↻</ThemedText>
						)}
					</TouchableOpacity>
				</View>
			</View>

			{error ? (
				<View style={styles.emptyContainer}>
					<ThemedText style={styles.emptyText}>{error}</ThemedText>
					<TouchableOpacity
						onPress={loadFormulas}
						style={[styles.addButton, { backgroundColor: "#2E7D9B" }]}
					>
						<ThemedText style={styles.addButtonText}>Reintentar</ThemedText>
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
								<View style={{ flex: 1 }}>
									<ThemedText
										style={[
											styles.formulaColor,
											{
												color: isDark ? "#fff" : "#222",
												fontWeight: "500",
												fontSize: 20,
											},
										]}
									>
										{item.nombreColor.charAt(0).toUpperCase() +
											item.nombreColor.slice(1)}
									</ThemedText>
								</View>
								<Ionicons
									name="chevron-forward-outline"
									size={26}
									color={isDark ? "#fff" : "#222"}
									style={{ marginLeft: 8, opacity: 0.7 }}
								/>
							</TouchableOpacity>
						</Link>
					)}
					ListEmptyComponent={
						!isLoading ? (
							<View style={styles.emptyContainer}>
								<ThemedText style={styles.emptyText}>
									No hay fórmulas disponibles.
								</ThemedText>
							</View>
						) : null
					}
					contentContainerStyle={styles.listContentContainer}
				/>
			)}
			{/* Botón para añadir nueva fórmula */}
			<View style={{ alignItems: "flex-end", margin: 16 }}>
				<Link href="/formulas/nueva-formula" asChild>
					<TouchableOpacity style={styles.addButton}>
						<ThemedText style={styles.addButtonText}>
							+ Añadir fórmula
						</ThemedText>
					</TouchableOpacity>
				</Link>
			</View>
		</ThemedView>
	);
}
