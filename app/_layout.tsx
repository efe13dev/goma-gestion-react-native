import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import Toast from 'react-native-toast-message';
import { PaperProvider } from "react-native-paper";
import { MD3LightThemeCustom, MD3DarkThemeCustom } from "@/theme/md3-theme";
// import { cargarFormulas } from "@/data/formulas";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	const theme = colorScheme === "dark" ? MD3DarkThemeCustom : MD3LightThemeCustom;

	useEffect(() => {
		// Cargar las fórmulas desde el archivo al iniciar la aplicación
		const inicializarDatos = async () => {
			try {
				// await cargarFormulas();
				console.log("Datos de fórmulas inicializados correctamente");
			} catch (error) {
				console.error(`Error al inicializar los datos de fórmulas: ${error}`);
			}

			// Esperar 2 segundos antes de ocultar el splash
			if (loaded) {
				setTimeout(() => {
					SplashScreen.hideAsync();
				}, 2000);
			}
		};

		inicializarDatos();
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<PaperProvider theme={theme}>
			<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
				<Stack
					screenOptions={{
						headerBackTitle: "Volver",
					}}
				>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen name="+not-found" />
					<Stack.Screen
						name="formulas/[id]"
						options={{
							headerShown: false,
							title: "Volver",
							headerBackTitle: "Volver",
							headerBackVisible: true,
						}}
					/>
					<Stack.Screen
						name="formulas/nueva-formula"
						options={{
							title: "Volver",
							headerBackTitle: "Volver",
							headerBackVisible: true,
						}}
					/>
				</Stack>
				<Toast />
				<StatusBar style="auto" />
			</ThemeProvider>
		</PaperProvider>
	);
}
