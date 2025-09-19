# Project: Goma Gestion React Native

## Project Overview

This is a React Native mobile application built with Expo for managing rubber color inventory and formulas. The app allows users to view, add, delete, and reorder rubber colors, as well as create, view, and manage formulas for those colors. It features a modern user interface based on Material Design 3, with support for light, dark, and automatic themes.

**Key Technologies:**

*   **Frontend:** React Native, Expo, Expo Router, React Navigation
*   **UI:** React Native Paper (Material Design 3), React Native Reanimated, React Native Draggable FlatList
*   **State Management:** React Context API for theme management
*   **Data Fetching:** `fetch` API for interacting with a REST backend
*   **Persistence:** `@react-native-async-storage/async-storage` for storing theme preferences and color order

**Architecture:**

The application is structured using Expo Router for file-based routing. It uses a tab-based navigation for the main screens (Stock and Formulas) and a stack-based navigation for other screens. The UI is built with `react-native-paper` components, and the theme is managed through a custom `ThemeContext`. API calls are organized in the `api` directory, with separate files for the `stock` and `formulas` endpoints.

## Building and Running

**Prerequisites:**

*   Node.js and npm
*   Expo CLI
*   Expo Go app on a mobile device or an Android/iOS emulator

**Running the app:**

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the development server:**
    ```bash
    npx expo start
    ```
3.  **Run on a device or emulator:**
    *   Scan the QR code with the Expo Go app.
    *   Press `a` to run on an Android emulator.
    *   Press `i` to run on an iOS simulator.

**Building for production:**

The project is configured to use EAS Build for creating production builds.

*   **Build an APK (for Android):**
    ```bash
    npx eas build --platform android --profile preview
    ```

## Development Conventions

*   **Styling:** The project uses `react-native-paper` for UI components and a custom Material Design 3 theme defined in `theme/md3-theme.ts`. Spacing and border radius constants are defined in `constants/Spacing.ts`.
*   **Routing:** File-based routing is handled by Expo Router. The main navigation is in `app/(tabs)/_layout.tsx`.
*   **API Interaction:** API calls are centralized in the `api` directory. Each API resource has its own file (e.g., `stockApi.ts`, `formulasApi.ts`).
*   **Linting:** The project is configured with `expo lint` for code linting.
*   **Testing:** The project is set up with Jest for unit testing. Run tests with `npm test`.
*   **Toast Notifications:** Custom toast notifications are implemented using `react-native-toast-message` and a utility function in `utils/toast.ts`.
