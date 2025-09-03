import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native-paper';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
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
  const previousQuantity = useRef(quantity);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (previousQuantity.current !== quantity) {
      const isIncreasing = quantity > previousQuantity.current;
      
      // Animación de contador digital
      translateY.value = withTiming(
        isIncreasing ? -30 : 30,
        { 
          duration: 150, 
          easing: Easing.out(Easing.quad) 
        },
        () => {
          // Después de salir, resetear posición y entrar desde el lado opuesto
          translateY.value = isIncreasing ? 30 : -30;
          opacity.value = 0;
          
          translateY.value = withTiming(0, {
            duration: 200,
            easing: Easing.out(Easing.back(1.2))
          });
          
          opacity.value = withTiming(1, {
            duration: 200,
            easing: Easing.out(Easing.quad)
          });
        }
      );
      
      opacity.value = withTiming(0, {
        duration: 150,
        easing: Easing.in(Easing.quad)
      });
      
      previousQuantity.current = quantity;
    }
  }, [quantity]);

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
          {quantity}
        </Text>
      </Animated.View>
    </View>
  );
}
