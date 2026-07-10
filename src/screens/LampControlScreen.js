import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import { ArrowLeft, Lightbulb } from "lucide-react-native";

export default function LampControlScreen({ navigation }) {
  const { user } = useUser();
  const [activeBuilding, setActiveBuilding] = useState("");
  const [lampDeviceId, setLampDeviceId] = useState("DEV_LAMP01");
  const [isLampOn, setIsLampOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isViewer = user?.selectedRole?.roleId === "ROL003";

  const loadLampStatus = async () => {
    setIsLoading(true);
    const response = await iotService.getDashboardLatest();
    setIsLoading(false);

    if (response.error) {
      Alert.alert("Gagal", response.message || "Gagal mengambil status lampu.");
      return;
    }

    let building = "Gedung Utama";
    if (response.length > 0) {
      building = response[0].gedung || "Gedung Utama";
    }
    setActiveBuilding(building);

    let lId = "DEV_LAMP01";
    let pwrOn = false;

    response.forEach((dev) => {
      if (dev?.gedung?.toLowerCase() === building.toLowerCase()) {
        if (dev.category === "Lampu") {
          lId = dev.id;
          pwrOn = dev.status === "ON";
        }
      }
    });

    setLampDeviceId(lId);
    setIsLampOn(pwrOn);
  };

  useEffect(() => {
    loadLampStatus();
  }, []);

  const handleViewerBlock = () => {
    Alert.alert("Akses Ditolak", "Anda tidak memiliki akses untuk mengendalikan perangkat (Viewer).");
  };

  const handleToggle = async (value) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    setIsLampOn(value);
    const statusStr = value ? "ON" : "OFF";
    const response = await iotService.setDeviceStatus(lampDeviceId, statusStr);
    
    if (response.error) {
      setIsLampOn(!value);
      Alert.alert("Gagal", "Gagal mengubah status lampu.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Kontrol Lampu</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={styles.loaderText}>Menghubungkan lampu...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Active Info */}
          <Text style={styles.activeBuildingText}>Lokasi: {activeBuilding}</Text>

          {/* Lamp Visual Representation */}
          <View style={styles.lampVisualContainer}>
            <View
              style={[
                styles.glowCircle,
                isLampOn ? styles.glowCircleOn : styles.glowCircleOff,
              ]}
            >
              <Lightbulb
                size={80}
                color={isLampOn ? "#eab308" : "#adb5bd"}
                style={styles.lampIcon}
              />
            </View>
            <Text style={styles.lampStatusLabel}>
              Status Lampu: {isLampOn ? "MENYALA 💡" : "PADAM 😴"}
            </Text>
          </View>

          {/* Control Switch Card */}
          <Card style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <Text style={styles.controlTitle}>Sakelar Lampu</Text>
              <Text style={styles.controlSubtitle}>
                Hidupkan atau matikan aliran listrik lampu utama.
              </Text>
            </View>
            <Switch
              value={isLampOn}
              onValueChange={handleToggle}
              trackColor={{ false: "#dee2e6", true: "#0059AB" }}
              thumbColor={isLampOn ? "#fff" : "#f4f3f4"}
              disabled={isViewer}
            />
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
