import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { PaperProvider } from "react-native-paper";
import { MD3LightThemeCustom, MD3DarkThemeCustom } from "@/theme/md3-theme";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const theme = colorScheme === "dark" ? MD3DarkThemeCustom : MD3LightThemeCustom;

	return (
		<PaperProvider theme={theme}>
			<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: "absolute",
					},
					default: {},
				}),
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Stock",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="cube.fill" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="formulas"
				options={{
					title: "Fórmulas",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="testtube.2" color={color} />
					),
				}}
			/>
		</Tabs>
		</PaperProvider>
	);
}
