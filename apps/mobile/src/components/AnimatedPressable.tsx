import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useRef } from "react";

type AnimatedPressableProps = PressableProps & {
  containerStyle?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

export function AnimatedPressable({
  containerStyle,
  style,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable
        {...rest}
        style={style}
        onPressIn={(event) => {
          Animated.timing(scale, {
            toValue: pressedScale,
            duration: 90,
            useNativeDriver: true,
          }).start();
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          Animated.timing(scale, {
            toValue: 1,
            duration: 140,
            useNativeDriver: true,
          }).start();
          onPressOut?.(event);
        }}
      />
    </Animated.View>
  );
}
