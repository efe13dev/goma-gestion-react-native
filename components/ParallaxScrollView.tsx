import type { PropsWithChildren, ReactElement } from "react";
import { StyleSheet } from "react-native";
import Animated, {
	interpolate,
	useAnimatedRef,
	useAnimatedStyle,
	useScrollViewOffset,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";

const HEADER_HEIGHT = 150;

type Props = PropsWithChildren<{
	headerImage: ReactElement;
	headerBackgroundColor: { dark: string; light: string };
	headerHeight?: number;
	withNavHeader?: boolean;
}>;

export default function ParallaxScrollView({
	children,
	headerImage,
	headerBackgroundColor,
	headerHeight = HEADER_HEIGHT,
	withNavHeader = true,
}: Props) {
	const colorScheme = useColorScheme() ?? "light";
	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const scrollOffset = useScrollViewOffset(scrollRef);
	const bottom = useBottomTabOverflow();
	
	const headerAnimatedStyle = useAnimatedStyle(() => {
		const translateYValues = withNavHeader 
			? [-headerHeight / 2, 0, headerHeight * 0.5] 
			: [-headerHeight / 2, 0, headerHeight * 0.75];
			
		return {
			transform: [
				{
					translateY: interpolate(
						scrollOffset.value,
						[-headerHeight, 0, headerHeight],
						translateYValues,
					),
				},
				{
					scale: interpolate(
						scrollOffset.value,
						[-headerHeight, 0, headerHeight],
						[1.5, 1, 1],
					),
				},
			],
		};
	});

	return (
		<ThemedView style={styles.container}>
			<Animated.ScrollView
				ref={scrollRef}
				scrollEventThrottle={16}
				scrollIndicatorInsets={{ bottom }}
				contentContainerStyle={{ paddingBottom: bottom }}
			>
				<Animated.View
					style={[
						styles.header,
						{ 
							backgroundColor: headerBackgroundColor[colorScheme],
							height: headerHeight,
						},
						headerAnimatedStyle,
					]}
				>
					{headerImage}
				</Animated.View>
				<ThemedView style={styles.content}>{children}</ThemedView>
			</Animated.ScrollView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		overflow: "hidden",
	},
	content: {
		flex: 1,
		padding: 32,
		gap: 16,
		overflow: "hidden",
	},
});
