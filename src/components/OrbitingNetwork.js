import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Easing } from "react-native";

export default function OrbitingNetwork({ children, radius = 100, duration = 12000 }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start orbit loop
    const orbit = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    orbit.start();

    // Gracefully fade in after layout measurements settle down
    Animated.sequence([
      Animated.delay(350),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      orbit.stop();
    };
  }, [spinValue, opacityAnim, duration]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const counterSpin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  // 6 badges spaced equally in a circle (60 degrees apart)
  const angles = [0, 60, 120, 180, 240, 300];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.orbitingWrapper,
          {
            opacity: opacityAnim,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        {React.Children.map(children, (child, index) => {
          const angleRad = (angles[index] || 0) * (Math.PI / 180);
          const tx = radius * Math.cos(angleRad);
          const ty = radius * Math.sin(angleRad);

          return (
            <View
              style={[
                styles.badgeWrapper,
                {
                  transform: [
                    { translateX: tx },
                    { translateY: ty },
                  ],
                },
              ]}
            >
              {/* Counter-rotate individual badges to keep them upright */}
              <Animated.View style={{ transform: [{ rotate: counterSpin }] }}>
                {child}
              </Animated.View>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  orbitingWrapper: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
