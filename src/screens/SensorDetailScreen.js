import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import { ArrowLeft, Thermometer, Droplets, MapPin, Wifi } from "lucide-react-native";

const formatDecimal = (value, digits = 1) =>
  Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export default function SensorDetailScreen({ navigation, route }) {
  const { colors, language } = useUser();
  const { deviceId, deviceName, deviceLocation } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState("Online");
  const [locationHistory, setLocationHistory] = useState([]);

  const processSensorDevice = (dev) => {
    if (!dev) return;
    setDeviceStatus(dev.isActive !== false ? "Online" : "Offline");
    if (dev.limitMin != null && !Number.isNaN(Number(dev.limitMin))) {
      setTemperature(Number(dev.limitMin));
    }
    if (dev.limitMax != null && !Number.isNaN(Number(dev.limitMax))) {
      setHumidity(Number(dev.limitMax));
    }
  };

  // Load latest readings & device detail including location history
  const loadLatestData = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true);
    const response = await iotService.getDashboardLatest();
    if (deviceId) {
      const devDetail = await iotService.getDeviceById(deviceId);
      const historyList = devDetail?.locationHistory || devDetail?.LocationHistory || devDetail?.data?.locationHistory || devDetail?.data?.LocationHistory;
      if (Array.isArray(historyList)) {
        setLocationHistory(historyList);
      }
    }
    if (isInitial) setIsLoading(false);
    if (!response?.error && Array.isArray(response)) {
      const dev = response.find((d) => d.id === deviceId);
      processSensorDevice(dev);
    }
  }, [deviceId]);

  useFocusEffect(
    useCallback(() => {
      loadLatestData(true);
    }, [loadLatestData])
  );

  useEffect(() => {
    loadLatestData(true);
    const timer = setInterval(() => {
      loadLatestData(false);
    }, 5000); // 5s REAL-TIME live telemetry updates
    return () => clearInterval(timer);
  }, [loadLatestData]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <SensorNavBar navigation={navigation} deviceName={deviceName} colors={colors} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>
            {language === "Indonesia" ? "Memuat data sensor..." : "Loading sensor data..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SensorNavBar navigation={navigation} deviceName={deviceName} colors={colors} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SensorInfoCard deviceName={deviceName} deviceLocation={deviceLocation} deviceStatus={deviceStatus} colors={colors} language={language} />
        <SensorReadingsCard temperature={temperature} humidity={humidity} language={language} />
        <SensorStatusCard temperature={temperature} humidity={humidity} colors={colors} language={language} />
        <LocationHistoryCard locationHistory={locationHistory} colors={colors} language={language} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers & Subcomponents ───────────────────────────────────────────────
function SensorNavBar({ navigation, deviceName, colors }) {
  return (
    <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
        {deviceName || "Sensor Detail"}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function SensorInfoCard({ deviceName, deviceLocation, deviceStatus, colors, language }) {
  return (
    <Card style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.infoRow}>
        <View style={[styles.iconCircle, { backgroundColor: "#fef3c7" }]}>
          <Thermometer size={26} color="#f59e0b" />
        </View>
        <View style={styles.infoTextBlock}>
          <Text style={[styles.infoName, { color: colors.text }]}>{deviceName || "Sensor Suhu & Kelembaban"}</Text>
          {deviceLocation ? (
            <View style={styles.metaRow}>
              <MapPin size={11} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{deviceLocation}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Wifi size={11} color={deviceStatus === "Online" ? "#10b981" : "#ef4444"} />
            <Text style={[styles.metaText, { color: deviceStatus === "Online" ? "#10b981" : "#ef4444" }]}>
              {language === "Indonesia" ? (deviceStatus === "Online" ? "Aktif" : "Tidak Aktif") : deviceStatus}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function SensorReadingsCard({ temperature, humidity, language }) {
  return (
    <View style={styles.readingsRow}>
      <View style={[styles.readingCard, { backgroundColor: "#fef2f2" }]}>
        <View style={[styles.readingIconCircle, { backgroundColor: "#fee2e2" }]}>
          <Thermometer size={22} color="#ef4444" />
        </View>
        <Text style={styles.readingCardLabel}>
          {language === "Indonesia" ? "Suhu" : "Temperature"}
        </Text>
        <Text style={[styles.readingCardValue, { color: "#ef4444" }]}>
          {temperature !== null ? formatDecimal(temperature, 1) : "—"}
        </Text>
        <Text style={styles.readingCardUnit}>°C</Text>
        <Text style={{ fontSize: 10, fontWeight: "600", color: "#ef4444", marginTop: 2, textAlign: "center" }}>
          {language === "Indonesia" ? "Normal: 18°C – 30°C" : "Normal: 18°C – 30°C"}
        </Text>
      </View>

      <View style={[styles.readingCard, { backgroundColor: "#eff6ff" }]}>
        <View style={[styles.readingIconCircle, { backgroundColor: "#dbeafe" }]}>
          <Droplets size={22} color="#0284c7" />
        </View>
        <Text style={styles.readingCardLabel}>
          {language === "Indonesia" ? "Kelembaban" : "Humidity"}
        </Text>
        <Text style={[styles.readingCardValue, { color: "#0284c7" }]}>
          {humidity !== null ? formatDecimal(humidity, 1) : "—"}
        </Text>
        <Text style={styles.readingCardUnit}>%</Text>
        <Text style={{ fontSize: 10, fontWeight: "600", color: "#0284c7", marginTop: 2, textAlign: "center" }}>
          {language === "Indonesia" ? "Normal: 40% – 80%" : "Normal: 40% – 80%"}
        </Text>
      </View>
    </View>
  );
}

function SensorStatusCard({ temperature, humidity, colors, language }) {
  const getTempStatus = () => {
    if (temperature !== null && temperature > 30) {
      return language === "Indonesia" ? "⚠️ Suhu di atas normal (> 30°C)" : "⚠️ Temperature above normal (> 30°C)";
    }
    if (temperature !== null && temperature < 18) {
      return language === "Indonesia" ? "❄️ Suhu di bawah normal (< 18°C)" : "❄️ Temperature below normal (< 18°C)";
    }
    return language === "Indonesia" ? "✅ Suhu dalam kondisi normal" : "✅ Temperature is normal";
  };

  const getHumiStatus = () => {
    if (humidity > 80) {
      return language === "Indonesia" ? "💧 Kelembaban sangat tinggi (> 80%)" : "💧 Humidity very high (> 80%)";
    }
    if (humidity < 40) {
      return language === "Indonesia" ? "🌵 Kelembaban terlalu rendah (< 40%)" : "🌵 Humidity too low (< 40%)";
    }
    return language === "Indonesia" ? "✅ Kelembaban dalam kondisi normal" : "✅ Humidity is normal";
  };

  return (
    <Card style={[styles.statusCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, {
          backgroundColor: temperature !== null && (temperature > 30 || temperature < 18) ? "#ef4444" : "#10b981"
        }]} />
        <Text style={[styles.statusCardText, { color: colors.text }]}>
          {getTempStatus()}
        </Text>
      </View>
      {humidity !== null && (
        <View style={[styles.statusRow, { marginTop: 6 }]}>
          <View style={[styles.statusDot, {
            backgroundColor: humidity > 80 || humidity < 40 ? "#f59e0b" : "#10b981"
          }]} />
          <Text style={[styles.statusCardText, { color: colors.text }]}>
            {getHumiStatus()}
          </Text>
        </View>
      )}
    </Card>
  );
}

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

function LocationHistoryCard({ locationHistory, colors, language }) {
  const items = Array.isArray(locationHistory) ? locationHistory : [];

  return (
    <Card style={{ padding: 16, marginTop: 12, backgroundColor: colors.cardBackground }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
        {language === "Indonesia" ? "Riwayat Perpindahan Lokasi" : "Location Transfer History"}
      </Text>
      {items.length > 0 ? (
        items.map((h, idx) => {
          const rawPeriod = h.periodText || h.PeriodText || "-";
          const rawRoom = h.ruangan || h.Ruangan || "-";
          const period = formatLocationHistoryText(rawPeriod, language);
          const room = formatLocationHistoryText(rawRoom, language);
          return (
            <View key={h.id || h.historyId || `loc-${idx}`} style={{ flexDirection: "row", gap: 12, marginBottom: idx === items.length - 1 ? 0 : 12 }}>
              <View style={{ alignItems: "center", width: 14 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: idx === 0 ? "#10b981" : "#0059AB", marginTop: 2 }} />
                {idx < items.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: "#cbd5e1", marginTop: 2 }} />}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: idx === 0 ? "#10b981" : "#0059AB" }}>
                  {period}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text }}>
                  {room}
                </Text>
              </View>
            </View>
          );
        })
      ) : (
        <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: "italic" }}>
          {language === "Indonesia"
            ? "Belum ada riwayat perpindahan lokasi untuk perangkat ini."
            : "No location transfer history recorded for this device."}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbar: {
    height: 60,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backBtn: { padding: 8 },
  navTitle: { fontSize: 16, fontWeight: "800", flex: 1, textAlign: "center" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },

  // Info card
  infoCard: { padding: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  infoTextBlock: { flex: 1, gap: 3 },
  infoName: { fontSize: 15, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontWeight: "500" },

  // Reading cards
  readingsRow: { flexDirection: "row", gap: 12 },
  readingCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  readingIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  readingCardLabel: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  readingCardValue: { fontSize: 36, fontWeight: "900", lineHeight: 42 },
  readingCardUnit: { fontSize: 14, fontWeight: "700", color: "#94a3b8" },

  // Status card
  statusCard: { padding: 14 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusCardText: { fontSize: 13, fontWeight: "600", flex: 1 },

  // Location History Card
  historyCard: { padding: 16 },
  historyHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  historyIconCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  historyTitle: { fontSize: 15, fontWeight: "800" },
  timelineContainer: { paddingLeft: 4 },
  timelineItemRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  timelineLeftColumn: { alignItems: "center", width: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineDotActive: { backgroundColor: "#0059AB", borderWidth: 2, borderColor: "#93c5fd" },
  timelineDotInactive: { backgroundColor: "#cbd5e1" },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#e2e8f0", marginTop: 4 },
  timelineContentBox: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  timelineHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  dateBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#eff6ff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  dateBadgeText: { fontSize: 11, fontWeight: "700", color: "#0059AB" },
  activeBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  activeBadgeText: { fontSize: 10, fontWeight: "800", color: "#16a34a" },
  locationName: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  locationMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationMetaText: { fontSize: 12, fontWeight: "600" },
  updatedByText: { fontSize: 10, fontWeight: "500", marginTop: 2 },

  // Chart
  chartCard: { padding: 16 },
  chartTitle: { fontSize: 14, fontWeight: "800", marginBottom: 12 },
  chartModeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  modeBtnActiveRed: { backgroundColor: "#ef4444" },
  modeBtnActiveBlue: { backgroundColor: "#0284c7" },
  modeBtnText: { fontSize: 12, fontWeight: "700" },
  periodScroll: { marginBottom: 14 },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
    backgroundColor: "#f1f5f9",
  },
  periodBtnActive: { backgroundColor: "#0059AB" },
  periodBtnText: { fontSize: 12, fontWeight: "700" },
  chartArea: { flexDirection: "row", gap: 6, alignItems: "flex-end" },
  yAxis: { justifyContent: "space-between", height: 130, paddingRight: 4 },
  axisLabel: { fontSize: 9, fontWeight: "600" },
  chartPlaceholder: { height: 130, justifyContent: "center", alignItems: "center", gap: 8 },
  placeholderText: { fontSize: 13, fontWeight: "600" },
});
