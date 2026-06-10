import type { MD3Theme } from "react-native-paper";
import {
	BaseToast,
	type BaseToastProps,
	type ToastConfig,
} from "react-native-toast-message";

/**
 * Crea la configuración de toasts tematizada con Material Design 3.
 * Así los toasts respetan el tema activo (claro/oscuro) en lugar de usar
 * el estilo blanco por defecto de la librería.
 */
export function createToastConfig(theme: MD3Theme): ToastConfig {
	const buildToast = (accentColor: string) => {
		const ThemedToast = (props: BaseToastProps) => (
			<BaseToast
				{...props}
				style={{
					borderLeftColor: accentColor,
					backgroundColor: theme.colors.elevation.level3,
					borderRadius: 12,
				}}
				contentContainerStyle={{ paddingHorizontal: 12 }}
				text1Style={{
					fontSize: 16,
					fontWeight: "700",
					color: theme.colors.onSurface,
				}}
				text2Style={{
					fontSize: 14,
					color: theme.colors.onSurfaceVariant,
				}}
				text2NumberOfLines={2}
			/>
		);
		return ThemedToast;
	};

	return {
		success: buildToast(theme.colors.primary),
		error: buildToast(theme.colors.error),
		info: buildToast(theme.colors.tertiary),
	};
}
