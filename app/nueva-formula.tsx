import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Modal, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { addFormula } from '@/api/formulasApi';
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
  
  // Estado para manejar la carga
  const [isLoading, setIsLoading] = useState(false);

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
  const guardarFormula = async () => {
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

    // Mostrar indicador de carga
    setIsLoading(true);
    
    try {
      // Guardar la fórmula usando la API
      const resultado = await addFormula(nuevaFormula);

      if (resultado) {
        Alert.alert(
          'Éxito',
          'La fórmula se ha guardado correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navegar de vuelta a la lista de fórmulas
                router.replace('/(tabs)/formulas');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Ya existe una fórmula con ese nombre o hubo un problema al guardar');
      }
    } catch (error) {
      console.error('Error al guardar la fórmula:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar la fórmula. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#A1CEDC" />
            <ThemedText style={styles.loadingText}>Guardando fórmula...</ThemedText>
          </View>
        )}
        
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
            
            <ScrollView 
              style={styles.ingredientesScrollView}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.ingredientesScrollContent}
            >
              {ingredientes.map((ingrediente, index) => (
                <ThemedView key={`${ingrediente.nombre}-${index}`} style={styles.ingredienteItem}>
                  <ThemedView style={styles.ingredienteInfo}>
                    <ThemedText style={styles.ingredienteNombre}>{ingrediente.nombre}</ThemedText>
                    <ThemedText style={styles.ingredienteCantidad}>
                      {ingrediente.cantidad} {ingrediente.unidad}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.ingredienteAcciones}>
                    <TouchableOpacity
                      style={styles.accionBoton}
                      onPress={() => iniciarEdicion(index)}
                    >
                      <Ionicons name="pencil" size={20} color="#A1CEDC" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.accionBoton}
                      onPress={() => eliminarIngrediente(index)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              ))}
            </ScrollView>

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

          <ThemedView style={styles.botonesContainer}>
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
              <ThemedText style={styles.botonTexto}>Guardar</ThemedText>
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
              <View style={styles.modalOverlay}>
                <ThemedView style={[styles.modalContainer, { backgroundColor }]}>
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
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  formContainer: {
    padding: 16,
    marginHorizontal: 12,
    backgroundColor: 'rgba(161, 206, 220, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(161, 206, 220, 0.5)',
    color: '#333',
  },
  ingredientesContainer: {
    padding: 16,
    marginHorizontal: 12,
    backgroundColor: 'rgba(161, 206, 220, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
  },
  subtitle: {
    marginBottom: 16,
  },
  subtitleForm: {
    marginBottom: 12,
    textAlign: 'center',
  },
  ingredienteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(161, 206, 220, 0.2)',
  },
  ingredienteInfo: {
    flex: 1,
  },
  ingredienteNombre: {
    fontSize: 16,
    fontWeight: '500',
  },
  ingredienteCantidad: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  ingredienteAcciones: {
    flexDirection: 'row',
    gap: 12,
  },
  accionBoton: {
    padding: 8,
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(161, 206, 220, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(161, 206, 220, 0.5)',
  },
  botonAgregarTexto: {
    marginLeft: 8,
    fontSize: 16,
    color: '#A1CEDC',
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 24,
  },
  boton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  botonCancelar: {
    backgroundColor: 'rgba(200, 200, 200, 0.8)',
  },
  botonGuardar: {
    backgroundColor: '#A1CEDC',
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  inputRow: {
    marginBottom: 12,
  },
  unidadSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  unidadButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(161, 206, 220, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  unidadButtonSelected: {
    backgroundColor: '#A1CEDC',
    borderColor: '#A1CEDC',
  },
  unidadButtonText: {
    fontSize: 16,
    color: '#666',
  },
  unidadButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ingredientesScrollView: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(161, 206, 220, 0.3)',
    borderRadius: 8,
    marginVertical: 10,
  },
  ingredientesScrollContent: {
    paddingVertical: 12,
  },
});