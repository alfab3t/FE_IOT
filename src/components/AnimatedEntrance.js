import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

export default function AnimatedEntrance({
  children,
  type = "fade", // fade, slideUp, slideDown, zoom
  duration = 600,
  delay = 0,
  style,
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [animatedValue, duration, delay]);

  const getStyleOverrides = () => {
    switch (type) {
      case "slideUp":
        return {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        };
      case "slideDown":
        return {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        };
      case "zoom":
        return {
          opacity: animatedValue,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        };
      case "fade":
      default:
        return {
          opacity: animatedValue,
        };
    }
  };

  return (
    <Animated.View style={[getStyleOverrides(), style]}>
      {children}
    </Animated.View>
  );
}
