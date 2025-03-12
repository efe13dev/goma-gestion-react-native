import * as FileSystem from 'expo-file-system';

export interface Ingrediente {
	nombre: string;
	cantidad: number;
	unidad: string;
}

export interface Formula {
	id: string;
	nombreColor: string;
	ingredientes: Ingrediente[];
}

// Datos iniciales de fórmulas
const formulasIniciales: Formula[] = [
	{
		id: "negro",
		nombreColor: "Negro",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "negro-pega",
		nombreColor: "Negro Pega",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "marino",
		nombreColor: "Marino",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "crudo",
		nombreColor: "Crudo",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "blanco",
		nombreColor: "Blanco",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
	{
		id: "beige",
		nombreColor: "Beige",
		ingredientes: [
			{ nombre: "Estabilizante", cantidad: 500, unidad: "gr" },
			{ nombre: "Espumante", cantidad: 650, unidad: "gr" },
		],
	},
];

// Ruta del archivo de datos en el dispositivo
const DATA_FILE_PATH = `${FileSystem.documentDirectory}formulas_data.json`;

// Variable para almacenar las fórmulas en memoria
export let formulas: Formula[] = [...formulasIniciales];

// Función para guardar las fórmulas en el archivo
const guardarFormulasEnArchivo = async (): Promise<void> => {
  try {
    const jsonData = JSON.stringify(formulas, null, 2);
    await FileSystem.writeAsStringAsync(DATA_FILE_PATH, jsonData);
    console.log(`Datos guardados en: ${DATA_FILE_PATH}`);
  } catch (error) {
    console.error(`Error al guardar los datos: ${error}`);
  }
};

// Función para cargar las fórmulas desde el archivo
export const cargarFormulas = async (): Promise<void> => {
  try {
    // Verificar si el archivo existe
    const fileInfo = await FileSystem.getInfoAsync(DATA_FILE_PATH);
    
    if (fileInfo.exists) {
      // Leer el archivo
      const jsonData = await FileSystem.readAsStringAsync(DATA_FILE_PATH);
      formulas = JSON.parse(jsonData);
      console.log('Datos cargados desde el archivo');
    } else {
      // Si el archivo no existe, usar los datos iniciales y crear el archivo
      formulas = [...formulasIniciales];
      await guardarFormulasEnArchivo();
      console.log('Archivo de datos creado con valores iniciales');
    }
  } catch (error) {
    console.error(`Error al cargar los datos: ${error}`);
    // En caso de error, usar los datos iniciales
    formulas = [...formulasIniciales];
  }
};

// Función para eliminar una fórmula por su ID
export const eliminarFormula = (id: string): boolean => {
  const indiceInicial = formulas.length;
  formulas = formulas.filter(formula => formula.id !== id);
  
  // Guardar los cambios en el archivo
  guardarFormulasEnArchivo();
  
  return formulas.length < indiceInicial; // Retorna true si se eliminó correctamente
};

// Función para añadir un ingrediente a una fórmula
export const agregarIngrediente = (
  formulaId: string, 
  nuevoIngrediente: Ingrediente
): boolean => {
  const formula = formulas.find(f => f.id === formulaId);
  
  if (!formula) return false;
  
  // Añadir el nuevo ingrediente
  formula.ingredientes.push(nuevoIngrediente);
  
  // Guardar los cambios en el archivo
  guardarFormulasEnArchivo();
  
  return true;
};

// Función para actualizar un ingrediente existente
export const actualizarIngrediente = (
  formulaId: string,
  indiceIngrediente: number,
  ingredienteActualizado: Ingrediente
): boolean => {
  const formula = formulas.find(f => f.id === formulaId);
  
  if (!formula || indiceIngrediente < 0 || indiceIngrediente >= formula.ingredientes.length) {
    return false;
  }
  
  // Actualizar el ingrediente
  formula.ingredientes[indiceIngrediente] = ingredienteActualizado;
  
  // Guardar los cambios en el archivo
  guardarFormulasEnArchivo();
  
  return true;
};

// Función para eliminar un ingrediente
export const eliminarIngrediente = (
  formulaId: string,
  indiceIngrediente: number
): boolean => {
  const formula = formulas.find(f => f.id === formulaId);
  
  if (!formula || indiceIngrediente < 0 || indiceIngrediente >= formula.ingredientes.length) {
    return false;
  }
  
  // Eliminar el ingrediente
  formula.ingredientes.splice(indiceIngrediente, 1);
  
  // Guardar los cambios en el archivo
  guardarFormulasEnArchivo();
  
  return true;
};

// Función para añadir una nueva fórmula
export const agregarFormula = (nuevaFormula: Formula): boolean => {
  // Verificar que no exista una fórmula con el mismo ID
  if (formulas.some(f => f.id === nuevaFormula.id)) {
    return false;
  }
  
  // Añadir la nueva fórmula
  formulas.push(nuevaFormula);
  
  // Guardar los cambios en el archivo
  guardarFormulasEnArchivo();
  
  return true;
};
