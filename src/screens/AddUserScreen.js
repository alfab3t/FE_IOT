import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import Input from "../components/Input";
import {
  ArrowLeft,
  User,
  ChevronDown,
} from "lucide-react-native";

export default function AddUserScreen({ route, navigation }) {
  const { managedUsers, addUser, updateUser } = useUser();
  const editUserId = route.params?.editUserId;
  const isEditMode = !!editUserId;

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Viewer"); // Admin, Owner/Controller, Viewer
  const [status, setStatus] = useState("Aktif"); // Aktif, Nonaktif
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const existingUser = managedUsers.find((u) => u.id === editUserId);
      if (existingUser) {
        setName(existingUser.name);
        setEmail(existingUser.email);
        setPhone(existingUser.phone || "");
        setRole(existingUser.role);
        setStatus(existingUser.status);
      }
    }
  }, [editUserId, isEditMode]);

  const handleSave = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !role) {
      Alert.alert("Perhatian", "Semua kolom bertanda bintang (*) wajib diisi.");
      return;
    }

    // Validation pattern for email (string methods to prevent regex backtracking warnings)
    const isValidEmail = email.includes("@") && email.includes(".") && email.indexOf("@") > 0 && email.lastIndexOf(".") > email.indexOf("@") + 1 && email.lastIndexOf(".") < email.length - 1;
    if (!isValidEmail) {
      Alert.alert("Perhatian", "Format email tidak valid.");
      return;
    }

    let roleId;
    if (role === "Admin") {
      roleId = "ROL001";
    } else if (role.includes("Owner")) {
      roleId = "ROL002";
    } else {
      roleId = "ROL003";
    }

    const userData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role,
      roleId: roleId,
      status: status,
    };

    if (isEditMode) {
      updateUser(editUserId, userData);
      Alert.alert("Sukses", "Informasi pengguna berhasil diperbarui.");
    } else {
      addUser(userData);
      Alert.alert("Sukses", "Pengguna baru berhasil ditambahkan.");
    }

    navigation.navigate("UsersList");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isEditMode ? "Edit Pengguna" : "Tambah Pengguna"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile photo circle */}
        <Text style={styles.formLabel}>Foto Profil</Text>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <User size={36} color="#94a3b8" />
          </View>
        </View>

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabelText}>
            Nama Lengkap<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <Input
            placeholder="Contoh: Pak Budi"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabelText}>
            Email<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <Input
            placeholder="Contoh: pakbudi@astratech.co.id"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabelText}>
            No. HP<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <Input
            placeholder="Contoh: 0812 3456 7890"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Custom Role Dropdown Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabelText}>
            Role<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.rolePickerBox}
            activeOpacity={0.8}
            onPress={() => setShowRoleDropdown(!showRoleDropdown)}
          >
            <Text style={styles.rolePickerText}>{role}</Text>
            <ChevronDown size={18} color="#64748b" />
          </TouchableOpacity>

          {showRoleDropdown && (
            <View style={styles.dropdownOptionsBox}>
              {["Admin", "Owner/Controller", "Viewer"].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={styles.dropdownOptionRow}
                  onPress={() => {
                    setRole(r);
                    setShowRoleDropdown(false);
                  }}
                >
                  <Text style={[styles.optionText, role === r && styles.optionTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Status Radio Buttons Selector */}
        <Text style={[styles.inputLabelText, { marginTop: 10 }]}>
          Status<Text style={styles.redAsterisk}>*</Text>
        </Text>
        
        {/* Option 1: Aktif */}
        <TouchableOpacity
          style={[styles.radioItemRow, status === "Aktif" && styles.radioItemRowActive]}
          onPress={() => setStatus("Aktif")}
          activeOpacity={0.9}
        >
          <View style={[styles.radioOuterCircle, status === "Aktif" && styles.radioOuterCircleActive]}>
            {status === "Aktif" && <View style={styles.radioInnerCircle} />}
          </View>
          <View style={styles.radioTextContainer}>
            <Text style={styles.radioTitleText}>Aktif</Text>
            <Text style={styles.radioDescText}>Pengguna dapat login & menggunakan sistem</Text>
          </View>
        </TouchableOpacity>

        {/* Option 2: Nonaktif */}
        <TouchableOpacity
          style={[styles.radioItemRow, status === "Nonaktif" && styles.radioItemRowActive]}
          onPress={() => setStatus("Nonaktif")}
          activeOpacity={0.9}
        >
          <View style={[styles.radioOuterCircle, status === "Nonaktif" && styles.radioOuterCircleActive]}>
            {status === "Nonaktif" && <View style={styles.radioInnerCircle} />}
          </View>
          <View style={styles.radioTextContainer}>
            <Text style={styles.radioTitleText}>Nonaktif</Text>
            <Text style={styles.radioDescText}>Pengguna tidak dapat login</Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons Row */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
