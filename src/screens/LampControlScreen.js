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

const formatLocationHistoryText = (text, language) => {
  if (!text || typeof text !== "string") return text || "-";
  if (language === "Indonesia") return text;
  return text
    .replace(/\bSekarang\b/gi, "Present")
    .replace(/\bLokasi Terbaru\b/gi, "Latest Location")
    .replace(/\bTerbaru\b/gi, "Latest")
    .replace(/\bHari Ini\b/gi, "Today")
    .replace(/\bMinggu Ini\b/gi, "This Week")
    .replace(/\bBulan Ini\b/gi, "This Month")
    .replace(/\bDari\b/gi, "From")
    .replace(/\bKe\b/gi, "To")
    .replace(/\bs\/d\b/gi, "-")
    .replace(/\bsd\b/gi, "-")
    .replace(/\bsampai\b/gi, "to")

    // Specific Dashboard Device Titles & Rooms
    .replace(/\bAC Ruang Lab\b/gi, "Lab Room AC")
    .replace(/\bLampu Ruang Lab\b/gi, "Lab Room Lamp")
    .replace(/\bPower Meter Gedung B\b/gi, "Building B Power Meter")
    .replace(/\bPower Meter Gedung C\b/gi, "Building C Power Meter")
    .replace(/\bPower Meter Gedung D\b/gi, "Building D Power Meter")
    .replace(/\bPower Meter Gedung\b/gi, "Building Power Meter")
    .replace(/\bWater Meter Gedung C\b/gi, "Building C Water Meter")
    .replace(/\bWater Meter Gedung\b/gi, "Building Water Meter")
    .replace(/\bRuang Dosen PSI\b/gi, "PSI Lecturer Room")
    .replace(/\bRuang Lab\b/gi, "Lab Room")

    // General Category Filters & Devices
    .replace(/\bTemperatur & Kelembaban\b/gi, "Temperature & Humidity")
    .replace(/\bTemperatur & Kelembapan\b/gi, "Temperature & Humidity")
    .replace(/\bSensor Suhu & Kelembaban\b/gi, "Temperature & Humidity Sensor")
    .replace(/\bSensor Suhu dan Kelembaban\b/gi, "Temperature & Humidity Sensor")
    .replace(/\bSensor Suhu & Kelembapan\b/gi, "Temperature & Humidity Sensor")
    .replace(/\bSensor Suhu\b/gi, "Temperature Sensor")
    .replace(/\bSensor Kelembaban\b/gi, "Humidity Sensor")
    .replace(/\bSensor Kelembapan\b/gi, "Humidity Sensor")
    .replace(/\bPower Meter\b/gi, "Power Meter")
    .replace(/\bWater Meter\b/gi, "Water Meter")
    .replace(/\bMeteran Air\b/gi, "Water Meter")
    .replace(/\bMeteran Listrik\b/gi, "Power Meter")
    .replace(/\bKontrol AC\b/gi, "AC Control")
    .replace(/\bKontrol Lampu\b/gi, "Lamp Control")
    .replace(/\bLampu Utama\b/gi, "Main Lamp")
    .replace(/\bLampu\b/gi, "Lamp")
    .replace(/\bListrik\b/gi, "Power / Electricity")
    .replace(/\bSemua Perangkat\b/gi, "All Devices")
    .replace(/\bSemua Kategori\b/gi, "All Categories")
    .replace(/\bSemua\b/gi, "All")
    .replace(/\bPerangkat Aktif\b/gi, "Active Devices")
    .replace(/\bPerangkat Tidak Aktif\b/gi, "Inactive Devices")

    // Labs & Rooms
    .replace(/\bLab IoT\b/gi, "IoT Lab")
    .replace(/\bLab Kontrol\b/gi, "Control Lab")
    .replace(/\bLab Otomotif\b/gi, "Automotive Lab")
    .replace(/\bLab Pemrograman\b/gi, "Programming Lab")
    .replace(/\bLab AI\b/gi, "AI Lab")
    .replace(/\bLab Mekatronika\b/gi, "Mechatronics Lab")
    .replace(/\bLab Komputer\b/gi, "Computer Lab")
    .replace(/\bLab Otomasi\b/gi, "Automation Lab")
    .replace(/\bLab Robotika\b/gi, "Robotics Lab")
    .replace(/\bLab Elektronika\b/gi, "Electronics Lab")
    .replace(/\bLab Jaringan\b/gi, "Network Lab")
    .replace(/\bLab Telekomunikasi\b/gi, "Telecommunication Lab")
    .replace(/\bLab Manufaktur\b/gi, "Manufacturing Lab")
    .replace(/\bLab Multimedia\b/gi, "Multimedia Lab")
    .replace(/\bLab Basis Data\b/gi, "Database Lab")
    .replace(/\bLab Bahasa\b/gi, "Language Lab")
    .replace(/\bLaboratorium\b/gi, "Laboratory")
    .replace(/\bRuang Dosen\b/gi, "Lecturer Room")
    .replace(/\bRuang Dekan\b/gi, "Dean Room")
    .replace(/\bRuang Kaprodi\b/gi, "Department Head Room")
    .replace(/\bRuang Rapat Utama\b/gi, "Main Meeting Room")
    .replace(/\bRuang Rapat\b/gi, "Meeting Room")
    .replace(/\bRuang Server\b/gi, "Server Room")
    .replace(/\bRuang Kontrol\b/gi, "Control Room")
    .replace(/\bRuang Direktur\b/gi, "Director Room")
    .replace(/\bRuang Staf\b/gi, "Staff Room")
    .replace(/\bRuang Kuliah\b/gi, "Lecture Room")
    .replace(/\bRuang Kelas\b/gi, "Classroom")
    .replace(/\bRuangan\b/gi, "Room")
    .replace(/\bRuang\b/gi, "Room")
    .replace(/\bGedung A\b/gi, "Building A")
    .replace(/\bGedung B\b/gi, "Building B")
    .replace(/\bGedung C\b/gi, "Building C")
    .replace(/\bGedung D\b/gi, "Building D")
    .replace(/\bGedung E\b/gi, "Building E")
    .replace(/\bGedung Utama\b/gi, "Main Building")
    .replace(/\bGedung\b/gi, "Building")
    .replace(/\bLantai\b/gi, "Floor")
    .replace(/\bSenin\b/gi, "Monday")
    .replace(/\bSelasa\b/gi, "Tuesday")
    .replace(/\bRabu\b/gi, "Wednesday")
    .replace(/\bKamis\b/gi, "Thursday")
    .replace(/\bJum'at\b/gi, "Friday")
    .replace(/\bJumat\b/gi, "Friday")
    .replace(/\bSabtu\b/gi, "Saturday")
    .replace(/\bMinggu\b/gi, "Sunday")
    .replace(/\bJanuari\b/gi, "January")
    .replace(/\bFebruari\b/gi, "February")
    .replace(/\bMaret\b/gi, "March")
    .replace(/\bMei\b/gi, "May")
    .replace(/\bJuni\b/gi, "June")
    .replace(/\bJuli\b/gi, "July")
    .replace(/\bAgustus\b/gi, "August")
    .replace(/\bAgt\b/gi, "Aug")
    .replace(/\bAgu\b/gi, "Aug")
    .replace(/\bSeptember\b/gi, "September")
    .replace(/\bSept?\b/gi, "Sep")
    .replace(/\bOktober\b/gi, "October")
    .replace(/\bOkt\b/gi, "Oct")
    .replace(/\bNovember\b/gi, "November")
    .replace(/\bNov\b/gi, "Nov")
    .replace(/\bDesember\b/gi, "December")
    .replace(/\bDes\b/gi, "Dec");
};

function LocationHistoryTimeline({ locationHistory, colors, language }) {
  if (!Array.isArray(locationHistory) || locationHistory.length === 0) {
    return (
      <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: "italic" }}>
        {language === "Indonesia"
          ? "Belum ada riwayat perpindahan lokasi untuk perangkat ini."
          : "No location transfer history recorded for this device."}
      </Text>
    );
  }
  return locationHistory.map((h, idx) => {
    const rawPeriod = h.periodText || h.PeriodText || "-";
    const rawRoom = h.ruangan || h.Ruangan || "-";
    const period = formatLocationHistoryText(rawPeriod, language);
    const room = formatLocationHistoryText(rawRoom, language);
    return (
      <View key={h.id || h.historyId || `loc-${idx}`} style={{ flexDirection: "row", gap: 10, marginBottom: idx === locationHistory.length - 1 ? 0 : 10 }}>
        <View style={{ alignItems: "center", width: 14 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: idx === 0 ? "#10b981" : "#0059AB", marginTop: 2 }} />
          {idx < locationHistory.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: "#cbd5e1", marginTop: 2 }} />}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: idx === 0 ? "#10b981" : "#0059AB" }}>{period}</Text>
          <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text }}>{room}</Text>
        </View>
      </View>
    );
  });
}

export default function LampControlScreen({ navigation }) {
  const { user, colors, t, language } = useUser();
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
      Alert.alert(
        language === "Indonesia" ? "Akses Ditolak" : "Access Denied",
        language === "Indonesia" ? "Anda tidak memiliki akses untuk mengontrol lampu (Viewer)." : "You do not have access to control lamp (Viewer)."
      );
      return;
    }

    setIsLampOn(value);
    const cmd = value ? "1" : "0";
    const response = await iotService.controlLamp(activeTopic, cmd);

    if (response.error) {
      setIsLampOn(!value);
      Alert.alert(language === "Indonesia" ? "Gagal" : "Failed", response.message || (language === "Indonesia" ? "Gagal mengubah status lampu." : "Failed to change lamp status."));
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
              navigation.navigate("Home");
            }
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("kontrol_lampu")}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>{language === "Indonesia" ? "Memuat status lampu..." : "Loading lamp status..."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.activeBuildingText, { color: colors.textMuted }]}>
            {formatLocationHistoryText(activeBuilding || "Lab IoT (Gedung Utama)", language)}
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
              {isLampOn ? (language === "Indonesia" ? "Lampu Menyala (ON)" : "Lamp ON") : (language === "Indonesia" ? "Lampu Mati (OFF)" : "Lamp OFF")}
            </Text>
          </View>

          {/* Saklar Utama Card */}
          <Card style={[styles.controlCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.controlHeader}>
              <Text style={[styles.controlTitle, { color: colors.text }]}>{language === "Indonesia" ? "Saklar Utama" : "Main Switch"}</Text>
              <Text style={[styles.controlSubtitle, { color: colors.textMuted }]}>
                {language === "Indonesia" ? "Kontrol daya lampu ruangan secara langsung" : "Direct room lighting power control"}
              </Text>
            </View>
            {isViewer ? (
              <Text style={{ color: colors.textMuted, fontSize: 13, fontStyle: "italic" }}>{language === "Indonesia" ? "Viewer (Hanya Lihat)" : "Viewer (Read Only)"}</Text>
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
            {language === "Indonesia" ? "Riwayat Perpindahan Lokasi" : "Location Transfer History"}
          </Text>
          <Card style={{ backgroundColor: colors.cardBackground, borderRadius: 16, padding: 16 }}>
            <LocationHistoryTimeline locationHistory={locationHistory} colors={colors} language={language} />
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
