import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Modal } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { agregarFormula } from '@/data/formulas';
import type { Ingrediente, Formula } from '@/data/formulas';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function NuevaFormulaScreen() {
  // Estado para el nombre del color
  const [nombreColor, setNombreColor] = useState('');
  
  // Estado para la lista de ingredientes, inicializado con Estabilizante y Espumante
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([
    { nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
    { nombre: "Espumante", cantidad: 650, unidad: "gr" },
  ]);
  
  // Estado para el formulario de ingrediente
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ingredienteNombre, setIngredienteNombre] = useState('');
  const [ingredienteCantidad, setIngredienteCantidad] = useState('');
  const [ingredienteUnidad, setIngredienteUnidad] = useState('gr');
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);

  // Obtener el color del texto según el tema
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  // Referencias para los inputs
  const nombreColorRef = useRef<TextInput>(null);
  const ingredienteNombreRef = useRef<TextInput>(null);
  const ingredienteCantidadRef = useRef<TextInput>(null);

  // Función para mostrar el formulario para añadir un nuevo ingrediente
  const mostrarFormularioAgregar = () => {
    setIngredienteNombre('');
    setIngredienteCantidad('');
    setIngredienteUnidad('gr');
    setEditandoIndex(null);
    setMostrarFormulario(true);
  };

  // Función para iniciar la edición de un ingrediente
  const iniciarEdicion = (index: number) => {
    const ingrediente = ingredientes[index];
    setIngredienteNombre(ingrediente.nombre);
    setIngredienteCantidad(ingrediente.cantidad.toString());
    setIngredienteUnidad(ingrediente.unidad);
    setEditandoIndex(index);
    setMostrarFormulario(true);
  };

  // Función para cancelar el formulario
  const cancelarFormulario = () => {
    setEditandoIndex(null);
    setIngredienteNombre('');
    setIngredienteCantidad('');
    setIngredienteUnidad('gr');
    setMostrarFormulario(false);
  };

  // Función para guardar el ingrediente (ya sea nuevo o editado)
  const guardarIngrediente = () => {
    // Validar que se hayan ingresado los datos necesarios
    if (!ingredienteNombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del ingrediente');
      return;
    }

    if (!ingredienteCantidad.trim() || Number.isNaN(Number(ingredienteCantidad))) {
      Alert.alert('Error', 'Por favor ingresa una cantidad válida');
      return;
    }

    // Crear el objeto ingrediente
    const ingrediente: Ingrediente = {
      nombre: ingredienteNombre.trim(),
      cantidad: Number(ingredienteCantidad),
      unidad: ingredienteUnidad,
    };

    // Actualizar la lista de ingredientes
    if (editandoIndex !== null) {
      // Editar ingrediente existente
      const nuevosIngredientes = [...ingredientes];
      nuevosIngredientes[editandoIndex] = ingrediente;
      setIngredientes(nuevosIngredientes);
    } else {
      // Añadir nuevo ingrediente
      setIngredientes([...ingredientes, ingrediente]);
    }

    // Limpiar el formulario
    cancelarFormulario();
  };

  // Función para eliminar un ingrediente
  const eliminarIngrediente = (index: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este ingrediente?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const nuevosIngredientes = [...ingredientes];
            nuevosIngredientes.splice(index, 1);
            setIngredientes(nuevosIngredientes);
          },
        },
      ]
    );
  };

  // Función para guardar la fórmula completa
  const guardarFormula = () => {
    // Validar que se haya ingresado un nombre de color
    if (!nombreColor.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del color');
      return;
    }

    // Validar que haya al menos un ingrediente
    if (ingredientes.length === 0) {
      Alert.alert('Error', 'Por favor añade al menos un ingrediente');
      return;
    }

    // Crear el ID a partir del nombre (convertir a minúsculas y reemplazar espacios por guiones)
    const id = nombreColor.trim().toLowerCase().replace(/\s+/g, '-');

    // Crear el objeto fórmula
    const nuevaFormula: Formula = {
      id,
      nombreColor: nombreColor.trim(),
      ingredientes,
    };

    // Guardar la fórmula
    const resultado = agregarFormula(nuevaFormula);

    if (resultado) {
      Alert.alert(
        'Éxito',
        'La fórmula se ha guardado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navegar de vuelta a la lista de fórmulas
              router.replace('/');
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Ya existe una fórmula con ese nombre');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>Nueva Fórmula</ThemedText>
          </ThemedView>

          <ThemedView style={styles.formContainer}>
            <ThemedText style={styles.label}>Nombre del Color:</ThemedText>
            <TextInput
              ref={nombreColorRef}
              style={[styles.input, { color: textColor }]}
              value={nombreColor}
              onChangeText={setNombreColor}
              placeholder="Nombre del color"
              placeholderTextColor="rgba(150, 150, 150, 0.8)"
              editable={true}
              autoCapitalize="sentences"
              blurOnSubmit={false}
              caretHidden={false}
            />
          </ThemedView>

          <ThemedView style={styles.ingredientesContainer}>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Ingredientes:
            </ThemedText>

            {ingredientes.map((ingrediente, index) => (
              <ThemedView key={`ingrediente-${ingrediente.nombre}-${index}`} style={styles.ingredienteRow}>
                <TouchableOpacity onPress={() => iniciarEdicion(index)}>
                  <ThemedText style={styles.ingredienteNombre}>
                    {ingrediente.nombre}
                  </ThemedText>
                </TouchableOpacity>
                <ThemedView style={styles.accionesContainer}>
                  <ThemedText style={styles.cantidad}>
                    {ingrediente.cantidad} {ingrediente.unidad}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => eliminarIngrediente(index)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))}

            {/* Botón para mostrar el formulario de añadir */}
            <TouchableOpacity
              style={styles.botonAgregar}
              onPress={mostrarFormularioAgregar}
            >
              <Ionicons name="add-circle" size={24} color="#A1CEDC" />
              <ThemedText style={styles.botonAgregarTexto}>
                Añadir ingrediente
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.botonesGuardarContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonCancelar]}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.botonTexto}>Cancelar</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonGuardar]}
              onPress={guardarFormula}
            >
              <ThemedText style={styles.botonTexto}>Guardar Fórmula</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>

        {/* Modal para añadir o editar ingredientes */}
        <Modal
          visible={mostrarFormulario}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelarFormulario}
        >
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContainer}>
              <ThemedText type="subtitle" style={styles.subtitleForm}>
                {editandoIndex !== null ? 'Editar Ingrediente' : 'Añadir Ingrediente'}
              </ThemedText>

              <ThemedView style={styles.inputRow}>
                <ThemedText style={styles.label}>Nombre:</ThemedText>
                <TextInput
                  ref={ingredienteNombreRef}
                  style={[styles.input, { color: textColor }]}
                  value={ingredienteNombre}
                  onChangeText={setIngredienteNombre}
                  placeholder="Nombre del ingrediente"
                  placeholderTextColor="rgba(150, 150, 150, 0.8)"
                  editable={true}
                  autoCapitalize="sentences"
                />
              </ThemedView>

              <ThemedView style={styles.inputRow}>
                <ThemedText style={styles.label}>Cantidad:</ThemedText>
                <TextInput
                  ref={ingredienteCantidadRef}
                  style={[styles.input, { color: textColor }]}
                  value={ingredienteCantidad}
                  onChangeText={setIngredienteCantidad}
                  placeholder="Cantidad"
                  keyboardType="numeric"
                  placeholderTextColor="rgba(150, 150, 150, 0.8)"
                  editable={true}
                />
              </ThemedView>

              <ThemedView style={styles.inputRow}>
                <ThemedText style={styles.label}>Unidad:</ThemedText>
                <ThemedView style={styles.unidadSelectorContainer}>
                  <TouchableOpacity
                    style={[
                      styles.unidadButton,
                      ingredienteUnidad === 'gr' && styles.unidadButtonSelected,
                    ]}
                    onPress={() => setIngredienteUnidad('gr')}
                  >
                    <ThemedText
                      style={[
                        styles.unidadButtonText,
                        ingredienteUnidad === 'gr' &&
                          styles.unidadButtonTextSelected,
                      ]}
                    >
                      gr
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.unidadButton,
                      ingredienteUnidad === 'kg' && styles.unidadButtonSelected,
                    ]}
                    onPress={() => setIngredienteUnidad('kg')}
                  >
                    <ThemedText
                      style={[
                        styles.unidadButtonText,
                        ingredienteUnidad === 'kg' &&
                          styles.unidadButtonTextSelected,
                      ]}
                    >
                      kg
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.unidadButton,
                      ingredienteUnidad === 'L' && styles.unidadButtonSelected,
                    ]}
                    onPress={() => setIngredienteUnidad('L')}
                  >
                    <ThemedText
                      style={[
                        styles.unidadButtonText,
                        ingredienteUnidad === 'L' &&
                          styles.unidadButtonTextSelected,
                      ]}
                    >
                      L
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.botonesContainer}>
                <TouchableOpacity
                  style={[styles.boton, styles.botonCancelar]}
                  onPress={cancelarFormulario}
                >
                  <ThemedText style={styles.botonTexto}>Cancelar</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.boton, styles.botonGuardar]}
                  onPress={guardarIngrediente}
                >
                  <ThemedText style={styles.botonTexto}>Guardar</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
  },
  formContainer: {
    padding: 16,
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(161, 206, 220, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  ingredientesContainer: {
    padding: 16,
    marginBottom: 16,
  },
  subtitle: {
    marginBottom: 16,
  },
  subtitleForm: {
    marginBottom: 16,
    textAlign: 'center',
  },
  ingredienteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(161, 206, 220, 0.3)',
    borderRadius: 8,
    marginBottom: 8,
  },
  ingredienteNombre: {
    fontSize: 16,
  },
  accionesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cantidad: {
    marginRight: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  deleteButton: {
    padding: 4,
  },
  formularioContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(161, 206, 220, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(161, 206, 220, 0.3)',
  },
  inputRow: {
    marginBottom: 12,
  },
  unidadSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  unidadButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(161, 206, 220, 0.5)',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  unidadButtonSelected: {
    backgroundColor: '#A1CEDC',
  },
  unidadButtonText: {
    fontSize: 14,
  },
  unidadButtonTextSelected: {
    color: '#fff',
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  botonesGuardarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 32,
  },
  boton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  botonGuardar: {
    backgroundColor: '#A1CEDC',
  },
  botonCancelar: {
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
  },
  botonTexto: {
    fontSize: 16,
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  botonAgregarTexto: {
    marginLeft: 8,
    fontSize: 16,
    color: '#A1CEDC',
  },
  // Estilos para el modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});