import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { BorderRadius, Spacing } from "@/constants/Spacing";

/**
 * Tarjeta placeholder con efecto de pulso (shimmer) para estados de carga.
 * Sustituye al spinner a pantalla completa manteniendo la estructura visual
 * de las listas, lo que hace que la carga se perciba más rápida.
 */
export function SkeletonCard() {
	const theme = useTheme();
	const opacity = useSharedValue(0.5);

	useEffect(() => {
		opacity.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 600 }),
				withTiming(0.5, { duration: 600 }),
			),
			-1,
		);
	}, [opacity]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const blockColor = { backgroundColor: theme.colors.surfaceVariant };

	return (
		<Animated.View
			style={[
				styles.card,
				{ backgroundColor: theme.colors.elevation.level1 },
				animatedStyle,
			]}
		>
			<View style={styles.row}>
				<View style={[styles.title, blockColor]} />
				<View style={styles.actions}>
					<View style={[styles.circle, blockColor]} />
					<View style={[styles.quantity, blockColor]} />
					<View style={[styles.circle, blockColor]} />
				</View>
			</View>
		</Animated.View>
	);
}

interface SkeletonListProps {
	/** Número de tarjetas placeholder a mostrar. */
	count?: number;
}

export default function SkeletonList({ count = 6 }: SkeletonListProps) {
	return (
		<View style={styles.list}>
			{Array.from({ length: count }, (_, i) => (
				<SkeletonCard key={i} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	list: {
		paddingTop: Spacing.md,
	},
	card: {
		marginHorizontal: Spacing.md,
		marginVertical: Spacing.sm,
		borderRadius: BorderRadius.md,
		padding: Spacing.md,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	title: {
		width: "40%",
		height: 20,
		borderRadius: BorderRadius.sm,
	},
	actions: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.sm,
	},
	circle: {
		width: 36,
		height: 36,
		borderRadius: 18,
	},
	quantity: {
		width: 32,
		height: 24,
		borderRadius: BorderRadius.sm,
	},
});
