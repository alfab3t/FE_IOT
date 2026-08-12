import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Input from "../components/Input";
import { ArrowLeft, ChevronDown, User, Upload } from "lucide-react-native";
import NotificationPopup from "../components/NotificationPopup";

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const mapRoleIdToName = (val) => {
  if (!val) return "Viewer";
  const str = String(val);
  if (str === "ROL001" || str === "ROL01" || str.toLowerCase().includes("admin")) return "Admin";
  if (str === "ROL002" || str === "ROL02" || str.toLowerCase().includes("owner") || str.toLowerCase().includes("controller")) return "Owner/Controller";
  if (str === "ROL003" || str === "ROL03" || str.toLowerCase().includes("viewer")) return "Viewer";
  return val;
};

const mapRoleNameToId = (val) => {
  if (val === "Admin") return "ROL001";
  if (val === "Owner/Controller") return "ROL002";
  if (val === "Viewer") return "ROL003";
  return val;
};

export default function EditUserScreen({ route, navigation }) {
  const { colors, language, t, theme, updateUser } = useUser();
  const { editUsername } = route.params;
  const isIndo = language === "Indonesia";

  // Form States
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [role, setRole] = useState("Viewer");
  const [status, setStatus] = useState("Aktif");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  // Inline Validation Errors (Matching AddUserScreen.js)
  const [photoError, setPhotoError] = useState("");
  const [emailError, setEmailError] = useState("");

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Custom Popup States
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");
  const [popupConfirmText] = useState("OK");
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const showPopup = (title, message, type = "error") => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setOnConfirmAction(null);
    setPopupVisible(true);
  };

  useEffect(() => {
    const fetchUserDetail = async () => {
      setIsLoading(true);
      const res = await iotService.getUserDetail(editUsername);
      setIsLoading(false);
      if (res && !res.error) {
        const uData = res.data || res.Data || res;
        setEmailInput(uData.email || uData.Email || "");
        const rawRole = uData.roleName || uData.RoleName || uData.roleId || uData.RoleId || "ROL003";
        setRole(mapRoleIdToName(rawRole));
        setStatus(uData.status || uData.Status || "Aktif");

        const rawPhoto = uData.photo || uData.Photo || null;
        const cleanPhoto = rawPhoto && String(rawPhoto).trim() !== "" ? String(rawPhoto).trim() : null;
        setOriginalPhoto(cleanPhoto);
        setPhotoUri(cleanPhoto);
      }
    };
    fetchUserDetail();
  }, [editUsername]);

  // ── Photo picking ──────────────────────────
  const processPickedAsset = (asset) => {
    if (asset.fileSize && asset.fileSize > MAX_PHOTO_SIZE_BYTES) {
      showPopup(
        isIndo ? "Ukuran Terlalu Besar" : "File Too Large",
        isIndo ? "Ukuran foto maksimal 2MB." : "Maximum photo size is 2MB."
      );
      return;
    }
    setPhotoUri(asset.uri);
    setPhotoBase64(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    setPhotoRemoved(false);
    setPhotoError("");
  };

  const handlePickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showPopup(
        isIndo ? "Izin Ditolak" : "Permission Denied",
        isIndo ? "Akses ke galeri foto diperlukan." : "Photo library access is required."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      processPickedAsset(result.assets[0]);
    }
  };

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showPopup(
        isIndo ? "Izin Ditolak" : "Permission Denied",
        isIndo ? "Akses ke kamera diperlukan." : "Camera access is required."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      processPickedAsset(result.assets[0]);
    }
  };

  const handlePickPhoto = () => {
    Alert.alert(
      isIndo ? "Ubah Foto Profil" : "Change Profile Photo",
      isIndo ? "Ambil foto baru atau pilih dari galeri." : "Take a new photo or choose from gallery.",
      [
        { text: isIndo ? "Kamera" : "Camera", onPress: handleTakePhoto },
        { text: isIndo ? "Galeri" : "Gallery", onPress: handlePickFromGallery },
        { text: isIndo ? "Batal" : "Cancel", style: "cancel" },
      ]
    );
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setPhotoRemoved(true);
    setPhotoError(isIndo ? "Foto profil wajib diunggah." : "Profile photo is required.");
  };

  const validateForm = () => {
    let hasError = false;

    const photoToSend = photoBase64
      ? photoBase64
      : photoRemoved
        ? null
        : originalPhoto;

    if (!photoToSend) {
      setPhotoError(isIndo ? "Foto profil wajib diunggah." : "Profile photo is required.");
      hasError = true;
    } else {
      setPhotoError("");
    }

    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail) {
      setEmailError(isIndo ? "Email wajib diisi." : "Email is required.");
      hasError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError(isIndo ? "Format email tidak valid." : "Invalid email format.");
      hasError = true;
    } else {
      setEmailError("");
    }

    return !hasError;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const photoToSend = photoBase64
      ? photoBase64
      : photoRemoved
        ? null
        : originalPhoto;

    const userData = {
      username: editUsername,
      email: emailInput.trim(),
      password: passwordInput,
      roleId: mapRoleNameToId(role),
      status: status,
      photo: photoToSend,
    };

    setIsSubmitting(true);
    let response;
    try {
      response = await updateUser(editUsername, userData);
    } catch (err) {
      response = { error: true, message: err.message };
    } finally {
      setIsSubmitting(false);
    }

    const isError = !response || response.error || response.status >= 400;

    if (isError) {
      const errTitle = isIndo ? "Gagal" : "Error";
      const errMsg = isIndo ? response?.message || "Gagal memperbarui pengguna." : "Failed to update user details.";
      setPopupTitle(errTitle);
      setPopupMessage(errMsg);
      setPopupType("error");
      setOnConfirmAction(null);
      setPopupVisible(true);
    } else {
      const succTitle = isIndo ? "Sukses" : "Success";
      const succMsg = isIndo ? "Data pengguna berhasil diperbarui." : "User details successfully updated.";

      const onOkPress = () => {
        setPopupVisible(false);
        navigation.navigate("UsersList");
      };

      setPopupTitle(succTitle);
      setPopupMessage(succMsg);
      setPopupType("success");
      setOnConfirmAction(() => onOkPress);
      setPopupVisible(true);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate("UsersList");
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("edit_pengguna")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile photo */}
        <Text style={[styles.formLabel, { color: colors.text }]}>
          {t("foto_profil")}<Text style={styles.redAsterisk}>*</Text>
        </Text>
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: colors.border, borderColor: colors.cardBorder, overflow: "hidden" }]}
            onPress={handlePickPhoto}
            activeOpacity={0.8}
          >
            {photoUri ? (
              <Image
                source={{
                  uri: photoUri.startsWith("data:") || photoUri.startsWith("http") || photoUri.startsWith("file:") || photoUri.startsWith("content:")
                    ? photoUri
                    : `data:image/jpeg;base64,${photoUri}`,
                }}
                style={styles.avatarImage}
              />
            ) : (
              <User size={36} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          <View style={styles.avatarActions}>
            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickPhoto} activeOpacity={0.8}>
              <Upload size={14} color="#0059AB" />
              <Text style={styles.uploadBtnText}>{isIndo ? "Ganti Foto" : "Change Photo"}</Text>
            </TouchableOpacity>

            {photoUri && (
              <TouchableOpacity onPress={handleRemovePhoto} activeOpacity={0.8}>
                <Text style={styles.removePhotoText}>{isIndo ? "Hapus" : "Remove"}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.photoHintText, { color: colors.textMuted }]}>
            {isIndo
              ? "Format: JPG, PNG. Ukuran maks. 2MB."
              : "Format: JPG, PNG. Max size 2MB."}
          </Text>

          {photoError ? (
            <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: "600", marginTop: 6 }}>
              {photoError}
            </Text>
          ) : null}
        </View>

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>Username</Text>
          <View style={[styles.rolePickerBox, { backgroundColor: colors.border, borderColor: colors.border }]}>
            <Text style={[styles.rolePickerText, { color: colors.textMuted }]}>{editUsername}</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>
            {isIndo ? "Email Pengguna" : "User Email"}<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <Input
            placeholder={isIndo ? "Masukkan Email (Contoh: user@gmail.com)" : "Enter Email (e.g. user@gmail.com)"}
            value={emailInput}
            onChangeText={(val) => {
              setEmailInput(val);
              if (!val.trim()) {
                setEmailError(isIndo ? "Email wajib diisi." : "Email is required.");
              } else if (!isValidEmail(val.trim())) {
                setEmailError(isIndo ? "Format email tidak valid." : "Invalid email format.");
              } else {
                setEmailError("");
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>
            {isIndo ? "Password Baru (Kosongkan jika tidak diubah)" : "New Password (Leave blank if unchanged)"}
          </Text>
          <Input
            placeholder={isIndo ? "Masukkan Password Baru (Opsional)" : "Enter New Password (Optional)"}
            value={passwordInput}
            onChangeText={(val) => setPasswordInput(val)}
            secureTextEntry={true}
          />
        </View>

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

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>
            {t("status")}<Text style={styles.redAsterisk}>*</Text>
          </Text>

          <TouchableOpacity
            style={[
              styles.statusSelectorRow,
              status === "Aktif" && { borderColor: "#0059AB", backgroundColor: theme === "Dark Mode" ? "#1e293b" : "#f0f9ff" },
              { borderColor: colors.border },
            ]}
            onPress={() => setStatus("Aktif")}
          >
            <View style={[styles.radioCircle, status === "Aktif" ? styles.radioCircleActive : { borderColor: colors.textMuted }]}>
              {status === "Aktif" && <View style={styles.radioInnerCircle} />}
            </View>
            <View style={styles.statusLabelColumn}>
              <Text style={[styles.statusMainLabelText, { color: colors.text }]}>{t("aktif")}</Text>
              <Text style={[styles.statusSubLabelText, { color: colors.textMuted }]}>{t("pengguna_dapat_login")}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusSelectorRow,
              status === "Tidak Aktif" && { borderColor: "#0059AB", backgroundColor: theme === "Dark Mode" ? "#1e293b" : "#f0f9ff" },
              { borderColor: colors.border },
            ]}
            onPress={() => setStatus("Tidak Aktif")}
          >
            <View style={[styles.radioCircle, status === "Tidak Aktif" ? styles.radioCircleActive : { borderColor: colors.textMuted }]}>
              {status === "Tidak Aktif" && <View style={styles.radioInnerCircle} />}
            </View>
            <View style={styles.statusLabelColumn}>
              <Text style={[styles.statusMainLabelText, { color: colors.text }]}>{t("nonaktif")}</Text>
              <Text style={[styles.statusSubLabelText, { color: colors.textMuted }]}>{t("pengguna_tidak_dapat_login")}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.cancelFormBtn, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate("UsersList");
            }}
          >
            <Text style={[styles.cancelFormText, { color: colors.text }]}>{t("batal")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveFormBtn} onPress={handleSave} disabled={isSubmitting}>
            <Text style={styles.saveFormText}>{t("simpan")}</Text>
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  navbar: {
    height: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backBtn: { padding: 8 },
  navTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  scrollContent: { padding: 20 },
  formLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 8, marginTop: 10 },
  avatarSection: { alignItems: "flex-start", marginBottom: 20 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#0059AB",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  uploadBtnText: { fontSize: 12, fontWeight: "800", color: "#0059AB" },
  removePhotoText: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  photoHintText: { fontSize: 10, fontWeight: "600", marginTop: 6 },
  inputContainer: { marginBottom: 16, width: "100%" },
  inputLabelText: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  redAsterisk: { color: "#ef4444" },
  rolePickerBox: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  rolePickerText: { fontSize: 14, fontWeight: "600" },
  dropdownOptionsBox: { borderWidth: 1, borderRadius: 12, marginTop: 6, overflow: "hidden" },
  dropdownOptionRow: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "transparent" },
  optionText: { fontSize: 14, fontWeight: "600" },
  optionTextActive: { color: "#0059AB", fontWeight: "800" },
  statusSelectorRow: { flexDirection: "row", alignItems: "center", padding: 14, borderWidth: 1, borderRadius: 12, marginBottom: 10 },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center", marginRight: 12 },
  radioCircleActive: { borderColor: "#0059AB" },
  radioInnerCircle: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#0059AB" },
  statusLabelColumn: { flex: 1 },
  statusMainLabelText: { fontSize: 13, fontWeight: "800" },
  statusSubLabelText: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 20, marginBottom: 40 },
  cancelFormBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  cancelFormText: { fontSize: 14, fontWeight: "800" },
  saveFormBtn: { flex: 1, height: 48, backgroundColor: "#0059AB", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveFormText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});