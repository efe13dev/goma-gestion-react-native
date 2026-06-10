import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// Colores del flash al cambiar la cantidad (subida / bajada).
const FLASH_INCREASE = '#2E7D32';
const FLASH_DECREASE = '#C62828';

interface AnimatedQuantityProps {
  quantity: number;
  variant?: 'headlineSmall' | 'titleMedium' | 'bodyLarge';
  style?: any;
}

export default function AnimatedQuantity({ 
  quantity, 
  variant = 'headlineSmall',
  style 
}: AnimatedQuantityProps) {
  const theme = useTheme();
  const [displayQuantity, setDisplayQuantity] = useState(quantity);
  const previousQuantity = useRef(quantity);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  // 0 = color base, 1 = color de flash (verde al subir, rojo al bajar).
  const flashProgress = useSharedValue(0);
  const [flashColor, setFlashColor] = useState(FLASH_INCREASE);

  const baseColor =
    (StyleSheet.flatten(style)?.color as string | undefined) ??
    theme.colors.onSurface;

  useEffect(() => {
    if (previousQuantity.current !== quantity) {
      const isIncreasing = quantity > previousQuantity.current;

      // Flash de color para reforzar la dirección del cambio.
      setFlashColor(isIncreasing ? FLASH_INCREASE : FLASH_DECREASE);
      flashProgress.value = 1;
      flashProgress.value = withDelay(
        150,
        withTiming(0, { duration: 450, easing: Easing.out(Easing.quad) }),
      );

      // Animación rápida: sale el valor anterior, se actualiza el texto, entra el nuevo
      const exitDistance = 12;
      const exitDuration = 70;
      const enterDuration = 90;

      translateY.value = withTiming(
        isIncreasing ? -exitDistance : exitDistance,
        {
          duration: exitDuration,
          easing: Easing.out(Easing.quad),
        },
        () => {
          runOnJS(setDisplayQuantity)(quantity);

          translateY.value = isIncreasing ? exitDistance : -exitDistance;
          opacity.value = 0;

          translateY.value = withTiming(0, {
            duration: enterDuration,
            easing: Easing.out(Easing.quad),
          });

          opacity.value = withTiming(1, {
            duration: enterDuration,
            easing: Easing.out(Easing.quad),
          });
        },
      );

      opacity.value = withTiming(0, {
        duration: exitDuration,
        easing: Easing.in(Easing.quad),
      });

      previousQuantity.current = quantity;
    }
  }, [quantity, opacity, translateY, flashProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const animatedColorStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        flashProgress.value,
        [0, 1],
        [baseColor, flashColor],
      ),
    };
  });

  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View style={animatedStyle}>
        {/* Animated.Text de Reanimated con la tipografía MD3 del tema:
            el Text de Paper no es compatible con createAnimatedComponent. */}
        <Animated.Text style={[theme.fonts[variant], style, animatedColorStyle]}>
          {displayQuantity}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}
