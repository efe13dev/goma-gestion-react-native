import React, { useState, useRef } from 'react';
import { StyleSheet, Image, TouchableOpacity, Alert, Animated } from "react-native";
import { Link, router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { formulas, eliminarFormula } from "@/data/formulas";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";

export default function FormulasScreen() {
	// Estado para forzar la actualización del componente cuando se elimina una fórmula
	const [, setForceUpdate] = useState(0);
	
	// Referencias a los componentes Swipeable para cerrarlos cuando sea necesario
	const swipeableRefs = useRef<Array<Swipeable | null>>([]);

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
						for (const ref of swipeableRefs.current) {
							if (ref) ref.close();
						}
					}
				},
				{
					text: "Eliminar",
					style: "destructive",
					onPress: () => {
						const eliminado = eliminarFormula(id);
						if (eliminado) {
							// Forzar la actualización del componente
							setForceUpdate(prev => prev + 1);
						} else {
							Alert.alert("Error", "No se pudo eliminar la fórmula");
						}
					}
				}
			]
		);
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
					{formulas.map((formula, index) => (
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
									for (const ref of swipeableRefs.current) {
										if (ref) {
											ref.close();
										}
									}
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
		fontWeight: "600",
		marginTop: 4,
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
