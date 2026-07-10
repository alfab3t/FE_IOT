import React from "react";
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
import Card from "../components/Card";
import {
  ArrowLeft,
  User,
  PenTool,
  Trash2,
} from "lucide-react-native";

export default function UserDetailScreen({ route, navigation }) {
  const { userId } = route.params;
  const { managedUsers, deleteUser } = useUser();

  const selectedUserObj = managedUsers.find((u) => u.id === userId);

  if (!selectedUserObj) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Pengguna tidak ditemukan.</Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBackBtnText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Hapus Pengguna",
      `Apakah Anda yakin ingin menghapus akun ${selectedUserObj.name}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            deleteUser(userId);
            Alert.alert("Sukses", "Pengguna berhasil dihapus dari sistem.");
            navigation.navigate("UsersList");
          },
        },
      ]
    );
  };

  // Determine avatar background color
  let avatarBg = "#dbeafe";
  let avatarColor = "#2563eb";
  if (selectedUserObj.role.toLowerCase().includes("owner")) {
    avatarBg = "#fef3c7";
    avatarColor = "#d97706";
  } else if (selectedUserObj.role.toLowerCase() === "viewer") {
    avatarBg = "#fce7f3";
    avatarColor = "#db2777";
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Detail Pengguna</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderBox}>
          <View style={[styles.avatarCircleLarge, { backgroundColor: avatarBg }]}>
            <User size={36} color={avatarColor} />
          </View>
          <Text style={styles.profileNameText}>{selectedUserObj.name}</Text>
          <Text style={styles.profileEmailText}>{selectedUserObj.email}</Text>
          <View style={styles.onlineBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineBadgeText}>Online</Text>
          </View>
        </View>

        {/* User Info Metadata Grid */}
        <Text style={styles.sectionHeaderTitle}>Informasi Pengguna</Text>
        <Card style={styles.metadataCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Nama Lengkap</Text>
            <Text style={styles.metaValue}>{selectedUserObj.name}</Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Role</Text>
            <Text style={styles.metaValue}>{selectedUserObj.role}</Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Email</Text>
            <Text style={styles.metaValueBlue}>{selectedUserObj.email}</Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>No.HP</Text>
            <Text style={styles.metaValue}>{selectedUserObj.phone || "-"}</Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <View style={styles.aktifStatusBadge}>
              <View style={styles.aktifDot} />
              <Text style={styles.aktifText}>{selectedUserObj.status}</Text>
            </View>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Terdaftar Sejak</Text>
            <Text style={styles.metaValue}>{selectedUserObj.registeredSince}</Text>
          </View>
          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Login Terakhir</Text>
            <Text style={styles.metaValue}>{selectedUserObj.lastLogin}</Text>
          </View>
        </Card>

        {/* Action Buttons Section */}
        <Text style={styles.sectionHeaderTitle}>Aksi</Text>
        <Card style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate("AddUser", { editUserId: userId })}
          >
            <View style={styles.actionIconCircleBlue}>
              <PenTool size={18} color="#0059AB" />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionMainText}>Edit Pengguna</Text>
              <Text style={styles.actionSubText}>Ubah Informasi Pengguna</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.actionDivider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
            <View style={styles.actionIconCircleRed}>
              <Trash2 size={18} color="#ef4444" />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionMainTextRed}>Hapus Pengguna</Text>
              <Text style={styles.actionSubText}>Hapus akun pengguna dari sistem</Text>
            </View>
          </TouchableOpacity>
        </Card>
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
