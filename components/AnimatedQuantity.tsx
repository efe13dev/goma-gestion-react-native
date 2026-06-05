import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
  const [displayQuantity, setDisplayQuantity] = useState(quantity);
  const previousQuantity = useRef(quantity);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (previousQuantity.current !== quantity) {
      const isIncreasing = quantity > previousQuantity.current;

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
  }, [quantity, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View style={animatedStyle}>
        <Text variant={variant} style={style}>
          {displayQuantity}
        </Text>
      </Animated.View>
    </View>
  );
}
