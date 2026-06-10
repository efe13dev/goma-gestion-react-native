import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import "react-native-reanimated";
import Toast from 'react-native-toast-message';
import { PaperProvider } from "react-native-paper";
import { MD3LightThemeCustom, MD3DarkThemeCustom } from "@/theme/md3-theme";
import { createToastConfig } from "@/components/ToastConfig";
import { ThemeProvider as CustomThemeProvider, useTheme } from "@/contexts/ThemeContext";
// import { cargarFormulas } from "@/data/formulas";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
	const { actualTheme } = useTheme();
	const theme = actualTheme === "dark" ? MD3DarkThemeCustom : MD3LightThemeCustom;
	const toastConfig = useMemo(() => createToastConfig(theme), [theme]);

	return (
		<PaperProvider theme={theme}>
			<ThemeProvider value={actualTheme === "dark" ? DarkTheme : DefaultTheme}>
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
				<Toast config={toastConfig} />
				<StatusBar style={actualTheme === "dark" ? "light" : "dark"} />
			</ThemeProvider>
		</PaperProvider>
	);
}

export default function RootLayout() {
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			// SplashScreen.hideAsync(); // Lo moveremos a la pantalla principal
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<CustomThemeProvider>
			<RootLayoutContent />
		</CustomThemeProvider>
	);
}
