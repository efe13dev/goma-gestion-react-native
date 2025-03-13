import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {
  actualizarIngrediente,
  agregarIngrediente,
  eliminarIngrediente as eliminarIngredienteAPI,
  formulas,
} from '@/data/formulas';
import type { Ingrediente } from '@/data/formulas';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function FormulaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const formula = formulas.find((f) => f.id === id);

  // Estado para los ingredientes
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(
    formula?.ingredientes || []
  );

  // Estado unificado para el formulario (tanto para añadir como editar)
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ingredienteNombre, setIngredienteNombre] = useState('');
  const [ingredienteCantidad, setIngredienteCantidad] = useState('');
  const [ingredienteUnidad, setIngredienteUnidad] = useState('gr');
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);

  // Referencias a los componentes Swipeable para cerrarlos cuando sea necesario
  const swipeableRefs = useRef<Array<Swipeable | null>>([]);

  // Actualizar los ingredientes cuando cambia la fórmula
  useEffect(() => {
    if (formula) {
      setIngredientes(formula.ingredientes);
    }
  }, [formula]);

  if (!formula) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Fórmula no encontrada</ThemedText>
      </ThemedView>
    );
  }

  // Función para iniciar la edición de un ingrediente
  const iniciarEdicion = (index: number) => {
    // Cerrar todos los swipeables abiertos
    closeAllSwipeables();
    
    const ingrediente = ingredientes[index];
    setIngredienteNombre(ingrediente.nombre);
    setIngredienteCantidad(ingrediente.cantidad.toString());
    setIngredienteUnidad(ingrediente.unidad);
    setEditandoIndex(index);
    setMostrarFormulario(true);
  };

  // Función para guardar el ingrediente (ya sea nuevo o editado)
  const guardarIngrediente = () => {
    if (!ingredienteNombre.trim()) {
      Alert.alert('Error', 'El nombre del ingrediente es obligatorio');
      return;
    }

    if (
      !ingredienteCantidad.trim() ||
      Number.isNaN(Number(ingredienteCantidad))
    ) {
      Alert.alert('Error', 'La cantidad debe ser un número válido');
      return;
    }

    const nuevoIngrediente: Ingrediente = {
      nombre: ingredienteNombre.trim(),
      cantidad: Number(ingredienteCantidad),
      unidad: ingredienteUnidad.trim() || 'gr',
    };

    if (editandoIndex !== null && formula) {
      // Estamos editando un ingrediente existente
      const resultado = actualizarIngrediente(
        formula.id,
        editandoIndex,
        nuevoIngrediente
      );
      if (resultado) {
        // Obtener una referencia fresca a la fórmula después de la actualización
        const formulaActualizada = formulas.find((f) => f.id === formula.id);
        
        // Actualizar el estado local con los ingredientes actualizados
        if (formulaActualizada) {
          setIngredientes([...formulaActualizada.ingredientes]);
        }
      } else {
        Alert.alert('Error', 'No se pudo actualizar el ingrediente');
      }
    } else if (formula) {
      // Estamos añadiendo un nuevo ingrediente
      const resultado = agregarIngrediente(formula.id, nuevoIngrediente);
      if (resultado) {
        // Obtener una referencia fresca a la fórmula después de añadir
        const formulaActualizada = formulas.find((f) => f.id === formula.id);
        
        // Actualizar el estado local con los ingredientes actualizados
        if (formulaActualizada) {
          setIngredientes([...formulaActualizada.ingredientes]);
        }
      } else {
        Alert.alert('Error', 'No se pudo agregar el ingrediente');
      }
    }

    // Limpiar el formulario y cerrar
    cancelarFormulario();
  };

  // Función para cancelar el formulario
  const cancelarFormulario = () => {
    setEditandoIndex(null);
    setIngredienteNombre('');
    setIngredienteCantidad('');
    setIngredienteUnidad('gr');
    setMostrarFormulario(false);
  };

  // Función para mostrar el formulario para añadir un nuevo ingrediente
  const mostrarFormularioAgregar = () => {
    setIngredienteNombre('');
    setIngredienteCantidad('');
    setIngredienteUnidad('gr');
    setEditandoIndex(null);
    setMostrarFormulario(true);
  };

  // Función para eliminar un ingrediente
  const eliminarIngrediente = (index: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este ingrediente?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            // Cerrar el swipeable después de cancelar
            closeAllSwipeables();
          }
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            if (formula) {
              const resultado = eliminarIngredienteAPI(formula.id, index);
              if (resultado) {
                // Cerrar todos los swipeables
                closeAllSwipeables();
                
                // Obtener una referencia fresca a la fórmula después de la eliminación
                const formulaActualizada = formulas.find((f) => f.id === formula.id);
                
                // Actualizar el estado local con los ingredientes actualizados
                if (formulaActualizada) {
                  setIngredientes([...formulaActualizada.ingredientes]);
                }
              } else {
                Alert.alert('Error', 'No se pudo eliminar el ingrediente');
              }
            }
          },
        },
      ]
    );
  };
  
  // Función para guardar la referencia del swipeable
  const saveSwipeableRef = (ref: Swipeable | null, index: number) => {
    if (swipeableRefs.current.length <= index) {
      swipeableRefs.current = [...swipeableRefs.current, ...Array(index - swipeableRefs.current.length + 1).fill(null)];
    }
    swipeableRefs.current[index] = ref;
  };
  
  // Función para cerrar todos los swipeables
  const closeAllSwipeables = () => {
    for (const ref of swipeableRefs.current) {
      if (ref) ref.close();
    }
  };

  // Renderizar el lado derecho del swipeable (acción de eliminar)
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, index: number) => {
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
          onPress={() => eliminarIngrediente(index)}
        >
          <MaterialIcons name="delete-outline" size={24} color="white" />
          <ThemedText style={styles.deleteActionText}>Eliminar</ThemedText>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerHeight={140}
        withNavHeader={true}
        headerImage={
          <Image
            source={require('@/assets/images/palot.png')}
            style={styles.reactLogo}
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>
            {formula.nombreColor}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.ingredientesContainer}>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Ingredientes:
          </ThemedText>

          {ingredientes.map((ingrediente, index) => (
            <Swipeable
              key={`${formula.id}-${ingrediente.nombre}-${index}`}
              renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, index)}
              ref={(ref) => saveSwipeableRef(ref, index)}
              friction={2}
              rightThreshold={100}
              overshootRight={false}
              containerStyle={styles.swipeableContainer}
              onSwipeableOpen={(direction) => {
                if (direction === 'right') return;
                // Si se abre completamente, mostrar el diálogo de confirmación
                eliminarIngrediente(index);
              }}
            >
              <ThemedView style={styles.ingredienteRow}>
                <TouchableOpacity onPress={() => iniciarEdicion(index)}>
                  <ThemedText style={styles.ingredienteNombre}>
                    {ingrediente.nombre}
                  </ThemedText>
                </TouchableOpacity>
                <ThemedView style={styles.accionesContainer}>
                  <ThemedText style={styles.cantidad}>
                    {ingrediente.cantidad} {ingrediente.unidad}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Swipeable>
          ))}

          {/* Formulario para añadir o editar ingredientes */}
          {mostrarFormulario && (
            <ThemedView style={styles.formularioContainer}>
              <ThemedView style={styles.inputRow}>
                <ThemedText style={styles.label}>Nombre:</ThemedText>
                <TextInput
                  style={styles.input}
                  value={ingredienteNombre}
                  onChangeText={setIngredienteNombre}
                  placeholder="Nombre del ingrediente"
                  placeholderTextColor="rgba(150, 150, 150, 0.8)"
                />
              </ThemedView>

              <ThemedView style={styles.inputRow}>
                <ThemedText style={styles.label}>Cantidad:</ThemedText>
                <TextInput
                  style={styles.input}
                  value={ingredienteCantidad}
                  onChangeText={setIngredienteCantidad}
                  placeholder="Cantidad"
                  keyboardType="numeric"
                  placeholderTextColor="rgba(150, 150, 150, 0.8)"
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
          )}

          {/* Botón para mostrar el formulario de añadir */}
          {!mostrarFormulario && (
            <TouchableOpacity
              style={styles.botonAgregar}
              onPress={mostrarFormularioAgregar}
            >
              <Ionicons name="add-circle" size={24} color="#A1CEDC" />
              <ThemedText style={styles.botonAgregarTexto}>
                Añadir ingrediente
              </ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ParallaxScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: -20,
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
  },
  ingredientesContainer: {
    backgroundColor: 'rgba(161, 206, 220, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  subtitleForm: {
    marginBottom: 12,
    textAlign: 'center',
  },
  ingredienteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(161, 206, 220, 0.2)',
  },
  ingredienteNombre: {
    fontSize: 18,
  },
  cantidad: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reactLogo: {
    width: '50%',
    height: '70%',
    resizeMode: 'contain',
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -40 }],
    opacity: 0.9,
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
  label: {
    marginBottom: 4,
    fontSize: 16,
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
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  boton: {
    paddingVertical: 10,
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
  accionesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteAction: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteActionContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  deleteActionText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  swipeableContainer: {
    marginBottom: 8,
  },
});
