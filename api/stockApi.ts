import type { RubberColor } from '@/data/colors';

// API base URL
const API_URL = 'https://api-rubber-hono.onrender.com';
// Stock endpoint
const STOCK_ENDPOINT = '/stock'; // Endpoint for stock

// Interface for API data
interface ColorAPI {
  name: string;
  quantity: number;
}

// Function to convert from API format to local format
const mapApiToLocal = (apiColor: ColorAPI): RubberColor => ({
  id: apiColor.name.toLowerCase(),
  name: apiColor.name,
  quantity: apiColor.quantity
});

// Function to convert from local format to API format
const mapLocalToApi = (localColor: RubberColor): ColorAPI => ({
  name: localColor.name,
  quantity: localColor.quantity
});

// Get all stock
export const getStock = async (): Promise<RubberColor[]> => {
  try {
    console.log(`Getting stock from: ${API_URL}${STOCK_ENDPOINT}`);
    const response = await fetch(`${API_URL}${STOCK_ENDPOINT}`);
    
    if (!response.ok) {
      throw new Error(`Error getting stock: ${response.status}`);
    }
    
    const data: ColorAPI[] = await response.json();
    return data.map(mapApiToLocal);
  } catch (error) {
    console.error('Error getting stock:', error);
    throw error;
  }
};

// Add a new color
export const addColor = async (color: RubberColor): Promise<void> => {
  try {
    const colorAPI = mapLocalToApi(color);
    
    const response = await fetch(`${API_URL}${STOCK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(colorAPI),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error adding color: ${response.status}`);
    }
  } catch (error) {
    console.error('Error adding color:', error);
    throw error;
  }
};

// Update an existing color
export const updateColor = async (color: RubberColor): Promise<void> => {
  try {
    const colorAPI = mapLocalToApi(color);
    
    const response = await fetch(`${API_URL}${STOCK_ENDPOINT}/${encodeURIComponent(color.name)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(colorAPI),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error updating color: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating color:', error);
    throw error;
  }
};

// Delete a color
export const deleteColor = async (colorName: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}${STOCK_ENDPOINT}/${encodeURIComponent(colorName)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error deleting color: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting color:', error);
    throw error;
  }
};

// Update the order of colors
export const updateColorOrder = async (colors: RubberColor[]): Promise<void> => {
  try {
    // Como la API actual no tiene un endpoint específico para actualizar el orden,
    // vamos a simular esto actualizando cada color individualmente
    for (const color of colors) {
      await updateColor(color);
    }
  } catch (error) {
    console.error('Error updating color order:', error);
    throw error;
  }
};
