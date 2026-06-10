import * as SplashScreen from "expo-splash-screen";
import { createContext, useContext, useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
	Easing,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSequence,
	withTiming,
} from "react-native-reanimated";

// Contexto para que las pantallas sepan cuándo terminó el splash animado y
// puedan arrancar sus propias animaciones de entrada sin quedar tapadas.
const SplashDoneContext = createContext(true);
export const SplashDoneProvider = SplashDoneContext.Provider;
export const useSplashDone = () => useContext(SplashDoneContext);

const GRAIN_COUNT = 14;
const GRAIN_FALL_MS = 650;
const GRAIN_STAGGER_MS = 80;
const ZOOM_OUT_AT_MS = 1700;
const ZOOM_OUT_MS = 450;
// Debe coincidir con "imageWidth" del plugin expo-splash-screen en app.json
// para que la transición splash nativo -> overlay sea invisible.
const IMAGE_SIZE = 240;

// Pseudo-aleatorio determinista por índice para que cada grano tenga su propia
// trayectoria sin re-aleatorizarse en cada render.
const rand = (i: number, salt: number) => {
	const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
	return x - Math.floor(x);
};

function Grain({ index }: { index: number }) {
	const { width, height } = useWindowDimensions();
	const progress = useSharedValue(0);

	const size = 5 + rand(index, 1) * 6;
	// Caen sobre el ancho de la imagen (centrada), no sobre toda la pantalla.
	const startX = width / 2 + (rand(index, 2) - 0.5) * IMAGE_SIZE * 0.7;
	const drift = (rand(index, 3) - 0.5) * 30;
	// Los granos "aterrizan" en la boca de la cubeta (centro de la pantalla).
	const endY = height / 2 + (rand(index, 4) - 0.7) * IMAGE_SIZE * 0.25;
	const rotation = (rand(index, 5) - 0.5) * 360;

	useEffect(() => {
		progress.value = withDelay(
			150 + index * GRAIN_STAGGER_MS,
			withTiming(1, {
				duration: GRAIN_FALL_MS,
				easing: Easing.in(Easing.quad),
			}),
		);
	}, [index, progress]);

	const style = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0, 0.08, 0.82, 1], [0, 1, 1, 0]),
		transform: [
			{ translateX: startX + interpolate(progress.value, [0, 1], [0, drift]) },
			{ translateY: interpolate(progress.value, [0, 1], [-40, endY]) },
			{ rotate: `${interpolate(progress.value, [0, 1], [0, rotation])}deg` },
		],
	}));

	return (
		<Animated.View
			style={[
				styles.grain,
				{ width: size, height: size, borderRadius: size / 2 },
				style,
			]}
		/>
	);
}

interface AnimatedSplashProps {
	onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
	const overlayOpacity = useSharedValue(1);
	const imageScale = useSharedValue(1);

	useEffect(() => {
		// Latido sutil mientras caen los granos, seguido del zoom-out final.
		// El latido dura 1700ms = ZOOM_OUT_AT_MS, así el zoom arranca a la vez
		// que el fade del overlay.
		imageScale.value = withSequence(
			withTiming(1.03, { duration: 850, easing: Easing.inOut(Easing.sin) }),
			withTiming(1, { duration: 850, easing: Easing.inOut(Easing.sin) }),
			withTiming(1.15, { duration: ZOOM_OUT_MS, easing: Easing.out(Easing.cubic) }),
		);
		overlayOpacity.value = withDelay(
			ZOOM_OUT_AT_MS,
			withTiming(0, { duration: ZOOM_OUT_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
				if (finished) runOnJS(onFinish)();
			}),
		);
	}, [imageScale, overlayOpacity, onFinish]);

	const overlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
	}));
	const imageStyle = useAnimatedStyle(() => ({
		transform: [{ scale: imageScale.value }],
	}));

	return (
		<Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
			<Animated.Image
				source={require("../assets/images/splash-init.png")}
				style={[styles.image, imageStyle]}
				resizeMode="contain"
				// Ocultar el splash nativo recién cuando la imagen del overlay ya
				// está renderizada: la transición es invisible (misma imagen).
				onLoadEnd={() => SplashScreen.hideAsync()}
				fadeDuration={0}
			/>
			{Array.from({ length: GRAIN_COUNT }, (_, i) => (
				<Grain key={i} index={i} />
			))}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "#ffffff",
		zIndex: 1000,
		alignItems: "center",
		justifyContent: "center",
	},
	image: {
		width: IMAGE_SIZE,
		height: IMAGE_SIZE,
	},
	grain: {
		position: "absolute",
		top: 0,
		left: 0,
		backgroundColor: "#1a1a1a",
	},
});
