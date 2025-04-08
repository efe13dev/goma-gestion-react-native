import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Image, TouchableOpacity, Alert, Animated, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getFormulas, deleteFormula } from "@/api/formulasApi";
import type { Formula } from "@/data/formulas";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";

export default function FormulasScreen() {
	// Estado para las fórmulas
	const [formulas, setFormulas] = useState<Formula[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	
	// Referencias a los componentes Swipeable para cerrarlos cuando sea necesario
	const swipeableRefs = useRef<Array<Swipeable | null>>([]);

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

	// Función para manejar la eliminación de una fórmula
	const handleEliminarFormula = (id: string, nombre: string) => {
		Alert.alert(
			"Confirmar eliminación",
			`¿Estás seguro de que quieres eliminar la fórmula "${nombre}"?`,
			[
				{
					text: "Cancelar",
					style: "cancel",
					onPress: () => {
						// Cerrar el swipeable después de cancelar
						closeAllSwipeables();
					}
				},
				{
					text: "Eliminar",
					style: "destructive",
					onPress: async () => {
						setIsLoading(true);
						
						try {
							const eliminado = await deleteFormula(id);
							if (eliminado) {
								// Recargar las fórmulas después de eliminar
								await loadFormulas();
								Alert.alert("Éxito", `Fórmula "${nombre}" eliminada correctamente`);
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

	// Función para cerrar todos los swipeables
	const closeAllSwipeables = () => {
		for (const ref of swipeableRefs.current) {
			if (ref) ref.close();
		}
	};

	// Renderizar el lado derecho del swipeable (acción de eliminar)
	const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, id: string, nombre: string) => {
		const trans = dragX.interpolate({
			inputRange: [-101, -100, -50, 0],
			outputRange: [0, 0, 0, 100],
			extrapolate: 'clamp',
		});
		
		const opacity = dragX.interpolate({
			inputRange: [-100, -50],
			outputRange: [1, 0.5],
			extrapolate: 'clamp',
		});
		
		return (
			<Animated.View 
				style={[
					styles.deleteAction,
					{
						transform: [{ translateX: trans }],
						opacity: opacity,
					}
				]}
			>
				<TouchableOpacity
					style={styles.deleteActionContent}
					onPress={() => handleEliminarFormula(id, nombre)}
				>
					<MaterialIcons name="delete-outline" size={24} color="white" />
					<ThemedText style={styles.deleteActionText}>Eliminar</ThemedText>
				</TouchableOpacity>
			</Animated.View>
		);
	};

	// Función para guardar la referencia del swipeable
	const saveSwipeableRef = (ref: Swipeable | null, index: number) => {
		if (swipeableRefs.current.length <= index) {
			swipeableRefs.current = [...swipeableRefs.current, ...Array(index - swipeableRefs.current.length + 1).fill(null)];
		}
		swipeableRefs.current[index] = ref;
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
						formulas.map((formula, index) => (
							<Swipeable
								key={formula.id}
								ref={(ref) => saveSwipeableRef(ref, index)}
								renderRightActions={(progress, dragX) => 
									renderRightActions(progress, dragX, formula.id, formula.nombreColor)
								}
								friction={2}
								rightThreshold={100}
								overshootRight={false}
								containerStyle={styles.swipeableContainer}
								onSwipeableOpen={(direction) => {
									if (direction === 'right') return;
									// Si se abre completamente, mostrar el diálogo de confirmación
									handleEliminarFormula(formula.id, formula.nombreColor);
								}}
							>
								<TouchableOpacity
									style={styles.formulaCard}
									onPress={() => {
										// Cerrar todos los swipeables abiertos
										closeAllSwipeables();
										// Navegar a la pantalla de detalles
										router.push({
											pathname: "/formula/[id]",
											params: { id: formula.id },
										});
									}}
								>
									<ThemedText style={styles.colorName}>
										{formula.nombreColor}
									</ThemedText>
								</TouchableOpacity>
							</Swipeable>
						))
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
		gap: 12,
	},
	swipeableContainer: {
		marginBottom: 8,
	},
	formulaCard: {
		backgroundColor: "rgba(161, 206, 220, 0.1)",
		borderRadius: 12,
		padding: 16,
		alignItems: "flex-start",
		width: "100%",
	},
	colorName: {
		fontSize: 20,
		fontWeight: "500",
	},
	deleteAction: {
		backgroundColor: "#FF6B6B",
		justifyContent: "center",
		alignItems: "center",
		width: 100,
		borderRadius: 12,
		marginLeft: 8,
	},
	deleteActionContent: {
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		height: "100%",
	},
	deleteActionText: {
		color: "white",
		fontSize: 16,
		marginLeft: 8,
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
