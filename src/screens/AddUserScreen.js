import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import Input from "../components/Input";
import NotificationPopup from "../components/NotificationPopup";
import {
  ArrowLeft,
  User,
  ChevronDown,
} from "lucide-react-native";

export default function AddUserScreen({ navigation }) {
  const { addUser, colors, theme, t, language } = useUser();

  // Form States
  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [role, setRole] = useState("Viewer"); // Admin, Owner/Controller, Viewer
  const [status, setStatus] = useState("Aktif"); // Aktif, Nonaktif
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Custom Popup States
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");
  const [popupConfirmText] = useState("OK");
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  // Validation Error States
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSave = async () => {
    let hasError = false;

    if (!usernameInput.trim()) {
      setUsernameError(language === "Indonesia" ? "Username wajib diisi." : "Username is required.");
      hasError = true;
    } else {
      setUsernameError("");
    }

    if (!emailInput.trim()) {
      setEmailError(language === "Indonesia" ? "Email wajib diisi." : "Email is required.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      setEmailError(language === "Indonesia" ? "Format email tidak valid." : "Invalid email format.");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (!passwordInput.trim()) {
      setPasswordError(language === "Indonesia" ? "Password wajib diisi." : "Password is required.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (hasError) return;

    const userData = {
      username: usernameInput.trim(),
      email: emailInput.trim(),
      password: passwordInput,
      roleId: role,
      status: status,
    };

    const response = await addUser(userData);
    if (response?.error) {
      setPopupTitle(language === "Indonesia" ? "Gagal" : "Error");
      setPopupMessage(
        language === "Indonesia" 
          ? response.message || "Gagal menambahkan pengguna." 
          : "Failed to add new user."
      );
      setPopupType("error");
      setOnConfirmAction(null);
      setPopupVisible(true);
    } else {
      setPopupTitle(language === "Indonesia" ? "Sukses" : "Success");
      setPopupMessage(
        language === "Indonesia" ? "Pengguna baru berhasil ditambahkan." : "New user successfully added."
      );
      setPopupType("success");
      setOnConfirmAction(() => () => {
        setPopupVisible(false);
        navigation.navigate("UsersList");
      });
      setPopupVisible(true);
    }
  };

  let activeBgColor = colors.cardBackground;
  if (status === "Aktif") {
    activeBgColor = theme === "Dark Mode" ? "#1e293b" : "#f0f9ff";
  }

  let inactiveBgColor = colors.cardBackground;
  if (status === "Tidak Aktif") {
    inactiveBgColor = theme === "Dark Mode" ? "#1e293b" : "#f0f9ff";
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("UsersList");
            }
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("tambah_pengguna")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile photo circle */}
        <Text style={[styles.formLabel, { color: colors.text }]}>{t("foto_profil")}</Text>
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}>
            <User size={36} color={colors.textMuted} />
          </View>
        </View>

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>
            Username<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <Input
            placeholder="Masukkan Username (Contoh: user123)"
            value={usernameInput}
            onChangeText={(val) => {
              setUsernameInput(val);
              if (!val.trim()) {
                setUsernameError(language === "Indonesia" ? "Username wajib diisi." : "Username is required.");
              } else {
                setUsernameError("");
              }
            }}
            autoCapitalize="none"
            error={usernameError}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>
            Email Pengguna<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <Input
            placeholder="Masukkan Email (Contoh: user@gmail.com)"
            value={emailInput}
            onChangeText={(val) => {
              setEmailInput(val);
              if (!val.trim()) {
                setEmailError(language === "Indonesia" ? "Email wajib diisi." : "Email is required.");
              } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
                setEmailError(language === "Indonesia" ? "Format email tidak valid." : "Invalid email format.");
              } else {
                setEmailError("");
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>
            Password<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <Input
            placeholder="Masukkan Password"
            value={passwordInput}
            onChangeText={(val) => {
              setPasswordInput(val);
              if (!val.trim()) {
                setPasswordError(language === "Indonesia" ? "Password wajib diisi." : "Password is required.");
              } else {
                setPasswordError("");
              }
            }}
            secureTextEntry={true}
            error={passwordError}
          />
        </View>

        {/* Custom Role Dropdown Picker */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>
            {t("role")}<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.rolePickerBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => setShowRoleDropdown(!showRoleDropdown)}
          >
            <Text style={[styles.rolePickerText, { color: colors.text }]}>{role}</Text>
            <ChevronDown size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {showRoleDropdown && (
            <View style={[styles.dropdownOptionsBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              {["Admin", "Owner/Controller", "Viewer"].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={styles.dropdownOptionRow}
                  onPress={() => {
                    setRole(r);
                    setShowRoleDropdown(false);
                  }}
                >
                  <Text style={[styles.optionText, role === r ? styles.optionTextActive : { color: colors.textMuted }]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Status Radio Buttons Selector */}
        <Text style={[styles.inputLabelText, { marginTop: 10, color: colors.text }]}>
          {t("status")}<Text style={styles.redAsterisk}>*</Text>
        </Text>
        
        {/* Option 1: Aktif */}
        <TouchableOpacity
          style={[
            styles.radioItemRow,
            {
              borderColor: status === "Aktif" ? "#0059AB" : colors.border,
              backgroundColor: activeBgColor
            }
          ]}
          onPress={() => setStatus("Aktif")}
          activeOpacity={0.9}
        >
          <View style={[styles.radioOuterCircle, { borderColor: status === "Aktif" ? "#0059AB" : colors.textMuted }]}>
            {status === "Aktif" && <View style={styles.radioInnerCircle} />}
          </View>
          <View style={styles.radioTextContainer}>
            <Text style={[styles.radioTitleText, { color: colors.text }]}>{t("aktif")}</Text>
            <Text style={[styles.radioDescText, { color: colors.textMuted }]}>{t("pengguna_dapat_login")}</Text>
          </View>
        </TouchableOpacity>

        {/* Option 2: Tidak Aktif */}
        <TouchableOpacity
          style={[
            styles.radioItemRow,
            {
              borderColor: status === "Tidak Aktif" ? "#0059AB" : colors.border,
              backgroundColor: inactiveBgColor
            }
          ]}
          onPress={() => setStatus("Tidak Aktif")}
          activeOpacity={0.9}
        >
          <View style={[styles.radioOuterCircle, { borderColor: status === "Tidak Aktif" ? "#0059AB" : colors.textMuted }]}>
            {status === "Tidak Aktif" && <View style={styles.radioInnerCircle} />}
          </View>
          <View style={styles.radioTextContainer}>
            <Text style={[styles.radioTitleText, { color: colors.text }]}>{t("nonaktif")}</Text>
            <Text style={[styles.radioDescText, { color: colors.textMuted }]}>{t("pengguna_tidak_dapat_login")}</Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons Row */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("UsersList");
              }
            }}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>{t("batal")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>{t("simpan")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NotificationPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        confirmText={popupConfirmText}
        onConfirm={onConfirmAction}
        onClose={() => setPopupVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  navbar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: {
    padding: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  avatarSection: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabelText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  redAsterisk: {
    color: "#ef4444",
  },
  rolePickerBox: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  rolePickerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  dropdownOptionsBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  optionTextActive: {
    color: "#0059AB",
    fontWeight: "800",
  },
  radioItemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  radioItemRowActive: {
    borderColor: "#0059AB",
    backgroundColor: "#f0f9ff",
  },
  radioOuterCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  radioOuterCircleActive: {
    borderColor: "#0059AB",
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0059AB",
  },
  radioTextContainer: {
    flex: 1,
  },
  radioTitleText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  radioDescText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14,
  },
  saveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#0059AB",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});
