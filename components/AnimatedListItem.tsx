import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import Animated, {
	FadeInDown,
	FadeOut,
	LinearTransition,
} from "react-native-reanimated";

interface AnimatedListItemProps {
	/** Índice del elemento en la lista, usado para el efecto escalonado. */
	index?: number;
	children: ReactNode;
	style?: ViewStyle;
}

// Retardo entre elementos (ms). Se limita el índice para que en listas largas
// los últimos elementos no tarden demasiado en aparecer.
const STAGGER_MS = 45;
const MAX_STAGGER_INDEX = 8;

/**
 * Envoltorio para elementos de lista que añade:
 * - Entrada escalonada (fade + desplazamiento hacia arriba).
 * - Transición de layout suave al reordenarse/añadirse elementos.
 * - Salida con fade al eliminarse.
 */
export default function AnimatedListItem({
	index = 0,
	children,
	style,
}: AnimatedListItemProps) {
	const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_MS;

	return (
		<Animated.View
			style={style}
			entering={FadeInDown.delay(delay).springify().damping(16).stiffness(150)}
			exiting={FadeOut.duration(180)}
			layout={LinearTransition.springify().damping(18).stiffness(180)}
		>
			{children}
		</Animated.View>
	);
}
