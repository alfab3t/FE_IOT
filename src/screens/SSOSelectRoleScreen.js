import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { authService } from "../services/authService";
import Card from "../components/Card";
import Button from "../components/Button";
import { Grid, LogOut, CheckCircle2, Radio } from "lucide-react-native";

export default function SSOSelectRoleScreen({ navigation }) {
  const { ssoData, selectRole, logout } = useUser();
  const [groupedApps, setGroupedApps] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState(null);

  useEffect(() => {
    authService.getProfilePhoto().then((res) => {
      if (res && !res.error && res.photo) {
        setAvatarBase64(res.photo);
      }
    });
  }, []);

  useEffect(() => {
    if (!ssoData?.listAplikasi) {
      Alert.alert("Sesi Habis", "Sesi Anda tidak valid. Silakan login kembali.");
      logout();
      navigation.replace("Login");
      return;
    }

    const grouped = ssoData.listAplikasi.reduce((acc, app) => {
      if (!acc[app.namaAplikasi]) {
        acc[app.namaAplikasi] = [];
      }
      acc[app.namaAplikasi].push(app);
      return acc;
    }, {});
    setGroupedApps(grouped);
  }, [ssoData]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    const response = await selectRole(
      selectedRole.appId,
      selectedRole.roleId,
      selectedRole.namaRole,
      selectedRole.namaAplikasi
    );
    setIsLoading(false);

    if (response.error) {
      Alert.alert("Gagal", response.message || "Gagal mendapatkan izin akses.");
    } else {
      navigation.replace("Home"); // Navigates to main app layout
    }
  };

  const handleLogoutPress = () => {
    logout();
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>ASTRAtech</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
          <LogOut size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <View style={styles.avatarOuterWrapper}>
            {avatarBase64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${avatarBase64}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarInitialCircle}>
                <Text style={styles.avatarInitialText}>
                  {ssoData?.nama ? ssoData.nama.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.welcomeTitle}>
            Selamat Datang, {ssoData?.nama || "User"}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Silakan pilih aplikasi dan peran Anda untuk melanjutkan.
          </Text>
        </View>

        {Object.keys(groupedApps).map((namaAplikasi, idx) => {
          return (
            <Card key={namaAplikasi + "-" + idx} style={styles.appCard}>
              <View style={styles.appHeader}>
                {namaAplikasi === "IoT" ? (
                  <View style={styles.miniLogoRow}>
                    <Text style={styles.miniLogoLetter}>I</Text>
                    <View style={styles.miniLogoCircleIcon}>
                      <Radio size={10} color="#fff" />
                    </View>
                    <Text style={styles.miniLogoLetter}>T</Text>
                  </View>
                ) : (
                  <Grid size={24} color="#0059AB" />
                )}
                <Text style={styles.appName}>{namaAplikasi}</Text>
              </View>

              <Text style={styles.roleLabel}>Pilih Peran:</Text>
              <View style={styles.roleContainer}>
                {groupedApps[namaAplikasi].map((role) => {
                  const isSelected =
                    selectedRole?.roleId === role.roleId &&
                    selectedRole?.appId === role.appId;

                  return (
                    <TouchableOpacity
                      key={`${role.appId}-${role.roleId}`}
                      style={[
                        styles.roleBadge,
                        isSelected ? styles.roleBadgeActive : styles.roleBadgeInactive,
                      ]}
                      onPress={() => handleRoleSelect(role)}
                    >
                      <Text
                        style={[
                          styles.roleText,
                          isSelected ? styles.roleTextActive : styles.roleTextInactive,
                        ]}
                      >
                        {role.namaRole}
                      </Text>
                      {isSelected && (
                        <CheckCircle2 size={14} color="#fff" style={styles.checkIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          );
        })}

        <View style={styles.buttonContainer}>
          <Button
            label="Lanjutkan"
            onPress={handleContinue}
            disabled={!selectedRole}
            loading={isLoading}
            type="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  navbar: {
    height: 64,
    backgroundColor: "#fff",
    borderBottomWidth: 1.5,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0059AB",
    letterSpacing: -0.5,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  avatarOuterWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#0059AB",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
  },
  avatarInitialCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0059AB",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  appCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginLeft: 10,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  roleBadgeActive: {
    backgroundColor: "#0059AB",
    borderColor: "#0059AB",
    shadowColor: "#0059AB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  roleBadgeInactive: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  roleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  roleTextActive: {
    color: "#fff",
  },
  roleTextInactive: {
    color: "#475569",
  },
  checkIcon: {
    marginLeft: 6,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  miniLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  miniLogoLetter: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0059AB",
    lineHeight: 24,
  },
  miniLogoCircleIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#0059AB",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
});
