import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  User,
} from "lucide-react-native";

export default function UsersListScreen({ navigation }) {
  const { user, managedUsers } = useUser();
  const [activeTab, setActiveTab] = useState("Semua"); // Semua, Admin, Owner/Controller, Viewer
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Semua"); // Semua, Aktif, Nonaktif

  // Tab Filtering
  const getFilteredUsers = () => {
    return managedUsers.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const roleLower = u.role.toLowerCase();

      if (statusFilter !== "Semua" && u.status !== statusFilter) {
        return false;
      }

      if (activeTab === "Admin") {
        return matchesSearch && roleLower === "admin";
      }
      if (activeTab === "Owner/Controller") {
        return matchesSearch && (roleLower.includes("owner") || roleLower.includes("control"));
      }
      if (activeTab === "Viewer") {
        return matchesSearch && roleLower === "viewer";
      }
      return matchesSearch;
    });
  };

  const filteredUsers = getFilteredUsers();

  // Tab counts
  const countAll = managedUsers.length;
  const countAdmin = managedUsers.filter((u) => u.role.toLowerCase() === "admin").length;
  const countOwner = managedUsers.filter((u) => u.role.toLowerCase().includes("owner") || u.role.toLowerCase().includes("control")).length;
  const countViewer = managedUsers.filter((u) => u.role.toLowerCase() === "viewer").length;

  const renderRoleBadge = (roleName, isCurrentUser) => {
    if (isCurrentUser) {
      return (
        <View style={[styles.roleBadge, styles.badgeCurrent]}>
          <Text style={[styles.roleBadgeText, styles.badgeTextCurrent]}>You</Text>
        </View>
      );
    }
    const nameLower = roleName.toLowerCase();
    if (nameLower.includes("owner") || nameLower.includes("controller")) {
      return (
        <View style={[styles.roleBadge, styles.badgeOwner]}>
          <Text style={[styles.roleBadgeText, styles.badgeTextOwner]}>owner/controller</Text>
        </View>
      );
    }
    return (
      <View style={[styles.roleBadge, styles.badgeViewer]}>
        <Text style={[styles.roleBadgeText, styles.badgeTextViewer]}>viewer</Text>
      </View>
    );
  };

  const renderUserItem = ({ item }) => {
    const isCurrentUser = item.email.toLowerCase() === user?.email?.toLowerCase() || item.name === user?.username || item.id === "usr001";

    // Assign generic colorful user backgrounds for placeholder avatar
    let avatarBg = "#dbeafe";
    let avatarColor = "#2563eb";
    if (item.role.toLowerCase().includes("owner")) {
      avatarBg = "#fef3c7";
      avatarColor = "#d97706";
    } else if (item.role.toLowerCase() === "viewer") {
      avatarBg = "#fce7f3";
      avatarColor = "#db2777";
    }

    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("UserDetail", { userId: item.id })}
      >
        {/* Avatar circle */}
        <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
          <User size={22} color={avatarColor} />
        </View>

        {/* Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userNameText}>{item.name}</Text>
          <Text style={styles.userEmailText}>{item.email}</Text>
        </View>

        {/* Badge & Status */}
        <View style={styles.rightSection}>
          {renderRoleBadge(item.role, isCurrentUser)}
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Home")}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Pengguna</Text>
        <View style={styles.navRightIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSearch(!showSearch)}>
            <Search size={22} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setFilterModalVisible(true)}>
            <SlidersHorizontal size={20} color={statusFilter !== "Semua" ? "#0059AB" : "#0f172a"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Search Bar */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <Search size={16} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            placeholder="Cari pengguna..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInputField}
            autoFocus
          />
        </View>
      )}

      {/* Segment Tabs */}
      <View style={styles.segmentBar}>
        {[
          { label: "Semua", count: countAll },
          { label: "Admin", count: countAdmin },
          { label: "Owner/Controller", count: countOwner },
          { label: "Viewer", count: countViewer },
        ].map((tab) => {
          const active = activeTab === tab.label;
          return (
            <TouchableOpacity
              key={tab.label}
              style={[styles.segmentTab, active && styles.segmentTabActive]}
              onPress={() => setActiveTab(tab.label)}
            >
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                {tab.label}({tab.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={UserItemSeparator}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Tidak ada pengguna ditemukan</Text>
        }
      />

      {/* Footer Buttons (Batal & Tambah User) */}
      <View style={styles.footerButtonContainer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.cancelBtnText}>Batal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addUserBtn}
          onPress={() => navigation.navigate("AddUser")}
        >
          <Text style={styles.addUserBtnText}>+ Tambah User</Text>
        </TouchableOpacity>
      </View>
      {/* Custom Status Filter picker Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogBox, { backgroundColor: "#fff" }]}>
            {/* Header Icon */}
            <View style={[styles.iconContainer, { backgroundColor: "#f8fafc" }]}>
              <SlidersHorizontal size={32} color="#0059AB" />
            </View>

            {/* Title */}
            <Text style={[styles.dialogTitle, { color: "#0f172a", textAlign: "center", marginBottom: 8 }]}>Filter Status Pengguna</Text>

            {/* Message */}
            <Text style={[styles.dialogMessage, { color: "#64748b" }]}>
              Pilih status pengguna yang ingin ditampilkan:
            </Text>

            {/* Options list */}
            {["Semua", "Aktif", "Nonaktif"].map((statusOption) => {
              const isSelected = statusFilter === statusOption;
              return (
                <TouchableOpacity
                  key={statusOption}
                  style={[
                    styles.optionRowBtn,
                    {
                      borderColor: isSelected ? "#0059AB" : "#cbd5e1",
                      backgroundColor: isSelected ? "#f0f9ff" : "transparent",
                      marginTop: 8
                    }
                  ]}
                  onPress={() => {
                    setStatusFilter(statusOption);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionRowText, { color: isSelected ? "#0059AB" : "#0f172a" }]}>{statusOption}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelBtnTextBox, { marginTop: 16 }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={[styles.modalCancelBtnText, { color: "#64748b" }]}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const UserItemSeparator = () => <View style={styles.itemSeparator} />;

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
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
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
