# Aplicación de Gestión de Fórmulas de Goma

Una aplicación móvil desarrollada con React Native y Expo para la gestión de inventario de colores de goma y fórmulas.

![Logo de la aplicación](./assets/images/chemical.png)

## Descripción

Esta aplicación permite gestionar el inventario de colores de goma y sus fórmulas asociadas. Está diseñada para facilitar el seguimiento de stock, la creación de nuevas fórmulas y la gestión eficiente de los recursos.

## Características Principales

- **Gestión de Stock**:
  - Visualización del inventario de colores
  - Añadir y eliminar colores
  - Reordenar colores mediante arrastrar y soltar
  - El inventario se sincroniza en tiempo real con la API

- **Gestión de Fórmulas**:
  - Visualización de fórmulas existentes
  - Creación de nuevas fórmulas
  - Asociación de colores a fórmulas
  - Edición y eliminación de fórmulas

- **Interfaz de Usuario**:
  - Diseño moderno y atractivo
  - Notificaciones toast personalizadas (react-native-toast-message)
  - Cabeceras y botones con diseño mejorado
  - Experiencia de usuario fluida con animaciones
  - Mensajes y notificaciones en español

## Tecnologías Utilizadas

- **Frontend**:
  - React Native
  - Expo
  - Expo Router
  - React Navigation
  - React Native Gesture Handler
  - React Native Draggable FlatList
  - React Native Toast Message


- **Almacenamiento**:
  - Persistencia de datos a través de la API (sin AsyncStorage para stock)
  - AsyncStorage solo se utiliza para persistir el orden de los colores

## Estructura del Proyecto

```
goma-gestion-react-native/
├── api/                    # Conexión con la API
│   ├── stockApi.ts         # Funciones para interactuar con la API de stock
│   └── formulasApi.ts      # Funciones para interactuar con la API de fórmulas
├── app/                    # Estructura principal de la app
│   ├── _layout.tsx         # Configuración general y navegación
│   ├── index.tsx           # Pantalla principal (Stock)
│   └── +not-found.tsx      # Pantalla para rutas no encontradas
├── assets/                 # Recursos estáticos
│   └── images/             # Imágenes utilizadas en la aplicación
├── components/             # Componentes reutilizables
├── constants/              # Constantes de la aplicación
├── data/                   # Modelos de datos
│   └── colors.ts           # Interfaz y funciones para colores
├── hooks/                  # Hooks personalizados
└── utils/                  # Utilidades generales
```

## Uso

### Gestión de Stock

1. En la pantalla principal, visualiza todos los colores disponibles.
2. Utiliza el botón "+" para añadir un nuevo color.
3. Desliza un color hacia la izquierda para eliminarlo.
4. Mantén presionado y arrastra para reordenar los colores.
5. Utiliza el botón de recarga para actualizar el inventario desde la API.

### Gestión de Fórmulas

1. En la sección de "Fórmulas", visualiza todas las fórmulas disponibles.
2. Selecciona una fórmula para ver sus detalles.
3. Crea, edita o elimina fórmulas según sea necesario.

## Notificaciones Personalizadas

Se implementó un sistema de notificaciones toast personalizado usando `react-native-toast-message`, con mensajes en español y un diseño visual mejorado (títulos grandes, mensajes legibles).

## Cambios Visuales

- La cabecera de la vista de fórmulas utiliza una imagen química (chemical.png).
- El título y el botón de refrescar en la sección de stock tienen un diseño más atractivo e integrado.

## Instalación y Ejecución

1. Clona el repositorio:
   ```
   git clone https://github.com/tu-usuario/goma-gestion-react-native.git
   ```
2. Instala las dependencias:
   ```
   npm install
   # o
   yarn install
   ```
3. Inicia el proyecto con Expo:
   ```
   npx expo start
   ```
4. Escanea el código QR con la app Expo Go en tu dispositivo móvil o ejecuta en un emulador.

## Créditos

Desarrollado por efe13dev@gmail.com.

API creada por mí en render.com usando Hono.

## Licencia

MIT
