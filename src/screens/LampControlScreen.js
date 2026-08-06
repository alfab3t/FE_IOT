import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import { ArrowLeft, Lightbulb } from "lucide-react-native";

function LocationHistoryTimeline({ locationHistory, colors }) {
  if (!Array.isArray(locationHistory) || locationHistory.length === 0) {
    return (
      <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: "italic" }}>
        Belum ada riwayat perpindahan lokasi untuk perangkat ini.
      </Text>
    );
  }
  return locationHistory.map((h, idx) => (
    <View key={h.id || h.historyId || `loc-${idx}`} style={{ flexDirection: "row", gap: 10, marginBottom: idx === locationHistory.length - 1 ? 0 : 10 }}>
      <View style={{ alignItems: "center", width: 14 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: idx === 0 ? "#10b981" : "#0059AB", marginTop: 2 }} />
        {idx < locationHistory.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: "#cbd5e1", marginTop: 2 }} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: idx === 0 ? "#10b981" : "#0059AB" }}>{h.periodText || h.PeriodText}</Text>
        <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text }}>{h.ruangan || h.Ruangan}</Text>
      </View>
    </View>
  ));
}

export default function LampControlScreen({ navigation }) {
  const { user, colors } = useUser();
  const [activeBuilding, setActiveBuilding] = useState("");
  const [lampDeviceId, setLampDeviceId] = useState("DEV_LAMP01");
  const [isLampOn, setIsLampOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);

  const selectedRoleName = user?.selectedRole?.roleName || "Viewer";
  const isViewer = user?.selectedRole?.roleId === "ROL003" || user?.selectedRole?.roleId === "ROL03" || selectedRoleName.toLowerCase().includes("viewer");

  const processLampDevice = async (firstLamp) => {
    setIsLampOn(firstLamp.status === "ON" || firstLamp.status === "1");
    setLampDeviceId(firstLamp.id);
    setActiveBuilding(`${firstLamp.ruangan} (${firstLamp.gedung})`);
    const devDetail = await iotService.getDeviceById(firstLamp.id);
    const historyList = devDetail?.locationHistory || devDetail?.LocationHistory || devDetail?.data?.locationHistory || devDetail?.data?.LocationHistory;
    if (Array.isArray(historyList)) {
      setLocationHistory(historyList);
    }
  };

  const loadLampStatus = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true);
    const response = await iotService.getDashboardLatest();

    if (response?.error) {
      if (isInitial) setIsLoading(false);
      return;
    }

    const firstLamp = response.find((d) => d.category === "Lampu" || d.name?.toLowerCase().includes("lamp"));
    if (firstLamp) {
      await processLampDevice(firstLamp);
    } else {
      setActiveBuilding("Lab IoT (Gedung Utama)");
    }
    if (isInitial) setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLampStatus(true);
    }, [loadLampStatus])
  );

  useEffect(() => {
    loadLampStatus(true);
    const timer = setInterval(() => {
      loadLampStatus(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [loadLampStatus]);

  const handleToggle = async (value) => {
    if (isViewer) {
      Alert.alert("Akses Ditolak", "Viewer tidak diperbolehkan mengontrol perangkat.");
      return;
    }

    setIsLampOn(value);
    const cmd = value ? "ON" : "OFF";
    const response = await iotService.controlDevice(lampDeviceId, cmd);
    
    if (response.error) {
      setIsLampOn(!value);
      Alert.alert("Gagal", response.message || "Gagal mengontrol lampu.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header / Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("Home");
            }
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Kontrol Lampu</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>Memuat status lampu...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.activeBuildingText, { color: colors.textMuted }]}>
            {activeBuilding || "Lab IoT (Gedung Utama)"}
          </Text>

          {/* Visual Lampu Glowing */}
          <View style={styles.lampVisualContainer}>
            <View
              style={[
                styles.glowCircle,
                isLampOn ? styles.glowCircleOn : styles.glowCircleOff,
              ]}
            >
              <Lightbulb
                size={80}
                color={isLampOn ? "#eab308" : "#94a3b8"}
                style={styles.lampIcon}
              />
            </View>
            <Text style={[styles.lampStatusLabel, { color: colors.text }]}>
              {isLampOn ? "Lampu Menyala (ON)" : "Lampu Mati (OFF)"}
            </Text>
          </View>

          {/* Saklar Utama Card */}
          <Card style={[styles.controlCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.controlHeader}>
              <Text style={[styles.controlTitle, { color: colors.text }]}>Saklar Utama</Text>
              <Text style={[styles.controlSubtitle, { color: colors.textMuted }]}>
                Kontrol daya lampu ruangan secara langsung
              </Text>
            </View>
            {isViewer ? (
              <Text style={{ color: colors.textMuted, fontSize: 13, fontStyle: "italic" }}>Viewer (Hanya Lihat)</Text>
            ) : (
              <Switch
                value={isLampOn}
                onValueChange={handleToggle}
                trackColor={{ false: "#cbd5e1", true: "#0059AB" }}
                thumbColor={isLampOn ? "#ffffff" : "#f1f5f9"}
              />
            )}
          </Card>

          {/* Riwayat Perpindahan Lokasi Timeline */}
          <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text, marginTop: 24, marginBottom: 12 }}>
            Riwayat Perpindahan Lokasi
          </Text>
          <Card style={{ backgroundColor: colors.cardBackground, borderRadius: 16, padding: 16 }}>
            <LocationHistoryTimeline locationHistory={locationHistory} colors={colors} />
          </Card>
        </ScrollView>
      )}
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
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
  },
  scrollContent: {
    padding: 16,
  },
  activeBuildingText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "600",
    marginBottom: 16,
  },
  lampVisualContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  glowCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  glowCircleOn: {
    backgroundColor: "#fef9c3",
    shadowColor: "#eab308",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  glowCircleOff: {
    backgroundColor: "#e9ecef",
  },
  lampIcon: {
    marginTop: -4,
  },
  lampStatusLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#495057",
    marginTop: 24,
  },
  controlCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  controlHeader: {
    flexDirection: "column",
    flex: 1,
    paddingRight: 16,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  controlSubtitle: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
    fontWeight: "500",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6c757d",
  },
});
