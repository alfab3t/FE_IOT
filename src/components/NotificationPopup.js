import React from "react";
import { StyleSheet, View, Text, Modal, TouchableOpacity } from "react-native";
import { useUser } from "../context/UserContext";
import { CheckCircle, AlertTriangle, XCircle, Info, HelpCircle } from "lucide-react-native";

export default function NotificationPopup({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Batal",
  type = "info", // info, success, warning, error, question
}) {
  const { colors } = useUser();

  const renderIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={32} color="#10b981" />;
      case "warning":
        return <AlertTriangle size={32} color="#f59e0b" />;
      case "error":
        return <XCircle size={32} color="#ef4444" />;
      case "question":
        return <HelpCircle size={32} color="#0059AB" />;
      case "info":
      default:
        return <Info size={32} color="#0059AB" />;
    }
  };

  let confirmBtnBgColor = "#0059AB";
  if (type === "success") {
    confirmBtnBgColor = "#10b981";
  } else if (type === "error") {
    confirmBtnBgColor = "#ef4444";
  } else if (type === "warning") {
    confirmBtnBgColor = "#f59e0b";
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.dialogBox, { backgroundColor: colors.cardBackground }]}>
          {/* Header Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
            {renderIcon()}
          </View>

          {/* Title */}
          <Text style={[styles.dialogTitle, { color: colors.text }]}>{title}</Text>

          {/* Message */}
          <Text style={[styles.dialogMessage, { color: colors.textMuted }]}>{message}</Text>

          {/* Buttons Row */}
          <View style={styles.buttonRow}>
            {onConfirm && (
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.btnCancelText, { color: colors.textMuted }]}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnConfirm,
                {
                  backgroundColor: confirmBtnBgColor,
                },
              ]}
              onPress={onConfirm || onClose}
            >
              <Text style={styles.btnConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)", // slate overlay
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogBox: {
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  dialogMessage: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  btnConfirm: {
    elevation: 1,
  },
  btnConfirmText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
