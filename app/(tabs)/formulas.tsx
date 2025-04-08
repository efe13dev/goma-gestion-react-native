import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getFormulas, deleteFormula } from "@/api/formulasApi";
import type { Formula } from "@/data/formulas";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

export default function FormulasScreen() {
	// Estado para las fórmulas
	const [formulas, setFormulas] = useState<Formula[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar las fórmulas desde la API
	const loadFormulas = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		
		try {
			const data = await getFormulas();
			setFormulas(data);
		} catch (err) {
			console.error('Error al cargar las fórmulas:', err);
			setError('Error al cargar las fórmulas. Intente nuevamente.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Cargar las fórmulas al montar el componente
	useEffect(() => {
		loadFormulas();
	}, [loadFormulas]);

	// Recargar las fórmulas cuando la pantalla obtiene el foco
	useFocusEffect(
		useCallback(() => {
			loadFormulas();
		}, [loadFormulas])
	);

	// Función para confirmar la eliminación de una fórmula
	const confirmDeleteFormula = (formula: Formula) => {
		Alert.alert(
			"Eliminar Fórmula",
			`¿Estás seguro de que quieres eliminar la fórmula "${formula.nombreColor}"?`,
			[
				{
					text: "Cancelar",
					style: "cancel"
				},
				{
					text: "Eliminar",
					style: "destructive",
					onPress: async () => {
						setIsLoading(true);
						
						try {
							const eliminado = await deleteFormula(formula.id);
							if (eliminado) {
								// Recargar las fórmulas después de eliminar
								await loadFormulas();
								Alert.alert("Éxito", `Fórmula "${formula.nombreColor}" eliminada correctamente`);
							} else {
								Alert.alert("Error", "No se pudo eliminar la fórmula");
							}
						} catch (err) {
							console.error('Error al eliminar la fórmula:', err);
							Alert.alert("Error", "Ocurrió un error al eliminar la fórmula");
						} finally {
							setIsLoading(false);
						}
					}
				}
			]
		);
	};

	// Si está cargando, mostrar un indicador de carga
	if (isLoading) {
		return (
			<ThemedView style={[styles.container, styles.centerContent]}>
				<ActivityIndicator size="large" color="#A1CEDC" />
				<ThemedText style={styles.loadingText}>Cargando fórmulas...</ThemedText>
			</ThemedView>
		);
	}

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
					<TouchableOpacity onPress={loadFormulas} style={styles.reloadButton}>
						<ThemedText style={styles.reloadButtonText}>↻</ThemedText>
					</TouchableOpacity>
				</ThemedView>

				{error && (
					<ThemedView style={styles.errorContainer}>
						<ThemedText style={styles.errorText}>{error}</ThemedText>
						<TouchableOpacity onPress={loadFormulas} style={styles.retryButton}>
							<ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
						</TouchableOpacity>
					</ThemedView>
				)}

				<ThemedView style={styles.formulasContainer}>
					{formulas.length === 0 && !isLoading && !error ? (
						<ThemedView style={styles.emptyContainer}>
							<ThemedText style={styles.emptyText}>
								No hay fórmulas disponibles. Crea una nueva fórmula con el botón +
							</ThemedText>
						</ThemedView>
					) : (
						formulas.map((formula) => (
							<TouchableOpacity
								key={formula.id}
								style={styles.formulaCard}
								onPress={() => {
									router.push({
										pathname: "/formula/[id]",
										params: { id: formula.id },
									});
								}}
								onLongPress={() => confirmDeleteFormula(formula)}
							>
								<ThemedText style={styles.colorName}>
									{formula.nombreColor}
								</ThemedText>
							</TouchableOpacity>
						))
					)}

					{formulas.length > 0 && (
						<ThemedText style={styles.helpText}>
							Mantener presionada una fórmula para eliminarla
						</ThemedText>
					)}
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
	container: {
		flex: 1,
	},
	centerContent: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
	},
	errorContainer: {
		backgroundColor: 'rgba(255, 107, 107, 0.1)',
		borderRadius: 12,
		padding: 16,
		margin: 12,
		alignItems: 'center',
	},
	errorText: {
		color: '#FF6B6B',
		marginBottom: 12,
		textAlign: 'center',
	},
	retryButton: {
		backgroundColor: '#A1CEDC',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 6,
	},
	retryButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	emptyContainer: {
		padding: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyText: {
		textAlign: 'center',
		opacity: 0.7,
		fontSize: 16,
	},
	helpText: {
		textAlign: 'center',
		marginTop: 16,
		fontSize: 14,
		opacity: 0.7,
		fontStyle: 'italic',
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		marginTop: -20,
		marginBottom: 12,
	},
	reloadButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(161, 206, 220, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 8,
	},
	reloadButtonText: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	formulasContainer: {
		padding: 12,
		backgroundColor: "rgba(161, 206, 220, 0.1)",
		borderRadius: 12,
		marginVertical: 0,
		marginHorizontal: 6,
	},
	formulaCard: {
		backgroundColor: "rgba(161, 206, 220, 0.05)",
		borderRadius: 12,
		paddingVertical: 20,
		paddingHorizontal: 16,
		marginVertical: 6,
		borderWidth: 1,
		borderColor: "rgba(161, 206, 220, 0.2)",
	},
	colorName: {
		fontSize: 20,
		fontWeight: "500",
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
	fab: {
		position: "absolute",
		bottom: 20,
		right: 20,
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#A1CEDC",
		justifyContent: "center",
		alignItems: "center",
		elevation: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
});
