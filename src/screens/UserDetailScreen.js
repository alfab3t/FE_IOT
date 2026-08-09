import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import NotificationPopup from "../components/NotificationPopup";
import {
  ArrowLeft,
  User,
  Trash2,
  PenTool,
} from "lucide-react-native";

export default function UserDetailScreen({ route, navigation }) {
  const { username } = route.params;
  const { deleteUser, colors, language, t, user } = useUser();
  const [selectedUserObj, setSelectedUserObj] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Popup States
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");
  const [showCancel, setShowCancel] = useState(false);
  const [popupConfirmText, setPopupConfirmText] = useState("OK");
  const [popupCancelText, setPopupCancelText] = useState("Batal");
  const [onConfirmAction, setOnConfirmAction] = useState(null);


  const isAdmin = selectedUserObj?.canManage === true;

  const resolveUserPhoto = async (uName, rawPhoto) => {
    if (rawPhoto) return rawPhoto;
    if (user?.username && uName.toLowerCase() === user.username.toLowerCase() && user.foto) {
      return user.foto;
    }
    try {
      const saved = await AsyncStorage.getItem(`avatar_${uName.toLowerCase()}`);
      return saved || "";
    } catch (err) {
      console.warn("Avatar fetch error:", err);
      return "";
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      const response = await iotService.getUserDetail(username);
      setIsLoading(false);
      if (response && !response.error) {
        const uName = response.username || response.Username || username;
        const uPhoto = await resolveUserPhoto(uName, response.photo || response.Photo);
        const rawPhone = response.phone || response.Phone;
        const phoneVal = (rawPhone && String(rawPhone).trim() !== "") ? String(rawPhone).trim() : "—";
        const rawRole = response.roleName || response.RoleName || response.roleId || response.RoleId || "Viewer";
        let displayRole = rawRole;
        if (rawRole === "ROL001" || rawRole === "ROL01" || rawRole.toLowerCase().includes("admin")) displayRole = "Admin";
        else if (rawRole === "ROL002" || rawRole === "ROL02" || rawRole.toLowerCase().includes("owner") || rawRole.toLowerCase().includes("controller")) displayRole = "Owner/Controller";
        else if (rawRole === "ROL003" || rawRole === "ROL03" || rawRole.toLowerCase().includes("viewer")) displayRole = "Viewer";

        setSelectedUserObj({
          id: uName,
          name: response.fullName || response.FullName || uName,
          email: (response.email || response.Email || `${uName}@astratech.ac.id`).toLowerCase(),
          role: displayRole,
          roleId: response.roleId || response.RoleId || "ROL01",
          phone: phoneVal,
          status: response.status || response.Status || "Aktif",
          registeredSince: response.registeredSince || response.RegisteredSince || "09 Jul 2026",
          lastLogin: response.lastLogin || response.LastLogin || "09 Jul 2026, 02:01",
          photo: uPhoto,
          canManage: response.canManage ?? response.CanManage ?? true,
        });
      }
    };
    fetchDetail();
  }, [username, user]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#0059AB" />
      </SafeAreaView>
    );
  }

  if (!selectedUserObj) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {language === "Indonesia" ? "Pengguna tidak ditemukan." : "User not found."}
        </Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBackBtnText}>
            {language === "Indonesia" ? "Kembali" : "Go Back"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    const isIndo = language === "Indonesia";
    const targetName = selectedUserObj?.name || username;
    const targetId = selectedUserObj?.id || username;

    setPopupTitle(isIndo ? "Hapus Pengguna" : "Delete User");
    setPopupMessage(
      isIndo
        ? `Apakah Anda yakin ingin menghapus akun ${targetName}?`
        : `Are you sure you want to delete account ${targetName}?`
    );
    setPopupType("question");
    setShowCancel(true);
    setPopupConfirmText(isIndo ? "HAPUS" : "DELETE");
    setPopupCancelText(isIndo ? "BATAL" : "CANCEL");

    const doDelete = async () => {
      setPopupVisible(false);
      const res = await deleteUser(targetId);
      if (res?.error) {
        setPopupTitle(isIndo ? "Gagal" : "Error");
        setPopupMessage(res.message || (isIndo ? "Gagal menghapus pengguna." : "Failed to delete user."));
        setPopupType("error");
        setShowCancel(false);
        setPopupConfirmText("OK");
        setOnConfirmAction(() => () => setPopupVisible(false));
        setPopupVisible(true);
      } else {
        setPopupTitle(isIndo ? "Sukses" : "Success");
        setPopupMessage(isIndo ? "Pengguna berhasil dihapus dari sistem." : "User successfully deleted from system.");
        setPopupType("success");
        setShowCancel(false);
        setPopupConfirmText("OK");
        setOnConfirmAction(() => () => {
          setPopupVisible(false);
          navigation.navigate("UsersList");
        });
        setPopupVisible(true);
      }
    };

    setOnConfirmAction(() => doDelete);
    setPopupVisible(true);
  };

  // Determine avatar background color
  let avatarBg = "#dbeafe";
  let avatarColor = "#2563eb";
  if (selectedUserObj.role?.toLowerCase().includes("owner")) {
    avatarBg = "#fef3c7";
    avatarColor = "#d97706";
  } else if (selectedUserObj.role?.toLowerCase() === "viewer") {
    avatarBg = "#fce7f3";
    avatarColor = "#db2777";
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
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("detail_pengguna")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={[styles.profileHeaderBox, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <View style={[styles.avatarCircleLarge, { backgroundColor: avatarBg, overflow: "hidden" }]}>
            {selectedUserObj.photo ? (
              <Image
                source={{
                  uri: selectedUserObj.photo.startsWith("data:") || selectedUserObj.photo.startsWith("http")
                    ? selectedUserObj.photo
                    : `data:image/jpeg;base64,${selectedUserObj.photo}`,
                }}
                style={styles.avatarImageLarge}
              />
            ) : (
              <User size={36} color={avatarColor} />
            )}
          </View>
          <Text style={[styles.profileNameText, { color: colors.text }]}>{selectedUserObj.name}</Text>
          <Text style={[styles.profileEmailText, { color: colors.textMuted }]}>{selectedUserObj.email}</Text>
          <View style={styles.onlineBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineBadgeText}>Online</Text>
          </View>
        </View>

        {/* User Info Metadata Grid */}
        <Text style={[styles.sectionHeaderTitle, { color: colors.textMuted }]}>{t("informasi_pengguna")}</Text>
        <Card style={[styles.metadataCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t("nama_lengkap")}</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{selectedUserObj.name}</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t("role")}</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{selectedUserObj.role}</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t("email")}</Text>
            <Text style={styles.metaValueBlue}>{selectedUserObj.email}</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t("nohp")}</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{selectedUserObj.phone || "-"}</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t("status")}</Text>
            <View style={styles.aktifStatusBadge}>
              <View style={[styles.aktifDot, { backgroundColor: selectedUserObj.status === "Aktif" ? "#10b981" : "#ef4444" }]} />
              <Text style={[styles.aktifText, { color: selectedUserObj.status === "Aktif" ? "#10b981" : "#ef4444" }]}>
                {selectedUserObj.status === "Aktif" ? t("aktif") : t("nonaktif")}
              </Text>
            </View>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t("terdaftar_sejak")}</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{selectedUserObj.registeredSince}</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t("login_terakhir")}</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{selectedUserObj.lastLogin}</Text>
          </View>
        </Card>

        {/* Action Buttons Section */}
        {isAdmin && (
          <>
            <Text style={[styles.sectionHeaderTitle, { color: colors.textMuted }]}>{t("aksi")}</Text>
            <Card style={[styles.actionsCard, { backgroundColor: colors.cardBackground }]}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => navigation.navigate("EditUser", { editUsername: selectedUserObj.id })}
              >
                <View style={styles.actionIconCircleBlue}>
                  <PenTool size={18} color="#0059AB" />
                </View>
                <View style={styles.actionTextContent}>
                  <Text style={[styles.actionMainText, { color: colors.text }]}>{t("edit_pengguna")}</Text>
                  <Text style={[styles.actionSubText, { color: colors.textMuted }]}>{t("ubah_info_pengguna")}</Text>
                </View>
              </TouchableOpacity>
              <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

              <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
                <View style={styles.actionIconCircleRed}>
                  <Trash2 size={18} color="#ef4444" />
                </View>
                <View style={styles.actionTextContent}>
                  <Text style={styles.actionMainTextRed}>{t("hapus_pengguna")}</Text>
                  <Text style={[styles.actionSubText, { color: colors.textMuted }]}>{t("hapus_pengguna_desc")}</Text>
                </View>
              </TouchableOpacity>
            </Card>
          </>
        )}
      </ScrollView>

      <NotificationPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        showCancel={showCancel}
        confirmText={popupConfirmText}
        cancelText={popupCancelText}
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
    padding: 16,
  },
  profileHeaderBox: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 16,
  },
  avatarCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  profileEmailText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 8,
  },
  onlineBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  onlineBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
    marginTop: 10,
    paddingLeft: 4,
  },
  metadataCard: {
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  metaLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  metaValue: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "800",
  },
  metaValueBlue: {
    fontSize: 12,
    color: "#0059AB",
    fontWeight: "800",
  },
  aktifStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aktifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  aktifText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "800",
  },
  metaDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 16,
  },
  actionsCard: {
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 30,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionIconCircleBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionIconCircleRed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionTextContent: {
    flex: 1,
  },
  actionMainText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0059AB",
  },
  actionMainTextRed: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ef4444",
  },
  actionSubText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 2,
  },
  actionDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  errorBackBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0059AB",
    borderRadius: 8,
  },
  errorBackBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});