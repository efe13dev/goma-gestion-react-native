# Aplicación de Gestión de Goma

Una aplicación móvil desarrollada con React Native y Expo para la gestión de inventario de colores de goma y fórmulas.

![Logo de la aplicación](./assets/images/palot.png)

## Descripción

Esta aplicación permite gestionar el inventario de colores de goma y sus fórmulas asociadas. Está diseñada para facilitar el seguimiento de stock, la creación de nuevas fórmulas y la gestión eficiente de los recursos.

## Características Principales

- **Gestión de Stock**:
  - Visualización del inventario de colores
  - Añadir, editar y eliminar colores
  - Reordenar colores mediante arrastrar y soltar
  - Persistencia del orden de los colores entre sesiones

- **Gestión de Fórmulas**:
  - Visualización de fórmulas existentes
  - Creación de nuevas fórmulas
  - Asociación de colores a fórmulas

- **Interfaz de Usuario**:
  - Diseño moderno y atractivo
  - Notificaciones toast personalizadas
  - Soporte para modo claro y oscuro
  - Experiencia de usuario fluida con animaciones

## Tecnologías Utilizadas

- **Frontend**:
  - React Native
  - Expo
  - React Navigation
  - React Native Gesture Handler
  - React Native Draggable FlatList
  - React Native Toast Message

- **Almacenamiento**:
  - AsyncStorage para persistencia local
  - API REST para datos remotos

- **API**:
  - Conexión con API REST para gestión de datos
  - Endpoints para obtener, añadir, actualizar y eliminar colores


## Estructura del Proyecto

```
goma-gestion-react-native/
├── api/                    # Conexión con la API
│   └── stockApi.ts         # Funciones para interactuar con la API de stock
├── app/                    # Pantallas principales de la aplicación
│   └── (tabs)/             # Pestañas de navegación
│       ├── index.tsx       # Vista de Stock
│       └── formulas.tsx    # Vista de Fórmulas
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

1. En la pestaña "Stock", visualiza todos los colores disponibles.
2. Utiliza el botón "+" para añadir un nuevo color.
3. Desliza un color hacia la izquierda para eliminarlo.
4. Mantén presionado y arrastra para reordenar los colores.
5. Utiliza el botón de recarga para actualizar el inventario desde la API.

### Gestión de Fórmulas

1. En la pestaña "Fórmulas", visualiza todas las fórmulas disponibles.
2. Selecciona una fórmula para ver sus detalles.
3. Utiliza el botón de recarga para actualizar las fórmulas desde la API.



## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Contacto

Para cualquier consulta o sugerencia, por favor contacta conmigo.
