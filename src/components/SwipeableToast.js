import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Animated,
  PanResponder,
  Text,
  View,
  Dimensions,
} from "react-native";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react-native";

const width = Dimensions.get("window")?.width || 360;
const SWIPE_THRESHOLD = width * 0.35;

export default function SwipeableToast({ message, type, colors, onDismiss, onPress, language = "Indonesia" }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Reset position when message changes
    pan.setValue({ x: 0, y: 0 });
  }, [message]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        // If movement is very small, it is a click/tap
        if (Math.abs(gestureState.dx) < 7 && Math.abs(gestureState.dy) < 7) {
          if (onPress) {
            onPress();
          }
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right to dismiss
          Animated.timing(pan, {
            toValue: { x: width, y: 0 },
            duration: 150,
            useNativeDriver: false,
          }).start(() => onDismiss());
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left to dismiss
          Animated.timing(pan, {
            toValue: { x: -width, y: 0 },
            duration: 150,
            useNativeDriver: false,
          }).start(() => onDismiss());
        } else {
          // Spring back to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const renderIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={22} color="#10b981" />;
      case "warning":
        return <AlertTriangle size={22} color="#f59e0b" />;
      case "error":
        return <XCircle size={22} color="#ef4444" />;
      case "info":
      default:
        return <Info size={22} color="#0059AB" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "#10b981";
      case "warning":
        return "#f59e0b";
      case "error":
        return "#ef4444";
      default:
        return "#0059AB";
    }
  };

  const isIndo = language === "Indonesia";
  let titleText = isIndo ? "Pemberitahuan" : "Notification";
  if (type === "warning") {
    titleText = isIndo ? "Peringatan Sensor" : "Sensor Warning";
  } else if (type === "success") {
    titleText = isIndo ? "Sukses" : "Success";
  } else if (type === "error") {
    titleText = isIndo ? "Gagal" : "Failed";
  }

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          opacity: opacity,
          transform: [{ translateX: pan.x }],
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderLeftColor: getBorderColor(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.iconBox}>{renderIcon()}</View>
      <View style={styles.textBox}>
        <Text style={[styles.titleText, { color: colors.text }]}>
          {titleText}
        </Text>
        <Text style={[styles.messageText, { color: colors.textMuted }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderLeftWidth: 6,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  iconBox: {
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  textBox: {
    flex: 1,
    justifyContent: "center",
  },
  titleText: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  messageText: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "500",
  },
});
