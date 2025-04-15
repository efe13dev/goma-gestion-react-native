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
