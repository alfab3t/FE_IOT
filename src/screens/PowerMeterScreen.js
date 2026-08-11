import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import { ArrowLeft, Zap, TrendingUp, MapPin, Wifi } from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";
import DateRangeFilter from "../components/DateRangeFilter";


const SCREEN_WIDTH = Dimensions.get("window")?.width || 360;
const CHART_WIDTH = SCREEN_WIDTH - 32 - 32; // padding horizontal
const CHART_HEIGHT = 160;

const PERIOD_OPTIONS = [
  { label: "Per Jam", value: "Hourly" },
  { label: "Harian", value: "Daily" },
  { label: "Mingguan", value: "Weekly" },
];

// Format angka dengan koma sebagai pemisah desimal (format Indonesia)
const formatDecimal = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

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
    .replace(/\bLab AI\b/gi, "AI Lab")
    .replace(/\bLab Mekatronika\b/gi, "Mechatronics Lab")
    .replace(/\bLab Komputer\b/gi, "Computer Lab")
    .replace(/\bLab Otomasi\b/gi, "Automation Lab")
    .replace(/\bLab Robotika\b/gi, "Robotics Lab")
    .replace(/\bLab Elektronika\b/gi, "Electronics Lab")
    .replace(/\bLab Jaringan\b/gi, "Network Lab")
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

export default function PowerMeterScreen({ navigation, route }) {
  const { colors, language } = useUser();
  const { deviceId, deviceName, deviceLocation } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [latestValue, setLatestValue] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState("Online");
  const [graphData, setGraphData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("Hourly");
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === "Hourly") {
      setRangeStart(null);
      setRangeEnd(null);
    }
    setSelectedPeriod(newPeriod);
  };

  const updateDeviceState = (dev) => {
    if (!dev) {
      setLatestValue(null);
      return;
    }
    setDeviceStatus(dev.isActive !== false ? "Online" : "Offline");
    if (dev.limitMin != null && !Number.isNaN(Number(dev.limitMin))) {
      const val = Number(dev.limitMin);
      setLatestValue(val > 100 ? val / 1000.0 : val);
    } else {
      setLatestValue(null);
    }
  };

  // Load latest reading from dashboard (Real-time telemetry)
  const loadLatestData = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true);
    const response = await iotService.getDashboardLatest();
    if (isInitial) setIsLoading(false);
    if (!response?.error && Array.isArray(response)) {
      const dev = response.find(
        (d) =>
          d.id === deviceId ||
          (d.name && deviceName && d.name.toLowerCase() === deviceName.toLowerCase())
      );
      updateDeviceState(dev);
    }
  }, [deviceId, deviceName]);

  // Load chart data
  const loadChartData = useCallback(async (period) => {
    setIsChartLoading(true);
    const response = await iotService.getGraphData(deviceId, period,rangeStart ? rangeStart.toISOString() : null,
    rangeEnd ? rangeEnd.toISOString() : null);
    setIsChartLoading(false);
    if (!response?.error && Array.isArray(response) && response.length > 0) {
      const sliced = response.length > 7 ? response.slice(-7) : response;
      setGraphData(sliced);
    } else {
      setGraphData([]);
    }
  }, [deviceId, rangeStart, rangeEnd]);

  useEffect(() => {
    loadLatestData(true);
    const timer = setInterval(() => {
      loadLatestData(false);
    }, 5000); // 5s REAL-TIME live telemetry updates
    return () => clearInterval(timer);
  }, [loadLatestData]);

  useEffect(() => {
    loadChartData(selectedPeriod);
  }, [selectedPeriod, loadChartData]);

  // ── Line Chart ───────────────────────────────────────────────────────────
  const thinLabels = (labels) => {
    if (!labels || labels.length === 0) return [];
    const len = labels.length;
    const n = len > 7 ? Math.max(1, Math.ceil(len / 4)) : 1;

    return labels.map((lbl, i) => {
      if (!lbl || (len > 7 && i !== 0 && i !== len - 1 && i % n !== 0)) return "";
      let s = lbl.trim();

      if (s.includes("(") && s.endsWith(")")) {
        const openIdx = s.indexOf("(");
        if (openIdx !== -1) {
          const inside = s.slice(openIdx + 1, -1).trim();
          if (/^Minggu\s+\d+/i.test(s) || /^Mgg\s+\d+/i.test(s)) {
            const mggNum = s.slice(0, openIdx).replace("Minggu", "M").replace("Mgg", "M").trim();
            const monthParts = inside.split(" ");
            const monthShort = monthParts[0] ? monthParts[0].substring(0, 3) : "";
            return `${mggNum} ${monthShort}`;
          }
          return inside;
        }
      }

      return s;
    });
  };

  const chartConfig = {
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0,89,171,${opacity})`,
    labelColor: () => colors.textMuted,
    propsForDots: { r: "3", strokeWidth: "2", stroke: "#0059AB" },
    propsForLabels: { fontSize: 9 },
  };

  // ── Mini Chart Renderer ──────────────────────────────────────────────────
  const renderChart = () => {
    if (isChartLoading) {
      return (
        <View style={styles.chartLoaderBox}>
          <ActivityIndicator size="small" color="#0059AB" />
          <Text style={[styles.chartLoaderText, { color: colors.textMuted }]}>
            {language === "Indonesia" ? "Memuat grafik..." : "Loading chart..."}
          </Text>
        </View>
      );
    }
    if (!graphData || graphData.length === 0) {
      return (
        <View style={styles.chartLoaderBox}>
          <TrendingUp size={32} color={colors.textMuted} />
          <Text style={[styles.chartLoaderText, { color: colors.textMuted }]}>Belum ada data grafik</Text>
        </View>
      );
    }

    // Convert W → kWh for display
    const values = graphData.map((p) => (p.averageValue ?? p.average ?? 0) / 1000);
    const labels = thinLabels(graphData.map((p) => p.labelText ?? ""));

    return (
      <LineChart
        data={{ labels, datasets: [{ data: values }] }}
        width={CHART_WIDTH + 32}
        height={CHART_HEIGHT + 35}
        chartConfig={chartConfig}
        bezier
        verticalLabelRotation={0}
        xLabelsOffset={2}
        style={{ borderRadius: 10, marginLeft: -16 }}
        withHorizontalLabels={true}
        fromZero={false}
      />
    );
  };

  // ── Stats Summary ────────────────────────────────────────────────────────
  const hasConsumption = latestValue !== null && latestValue !== undefined && Number(latestValue) > 0;

  const avgValueRaw = graphData.length > 0
    ? (graphData.reduce((s, p) => s + (p.averageValue ?? p.average ?? 0), 0) / graphData.length) / 1000
    : null;
  const maxValueRaw = graphData.length > 0
    ? Math.max(...graphData.map((p) => p.maximumValue ?? p.max ?? 0)) / 1000
    : null;
  const minValueRaw = graphData.length > 0
    ? Math.min(...graphData.map((p) => p.minimumValue ?? p.min ?? 0)) / 1000
    : null;

  const avgValue = formatDecimal(avgValueRaw, 3);
  const maxValue = formatDecimal(maxValueRaw, 3);
  const minValue = formatDecimal(minValueRaw, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
          {deviceName || "Power Meter"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>
            {language === "Indonesia" ? "Memuat data..." : "Loading data..."}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Device Info Card */}
          <Card style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: "#e0f2fe" }]}>
                <Zap size={28} color="#0059AB" />
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={[styles.infoDeviceName, { color: colors.text }]}>{deviceName || "Power Meter"}</Text>
                {deviceLocation ? (
                  <View style={styles.locationRow}>
                    <MapPin size={12} color={colors.textMuted} />
                    <Text style={[styles.infoLocation, { color: colors.textMuted }]}>{formatLocationHistoryText(deviceLocation, language)}</Text>
                  </View>
                ) : null}
                <View style={styles.statusRow}>
                  <Wifi size={12} color={deviceStatus === "Online" ? "#10b981" : "#ef4444"} />
                  <Text style={[styles.statusText, { color: deviceStatus === "Online" ? "#10b981" : "#ef4444" }]}>
                    {deviceStatus}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Current Reading Card */}
          <Card style={[styles.readingCard, { backgroundColor: "#0059AB" }]}>
            <Text style={styles.readingLabel}>
              {language === "Indonesia" ? "Konsumsi Daya Saat Ini" : "Current Power Consumption"}
            </Text>
            {hasConsumption ? (
              <View style={styles.readingValueRow}>
                <Text style={styles.readingValue}>
                  {formatDecimal(Number(latestValue) / 1000, 2)}
                </Text>
                <Text style={styles.readingUnit}>kWh</Text>
              </View>
            ) : (
              <View style={styles.emptyReadingBox}>
                <Text style={styles.emptyReadingText}>
                  {language === "Indonesia"
                    ? "Saat ini tidak ada perangkat yang menggunakan power meter/plug ini"
                    : "No device is currently using this power meter/plug"}
                </Text>
              </View>
            )}
          </Card>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {[
              { label: language === "Indonesia" ? "Rata-rata" : "Average", value: avgValue, unit: "kWh", color: "#0059AB" },
              { label: language === "Indonesia" ? "Tertinggi" : "Highest", value: maxValue, unit: "kWh", color: "#ef4444" },
              { label: language === "Indonesia" ? "Terendah" : "Lowest", value: minValue, unit: "kWh", color: "#10b981" },
            ].map((s) => (
              <Card key={s.label} style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statUnit, { color: colors.textMuted }]}>{s.unit}</Text>
              </Card>
            ))}
          </View>

          {/* Chart Section */}
          <Card style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {language === "Indonesia" ? "Grafik Konsumsi" : "Consumption Chart"}
              </Text>
            </View>

            {/* Period selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
              {PERIOD_OPTIONS.map((p) => {
                const isActive = selectedPeriod === p.value;
                let pLabel = p.label;
                if (language === "English") {
                  if (p.value === "Hourly") pLabel = "Hourly";
                  else if (p.value === "Daily") pLabel = "Daily";
                  else if (p.value === "Weekly") pLabel = "Weekly";
                }
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.periodBtn, isActive && styles.periodBtnActive]}
                    onPress={() => handlePeriodChange(p.value)}
                  >
                    <Text style={[styles.periodBtnText, { color: isActive ? "#fff" : colors.textMuted }]}>
                      {pLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedPeriod !== "Hourly" && (
              <DateRangeFilter
                startDate={rangeStart}
                endDate={rangeEnd}
                onChange={(s, e) => { setRangeStart(s); setRangeEnd(e); }}
                colors={colors}
              />
            )}
            
            {/* Chart */}
            <View style={styles.chartWrapper}>
              {renderChart()}
            </View>
          </Card>

        </ScrollView>
      )}
    </SafeAreaView>
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
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Info card
  infoCard: { padding: 16, marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  infoTextBlock: { flex: 1, gap: 4 },
  infoDeviceName: { fontSize: 15, fontWeight: "800" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  infoLocation: { fontSize: 12, fontWeight: "500" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Reading card
  readingCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  readingLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  readingValueRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  readingValue: { color: "#fff", fontSize: 52, fontWeight: "900", lineHeight: 60 },
  readingUnit: { color: "rgba(255,255,255,0.85)", fontSize: 20, fontWeight: "700", marginBottom: 10 },
  readingDeviceId: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8, fontWeight: "600" },
  emptyReadingBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  emptyReadingText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: { flex: 1, padding: 12, alignItems: "center", gap: 2 },
  statLabel: { fontSize: 11, fontWeight: "600" },
  statValue: { fontSize: 18, fontWeight: "900" },
  statUnit: { fontSize: 10, fontWeight: "600" },

  // Chart
  chartCard: { padding: 16 },
  chartHeader: { marginBottom: 12 },
  chartTitle: { fontSize: 14, fontWeight: "800" },
  periodScroll: { marginBottom: 16 },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f1f5f9",
  },
  periodBtnActive: { backgroundColor: "#0059AB" },
  periodBtnText: { fontSize: 12, fontWeight: "700" },
  chartWrapper: { minHeight: CHART_HEIGHT + 20 },
  chartArea: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  yAxis: { justifyContent: "space-between", height: CHART_HEIGHT, paddingRight: 4 },
  axisLabel: { fontSize: 9, fontWeight: "600" },
  chartLoaderBox: { height: CHART_HEIGHT, justifyContent: "center", alignItems: "center", gap: 8 },
  chartLoaderText: { fontSize: 13, fontWeight: "600" },
});