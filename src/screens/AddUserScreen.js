import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "../context/UserContext";
import Input from "../components/Input";
import NotificationPopup from "../components/NotificationPopup";
import {
  ArrowLeft,
  ChevronDown,
  User,
  Upload,
} from "lucide-react-native";

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ACCEPTED_PHOTO_LABEL = "JPG, PNG";

const isValidEmail = (email) => {
  const atIdx = email.indexOf("@");
  const dotIdx = email.lastIndexOf(".");
  return atIdx > 0 && dotIdx > atIdx + 1 && dotIdx < email.length - 1;
};

export default function AddUserScreen({ navigation }) {
  const { addUser, colors, language, t, theme } = useUser();
  const isIndo = language === "Indonesia";

  // Form States
  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [role, setRole] = useState("Viewer"); // Admin, Owner/Controller, Viewer
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // New user is always created as Active.
  // Status can only be changed later from the Edit User screen.
  const status = "Aktif";

  // Profile Photo State
  const [photoUri, setPhotoUri] = useState(null); // local uri, only for preview
  const [photoBase64, setPhotoBase64] = useState(null); // "data:image/jpeg;base64,...." sent to backend

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
  const [photoError, setPhotoError] = useState("");

  const showPopup = (title, message, type = "error") => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setOnConfirmAction(null);
    setPopupVisible(true);
  };

  // Shared handling for whatever ImagePicker gives back, whether it came
  // from the gallery or the camera: validate size, derive mime type, and
  // store both the local preview uri and the base64 payload sent to the backend.
  const processPickedAsset = (asset) => {
    if (asset.fileSize && asset.fileSize > MAX_PHOTO_SIZE_BYTES) {
      showPopup(
        isIndo ? "Ukuran Terlalu Besar" : "File Too Large",
        isIndo ? `Ukuran foto maksimal 2MB.` : `Maximum photo size is 2MB.`
      );
      return;
    }

    if (!asset.base64) {
      showPopup(
        isIndo ? "Gagal Memuat Foto" : "Failed to Load Photo",
        isIndo ? "Tidak bisa membaca file foto ini." : "Could not read this photo file."
      );
      return;
    }

    const ext = (asset.uri.split(".").pop() || "jpg").toLowerCase();
    const mime = ext === "png" ? "image/png" : "image/jpeg";

    setPhotoUri(asset.uri); // for local preview only
    setPhotoBase64(`data:${mime};base64,${asset.base64}`);
    setPhotoError("");
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showPopup(
        isIndo ? "Izin Dibutuhkan" : "Permission Needed",
        isIndo
          ? "Aplikasi memerlukan akses galeri untuk mengunggah foto profil."
          : "The app needs gallery access to upload a profile photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // ask expo-image-picker to include base64 directly, no extra FS read needed
    });

    if (result.canceled) return;
    processPickedAsset(result.assets[0]);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showPopup(
        isIndo ? "Izin Dibutuhkan" : "Permission Needed",
        isIndo
          ? "Aplikasi memerlukan akses kamera untuk mengambil foto profil."
          : "The app needs camera access to take a profile photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled) return;
    processPickedAsset(result.assets[0]);
  };

  const handlePickPhoto = () => {
    Alert.alert(
      isIndo ? "Pilih Foto Profil" : "Choose Profile Photo",
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
  };

  const validateForm = () => {
    let hasError = false;

      if (!photoBase64) {
      setPhotoError(
        isIndo
          ? "Foto profil wajib diunggah."
          : "Profile photo is required."
      );
      hasError = true;
    } else {
      setPhotoError("");
    }

    if (!usernameInput.trim()) {
      setUsernameError(isIndo ? "Username wajib diisi." : "Username is required.");
      hasError = true;
    } else {
      setUsernameError("");
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

    if (!passwordInput.trim()) {
      setPasswordError(isIndo ? "Password wajib diisi." : "Password is required.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    return !hasError;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const mapRoleNameToId = (val) => {
      if (val === "Admin") return "ROL001";
      if (val === "Owner/Controller") return "ROL002";
      if (val === "Viewer") return "ROL003";
      return val;
    };

    // Plain object, sent as regular JSON — same shape as before, just with
    // an extra "photo" field (base64 data URI, or null if none was picked).
    const userData = {
      username: usernameInput.trim(),
      email: emailInput.trim(),
      password: passwordInput,
      roleId: mapRoleNameToId(role),
      status, // always "Aktif" on creation
      photo: photoBase64,
    };

    const response = await addUser(userData);

    if (response?.error) {
      const errTitle = isIndo ? "Gagal" : "Error";
      const errMsg = isIndo ? response.message || "Gagal menambahkan pengguna." : "Failed to add new user.";
      showPopup(errTitle, errMsg, "error");
    } else {
      const succTitle = isIndo ? "Sukses" : "Success";
      const succMsg = isIndo ? "Pengguna baru berhasil ditambahkan." : "New user successfully added.";

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
        <Text style={[styles.formLabel, { color: colors.text }]}>
          {t("foto_profil")}
          <Text style={styles.redAsterisk}>*</Text>
        </Text>        
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}
            onPress={handlePickPhoto}
            activeOpacity={0.8}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <User size={36} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          <View style={styles.avatarActions}>
            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickPhoto} activeOpacity={0.8}>
              <Upload size={14} color="#0059AB" />
              <Text style={styles.uploadBtnText}>
                {isIndo ? "Unggah Foto" : "Upload Photo"}
              </Text>
            </TouchableOpacity>

            {photoUri && (
              <TouchableOpacity onPress={handleRemovePhoto} activeOpacity={0.8}>
                <Text style={styles.removePhotoText}>
                  {isIndo ? "Hapus" : "Remove"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.photoHintText, { color: colors.textMuted }]}>
            {isIndo
              ? `Format: ${ACCEPTED_PHOTO_LABEL}. Ukuran maks. 2MB.`
              : `Format: ${ACCEPTED_PHOTO_LABEL}. Max size 2MB.`}
          </Text>

          {photoError ? (
            <Text style={styles.photoErrorText}>
              {photoError}
            </Text>
          ) : null}
        </View>

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>
            Username<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <Input
            placeholder={isIndo ? "Masukkan Username (Contoh: user123)" : "Enter Username (e.g. user123)"}
            value={usernameInput}
            onChangeText={(val) => {
              setUsernameInput(val);
              if (!val.trim()) {
                setUsernameError(isIndo ? "Username wajib diisi." : "Username is required.");
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

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabelText, { color: colors.text }]}>
            Password<Text style={styles.redAsterisk}>*</Text>
          </Text>
          <Input
            placeholder={isIndo ? "Masukkan Password" : "Enter Password"}
            value={passwordInput}
            onChangeText={(val) => {
              setPasswordInput(val);
              if (!val.trim()) {
                setPasswordError(isIndo ? "Password wajib diisi." : "Password is required.");
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

        {/*
          NOTE: Status (Aktif / Tidak Aktif) selector removed per revision
          checklist — a newly created user is always "Aktif" by default.
          Status can only be changed afterwards from the Edit User screen.
        */}

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
  photoErrorText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ef4444",
    marginTop: 4,
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
    marginBottom: 20,
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
    overflow: "hidden",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 10,
  },
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
  uploadBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0059AB",
  },
  removePhotoText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
  },
  photoHintText: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
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