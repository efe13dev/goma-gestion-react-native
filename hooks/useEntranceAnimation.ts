import { useCallback, useState } from "react";
import {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from "react-native-reanimated";

/**
 * Encapsula la animación de entrada compartida por las pantallas principales
 * (header, contenido y FAB). Cada pantalla decide cuándo llamar a `start` y
 * `reset` según su propio estado de carga / modales.
 */
export function useEntranceAnimation() {
	const headerOpacity = useSharedValue(0);
	const headerTranslateY = useSharedValue(-50);
	const contentOpacity = useSharedValue(0);
	const contentTranslateY = useSharedValue(30);
	const fabScale = useSharedValue(0);
	const [animationsStarted, setAnimationsStarted] = useState(false);

	const start = useCallback(() => {
		setAnimationsStarted(true);
		// Header
		headerOpacity.value = withTiming(1, { duration: 300 });
		headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
		// Contenido con delay
		contentOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
		contentTranslateY.value = withDelay(
			100,
			withSpring(0, { damping: 15, stiffness: 120 }),
		);
		// FAB con más delay
		fabScale.value = withDelay(
			350,
			withSpring(1, { damping: 12, stiffness: 200 }),
		);
	}, [
		headerOpacity,
		headerTranslateY,
		contentOpacity,
		contentTranslateY,
		fabScale,
	]);

	const reset = useCallback(() => {
		setAnimationsStarted(false);
		headerOpacity.value = 0;
		headerTranslateY.value = -50;
		contentOpacity.value = 0;
		contentTranslateY.value = 30;
		fabScale.value = 0;
	}, [
		headerOpacity,
		headerTranslateY,
		contentOpacity,
		contentTranslateY,
		fabScale,
	]);

	const headerStyle = useAnimatedStyle(() => ({
		opacity: headerOpacity.value,
		transform: [{ translateY: headerTranslateY.value }],
	}));

	const contentStyle = useAnimatedStyle(() => ({
		opacity: contentOpacity.value,
		transform: [{ translateY: contentTranslateY.value }],
	}));

	const fabStyle = useAnimatedStyle(() => ({
		transform: [{ scale: fabScale.value }],
	}));

	return {
		animationsStarted,
		start,
		reset,
		headerStyle,
		contentStyle,
		fabStyle,
	};
}
