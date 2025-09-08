# Aplicación de Gestión de Fórmulas de Goma

Una aplicación móvil desarrollada con React Native y Expo para la gestión de inventario de colores de goma y fórmulas.

![Logo de la aplicación](./assets/images/splash-init.png)

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
  - Diseño moderno con **Material Design 3** usando `react-native-paper`
  - Cambio de tema: claro, oscuro y automático, con persistencia vía `AsyncStorage`
  - Notificaciones toast personalizadas (`react-native-toast-message`)
  - Splash screen nativo configurado con `expo-splash-screen`
  - Tabs y elementos activos/inactivos con colores MD3 consistentes
  - Cabeceras y botones con diseño mejorado y animaciones sutiles
  - Mensajes y notificaciones en español

## Tecnologías Utilizadas

- **Frontend**:
  - React Native, Expo y Expo Router
  - React Navigation, Gesture Handler, Reanimated
  - React Native Draggable FlatList
  - React Native Toast Message
  - React Native Paper (Material Design 3)
  - Expo Splash Screen, Expo Build Properties

- **Datos y Persistencia**:
  - API REST para stock: `https://api-rubber-hono.onrender.com/stock`
  - API REST para fórmulas: `https://api-rubber-hono.onrender.com/formulas`
  - `AsyncStorage` para: preferencia de tema y orden de colores

## Estructura del Proyecto

```
goma-gestion-react-native/
├── api/                        # Conexión con la API
│   ├── stockApi.ts             # Endpoints de stock
│   └── formulasApi.ts          # Endpoints de fórmulas
├── app/                        # Rutas y pantallas (Expo Router)
│   ├── (tabs)/                 # Navegación por pestañas
│   │   ├── _layout.tsx         # Layout de tabs + Appbar
│   │   ├── index.tsx           # Pantalla Stock
│   │   └── formulas.tsx        # Listado de fórmulas
│   ├── formulas/
│   │   ├── [id].tsx            # Detalle de fórmula (MD3, Appbar propio)
│   │   ├── nueva-formula.tsx   # Crear/editar fórmula (MD3)
│   │   └── nueva-formula-backup.tsx
│   ├── _layout.tsx             # Layout raíz (PaperProvider, Toast, Stack)
│   └── +not-found.tsx          # Rutas no encontradas
├── assets/
│   ├── fonts/
│   └── images/                 # chemical.png, palot.png, splash-init.png, íconos
├── components/                 # UI reutilizable
├── constants/                  # Colores y spacing
├── contexts/
│   └── ThemeContext.tsx        # Sistema de temas (claro/oscuro/auto)
├── theme/
│   └── md3-theme.ts            # Temas MD3 personalizados
├── types/                      # Tipos TS (colors, formulas)
├── utils/
│   └── toast.ts                # Utilidad de toasts
└── eas.json                    # Perfiles de build (APK con profile preview)
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

- Migración a **Material Design 3** en pantallas clave (`app/formulas/[id].tsx` y `app/formulas/nueva-formula.tsx`) con `react-native-paper`.
- Alternancia de tema claro/oscuro/auto desde los headers de Stock y Fórmulas (persistente con `AsyncStorage`).
  - Tabs activos/inactivos con colores MD3 adecuados para mejor visibilidad.
  - Splash screen usando `assets/images/splash-init.png` con `resizeMode: contain` y fondo blanco.
  - En rutas `formulas/[id]` y `formulas/nueva-formula` se oculta el header del Stack porque renderizan su propio `Appbar`.

## Capturas de pantalla
<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <img src="./assets/images/screenshoot_stock.png" alt="Stock" width="48%" />
  <img src="./assets/images/screenshoot_forms.png" alt="Fórmulas" width="48%" />
  <img src="./assets/images/screenshoot_ingredients.png" alt="Ingredientes" width="48%" />
  <img src="./assets/images/screenshoot_newform.png" alt="Nueva fórmula" width="48%" />
</div>

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

### Generar APK (Android)

La app está preparada para build con EAS. Versión actual: `2.0.0` (Android `versionCode: 2`).

1. Inicia sesión en Expo (si aplica):
   ```bash
   npx expo login
   ```
2. Genera la APK con el perfil `preview` definido en `eas.json`:
   ```bash
   npx eas build --platform android --profile preview
   ```
3. Sigue el enlace que provee EAS para descargar la APK una vez finalizado el build.
4. Si necesitas un AAB o build de producción, puedes usar:
   ```bash
   npx eas build --platform android --profile production
   ```

## Créditos

Desarrollado por efe13dev@gmail.com.

API creada por mí en render.com usando Hono.

## Licencia

MIT
