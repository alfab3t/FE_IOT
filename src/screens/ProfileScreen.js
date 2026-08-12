import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "../context/UserContext";
import { authService } from "../services/authService";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import Input from "../components/Input";
import NotificationPopup from "../components/NotificationPopup";
import SwipeableToast from "../components/SwipeableToast";
import {
  User,
  Camera,
  Edit2,
  LogOut,
  AlertCircle,
} from "lucide-react-native";

export default function ProfileScreen({ navigation }) {
  const { user, setUser, logout, colors, showToast, t, language } = useUser();
  const [avatarBase64, setAvatarBase64] = useState(user?.foto || null);
  const [editUsernameError, setEditUsernameError] = useState("");

  // Modals and Previews
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [editUsernameValue, setEditUsernameValue] = useState("");
  const [logoutPopupVisible, setLogoutPopupVisible] = useState(false);

  // Load avatar and user detail from backend / AsyncStorage on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const uKey = (user?.username || "admin").toLowerCase();

        // 1. Fetch user email from AsyncStorage or backend
        const cachedEmail = await AsyncStorage.getItem(`email_${uKey}`);
        if (cachedEmail) {
          setUser((prev) => (prev ? { ...prev, email: cachedEmail } : { email: cachedEmail }));
        }

        try {
          const detailRes = await iotService.getUserDetail(user?.username || "admin");
          if (!detailRes?.error && detailRes?.email) {
            setUser((prev) => (prev ? {
              ...prev,
              email: detailRes.email,
              fullName: detailRes.fullName || prev?.fullName,
            } : { email: detailRes.email, fullName: detailRes.fullName }));
            await AsyncStorage.setItem(`email_${uKey}`, detailRes.email);
          }
        } catch (e) {
          console.warn("Failed to fetch user detail:", e);
        }

        // 2. Load user's profile photo strictly for this username
        const savedPhoto = await AsyncStorage.getItem(`avatar_${uKey}`);
        if (savedPhoto) {
          setAvatarBase64(savedPhoto);
          setUser((prev) => ({ ...prev, foto: savedPhoto, photo: savedPhoto }));
        } else {
          const existingPhoto = user?.foto || user?.photo || avatarBase64;
          if (existingPhoto) {
            await AsyncStorage.setItem(`avatar_${uKey}`, existingPhoto);
          } else {
            const response = await authService.getProfilePhoto();
            if (!response?.error && response?.photo) {
              setAvatarBase64(response.photo);
              setUser((prev) => ({ ...prev, foto: response.photo, photo: response.photo }));
              await AsyncStorage.setItem(`avatar_${uKey}`, response.photo);
            }
          }
        }
      } catch (e) {
        console.warn("AsyncStorage load profile failed:", e);
      }
    };
    loadProfileData();
  }, [user?.username]);

  const handlePhotoSelect = () => {
    setPhotoModalVisible(true);
  };

  const processImageResult = async (result) => {
    if (!result.canceled && result.assets[0].base64) {
      const b64 = result.assets[0].base64;
      setAvatarBase64(b64);
      // Save profile photo to global context
      setUser((prev) => ({ ...prev, foto: b64, photo: b64 }));
      // Save profile photo strictly for current username
      try {
        const uKey = (user?.username || "admin").toLowerCase();
        await AsyncStorage.setItem(`avatar_${uKey}`, b64);
      } catch (e) {
        console.warn("AsyncStorage save photo failed:", e);
      }
      // Save profile photo to backend database
      const response = await authService.updateProfilePhoto(b64);
      if (response?.error) {
        showToast(
          language === "Indonesia" ? response.message || "Gagal mengunggah foto ke database." : "Failed to upload photo to database.",
          "error"
        );
      } else {
        showToast(
          language === "Indonesia" ? "Foto profil berhasil diperbarui!" : "Profile photo successfully updated!",
          "success"
        );
      }
    }
  };

  const handleSaveUsername = async () => {
    if (!editUsernameValue.trim()) {
      const emptyMsg = language === "Indonesia" ? "Username wajib diisi." : "Username is required.";
      setEditUsernameError(emptyMsg);
      return;
    }

    const nextVal = editUsernameValue.trim();
    const oldVal = user?.username || "admin";

    // Kalau username tidak berubah
    if (nextVal.toLowerCase() === oldVal.toLowerCase()) {
      setEditUsernameError("");
      setUsernameModalVisible(false);
      return;
    }

    // Validasi duplikasi username terhadap pengguna lain (case-insensitive)
    try {
      const usersRes = await iotService.getUsers("", "", "");
      if (usersRes && !usersRes.error) {
        const rawUsers = usersRes.users || usersRes.Users || (Array.isArray(usersRes) ? usersRes : usersRes.data || []);
        const exists = Array.isArray(rawUsers) && rawUsers.some((u) => {
          const uName = (u.username || u.Username || u.use_id || "").toString().trim().toLowerCase();
          return uName === nextVal.toLowerCase() && uName !== oldVal.toLowerCase();
        });

        if (exists) {
          const dupMsg = language === "Indonesia"
            ? "Username sudah terdaftar, silakan gunakan username lain."
            : "Username is already registered, please use another username.";
          setEditUsernameError(dupMsg);
          return;
        }
      }
    } catch (err) {
      console.warn("User duplicate pre-check failed:", err);
    }

    try {
      // Update ke backend TERLEBIH DAHULU
      const response = await authService.updateUsername(nextVal, oldVal);

      // Kalau backend mengembalikan error
      if (response?.error) {
        const errBackend = language === "Indonesia"
          ? response.message || "Username sudah terdaftar, silakan gunakan username lain."
          : response.message || "Username is already registered, please use another username.";
        setEditUsernameError(errBackend);
        return;
      }

      setEditUsernameError("");

      // Backend berhasil → baru update data lokal
      const currentPhoto =
        avatarBase64 || user?.foto || user?.photo || null;

      const currentEmail =
        user?.email ||
        (oldVal ? `${oldVal.toLowerCase()}@astratech.ac.id` : "");

      setUser((prev) => ({
        ...prev,
        username: nextVal,
        nama: nextVal,
        nickname: nextVal,
        email: currentEmail,
        foto: currentPhoto || prev?.foto || prev?.photo || null,
        photo: currentPhoto || prev?.foto || prev?.photo || null,
      }));

      try {
        await AsyncStorage.setItem("username", nextVal);

        await AsyncStorage.setItem(
          `nickname_${nextVal.toLowerCase()}`,
          nextVal
        );

        if (currentPhoto) {
          await AsyncStorage.setItem(
            `avatar_${nextVal.toLowerCase()}`,
            currentPhoto
          );

          await AsyncStorage.setItem(
            `avatar_${oldVal.toLowerCase()}`,
            currentPhoto
          );
        }

        if (currentEmail) {
          await AsyncStorage.setItem(
            `email_${nextVal.toLowerCase()}`,
            currentEmail
          );

          await AsyncStorage.setItem(
            `email_${oldVal.toLowerCase()}`,
            currentEmail
          );
        }
      } catch (e) {
        console.warn("AsyncStorage write username failed:", e);
      }

      setUsernameModalVisible(false);

      showToast(
        language === "Indonesia"
          ? "Username berhasil diperbarui!"
          : "Username successfully updated!",
        "success"
      );
    } catch (e) {
      console.warn("Backend username sync failed:", e);

      showToast(
        language === "Indonesia"
          ? "Username gagal diperbarui."
          : "Failed to update username.",
        "error"
      );
    }
  };

  const handleLogout = () => {
    setLogoutPopupVisible(true);
  };

  const roleName = user?.selectedRole?.roleName || "Admin";
  const userEmail = user?.email || (user?.username ? `${user.username.toLowerCase()}@astratech.ac.id` : "");
  const selectedRoleLower = (user?.selectedRole?.roleName || "").toLowerCase();
  const roleId = user?.selectedRole?.roleId || "";

  let accessRights;
  if (roleId === "ROL001" || roleId === "ROL01" || selectedRoleLower.includes("admin")) {
    accessRights = language === "Indonesia" ? "Full Access (Mengelola Sistem)" : "System Administration";
  } else if (roleId === "ROL002" || roleId === "ROL02" || selectedRoleLower.includes("owner") || selectedRoleLower.includes("controller")) {
    accessRights = "Control & Monitor";
  } else {
    accessRights = "Monitoring Only";
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("profil")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={() => setPreviewVisible(true)} activeOpacity={0.9}>
              {avatarBase64 ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${avatarBase64}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                  <User size={64} color={colors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePhotoSelect} style={styles.cameraIconBox} activeOpacity={0.7}>
              <Camera size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handlePhotoSelect} style={{ marginTop: 8 }}>
            <Text style={[styles.editTextBtn, { color: "#0059AB" }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info Grid (Figma Style) */}
        <Card style={[styles.profileInfoCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
              {language === "Indonesia" ? "Nama" : "Name"}
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.username || user?.nama || "Pengguna"}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t("email")}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{userEmail}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t("role")}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{roleName}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
              {language === "Indonesia" ? "Hak Akses" : "Access Rights"}
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{accessRights}</Text>
          </View>
        </Card>

        {/* Config Quick Actions */}
        <Card style={[styles.settingsCard, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              setEditUsernameValue(user?.username || "");
              setEditUsernameError("");
              setUsernameModalVisible(true);
            }}
          >
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {language === "Indonesia" ? "Ubah Username" : "Change Username"} <Text style={{ color: "#ef4444" }}>*</Text>
              </Text>
              <Text style={[styles.rowValue, { color: colors.textMuted }]}>{user?.username || "admin"}</Text>
            </View>
            <Edit2 size={16} color="#0059AB" />
          </TouchableOpacity>
        </Card>

        {/* Premium Logout Button (Figma Style: white background, red border) */}
        <TouchableOpacity style={[styles.logoutBtnOutline, { backgroundColor: colors.cardBackground }]} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>{t("logout_btn")}</Text>
        </TouchableOpacity>
      </ScrollView>

      <UsernameModal
        visible={usernameModalVisible}
        onClose={() => {
          setEditUsernameError("");
          setUsernameModalVisible(false);
        }}
        editUsernameValue={editUsernameValue}
        setEditUsernameValue={setEditUsernameValue}
        editUsernameError={editUsernameError}
        setEditUsernameError={setEditUsernameError}
        handleSaveUsername={handleSaveUsername}
        colors={colors}
        t={t}
        language={language}
      />

      <NotificationPopup
        visible={logoutPopupVisible}
        title={language === "Indonesia" ? "Keluar Sesi" : "Logout Session"}
        message={language === "Indonesia" ? "Apakah Anda yakin ingin keluar dari aplikasi?" : "Are you sure you want to logout from the application?"}
        type="warning"
        showCancel={true}
        confirmText={language === "Indonesia" ? "Keluar" : "Logout"}
        cancelText={t("batal")}
        onClose={() => setLogoutPopupVisible(false)}
        onConfirm={() => {
          setLogoutPopupVisible(false);
          logout();
          navigation.replace("Login");
        }}
      />

      <PhotoSourceModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        colors={colors}
        language={language}
        processImageResult={processImageResult}
      />

      <PreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        avatarBase64={avatarBase64}
        language={language}
      />
    </View>
  );
}



// ── Helpers & Subcomponents ───────────────────────────────────────────────
function UsernameModal({
  visible,
  onClose,
  editUsernameValue,
  setEditUsernameValue,
  editUsernameError,
  setEditUsernameError,
  handleSaveUsername,
  colors,
  t,
  language,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.dialogBox, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.dialogTitle, { color: colors.text }]}>
            {language === "Indonesia" ? "Ubah Username" : "Change Username"} <Text style={{ color: "#ef4444" }}>*</Text>
          </Text>

          {editUsernameError ? (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#fca5a5" }}>
              <AlertCircle size={16} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: "#ef4444", flex: 1, fontWeight: "600" }}>{editUsernameError}</Text>
            </View>
          ) : null}

          <Input
            placeholder={language === "Indonesia" ? "Masukkan username baru" : "Enter new username"}
            value={editUsernameValue}
            onChangeText={(text) => {
              setEditUsernameValue(text);
              if (text.trim()) setEditUsernameError("");
            }}
            error={editUsernameError}
            hideErrorText={true}
          />
          <View style={styles.dialogButtonRow}>
            <TouchableOpacity
              style={[styles.dialogBtn, styles.dialogBtnCancel, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}
              onPress={onClose}
            >
              <Text style={[styles.dialogBtnCancelText, { color: colors.text }]}>{t("batal")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogBtn, styles.dialogBtnSave]}
              onPress={handleSaveUsername}
            >
              <Text style={styles.dialogBtnSaveText}>{t("simpan")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PhotoSourceModal({
  visible,
  onClose,
  colors,
  language,
  processImageResult,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.bottomSheetOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[styles.bottomSheetContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.bottomSheetHandle} />
          <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
            {language === "Indonesia" ? "Ubah Foto Profil" : "Change Profile Photo"}
          </Text>
          <Text style={[styles.bottomSheetSub, { color: colors.textMuted }]}>
            {language === "Indonesia" ? "Pilih sumber foto profil Anda:" : "Select your profile photo source:"}
          </Text>

          {/* Options */}
          <TouchableOpacity 
            style={[styles.bottomSheetOption, { borderBottomColor: colors.border }]}
            onPress={async () => {
              onClose();
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  language === "Indonesia" ? "Izin Kamera Diperlukan" : "Camera Permission Required",
                  language === "Indonesia" ? "Izin akses kamera dibutuhkan untuk mengambil foto." : "Camera access permission is required to take photos."
                );
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
              });
              processImageResult(result);
            }}
          >
            <Camera size={20} color="#0059AB" style={{ marginRight: 12 }} />
            <Text style={[styles.bottomSheetOptionText, { color: colors.text }]}>
              {language === "Indonesia" ? "Ambil Foto (Kamera)" : "Take Photo (Camera)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.bottomSheetOption, { borderBottomColor: colors.border }]}
            onPress={async () => {
              onClose();
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  language === "Indonesia" ? "Izin Galeri Diperlukan" : "Gallery Permission Required",
                  language === "Indonesia" ? "Izin akses galeri dibutuhkan untuk mengubah foto profil." : "Gallery access permission is required to change profile photo."
                );
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
              });
              processImageResult(result);
            }}
          >
            <User size={20} color="#0059AB" style={{ marginRight: 12 }} />
            <Text style={[styles.bottomSheetOptionText, { color: colors.text }]}>
              {language === "Indonesia" ? "Pilih dari Galeri" : "Choose from Gallery"}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity 
            style={[styles.bottomSheetCancelBtn, { backgroundColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.bottomSheetCancelText, { color: colors.text }]}>
              {language === "Indonesia" ? "Batal" : "Cancel"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function PreviewModal({
  visible,
  onClose,
  avatarBase64,
  language,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.previewOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalCloseButton}>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>Close</Text>
        </View>
        {avatarBase64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${avatarBase64}` }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.previewPlaceholder}>
            <User size={120} color="#cbd5e1" />
            <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 14 }}>
              {language === "Indonesia" ? "Tidak ada foto profil" : "No profile photo"}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
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
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  backBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cameraIconBox: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0059AB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  editTextBtn: {
    color: "#0059AB",
    fontSize: 14,
    fontWeight: "800",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  previewImage: {
    width: "90%",
    height: "75%",
  },
  previewPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 34,
    alignItems: "center",
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  bottomSheetSub: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 20,
  },
  bottomSheetOption: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  bottomSheetOptionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  bottomSheetCancelBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  bottomSheetCancelText: {
    fontSize: 14,
    fontWeight: "800",
  },
  profileInfoCard: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "700",
  },
  infoValue: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "800",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  settingsCard: {
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "700",
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  logoutBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 30,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  logoutBtnText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  dialogButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  dialogBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dialogBtnCancel: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dialogBtnCancelText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  dialogBtnSave: {
    backgroundColor: "#0059AB",
  },
  dialogBtnSaveText: {
    color: "#fff",
    fontWeight: "700",
  },
  tzModalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
    paddingVertical: 0,
    fontWeight: "600",
  },
  tzItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fff",
  },
  tzItemText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  tzItemSubText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    paddingVertical: 40,
    fontWeight: "600",
  },
});
