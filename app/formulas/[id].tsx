import { getFormulaById, updateFormula } from "@/api/formulasApi";
import AnimatedListItem from "@/components/AnimatedListItem";
import SkeletonList from "@/components/SkeletonCard";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";
import { getColorSwatch } from "@/types/colors";
import type { Formula, Ingrediente } from "@/types/formulas";
import { showError, showSuccess } from "@/utils/toast";
import { calculateTotalWeight } from "@/utils/weight";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import {
	StyleSheet,
	View,
} from "react-native";
import {
	Appbar,
	Button,
	Card,
	Dialog,
	FAB,
	IconButton,
	Portal,
	SegmentedButtons,
	Surface,
	Text,
	TextInput,
	useTheme,
} from "react-native-paper";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";


// Función para capitalizar la primera letra de un string
function capitalizeFirstLetter(text: string) {
	if (!text) return "";
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(text: string) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function sanitizeFilename(text: string) {
	return text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-zA-Z0-9-_ ]/g, "")
		.trim()
		.replace(/\s+/g, "-");
}

// Tarjeta de ingrediente con entrada escalonada y feedback táctil (scale).
function IngredientCard({
	ingrediente,
	index,
	onPress,
}: {
	ingrediente: Ingrediente;
	index: number;
	onPress: () => void;
}) {
	const theme = useTheme();
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));
	const pressConfig = { damping: 18, stiffness: 260 } as const;

	const name = ingrediente.nombre || "Nombre no disponible";
	const quantity =
		ingrediente.cantidad !== null && ingrediente.cantidad !== undefined
			? ingrediente.cantidad
			: "-";
	const unit = ingrediente.unidad || "";

	return (
		<AnimatedListItem index={index}>
			<Animated.View style={animatedStyle}>
				<Card
					style={[
						styles.ingredientsCard,
						{
							backgroundColor: theme.colors.surface,
							borderColor: theme.colors.outlineVariant,
						},
					]}
					onPress={onPress}
					mode="elevated"
					elevation={0}
					onPressIn={() => {
						scale.value = withSpring(0.97, pressConfig);
					}}
					onPressOut={() => {
						scale.value = withSpring(1, pressConfig);
					}}
				>
					<Card.Content style={styles.ingredientsContent}>
						<View style={styles.nameSection}>
							<Text variant="titleMedium" style={[styles.ingredientsName, { color: theme.colors.onSurface }]}>
								{capitalizeFirstLetter(name)}
							</Text>
						</View>
						<View
							style={[
								styles.quantityContainer,
								{ backgroundColor: theme.colors.secondaryContainer },
							]}
						>
							<Text variant="titleMedium" style={[styles.quantityNumber, { color: theme.colors.onSecondaryContainer }]}>
								{quantity}
							</Text>
							<Text variant="labelMedium" style={[styles.quantityUnit, { color: theme.colors.onSecondaryContainer }]}>
								{unit}
							</Text>
						</View>
						<IconButton 
							icon="pencil-outline" 
							size={18} 
							style={{ margin: 0, marginLeft: 4 }}
							iconColor={theme.colors.onSurfaceVariant}
							accessibilityLabel={`Editar ${name}`}
							onPress={onPress}
						/>
					</Card.Content>
				</Card>
			</Animated.View>
		</AnimatedListItem>
	);
}

export default function FormulaDetailScreen() {
	const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
	const router = useRouter();
	const theme = useTheme();
	const [formula, setFormula] = useState<Formula | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedIngredientIndex, setSelectedIngredientIndex] = useState<number | null>(null);
	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [editedIngredient, setEditedIngredient] = useState<Ingrediente>({
		nombre: "",
		cantidad: 0,
		unidad: "gr",
	});
	const editedNameRef = useRef("");
	const editedCantidadRef = useRef("");
	const [addDialogVisible, setAddDialogVisible] = useState(false);
	const [newIngredientUnidad, setNewIngredientUnidad] = useState("gr");
	const newNameRef = useRef("");
	const newCantidadRef = useRef("");
	// Evita volver al spinner/skeleton (y desmontar el contenido) en recargas
	// posteriores a la primera carga.
	const hasLoadedRef = useRef(false);

	// Animaciones de entrada (header, contenido y FAB)
	const {
		animationsStarted,
		start: startEntranceAnimation,
		headerStyle: animatedHeaderStyle,
		contentStyle: animatedContentStyle,
		fabStyle: animatedFabStyle,
	} = useEntranceAnimation();

	useEffect(() => {
		if (id && typeof id === 'string') {
			fetchFormula();
		} else {
			setError("No se proporcionó ID de fórmula.");
			setIsLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	useEffect(() => {
		if (!animationsStarted) {
			startEntranceAnimation();
		}
	}, [animationsStarted, startEntranceAnimation]);

	const fetchFormula = async () => {
		if (!hasLoadedRef.current) {
			setIsLoading(true);
		}
		setError(null);
		try {
			const fetchedFormula = await getFormulaById(id as string, name);
			if (fetchedFormula) {
				setFormula(fetchedFormula);
				hasLoadedRef.current = true;
			} else {
				setError("No se encontró la fórmula.");
			}
		} catch (err) {
			setError("Error al cargar la fórmula.");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	// Persiste una nueva lista de ingredientes con actualización optimista:
	// se aplica localmente al instante y se revierte si la API falla.
	const persistIngredients = async (
		updatedIngredients: Ingrediente[],
		successTitle: string,
		successMessage: string,
		errorMessage: string,
	) => {
		if (!formula) return false;
		const previousFormula = formula;
		const updatedFormula = { ...formula, ingredientes: updatedIngredients };
		setFormula(updatedFormula);
		try {
			const success = await updateFormula(
				id as string,
				updatedFormula,
				formula.nombreColor,
			);
			if (!success) throw new Error("La API rechazó la actualización");
			showSuccess(successTitle, successMessage);
			return true;
		} catch (error) {
			console.error(errorMessage, error);
			setFormula(previousFormula);
			showError("Error", errorMessage);
			return false;
		}
	};

	const handleIngredientPress = (ingrediente: Ingrediente, index: number) => {
		setSelectedIngredientIndex(index);
		setEditedIngredient({ ...ingrediente });
		editedNameRef.current = ingrediente.nombre;
		editedCantidadRef.current = ingrediente.cantidad?.toString() || "";
		setEditDialogVisible(true);
	};

	const handleUpdateIngredient = async () => {
		if (selectedIngredientIndex === null || !formula) return;

		const parsedCantidad = Number.parseFloat(
			editedCantidadRef.current.replace(",", "."),
		);
		const updatedIngredients = [...(formula.ingredientes || [])];
		updatedIngredients[selectedIngredientIndex] = {
			...editedIngredient,
			nombre: editedNameRef.current.trim() || editedIngredient.nombre,
			cantidad: Number.isNaN(parsedCantidad) ? 0 : parsedCantidad,
		};

		setEditDialogVisible(false);
		await persistIngredients(
			updatedIngredients,
			"Ingrediente actualizado",
			"El ingrediente se actualizó correctamente",
			"Ocurrió un error al actualizar el ingrediente",
		);
	};

	const handleConfirmDelete = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setEditDialogVisible(false);
		setDeleteDialogVisible(true);
	};

	const handleDeleteIngredient = async () => {
		if (selectedIngredientIndex === null || !formula || !id) return;

		const updatedIngredients = formula.ingredientes.filter(
			(_, index) => index !== selectedIngredientIndex
		);

		setDeleteDialogVisible(false);
		await persistIngredients(
			updatedIngredients,
			"Ingrediente eliminado",
			"El ingrediente se eliminó correctamente",
			"Ocurrió un error al eliminar el ingrediente",
		);
	};

	const handleAddIngredient = () => {
		newNameRef.current = "";
		newCantidadRef.current = "";
		setNewIngredientUnidad("gr");
		setAddDialogVisible(true);
	};

	const handleShareFormula = async () => {
		if (!formula) return;
		try {
			const ingredientsRows = (formula.ingredientes || [])
				.map((ingrediente) => {
					const name = escapeHtml(capitalizeFirstLetter(ingrediente.nombre || "-"));
					const quantity = ingrediente.cantidad ?? "-";
					const unit = escapeHtml(ingrediente.unidad || "");
					return `
						<tr>
							<td>${name}</td>
							<td>${quantity}</td>
							<td>${unit}</td>
						</tr>
					`;
				})
				.join("");

			const totalWeight = calculateTotalWeight(formula.ingredientes || []).toFixed(2);
			const title = escapeHtml(capitalizeFirstLetter(formula.nombreColor));
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8" />
					<style>
						:root { color-scheme: light; }
						* { box-sizing: border-box; }
						@page { size: A4; margin: 0; }
						html { margin: 0; padding: 0; background: #f4f7fb; }
						body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 32px; background: #f4f7fb; color: #1f2a44; }
						.header { background: #ffffff; border-radius: 16px; padding: 20px 24px; box-shadow: 0 6px 18px rgba(31, 42, 68, 0.08); margin-bottom: 24px; }
						.title { font-size: 26px; font-weight: 700; margin: 0 0 6px; }
						.subtitle { margin: 0; font-size: 14px; color: #51607a; }
						.meta { margin-top: 12px; display: inline-flex; gap: 16px; font-size: 13px; color: #34425c; }
						table { width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 18px rgba(31, 42, 68, 0.08); }
						thead { background: #e9eff7; }
						th, td { text-align: left; padding: 12px 16px; font-size: 14px; }
						th { font-weight: 600; color: #2a3b58; }
						tr:nth-child(even) td { background: #f8fafd; }
						.footer { margin-top: 18px; font-size: 12px; color: #6b7a94; }
					</style>
				</head>
				<body>
					<div class="header">
						<h1 class="title">${title}</h1>
						<div class="meta">
							<span>Ingredientes: ${formula.ingredientes?.length || 0}</span>
							<span>Peso total: ${totalWeight} kg</span>
						</div>
					</div>
					<table>
						<thead>
							<tr>
								<th>Ingrediente</th>
								<th>Cantidad</th>
								<th>Unidad</th>
							</tr>
						</thead>
						<tbody>
							${ingredientsRows}
						</tbody>
					</table>
				</body>
				</html>
			`;

			// El tamaño A4 se fuerza vía CSS (@page { size: A4 }). No pasamos
			// width/height aquí porque provoca que el contenido no ocupe todo el
			// ancho de la página (margen blanco a la derecha).
			const { uri } = await Print.printToFileAsync({ html });
			const rawName = capitalizeFirstLetter(formula.nombreColor || "formula");
			const safeName = sanitizeFilename(rawName) || "Formula";
			const targetUri = `${FileSystem.cacheDirectory}${safeName}.pdf`;
			await FileSystem.copyAsync({ from: uri, to: targetUri });
			const canShare = await Sharing.isAvailableAsync();
			if (!canShare) {
				showError("Error", "No se puede compartir en este dispositivo.");
				return;
			}
			await Sharing.shareAsync(targetUri, {
				mimeType: "application/pdf",
				UTI: "com.adobe.pdf",
				dialogTitle: `Fórmula ${formula.nombreColor}`,
			});
		} catch (error) {
			console.error("Error al compartir la fórmula:", error);
			showError("Error", "No se pudo generar el archivo para compartir.");
		}
	};

	const handleSaveNewIngredient = async () => {
		if (!formula) return;
		const nombre = newNameRef.current.trim();
		const rawCantidad = newCantidadRef.current.trim().replace(",", ".");
		if (!nombre || !rawCantidad) {
			showError("Error", "Completa el nombre y la cantidad del ingrediente");
			return;
		}
		const ingredienteObj = {
			nombre,
			cantidad: Number(rawCantidad),
			unidad: newIngredientUnidad.trim() || "gr",
		};

		setAddDialogVisible(false);
		newNameRef.current = "";
		newCantidadRef.current = "";
		await persistIngredients(
			[...(formula.ingredientes || []), ingredienteObj],
			"Ingrediente añadido",
			"El ingrediente se añadió correctamente",
			"Ocurrió un error al añadir el ingrediente",
		);
	};

	if (isLoading) {
		return (
			<Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
				<Appbar.Header mode="center-aligned" style={[styles.appBar, { backgroundColor: theme.colors.background }]}>
					<Appbar.BackAction onPress={() => router.back()} accessibilityLabel="Volver" />
					<Appbar.Content title={capitalizeFirstLetter(name ?? "")} titleStyle={styles.appBarTitle} />
				</Appbar.Header>
				<SkeletonList count={6} />
			</Surface>
		);
	}

	if (error) {
		return (
			<Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
				<Card style={styles.errorCard}>
					<Card.Content>
						<Text style={styles.errorText}>{error}</Text>
						<Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
							Volver
						</Button>
					</Card.Content>
				</Card>
			</Surface>
		);
	}

	if (!formula) {
		return (
			<Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
				<Card style={styles.errorCard}>
					<Card.Content>
						<Text>No se encontró la fórmula.</Text>
						<Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
							Volver
						</Button>
					</Card.Content>
				</Card>
			</Surface>
		);
	}

	return (
		<Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<Animated.View style={animatedHeaderStyle}>
				<Appbar.Header mode="center-aligned" style={[styles.appBar, { backgroundColor: theme.colors.background }]}>
					<Appbar.BackAction onPress={() => router.back()} accessibilityLabel="Volver" />
					<Appbar.Content title={capitalizeFirstLetter(formula.nombreColor)} titleStyle={styles.appBarTitle} />
					<Appbar.Action icon="share-variant" onPress={handleShareFormula} accessibilityLabel="Compartir fórmula en PDF" />
				</Appbar.Header>
			</Animated.View>

			<Animated.ScrollView 
				style={[styles.content, animatedContentStyle]}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<Card
					style={[
						styles.formulaCard,
						{
							backgroundColor: theme.colors.surface,
							borderColor: theme.colors.outlineVariant,
						},
					]}
					mode="elevated"
					elevation={0}
				>
					<Card.Content>
						<View style={styles.headerRow}>
							<View
								style={[
									styles.colorSwatch,
									{
										backgroundColor: getColorSwatch(formula.nombreColor),
										borderColor: theme.colors.outlineVariant,
									},
								]}
							/>
							<View style={styles.headerLeft}>
								<Text variant="titleLarge" style={styles.sectionTitle}>
									Ingredientes
								</Text>
								<Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
									{formula.ingredientes?.length || 0} componentes en la mezcla
								</Text>
							</View>
							<View style={styles.headerRight}>
								<View
									style={[
										styles.weightContainer,
										{ backgroundColor: theme.colors.primaryContainer },
									]}
								>
									<IconButton 
										icon="scale" 
										size={18} 
										iconColor={theme.colors.onPrimaryContainer}
										style={styles.weightIcon}
									/>
									<Text variant="titleMedium" style={[styles.weightText, { color: theme.colors.onPrimaryContainer }]}>
										{calculateTotalWeight(formula.ingredientes || []).toFixed(2)} kg
									</Text>
								</View>
							</View>
						</View>
					</Card.Content>
				</Card>

				{formula.ingredientes && formula.ingredientes.length > 0 ? (
					formula.ingredientes.map((ingrediente: Ingrediente, index: number) => (
						<IngredientCard
							key={`${formula?.id || "formula"}-${ingrediente.nombre}-${index}`}
							ingrediente={ingrediente}
							index={index}
							onPress={() => handleIngredientPress(ingrediente, index)}
						/>
					))
				) : (
					<Card style={styles.emptyCard}>
						<Card.Content style={styles.emptyContent}>
							<Text variant="titleMedium" style={styles.emptyTitle}>
								No hay ingredientes
							</Text>
							<Text variant="bodyMedium" style={styles.emptySubtitle}>
								Agrega ingredientes para esta fórmula
							</Text>
						</Card.Content>
					</Card>
				)}
			</Animated.ScrollView>

			{/* FAB para agregar ingrediente */}
			<Animated.View style={[styles.fabContainer, animatedFabStyle]}>
				<FAB
					icon="plus"
					onPress={handleAddIngredient}
					accessibilityLabel="Agregar ingrediente"
				/>
			</Animated.View>

			{/* Dialog para editar ingrediente */}
			<Portal>
				<Dialog
					visible={editDialogVisible}
					onDismiss={() => setEditDialogVisible(false)}
					style={[styles.dialogContent, { backgroundColor: theme.colors.surface }]}
				>
					<View style={styles.dialogHeaderRow}>
						<Dialog.Title style={styles.dialogTitleInline}>
							Editar Ingrediente
						</Dialog.Title>
						<IconButton
							icon="trash-can-outline"
							iconColor={theme.colors.error}
							size={22}
							onPress={handleConfirmDelete}
							accessibilityLabel="Eliminar ingrediente"
						/>
					</View>
					<Dialog.Content>
						<TextInput
							label="Nombre"
							mode="outlined"
							outlineStyle={styles.inputOutline}
							defaultValue={editedIngredient.nombre || undefined}
							onChangeText={(text) => {
								editedNameRef.current = text;
							}}
							style={styles.dialogInput}
						/>
						<TextInput
							label="Cantidad"
							mode="outlined"
							outlineStyle={styles.inputOutline}
							defaultValue={editedIngredient.cantidad ? editedIngredient.cantidad.toString() : undefined}
							onChangeText={(text) => {
								editedCantidadRef.current = text;
							}}
							keyboardType="numeric"
							style={styles.dialogInput}
						/>
						<Text variant="labelMedium" style={styles.unitLabel}>Unidad de medida</Text>
						<SegmentedButtons
							value={editedIngredient.unidad || "gr"}
							onValueChange={(value) =>
								setEditedIngredient({ ...editedIngredient, unidad: value })
							}
							buttons={[
								{ value: "gr", label: "gr" },
								{ value: "kg", label: "kg" },
								{ value: "L", label: "L" },
							]}
							style={styles.segmentedButtons}
						/>
					</Dialog.Content>
					<Dialog.Actions style={styles.dialogActions}>
						<Button mode="text" onPress={() => setEditDialogVisible(false)}>
							Cancelar
						</Button>
						<Button
							mode="contained"
							icon="check"
							style={styles.dialogPrimaryBtn}
							onPress={handleUpdateIngredient}
						>
							Guardar
						</Button>
					</Dialog.Actions>
				</Dialog>

				{/* Dialog para confirmar eliminación */}
				<Dialog
					visible={deleteDialogVisible}
					onDismiss={() => setDeleteDialogVisible(false)}
					style={[styles.dialogContent, { backgroundColor: theme.colors.surface }]}
				>
					<Dialog.Icon icon="trash-can-outline" color={theme.colors.error} size={32} />
					<Dialog.Title style={styles.dialogTitleCentered}>
						Eliminar ingrediente
					</Dialog.Title>
					<Dialog.Content>
						<View
							style={[
								styles.dialogPreviewChip,
								{
									backgroundColor: theme.colors.elevation.level2,
									borderColor: theme.colors.outlineVariant,
								},
							]}
						>
							<Text variant="titleMedium" style={{ fontWeight: "700" }}>
								{capitalizeFirstLetter(editedIngredient.nombre)}
							</Text>
							<Text
								variant="bodyMedium"
								style={{ marginLeft: 8, color: theme.colors.primary, fontWeight: "600" }}
							>
								({editedIngredient.cantidad} {editedIngredient.unidad})
							</Text>
						</View>
						<Text
							variant="bodyMedium"
							style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}
						>
							¿Seguro que deseas quitar este ingrediente de la fórmula?
						</Text>
					</Dialog.Content>
					<Dialog.Actions style={styles.dialogActions}>
						<Button mode="text" onPress={() => setDeleteDialogVisible(false)}>
							Cancelar
						</Button>
						<Button
							mode="contained"
							icon="trash-can-outline"
							buttonColor={theme.colors.error}
							textColor={theme.colors.onError}
							style={styles.dialogPrimaryBtn}
							onPress={handleDeleteIngredient}
						>
							Eliminar
						</Button>
					</Dialog.Actions>
				</Dialog>

				{/* Dialog para añadir ingrediente */}
				<Dialog
					visible={addDialogVisible}
					onDismiss={() => setAddDialogVisible(false)}
					style={[styles.dialogContent, { backgroundColor: theme.colors.surface }]}
				>
					<Dialog.Title style={{ fontWeight: "700" }}>Nuevo Ingrediente</Dialog.Title>
					<Dialog.Content>
						<TextInput
							label="Nombre del ingrediente"
							mode="outlined"
							outlineStyle={styles.inputOutline}
							onChangeText={(text) => {
								newNameRef.current = text;
							}}
							style={styles.dialogInput}
						/>
						<TextInput
							label="Cantidad"
							mode="outlined"
							outlineStyle={styles.inputOutline}
							onChangeText={(text) => {
								newCantidadRef.current = text;
							}}
							keyboardType="numeric"
							style={styles.dialogInput}
						/>
						<Text variant="labelMedium" style={styles.unitLabel}>Unidad de medida</Text>
						<SegmentedButtons
							value={newIngredientUnidad}
							onValueChange={setNewIngredientUnidad}
							buttons={[
								{ value: "gr", label: "gr" },
								{ value: "kg", label: "kg" },
								{ value: "L", label: "L" },
							]}
							style={styles.segmentedButtons}
						/>
					</Dialog.Content>
					<Dialog.Actions style={styles.dialogActions}>
						<Button mode="text" onPress={() => setAddDialogVisible(false)}>
							Cancelar
						</Button>
						<Button
							mode="contained"
							icon="plus"
							style={styles.dialogPrimaryBtn}
							onPress={handleSaveNewIngredient}
						>
							Añadir
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
		</Surface>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: Spacing.xl,
	},
	loadingText: {
		marginTop: Spacing.md,
	},
	appBar: {
		elevation: 0,
	},
	appBarTitle: {
		fontWeight: 'bold',
	},
	content: {
		padding: 16,
	},
	scrollContent: {
		paddingBottom: 88, // Múltiplo de 4 + espacio para FAB
	},
	errorCard: {
		margin: Spacing.md,
	},
	errorText: {
		marginBottom: Spacing.sm,
		textAlign: 'center',
	},
	backButton: {
		marginTop: Spacing.sm,
	},
	formulaCard: {
		marginBottom: 16,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
	},
	colorSwatch: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1,
		marginRight: 12,
	},
	sectionTitle: {
		fontWeight: "700",
		marginBottom: 2,
	},
	headerSubtitle: {},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerLeft: {
		flex: 1,
	},
	headerRight: {
		alignItems: 'flex-end',
	},
	weightContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: BorderRadius.xl,
	},
	weightIcon: {
		margin: 0,
		width: 22,
		height: 22,
		marginRight: 4,
	},
	weightText: {
		fontWeight: '700',
	},
	ingredientsList: {
		marginBottom: Spacing.sm,
	},
	ingredientsCard: {
		marginBottom: 10,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
	},
	ingredientsContent: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	ingredientsInfo: {
		flex: 1,
	},
	ingredientRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	nameSection: {
		flex: 1,
		justifyContent: 'center',
		marginRight: Spacing.sm,
	},
	quantitySection: {
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	buttonSection: {
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	ingredientsName: {
		// Texto del nombre del ingrediente
		fontWeight: '600',
	},
	ingredientsQuantity: {
		// Se aplicará color del tema en el componente
		marginTop: Spacing.sm,
	},
	quantityContainer: {
		flexDirection: 'row',
		alignItems: 'baseline',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: BorderRadius.xl,
	},
	quantityNumber: {
		fontWeight: '700',
		marginRight: 4,
	},
	quantityUnit: {
		// Color se aplicará desde el tema
	},
	totalCard: {
		marginTop: Spacing.sm,
		marginBottom: Spacing.md,
	},
	totalContent: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: Spacing.sm,
	},
	emptyCard: {
		margin: Spacing.md,
		minHeight: 150,
	},
	emptyContent: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: Spacing.xl,
	},
	emptyTitle: {
		textAlign: 'center',
		marginBottom: Spacing.sm,
	},
	emptySubtitle: {
		textAlign: 'center',
	},
	fabContainer: {
		position: "absolute",
		right: Spacing.md,
		bottom: Spacing.md,
	},
	dialogInput: {
		marginBottom: Spacing.sm,
	},
	inputOutline: {
		borderRadius: BorderRadius.md,
	},
	unitLabel: {
		marginBottom: Spacing.sm,
		marginTop: Spacing.xs,
	},
	segmentedButtons: {
		marginBottom: Spacing.xs,
	},
	dialogContent: {
		borderRadius: BorderRadius.xl,
	},
	dialogHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingRight: Spacing.sm,
	},
	dialogTitleInline: {
		fontWeight: "700",
		flex: 1,
	},
	dialogTitleCentered: {
		fontWeight: "700",
		textAlign: "center",
	},
	dialogPreviewChip: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: BorderRadius.md,
		borderWidth: 1,
		marginBottom: Spacing.md,
	},
	dialogActions: {
		paddingHorizontal: Spacing.lg,
		paddingBottom: Spacing.md,
		gap: Spacing.xs,
	},
	dialogPrimaryBtn: {
		borderRadius: BorderRadius.lg,
	},
});
