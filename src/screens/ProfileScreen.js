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
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "../context/UserContext";
import { authService } from "../services/authService";
import Card from "../components/Card";
import Input from "../components/Input";
import NotificationPopup from "../components/NotificationPopup";
import {
  ArrowLeft,
  User,
  Camera,
  Edit2,
  Globe,
  LogOut,
  Search,
} from "lucide-react-native";

export default function ProfileScreen({ navigation }) {
  const { user, setUser, logout, colors, showToast } = useUser();
  const [nickname, setNickname] = useState(user?.nickname || user?.username || "Pengguna");
  const [timezone, setTimezone] = useState("Asia/Jakarta (WIB)");
  const [avatarBase64, setAvatarBase64] = useState(user?.foto || null);

  // Modals
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);
  const [editNicknameValue, setEditNicknameValue] = useState("");
  const [searchTz, setSearchTz] = useState("");
  const [logoutPopupVisible, setLogoutPopupVisible] = useState(false);

  const timezones = [
    { id: "WIB", city: "Asia/Jakarta (WIB)" },
    { id: "WITA", city: "Asia/Makassar (WITA)" },
    { id: "WIT", city: "Asia/Jayapura (WIT)" },
  ];

  // Fetch initial profile
  const fetchProfile = async () => {
    const response = await authService.getProfilePhoto();
    if (!response.error && response.photo) {
      setAvatarBase64(response.photo);
      setUser((prev) => ({ ...prev, foto: response.photo }));
    }
  };

  // Load nickname from AsyncStorage on mount (keyed per username so multi-user safe)
  useEffect(() => {
    const loadNickname = async () => {
      try {
        const key = `nickname_${user?.username}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          setNickname(saved);
          setUser((prev) => ({ ...prev, nickname: saved }));
        }
      } catch (e) {
        console.warn("AsyncStorage read nickname failed:", e);
      }
    };
    loadNickname();
    fetchProfile();
  }, []);

  const handlePhotoSelect = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin Diperlukan", "Izin akses galeri dibutuhkan untuk mengubah foto profil.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const b64 = result.assets[0].base64;
      setAvatarBase64(b64);
      // Save profile photo to global context
      setUser((prev) => ({ ...prev, foto: b64 }));
      // Save profile photo to backend database
      const response = await authService.updateProfilePhoto(b64);
      if (response?.error) {
        showToast(response.message || "Gagal mengunggah foto ke database.", "error");
      } else {
        showToast("Foto profil berhasil diperbarui!", "success");
      }
    }
  };

  const handleSaveNickname = async () => {
    if (!editNicknameValue.trim()) {
      showToast("Nickname tidak boleh kosong.", "error");
      return;
    }
    const nextVal = editNicknameValue.trim();
    setNickname(nextVal);
    // Persist nickname in global user context so it survives navigation remount
    setUser((prev) => ({ ...prev, nickname: nextVal }));
    // Persist nickname locally on device so it survives app restart
    try {
      const key = `nickname_${user?.username}`;
      await AsyncStorage.setItem(key, nextVal);
    } catch (e) {
      console.warn("AsyncStorage write nickname failed:", e);
    }
    setNicknameModalVisible(false);
    showToast("Nickname berhasil diperbarui!", "success");
  };

  const handleLogout = () => {
    setLogoutPopupVisible(true);
  };

  const roleName = user?.selectedRole?.roleName || "Viewer";
  const userEmail = user?.email || `${user?.username?.toLowerCase() || "user"}@astra.ac.id`;
  let accessRights;
  if (user?.selectedRole?.roleId === "ROL001") {
    accessRights = "Mengelola Sistem";
  } else if (user?.selectedRole?.roleId === "ROL002") {
    accessRights = "Control & Monitor";
  } else {
    accessRights = "Monitoring Only";
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <Text style={[styles.navTitle, { color: colors.text }]}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePhotoSelect} activeOpacity={0.9}>
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
            <View style={styles.cameraIconBox}>
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePhotoSelect} style={{ marginTop: 8 }}>
            <Text style={[styles.editTextBtn, { color: "#0059AB" }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info Grid (Figma Style) */}
        <Card style={[styles.profileInfoCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Nama</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{nickname}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{userEmail}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Role</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{roleName}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Hak Akses</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{accessRights}</Text>
          </View>
        </Card>

        {/* Config Quick Actions */}
        <Card style={[styles.settingsCard, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              setEditNicknameValue(nickname);
              setNicknameModalVisible(true);
            }}
          >
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Ubah Nickname</Text>
              <Text style={[styles.rowValue, { color: colors.textMuted }]}>{nickname}</Text>
            </View>
            <Edit2 size={16} color="#0059AB" />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.settingRow} onPress={() => setTimezoneModalVisible(true)}>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Zona Waktu</Text>
              <Text style={[styles.rowValue, { color: colors.textMuted }]}>{timezone}</Text>
            </View>
            <Globe size={16} color="#0059AB" />
          </TouchableOpacity>
        </Card>

        {/* Premium Logout Button (Figma Style: white background, red border) */}
        <TouchableOpacity style={[styles.logoutBtnOutline, { backgroundColor: colors.cardBackground }]} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Nickname Modal */}
      <Modal
        visible={nicknameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNicknameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>Ubah Nickname</Text>
            <Input
              placeholder="Masukkan nickname baru"
              value={editNicknameValue}
              onChangeText={setEditNicknameValue}
            />
            <View style={styles.dialogButtonRow}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnCancel]}
                onPress={() => setNicknameModalVisible(false)}
              >
                <Text style={styles.dialogBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnSave]}
                onPress={handleSaveNickname}
              >
                <Text style={styles.dialogBtnSaveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Timezone picker Modal */}
      <Modal
        visible={timezoneModalVisible}
        animationType="slide"
        onRequestClose={() => setTimezoneModalVisible(false)}
      >
        <SafeAreaView style={styles.tzModalContainer}>
          <View style={styles.navbar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setTimezoneModalVisible(false)}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Pilih Zona Waktu</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchBarInput, { color: colors.text }]}
              placeholder="Cari kota..."
              placeholderTextColor={colors.textMuted}
              value={searchTz}
              onChangeText={setSearchTz}
            />
          </View>

          <FlatList
            data={timezones.filter((tz) => tz.city.toLowerCase().includes(searchTz.toLowerCase()))}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.tzItem}
                onPress={() => {
                  setTimezone(item.city);
                  setTimezoneModalVisible(false);
                }}
              >
                <Text style={styles.tzItemText}>{item.city}</Text>
                <Text style={styles.tzItemSubText}>{item.id}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Zona waktu tidak ditemukan</Text>
            }
          />
        </SafeAreaView>
      </Modal>

      <NotificationPopup
        visible={logoutPopupVisible}
        title="Keluar Sesi"
        message="Apakah Anda yakin ingin keluar dari aplikasi?"
        type="warning"
        confirmText="Keluar"
        cancelText="Batal"
        onClose={() => setLogoutPopupVisible(false)}
        onConfirm={() => {
          setLogoutPopupVisible(false);
          logout();
          navigation.replace("Login");
        }}
      />
    </View>
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
