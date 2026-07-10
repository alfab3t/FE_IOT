import React from "react";
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from "react-native";

export default function Button({
  label,
  onPress,
  type = "primary",
  disabled = false,
  loading = false,
}) {
  const getButtonStyle = () => {
    switch (type) {
      case "primary":
        return styles.primary;
      case "secondary":
        return styles.secondary;
      case "success":
        return styles.success;
      case "danger":
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    if (type === "secondary") return styles.secondaryText;
    return styles.text;
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={type === "secondary" ? "#333" : "#fff"} size="small" />
      ) : (
        <Text style={[styles.text, getTextStyle()]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginVertical: 8,
    flexDirection: "row",
  },
  primary: {
    backgroundColor: "#0059AB",
  },
  secondary: {
    backgroundColor: "#e9ecef",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  success: {
    backgroundColor: "#10b981",
  },
  danger: {
    backgroundColor: "#ef4444",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryText: {
    color: "#333",
  },
});
