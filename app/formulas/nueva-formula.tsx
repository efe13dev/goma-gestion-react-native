import { addFormula, getFormulas } from "@/api/formulasApi";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    Appbar,
    Button,
    Card,
    IconButton,
    SegmentedButtons,
    Surface,
    Text,
    TextInput,
    useTheme
} from "react-native-paper";
import uuid from "react-native-uuid";

export default function NuevaFormulaScreen() {
    const [nombreColor, setNombreColor] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView | null>(null);
    const addIngredientSectionYRef = useRef(0);
    const cantidadRowYRef = useRef(0);
    const [ingredientes, setIngredientes] = useState<
        {
            id: string;
            nombre: string;
            cantidad: string;
            unidad: string;
        }[]
    >([]);
    const [nuevoIngrediente, setNuevoIngrediente] = useState({
        id: "",
        nombre: "",
        cantidad: "",
        unidad: "gr",
    });
    const [editIngredientId, setEditIngredientId] = useState<string | null>(null);
    const [ingredientAttempted, setIngredientAttempted] = useState(false);
    const [cantidadDraft, setCantidadDraft] = useState("");
    const ingredientNameRef = useRef<any>(null);
    const ingredientCantidadRef = useRef<any>(null);
    const router = useRouter();
    const theme = useTheme();
    const navigation = useNavigation();

    // Opciones de unidad disponibles
    const unidades = ["gr", "kg", "L"];

    useEffect(() => {
        navigation.setOptions({
            headerBackTitle: "Volver",
            header: () => (
                <Appbar.Header elevated mode="center-aligned">
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title="Nueva Fórmula" />
                </Appbar.Header>
            ),
        });
    }, [navigation, router]);

    const handleAddIngredient = () => {
        setIngredientAttempted(true);
        if (!nuevoIngrediente.nombre.trim() || !cantidadDraft.trim()) {
            showError("Error", "Completa el nombre y la cantidad del ingrediente");
            return;
        }
        const parsedCantidad = parseCantidad(cantidadDraft);
        if (!parsedCantidad || parsedCantidad <= 0) {
            showError("Error", "La cantidad debe ser un número mayor que cero");
            return;
        }
        if (editIngredientId) {
            setIngredientes((prev) =>
                prev.map((ing) =>
                    ing.id === editIngredientId
                        ? {
                              ...ing,
                              nombre: nuevoIngrediente.nombre,
                              cantidad: cantidadDraft,
                              unidad: nuevoIngrediente.unidad,
                          }
                        : ing,
                ),
            );
            setEditIngredientId(null);
        } else {
            const ingredienteConId = {
                ...nuevoIngrediente,
                cantidad: cantidadDraft,
                id: uuid.v4().toString(),
            };
            setIngredientes([...ingredientes, ingredienteConId]);
        }
        setIngredientAttempted(false);
        setNuevoIngrediente({ id: "", nombre: "", cantidad: "", unidad: "gr" });
        setCantidadDraft("");
        setTimeout(() => ingredientNameRef.current?.focus?.(), 0);
    };

    const handleRemoveIngredient = useCallback(
        (index: number) => {
            setIngredientes((prev) => {
                const toRemove = prev[index];
                if (toRemove && toRemove.id === editIngredientId) {
                    setEditIngredientId(null);
                    setNuevoIngrediente({ id: "", nombre: "", cantidad: "", unidad: "gr" });
                    setCantidadDraft("");
                }
                return prev.filter((_, i) => i !== index);
            });
        },
        [editIngredientId],
    );

    const handleSelectIngredient = useCallback(
        (ing: { id: string; nombre: string; cantidad: string; unidad: string }) => {
            setEditIngredientId(ing.id);
            setIngredientAttempted(false);
            setNuevoIngrediente({
                id: ing.id,
                nombre: ing.nombre,
                cantidad: ing.cantidad,
                unidad: ing.unidad,
            });
            setCantidadDraft(ing.cantidad);
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, addIngredientSectionYRef.current - 24),
                animated: true,
            });
            setTimeout(() => ingredientNameRef.current?.focus?.(), 0);
        },
        [],
    );

    const ingredientCards = useMemo(
        () =>
            ingredientes.map((ing, index) => (
                <Card
                    key={ing.id}
                    style={styles.ingredientCard}
                    mode="outlined"
                    onPress={() => handleSelectIngredient(ing)}
                >
                    <Card.Content style={styles.ingredientContent}>
                        <View style={styles.ingredientInfo}>
                            <Text variant="bodyLarge" style={styles.ingredientName}>
                                {ing.nombre}
                            </Text>
                            <Text
                                variant="bodyMedium"
                                style={[styles.ingredientQuantity, { color: theme.colors.onSurfaceVariant }]}
                            >
                                {ing.cantidad} {ing.unidad}
                            </Text>
                        </View>
                        <IconButton
                            icon="delete"
                            size={20}
                            iconColor={theme.colors.error}
                            onPress={() => handleRemoveIngredient(index)}
                        />
                    </Card.Content>
                </Card>
            )),
        [handleRemoveIngredient, handleSelectIngredient, ingredientes, theme.colors.error, theme.colors.onSurfaceVariant],
    );

    const handleChangeNuevo = (field: string, value: string) => {
        setNuevoIngrediente((prev) => ({ ...prev, [field]: value }));
    };

    const parseCantidad = (value: string) => {
        const normalized = value.replace(",", ".");
        const parsed = Number(normalized);
        return Number.isNaN(parsed) ? null : parsed;
    };

    const parsedCantidad = parseCantidad(cantidadDraft.trim());
    const isCantidadValid = !!parsedCantidad && parsedCantidad > 0;
    const isNombreValid = !!nuevoIngrediente.nombre.trim();
    const canSubmitIngredient = isNombreValid && isCantidadValid;

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
            const formulasExistentes = await getFormulas();
            const existe = formulasExistentes.some(
                (f) =>
                    f.nombreColor.trim().toLowerCase() ===
                    nombreColor.trim().toLowerCase(),
            );
            if (existe) {
                showError("Error", `La fórmula '${nombreColor}' ya existe.`);
                setIsLoading(false);
                return;
            }

            await addFormula({
                id: uuid.v4().toString(),
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

    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "android" ? 56 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 180 }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <Card style={styles.formCard}>
                            <Card.Content>
                                <Text variant="titleLarge" style={styles.sectionTitle}>
                                    Información de la Fórmula
                                </Text>

                                <TextInput
                                    label="Nombre del color"
                                    defaultValue={nombreColor}
                                    onChangeText={setNombreColor}
                                    mode="outlined"
                                    placeholder="Ejemplo: Azul cielo"
                                    style={styles.input}
                                />

                                <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 24 }]}>
                                    Ingredientes
                                </Text>

                                {ingredientes.length === 0 ? (
                                    <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                                        Agrega al menos un ingrediente
                                    </Text>
                                ) : (
                                    <View style={styles.ingredientsList}>{ingredientCards}</View>
                                )}

                                <Surface
                                    onLayout={(e) => {
                                        addIngredientSectionYRef.current = e.nativeEvent.layout.y;
                                    }}
                                    style={[
                                        styles.addIngredientSection,
                                        { backgroundColor: theme.colors.elevation.level1 },
                                    ]}
                                    elevation={1}
                                >
                                    <Text variant="titleSmall" style={styles.addIngredientTitle}>
                                        Nuevo ingrediente:
                                    </Text>

                                    <TextInput
                                        label="Nombre del ingrediente"
                                        ref={ingredientNameRef}
                                        value={nuevoIngrediente.nombre}
                                        onChangeText={(text) => handleChangeNuevo("nombre", text)}
                                        mode="outlined"
                                        style={styles.input}
                                        returnKeyType="next"
                                        onSubmitEditing={() => ingredientCantidadRef.current?.focus?.()}
                                        error={ingredientAttempted && !isNombreValid}
                                    />
                                    {ingredientAttempted && !isNombreValid ? (
                                        <Text variant="bodySmall" style={[styles.inlineError, { color: theme.colors.error }]}>
                                            Escribe el nombre del ingrediente.
                                        </Text>
                                    ) : null}

                                    <View
                                        onLayout={(e) => {
                                            cantidadRowYRef.current = e.nativeEvent.layout.y;
                                        }}
                                        style={styles.quantityRow}
                                    >
                                        <TextInput
                                            label="Cantidad"
                                            ref={ingredientCantidadRef}
                                            value={cantidadDraft}
                                            onChangeText={setCantidadDraft}
                                            onFocus={() => {
                                                scrollViewRef.current?.scrollTo({
                                                    y: Math.max(
                                                        0,
                                                        addIngredientSectionYRef.current +
                                                            cantidadRowYRef.current - 24,
                                                    ),
                                                    animated: true,
                                                });
                                            }}
                                            mode="outlined"
                                            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "number-pad"}
                                            inputMode={Platform.OS === "ios" ? "decimal" : "numeric"}
                                            autoCorrect={false}
                                            autoCapitalize="none"
                                            returnKeyType="done"
                                            onSubmitEditing={() => {
                                                if (canSubmitIngredient) handleAddIngredient();
                                            }}
                                            style={[styles.input, { flex: 1, marginRight: 12 }]}
                                            error={ingredientAttempted && !isCantidadValid}
                                        />
                                    </View>
                                    {ingredientAttempted && !isCantidadValid ? (
                                        <Text variant="bodySmall" style={[styles.inlineError, { color: theme.colors.error }]}>
                                            Ingresa una cantidad válida mayor que cero.
                                        </Text>
                                    ) : null}

                                    {editIngredientId ? (
                                        <View style={styles.editRow}>
                                            <Text variant="bodySmall" style={[styles.editLabel, { color: theme.colors.primary }]}>
                                                Editando ingrediente
                                            </Text>
                                            <Button
                                                mode="text"
                                                onPress={() => {
                                                    setEditIngredientId(null);
                                                    setIngredientAttempted(false);
                                                    setNuevoIngrediente({
                                                        id: "",
                                                        nombre: "",
                                                        cantidad: "",
                                                        unidad: "gr",
                                                    });
                                                    setCantidadDraft("");
                                                    setTimeout(() => ingredientNameRef.current?.focus?.(), 0);
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        </View>
                                    ) : null}

                                    <View style={styles.unitsSection}>
                                        <Text variant="bodyMedium" style={styles.unitsLabel}>
                                            Unidad:
                                        </Text>
                                        <SegmentedButtons
                                            value={nuevoIngrediente.unidad}
                                            onValueChange={(value) => handleChangeNuevo("unidad", value)}
                                            buttons={unidades.map(unidad => ({
                                                value: unidad,
                                                label: unidad,
                                            }))} 
                                            style={styles.segmentedButtons}
                                        />
                                    </View>

                                    <Button
                                        mode="contained-tonal"
                                        onPress={handleAddIngredient}
                                        icon="plus"
                                        style={styles.addIngredientButton}
                                        disabled={!canSubmitIngredient}
                                    >
                                        {editIngredientId ? "Actualizar Ingrediente" : "Agregar Ingrediente"}
                                    </Button>
                                </Surface>
                            </Card.Content>
                        </Card>

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
                </ScrollView>
            </KeyboardAvoidingView>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.md,
    },
    formCard: {
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.md, // MD3 standard para cards
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    input: {
        marginBottom: Spacing.sm,
    },
    emptyText: {
        fontStyle: "italic",
        marginBottom: Spacing.md,
    },
    ingredientsList: {
        marginBottom: Spacing.md,
    },
    ingredientCard: {
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.md, // MD3 standard para cards
    },
    ingredientContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Spacing.sm,
    },
    ingredientInfo: {
        flex: 1,
    },
    ingredientName: {
        // Removido fontWeight, se usa variant del Text
    },
    ingredientQuantity: {
        marginTop: Spacing.xs,
    },
    addIngredientSection: {
        borderRadius: BorderRadius.lg, // MD3 para elementos destacados
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    addIngredientTitle: {
        marginBottom: Spacing.md,
    },
    quantityRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    unitsSection: {
        marginBottom: Spacing.md,
    },
    unitsLabel: {
        marginBottom: Spacing.sm,
    },
    segmentedButtons: {
        marginBottom: Spacing.sm,
    },
    inlineError: {
        marginTop: -Spacing.xs,
        marginBottom: Spacing.sm,
    },
    editRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.sm,
    },
    editLabel: {
        fontWeight: "600",
    },
    addIngredientButton: {
        marginTop: Spacing.sm,
    },
    submitButton: {
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.lg, // MD3 para botones destacados
    },
    submitButtonContent: {
        paddingVertical: Spacing.sm,
    },
});
