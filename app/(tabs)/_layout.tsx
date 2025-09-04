import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useTheme } from "@/contexts/ThemeContext";
import { useTheme as usePaperTheme } from "react-native-paper";

export default function TabLayout() {
	const { actualTheme } = useTheme();
	const paperTheme = usePaperTheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: paperTheme.colors.primary,
				tabBarInactiveTintColor: paperTheme.colors.onSurfaceVariant,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: "absolute",
						backgroundColor: paperTheme.colors.surface,
					},
					default: {
						backgroundColor: paperTheme.colors.surface,
						borderTopColor: paperTheme.colors.surfaceVariant,
						borderTopWidth: 1,
					},
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
	);
}
