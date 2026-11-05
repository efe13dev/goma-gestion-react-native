import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useTheme as usePaperTheme } from "react-native-paper";

export default function TabLayout() {
	const paperTheme = usePaperTheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: paperTheme.colors.primary,
				tabBarInactiveTintColor: paperTheme.colors.onSurfaceVariant,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: "600",
				},
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: "absolute",
						backgroundColor: paperTheme.colors.surface,
					},
					default: {
						backgroundColor: paperTheme.colors.surface,
						borderTopColor: paperTheme.colors.outlineVariant,
						borderTopWidth: 1,
						height: 64,
						paddingTop: 6,
						paddingBottom: 8,
						elevation: 0,
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
