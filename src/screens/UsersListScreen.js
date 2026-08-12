import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  User,
} from "lucide-react-native";

export default function UsersListScreen({ navigation }) {
  const { user, colors, showToast, t, theme, language } = useUser();
  const [activeRoleId, setActiveRoleId] = useState(""); // Default empty = "Semua"
  const [dbRoles, setDbRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Semua"); // Semua, Aktif, Tidak Aktif

  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin =
    user?.selectedRole?.roleId === "ROL01" ||
    user?.selectedRole?.roleId === "ROL001" ||
    user?.selectedRole?.roleName?.toLowerCase().includes("admin");

  useEffect(() => {
    if (!isAdmin) {
      showToast("Akses ditolak: Hanya Admin yang dapat mengelola pengguna.", "warning");
      navigation.goBack();
    }
  }, [isAdmin]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    const response = await iotService.getUsers("", "", "");
    setIsLoading(false);
    if (response && !response.error) {
      const rawUsers = response.users || response.Users || (Array.isArray(response) ? response : response.data || []);
      const rawRoles = response.roles || response.Roles || [];

      const mappedUsers = await Promise.all(
        (Array.isArray(rawUsers) ? rawUsers : []).map(async (u) => {
          const uName = u.username || u.Username || u.use_id || "";
          const realName = u.nama || u.Nama || u.fullName || u.FullName || u.use_nama || "";
          let uPhoto = u.photo || u.Photo || "";
          if (!uPhoto) {
            if (user?.username && uName.toLowerCase() === user.username.toLowerCase() && user.foto) {
              uPhoto = user.foto;
            } else {
              try {
                const saved = await AsyncStorage.getItem(`avatar_${uName.toLowerCase()}`);
                if (saved) uPhoto = saved;
              } catch (err) {
                console.warn("Avatar fetch error:", err);
              }
            }
          }

          let displayTitle = uName;
          if (realName && realName.trim() && realName.trim().toLowerCase() !== uName.trim().toLowerCase()) {
            displayTitle = `${uName} - ${realName.trim()}`;
          } else if (!uName && realName) {
            displayTitle = realName.trim();
          }

          return {
            ...u,
            username: uName,
            realName: realName,
            fullName: displayTitle,
            email: u.email || u.Email || "",
            status: u.status || u.Status || u.use_status || "Aktif",
            roleName: u.roleName || u.RoleName || u.rol_deskripsi || "User",
            roleId: u.roleId || u.RoleId || u.rol_id || "ROL01",
            photo: uPhoto,
          };
        })
      );

      const mappedRoles = (Array.isArray(rawRoles) ? rawRoles : []).map((r) => ({
        roleId: r.roleId || r.RoleId || "",
        roleName: r.roleName || r.RoleName || "",
        count: r.count ?? r.Count ?? 0,
      }));

      setAllUsers(mappedUsers);
      setDbRoles(mappedRoles);
    }
  }, [user]);

  useEffect(() => {
    // Jalankan pertama kali saat mount
    loadUsers();

    // Jalankan setiap kali screen kembali aktif (focus)
    const unsubscribe = navigation.addListener("focus", () => {
      loadUsers();
    });
    return unsubscribe;
  }, [navigation, loadUsers]);

  // Locally filter users dynamically by active role ID, status filter, and keyword search
  const filteredUsers = allUsers.filter((u) => {
    const normUserRole = (u.roleId || "").replace("ROL00", "ROL0").replace("ROL0", "ROL");
    const normActiveRole = (activeRoleId || "").replace("ROL00", "ROL0").replace("ROL0", "ROL");

    const matchTab = !activeRoleId ? true : (u.roleId === activeRoleId || normUserRole === normActiveRole);

    const matchStatus = statusFilter === "Semua" ? true : u.status === statusFilter;

    const matchQuery = !searchQuery ? true : (
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return matchTab && matchStatus && matchQuery;
  });

  const handleToggleStatus = async (u) => {
    const isIndo = language === "Indonesia";
    const newStatus = u.status === "Aktif" ? "Tidak Aktif" : "Aktif";
    Alert.alert(
      isIndo ? "Ubah Status Pengguna" : "Change User Status",
      isIndo ? `Ubah status ${u.fullName} menjadi "${newStatus}"?` : `Change status of ${u.fullName} to "${newStatus === "Aktif" ? "Active" : "Inactive"}"?`,
      [
        { text: isIndo ? "Batal" : "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            const res = await iotService.setUserStatus(u.username, newStatus);
            if (res.error) {
              showToast(isIndo ? "Gagal mengubah status." : "Failed to update status.", "error");
            } else {
              showToast(isIndo ? `Status ${u.fullName} berhasil diubah.` : `Status of ${u.fullName} successfully updated.`, "success");
              loadUsers();
            }
          },
        },
      ]
    );
  };

  const renderRoleBadge = (roleId, roleName, isCurrentUser) => {
    if (isCurrentUser) {
      return (
        <View style={[styles.roleBadge, styles.badgeCurrent]}>
          <Text style={[styles.roleBadgeText, styles.badgeTextCurrent]}>{language === "Indonesia" ? "Anda" : "You"}</Text>
        </View>
      );
    }
    let displayRole = roleName;

    if (!displayRole) {
      if (roleId === "ROL001" || roleId === "ROL01") {
        displayRole = "Admin";
      } else if (roleId === "ROL002" || roleId === "ROL02") {
        displayRole = "Owner/Controller";
      } else {
        displayRole = "Viewer";
      }
    }   
    return (
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>{displayRole}</Text>
      </View>
    );
  };

  const renderUserItem = ({ item }) => {
    const isCurrentUser = item.username === user?.username;
    const avatarBg = "#f0f9ff";
    const avatarColor = "#0059AB";

    const isActive = item.status === "Aktif";

    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("UserDetail", { username: item.username })}
        onLongPress={() => isAdmin && !isCurrentUser && handleToggleStatus(item)}
      >
        {/* Avatar circle */}
        <View style={[styles.avatarCircle, { backgroundColor: avatarBg, overflow: "hidden" }]}>
          {item.photo ? (
            <Image
              source={{
                uri: item.photo.startsWith("data:")
                  ? item.photo
                  : `data:image/jpeg;base64,${item.photo}`,
              }}
              style={styles.avatarImage}
            />
          ) : (
            <User size={22} color={avatarColor} />
          )}
        </View>

        {/* Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.userNameText, { color: colors.text }]}>{item.fullName}</Text>
          {item.email ? (
            <Text style={[styles.userEmailText, { color: colors.textMuted }]}>{item.email}</Text>
          ) : (
            <Text style={[styles.userEmailText, { color: colors.textMuted }]}>@{item.username}</Text>
          )}
        </View>

        {/* Badge & Status */}
        <View style={styles.rightSection}>
          {renderRoleBadge(item.roleId, item.roleName, isCurrentUser)}
          <Text style={[styles.statusText, { color: isActive ? "#10b981" : "#ef4444" }]}>
            {language === "Indonesia" ? (isActive ? "Aktif" : "Tidak Aktif") : (isActive ? "Active" : "Inactive")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeparator = useCallback(() => (
    <UserItemSeparator color={colors.border} />
  ), [colors.border]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Home")}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("pengguna")}</Text>
        <View style={styles.navRightIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSearch(!showSearch)}>
            <Search size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setFilterModalVisible(true)}>
            <SlidersHorizontal size={20} color={statusFilter !== "Semua" ? "#0059AB" : colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Search Bar */}
      {showSearch && (
        <View style={[styles.searchBarContainer, { backgroundColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder={t("cari_pengguna")}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInputField, { color: colors.text }]}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={loadUsers}
          />
        </View>
      )}

      {/* Segment Tabs */}
      <View style={[styles.segmentBar, { borderBottomColor: colors.border }]}>
       {[
            {
              label: "Semua",
              count: filteredUsers.length,
              roleId: "",
            },
            ...dbRoles.map((role) => ({
              label: role.roleName,
              count: allUsers.filter((u) => {
                const normUserRole = (u.roleId || "")
                  .replace("ROL00", "ROL0")
                  .replace("ROL0", "ROL");

                const normRoleId = (role.roleId || "")
                  .replace("ROL00", "ROL0")
                  .replace("ROL0", "ROL");

                const matchRole =
                  u.roleId === role.roleId ||
                  normUserRole === normRoleId;

                const matchStatus =
                  statusFilter === "Semua" || u.status === statusFilter;

                const matchQuery =
                  !searchQuery ||
                  u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.username?.toLowerCase().includes(searchQuery.toLowerCase());

                return matchRole && matchStatus && matchQuery;
              }).length,
              roleId: role.roleId,
            })),
          ].map((tab) => {
          const active = activeRoleId === tab.roleId;
          const displayLabel = tab.label === "Semua" ? t("semua") : tab.label;
          return (
            <TouchableOpacity
              key={tab.label}
              style={[styles.segmentTab, active && styles.segmentTabActive]}
              onPress={() => setActiveRoleId(tab.roleId)}
            >
              <Text style={[styles.segmentLabel, active ? styles.segmentLabelActive : { color: colors.textMuted }]}>
                {displayLabel} ({tab.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Users List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.username}
          renderItem={renderUserItem}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {language === "Indonesia" ? "Tidak ada pengguna ditemukan" : "No users found"}
            </Text>
          }
        />
      )}

      {/* Footer Buttons */}
      <View style={[styles.footerButtonContainer, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={[styles.cancelBtnText, { color: colors.text }]}>{t("batal")}</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={styles.addUserBtn}
            onPress={() => navigation.navigate("AddUser")}
          >
            <Text style={styles.addUserBtnText}>{t("tambah_user_btn")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Custom Status Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogBox, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
              <SlidersHorizontal size={32} color="#0059AB" />
            </View>

            <Text style={[styles.dialogTitle, { color: colors.text, textAlign: "center", marginBottom: 8 }]}>{t("filter_status_pengguna")}</Text>
            <Text style={[styles.dialogMessage, { color: colors.textMuted }]}>{t("pilih_status_pengguna")}</Text>

            {["Semua", "Aktif", "Tidak Aktif"].map((statusOption) => {
              const isSelected = statusFilter === statusOption;
              const labelText = statusOption === "Semua" ? (language === "Indonesia" ? "Semua" : "All") : statusOption === "Aktif" ? (language === "Indonesia" ? "Aktif" : "Active") : (language === "Indonesia" ? "Tidak Aktif" : "Inactive");
              let optionBg = "transparent";
              if (isSelected) {
                optionBg = theme === "Dark Mode" ? "#1e293b" : "#f0f9ff";
              }
              return (
                <TouchableOpacity
                  key={statusOption}
                  style={[
                    styles.optionRowBtn,
                    {
                      borderColor: isSelected ? "#0059AB" : colors.border,
                      backgroundColor: optionBg,
                      marginTop: 8
                    }
                  ]}
                  onPress={() => {
                    setStatusFilter(statusOption);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionRowText, { color: isSelected ? "#0059AB" : colors.text }]}>{labelText}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.cancelBtnTextBox, { marginTop: 16 }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={[styles.modalCancelBtnText, { color: colors.textMuted }]}>{t("batal")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const UserItemSeparator = ({ color }) => <View style={[styles.itemSeparator, { backgroundColor: color }]} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginLeft: 8,
    flex: 1,
  },
  navRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 8,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "600",
  },
  segmentBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingHorizontal: 8,
  },
  segmentTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  segmentTabActive: {
    borderBottomColor: "#0059AB",
  },
  segmentLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  segmentLabelActive: {
    color: "#0059AB",
  },
  listContent: {
    padding: 16,
    paddingBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  userEmailText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#f0f9ff",
    borderColor: "#0059AB",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0059AB",
  },
  badgeCurrent: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  badgeTextCurrent: {
    color: "#3b82f6",
  },
  badgeOwner: {
    backgroundColor: "#fffbeb",
    borderColor: "#eab308",
  },
  badgeTextOwner: {
    color: "#eab308",
  },
  badgeViewer: {
    backgroundColor: "#fdf2f8",
    borderColor: "#db2777",
  },
  badgeTextViewer: {
    color: "#db2777",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    paddingVertical: 40,
    fontWeight: "600",
  },
  footerButtonContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cancelBtnText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
  addUserBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#0059AB",
    alignItems: "center",
    justifyContent: "center",
  },
  addUserBtnText: {
    color: "#fff",
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
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  dialogMessage: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: "500",
  },
  optionRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    width: "100%",
  },
  optionRowText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cancelBtnTextBox: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
});
