import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getFormulaById } from '@/api/formulasApi'; // Asegúrate que esta función exista y la ruta sea correcta
import type { Formula, Ingrediente } from '@/data/formulas'; // Importar Ingrediente

export default function FormulaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [formula, setFormula] = useState<Formula | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchFormula = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedFormula = await getFormulaById(id); // Pasar id (string) directamente
          if (fetchedFormula) {
            setFormula(fetchedFormula);
          } else {
            setError('No se encontró la fórmula.');
          }
        } catch (err) {
          setError('Error al cargar la fórmula.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchFormula();
    } else {
        setError('No se proporcionó ID de fórmula.');
        setIsLoading(false);
    }
  }, [id]);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!formula) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No se encontró la fórmula.</ThemedText>
      </ThemedView>
    );
  }

  let ingredientsContent: JSX.Element | JSX.Element[];
  if (formula.ingredientes && formula.ingredientes.length > 0) {
    ingredientsContent = 
        formula.ingredientes.map((ingrediente: Ingrediente, index: number) => {
          const name = ingrediente.nombre || 'Nombre no disponible';
          const quantity = ingrediente.cantidad !== null && ingrediente.cantidad !== undefined ? ingrediente.cantidad : '-';
          const unit = ingrediente.unidad || '';

          return (
            // Usar el id de la fórmula (si existe) y el índice para una clave más única
            <ThemedView key={`${formula?.id || 'formula'}-${index}`} style={styles.ingredientContainer}>
              <ThemedText style={styles.ingredientName}>{name}</ThemedText>
              <ThemedText style={styles.ingredientQuantity}>{quantity} {unit}</ThemedText>
            </ThemedView>
          );
        });
  } else {
    ingredientsContent = <ThemedText>No hay ingredientes para esta fórmula.</ThemedText>;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>{formula.nombreColor}</ThemedText>
      <ThemedText style={styles.subtitle}>Ingredientes:</ThemedText>
      {ingredientsContent}
    </ThemedView>
  );
}

FormulaDetailScreen.options = {
  headerBackTitle: 'Volver'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 12,
  },
  ingredientContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: "#2C3E50",
  },
  ingredientName: {
    color: "white",
    fontSize: 18,
  },
  ingredientQuantity: {
    color: "#A1CEDC",
    fontWeight: "bold",
    fontSize: 18,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});
