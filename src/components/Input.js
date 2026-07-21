import React from "react";
import { StyleSheet, Text, TextInput, View, Platform } from "react-native";

import { useUser } from "../context/UserContext";

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  editable = true,
  error,
  hideErrorText = false,
}) {
  const userCtx = useUser();
  const colors = userCtx?.colors || { background: "#fff", text: "#333", border: "#dee2e6", inputBackground: "#fff", textMuted: "#aaa" };

  const renderLabel = () => {
    if (!label) return null;
    if (label.includes("*")) {
      const parts = label.split("*");
      return (
        <Text style={[styles.label, { color: colors.text }]}>
          {parts[0]}
          <Text style={styles.requiredAsterisk}>*</Text>
          {parts.slice(1).join("*")}
        </Text>
      );
    }
    return <Text style={[styles.label, { color: colors.text }]}>{label}</Text>;
  };

  return (
    <View style={styles.container}>
      {renderLabel()}
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.inputBackground,
            borderColor: error ? "#ef4444" : colors.border
          },
          !editable && [styles.disabledInput, { backgroundColor: colors.border }]
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
      {error && typeof error === "string" && !hideErrorText && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0059AB",
    marginBottom: 6,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  requiredAsterisk: {
    color: "#ef4444",
    fontWeight: "800",
    marginLeft: 2,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#fff",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  disabledInput: {
    backgroundColor: "#e9ecef",
    color: "#777",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
});
