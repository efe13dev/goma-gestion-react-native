import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  actualTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Cargar el tema guardado al iniciar
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
          setThemeMode(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error cargando el tema:', error);
      }
    };
    loadTheme();
  }, []);

  // Guardar el tema cuando cambia
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('themeMode', themeMode);
      } catch (error) {
        console.error('Error guardando el tema:', error);
      }
    };
    saveTheme();
  }, [themeMode]);

  // Detectar el tema del sistema
  useEffect(() => {
    const { Appearance } = require('react-native');
    
    const updateSystemTheme = () => {
      setSystemTheme(Appearance.getColorScheme() || 'light');
    };

    updateSystemTheme();
    const subscription = Appearance.addChangeListener(updateSystemTheme);
    
    return () => subscription.remove();
  }, []);

  const actualTheme = themeMode === 'auto' ? systemTheme : themeMode;

  const toggleTheme = () => {
    setThemeMode(current => {
      if (current === 'auto') return 'light';
      if (current === 'light') return 'dark';
      return 'auto';
    });
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  return (
    <ThemeContext.Provider value={{
      themeMode,
      actualTheme,
      toggleTheme,
      setThemeMode: handleSetThemeMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
}
