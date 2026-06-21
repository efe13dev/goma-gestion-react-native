import { addFormula, getFormulaNames } from "@/api/formulasApi";
import AnimatedListItem from "@/components/AnimatedListItem";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { showError, showSuccess } from "@/utils/toast";
import { calculateTotalWeight } from "@/utils/weight";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View,
} from "react-native";
import {
    Appbar,
    Button,
    Card,
    Divider,
    IconButton,
    SegmentedButtons,
    Surface,
    Text,
    TextInput,
    useTheme
} from "react-native-paper";

interface IngredienteDraft {
    id: string;
    nombre: string;
    cantidad: string;
    unidad: string;
}

// Opciones de unidad disponibles
const unidades = ["gr", "kg", "L"];

const parseCantidad = (value: string) => {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
};

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export default function NuevaFormulaScreen() {
    const [nombreColor, setNombreColor] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [ingredientes, setIngredientes] = useState<IngredienteDraft[]>([]);
    const [nombreDraft, setNombreDraft] = useState("");
    const [cantidadDraft, setCantidadDraft] = useState("");
    // La unidad se conserva entre ingredientes: lo habitual es añadir varios
    // con la misma unidad seguidos.
    const [unidadDraft, setUnidadDraft] = useState("gr");
    const [editIngredientId, setEditIngredientId] = useState<string | null>(null);
    const [ingredientAttempted, setIngredientAttempted] = useState(false);
    const ingredientNameRef = useRef<any>(null);
    const ingredientCantidadRef = useRef<any>(null);
    const listRef = useRef<FlatList<IngredienteDraft> | null>(null);
    const router = useRouter();
    const theme = useTheme();
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerBackTitle: "Volver",
            header: () => (
                <Appbar.Header elevated mode="center-aligned">
                    <Appbar.BackAction onPress={() => router.back()} accessibilityLabel="Volver" />
                    <Appbar.Content title="Nueva Fórmula" />
                </Appbar.Header>
            ),
        });
    }, [navigation, router]);

    const parsedCantidad = parseCantidad(cantidadDraft.trim());
    const isCantidadValid = !!parsedCantidad && parsedCantidad > 0;
    const isNombreValid = !!nombreDraft.trim();
    const canSubmitIngredient = isNombreValid && isCantidadValid;

    const resetIngredientForm = () => {
        setEditIngredientId(null);
        setIngredientAttempted(false);
        setNombreDraft("");
        setCantidadDraft("");
        // La unidad se mantiene a propósito para entrada en ráfaga.
    };

    const handleAddIngredient = () => {
        setIngredientAttempted(true);
        if (!isNombreValid || !isCantidadValid) {
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (editIngredientId) {
            setIngredientes((prev) =>
                prev.map((ing) =>
                    ing.id === editIngredientId
                        ? {
                              ...ing,
                              nombre: nombreDraft.trim(),
                              cantidad: cantidadDraft,
                              unidad: unidadDraft,
                          }
                        : ing,
                ),
            );
        } else {
            setIngredientes((prev) => [
                ...prev,
                {
                    id: uid(),
                    nombre: nombreDraft.trim(),
                    cantidad: cantidadDraft,
                    unidad: unidadDraft,
                },
            ]);
            // Mostrar el ingrediente recién añadido al final de la lista.
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
        resetIngredientForm();
        // Mantener el teclado abierto y volver al nombre para encadenar
        // la entrada del siguiente ingrediente sin tocar nada más.
        setTimeout(() => ingredientNameRef.current?.focus?.(), 0);
    };

    const handleRemoveIngredient = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (id === editIngredientId) {
            resetIngredientForm();
        }
        setIngredientes((prev) => prev.filter((ing) => ing.id !== id));
    };

    const handleSelectIngredient = (ing: IngredienteDraft) => {
        setEditIngredientId(ing.id);
        setIngredientAttempted(false);
        setNombreDraft(ing.nombre);
        setCantidadDraft(ing.cantidad);
        setUnidadDraft(ing.unidad);
        setTimeout(() => ingredientNameRef.current?.focus?.(), 0);
    };

    // Peso total en vivo de la fórmula en construcción.
    const totalKg = calculateTotalWeight(
        ingredientes.map((ing) => ({
            nombre: ing.nombre,
            cantidad: parseCantidad(ing.cantidad) ?? 0,
            unidad: ing.unidad,
        })),
    );

    const handleAddFormula = async () => {
        if (!nombreColor.trim() || ingredientes.length === 0) {
            showError(
                "Error",
                "Completa el nombre del color y agrega al menos un ingrediente",
            );
            return;
        }

        // Validar si ya existe una fórmula con el mismo nombre (ignorando mayúsculas y espacios)
        setIsLoading(true);
        try {
            const formulasExistentes = await getFormulaNames();
            const existe = formulasExistentes.some(
                (f) =>
                    f.name.trim().toLowerCase() ===
                    nombreColor.trim().toLowerCase(),
            );
            if (existe) {
                showError("Error", `La fórmula '${nombreColor}' ya existe.`);
                setIsLoading(false);
                return;
            }

            await addFormula({
                id: uid(),
                nombreColor,
                ingredientes: ingredientes.map(({ id, cantidad, ...rest }) => ({
                    ...rest,
                    cantidad: Number(cantidad.replace(",", ".")),
                })),
            });
            showSuccess("Listo", "Fórmula añadida correctamente.");
            router.back();
        } catch {
            showError("Error", "No se pudo añadir la fórmula.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderIngredient = ({
        item,
        index,
    }: {
        item: IngredienteDraft;
        index: number;
    }) => {
        const isEditing = item.id === editIngredientId;
        return (
            <AnimatedListItem index={index}>
                <Card
                    style={[
                        styles.ingredientCard,
                        isEditing && {
                            borderColor: theme.colors.primary,
                            borderWidth: 2,
                        },
                    ]}
                    mode="outlined"
                    onPress={() => handleSelectIngredient(item)}
                >
                    <Card.Content style={styles.ingredientContent}>
                        <View style={styles.ingredientInfo}>
                            <Text variant="bodyLarge" numberOfLines={1}>
                                {item.nombre}
                            </Text>
                        </View>
                        <Text
                            variant="titleMedium"
                            style={{ color: theme.colors.primary, marginRight: Spacing.xs }}
                        >
                            {item.cantidad}
                        </Text>
                        <Text
                            variant="bodyMedium"
                            style={{ color: theme.colors.onSurfaceVariant }}
                        >
                            {item.unidad}
                        </Text>
                        <IconButton
                            icon="delete"
                            size={20}
                            iconColor={theme.colors.error}
                            onPress={() => handleRemoveIngredient(item.id)}
                            accessibilityLabel={`Eliminar ${item.nombre}`}
                        />
                    </Card.Content>
                </Card>
            </AnimatedListItem>
        );
    };

    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "android" ? 56 : 0}
                style={{ flex: 1 }}
            >
                {/* Zona fija superior: nombre de la fórmula + formulario de
                    ingrediente. No se desplaza al crecer la lista, lo que
                    permite añadir ingredientes en ráfaga sin hacer scroll. */}
                <View style={styles.fixedTop}>
                    <TextInput
                        label="Nombre del color"
                        value={nombreColor}
                        onChangeText={setNombreColor}
                        mode="outlined"
                        placeholder="Ejemplo: Azul cielo"
                        style={styles.input}
                    />

                    <Surface
                        style={[
                            styles.addIngredientSection,
                            { backgroundColor: theme.colors.elevation.level1 },
                        ]}
                        elevation={1}
                    >
                        <View style={styles.formRow}>
                            <TextInput
                                label="Ingrediente"
                                ref={ingredientNameRef}
                                value={nombreDraft}
                                onChangeText={setNombreDraft}
                                mode="outlined"
                                dense
                                style={[styles.input, { flex: 1.6, marginRight: Spacing.sm }]}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => ingredientCantidadRef.current?.focus?.()}
                                error={ingredientAttempted && !isNombreValid}
                            />
                            <TextInput
                                label="Cantidad"
                                ref={ingredientCantidadRef}
                                value={cantidadDraft}
                                onChangeText={setCantidadDraft}
                                mode="outlined"
                                dense
                                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                                inputMode="decimal"
                                autoCorrect={false}
                                autoCapitalize="none"
                                returnKeyType="done"
                                blurOnSubmit={false}
                                onSubmitEditing={handleAddIngredient}
                                style={[styles.input, { flex: 1 }]}
                                error={ingredientAttempted && !isCantidadValid}
                            />
                        </View>
                        {ingredientAttempted && !canSubmitIngredient ? (
                            <Text variant="bodySmall" style={[styles.inlineError, { color: theme.colors.error }]}>
                                {!isNombreValid
                                    ? "Escribe el nombre del ingrediente."
                                    : "Ingresa una cantidad válida mayor que cero."}
                            </Text>
                        ) : null}

                        <View style={styles.formRow}>
                            <SegmentedButtons
                                value={unidadDraft}
                                onValueChange={setUnidadDraft}
                                density="small"
                                buttons={unidades.map((unidad) => ({
                                    value: unidad,
                                    label: unidad,
                                }))}
                                style={{ flex: 1, marginRight: Spacing.sm }}
                            />
                            <Button
                                mode="contained-tonal"
                                onPress={handleAddIngredient}
                                icon={editIngredientId ? "check" : "plus"}
                                disabled={!canSubmitIngredient}
                                compact
                            >
                                {editIngredientId ? "Actualizar" : "Agregar"}
                            </Button>
                        </View>

                        {editIngredientId ? (
                            <View style={styles.editRow}>
                                <Text variant="bodySmall" style={[styles.editLabel, { color: theme.colors.primary }]}>
                                    Editando ingrediente
                                </Text>
                                <Button
                                    mode="text"
                                    compact
                                    onPress={() => {
                                        resetIngredientForm();
                                        setTimeout(() => ingredientNameRef.current?.focus?.(), 0);
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </View>
                        ) : null}
                    </Surface>
                </View>

                {/* Lista de ingredientes: crece hacia abajo con su propio scroll */}
                <FlatList
                    ref={listRef}
                    data={ingredientes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderIngredient}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text
                            variant="bodyMedium"
                            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
                        >
                            Agrega al menos un ingrediente
                        </Text>
                    }
                />

                {/* Barra inferior fija: resumen + guardar */}
                <Divider />
                <View style={styles.bottomBar}>
                    <View style={styles.summary}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {ingredientes.length} ingrediente{ingredientes.length === 1 ? "" : "s"}
                        </Text>
                        <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: "bold" }}>
                            {totalKg.toFixed(2)} kg
                        </Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={handleAddFormula}
                        loading={isLoading}
                        disabled={isLoading || !nombreColor.trim() || ingredientes.length === 0}
                        style={styles.submitButton}
                        contentStyle={styles.submitButtonContent}
                    >
                        {isLoading ? "Añadiendo..." : "Añadir Fórmula"}
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fixedTop: {
        padding: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    input: {
        marginBottom: Spacing.sm,
    },
    addIngredientSection: {
        borderRadius: BorderRadius.lg, // MD3 para elementos destacados
        padding: Spacing.md,
        paddingBottom: Spacing.sm,
        marginTop: Spacing.xs,
    },
    formRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    inlineError: {
        marginBottom: Spacing.sm,
    },
    editRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: Spacing.xs,
    },
    editLabel: {
        fontWeight: "600",
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    emptyText: {
        fontStyle: "italic",
        textAlign: "center",
        marginTop: Spacing.lg,
    },
    ingredientCard: {
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.md, // MD3 standard para cards
    },
    ingredientContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Spacing.xs,
        paddingRight: 0,
    },
    ingredientInfo: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    bottomBar: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        gap: Spacing.md,
    },
    summary: {
        flex: 1,
    },
    submitButton: {
        borderRadius: BorderRadius.lg, // MD3 para botones destacados
    },
    submitButtonContent: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
    },
});
