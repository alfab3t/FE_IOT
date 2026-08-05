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
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import { ArrowLeft, Thermometer, Droplets, MapPin, Wifi, TrendingUp, Clock, Calendar, History } from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 32 - 48;
const CHART_HEIGHT = 130;

const PERIOD_OPTIONS = [
  { label: "Per Jam", value: "Hourly" },
  { label: "Harian", value: "Daily" },
  { label: "Mingguan", value: "Weekly" },
];

export default function SensorDetailScreen({ navigation, route }) {
  const { colors } = useUser();
  const { deviceId, deviceName, deviceLocation } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState("Online");
  const [graphData, setGraphData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("Hourly");
  const [chartMode, setChartMode] = useState("temp"); // "temp" | "humi"
  const [locationHistory, setLocationHistory] = useState([]);

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
    if (!response.error && Array.isArray(response)) {
      const dev = response.find((d) => d.id === deviceId);
      if (dev) {
        setDeviceStatus(dev.isActive !== false ? "Online" : "Offline");
        if (dev.limitMin != null && !Number.isNaN(Number(dev.limitMin))) {
          setTemperature(Number(dev.limitMin));
        }
        if (dev.limitMax != null && !Number.isNaN(Number(dev.limitMax))) {
          setHumidity(Number(dev.limitMax));
        }
      }
    }
  }, [deviceId]);

  useFocusEffect(
    useCallback(() => {
      loadLatestData(true);
      loadChartData(selectedPeriod, chartMode);
    }, [loadLatestData, loadChartData, selectedPeriod, chartMode])
  );

  // Load chart data
  const loadChartData = useCallback(async (period, mode = chartMode) => {
    setIsChartLoading(true);
    let response;
    const category = mode === "humi" ? "Kelembaban" : "Suhu";
    response = await iotService.getGraphAverage(category, period);
    if ((!response || response.error || !Array.isArray(response) || response.length === 0) && deviceId) {
      response = await iotService.getDashboardGraph(deviceId, period);
    }
    setIsChartLoading(false);
    if (!response?.error && Array.isArray(response) && response.length > 0) {
      const sliced = response.length > 7 ? response.slice(-7) : response;
      setGraphData(sliced);
    } else {
      setGraphData([]);
    }
  }, [deviceId, chartMode]);

  useEffect(() => {
    loadLatestData(true);
    loadChartData(selectedPeriod, chartMode);
    const timer = setInterval(() => {
      loadLatestData(false);
      loadChartData(selectedPeriod, chartMode);
    }, 5000); // 5s REAL-TIME live telemetry and graph updates
    return () => clearInterval(timer);
  }, [loadLatestData, loadChartData, selectedPeriod, chartMode]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <SensorNavBar navigation={navigation} deviceName={deviceName} colors={colors} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>Memuat data sensor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SensorNavBar navigation={navigation} deviceName={deviceName} colors={colors} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SensorInfoCard deviceName={deviceName} deviceLocation={deviceLocation} deviceStatus={deviceStatus} colors={colors} />
        <SensorReadingsCard temperature={temperature} humidity={humidity} />
        <SensorStatusCard temperature={temperature} humidity={humidity} colors={colors} />
        <LocationHistoryCard locationHistory={locationHistory} colors={colors} />
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

function SensorInfoCard({ deviceName, deviceLocation, deviceStatus, colors }) {
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
              {deviceStatus}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function SensorReadingsCard({ temperature, humidity }) {
  return (
    <View style={styles.readingsRow}>
      <View style={[styles.readingCard, { backgroundColor: "#fef2f2" }]}>
        <View style={[styles.readingIconCircle, { backgroundColor: "#fee2e2" }]}>
          <Thermometer size={22} color="#ef4444" />
        </View>
        <Text style={styles.readingCardLabel}>Suhu</Text>
        <Text style={[styles.readingCardValue, { color: "#ef4444" }]}>
          {temperature !== null ? temperature.toFixed(1) : "—"}
        </Text>
        <Text style={styles.readingCardUnit}>°C</Text>
      </View>

      <View style={[styles.readingCard, { backgroundColor: "#eff6ff" }]}>
        <View style={[styles.readingIconCircle, { backgroundColor: "#dbeafe" }]}>
          <Droplets size={22} color="#0284c7" />
        </View>
        <Text style={styles.readingCardLabel}>Kelembaban</Text>
        <Text style={[styles.readingCardValue, { color: "#0284c7" }]}>
          {humidity !== null ? humidity.toFixed(1) : "—"}
        </Text>
        <Text style={styles.readingCardUnit}>%</Text>
      </View>
    </View>
  );
}

function SensorStatusCard({ temperature, humidity, colors }) {
  const getTempStatus = () => {
    if (temperature !== null && temperature > 30) return "⚠️ Suhu di atas normal (> 30°C)";
    if (temperature !== null && temperature < 18) return "❄️ Suhu di bawah normal (< 18°C)";
    return "✅ Suhu dalam kondisi normal";
  };

  const getHumiStatus = () => {
    if (humidity > 80) return "💧 Kelembaban sangat tinggi (> 80%)";
    if (humidity < 40) return "🌵 Kelembaban terlalu rendah (< 40%)";
    return "✅ Kelembaban dalam kondisi normal";
  };

  return (
    <Card style={[styles.statusCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, {
          backgroundColor: temperature !== null && temperature > 30 ? "#ef4444" : "#10b981"
        }]} />
        <Text style={[styles.statusCardText, { color: colors.text }]}>
          {getTempStatus()}
        </Text>
      </View>
      {humidity !== null && (
        <View style={[styles.statusRow, { marginTop: 6 }]}>
          <View style={[styles.statusDot, {
            backgroundColor: humidity > 80 ? "#f59e0b" : "#10b981"
          }]} />
          <Text style={[styles.statusCardText, { color: colors.text }]}>
            {getHumiStatus()}
          </Text>
        </View>
      )}
    </Card>
  );
}

const thinLabels = (labels) => {
  if (!labels || labels.length === 0) return [];
  const len = labels.length;
  let n;
  if (len <= 6) { n = 1; }
  else if (len <= 12) { n = 2; }
  else { n = 3; }
  return labels.map((lbl, i) => (i === 0 || i === len - 1 || i % n === 0 ? lbl : ""));
};

function SensorChart({ isChartLoading, graphData, chartMode, colors }) {
  const lineColor = chartMode === "temp" ? "#ef4444" : "#0284c7";
  const chartConfig = {
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 1,
    color: (opacity = 1) => chartMode === "temp"
      ? `rgba(239,68,68,${opacity})`
      : `rgba(2,132,199,${opacity})`,
    labelColor: () => colors.textMuted,
    propsForDots: { r: "3", strokeWidth: "2", stroke: lineColor },
    propsForLabels: { fontSize: 9 },
  };

  if (isChartLoading) {
    return (
      <View style={styles.chartPlaceholder}>
        <ActivityIndicator size="small" color="#0059AB" />
        <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Memuat grafik...</Text>
      </View>
    );
  }
  if (!graphData || graphData.length === 0) {
    return (
      <View style={styles.chartPlaceholder}>
        <TrendingUp size={28} color={colors.textMuted} />
        <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Belum ada data grafik</Text>
      </View>
    );
  }

  const values = graphData.map((p) => p.averageValue ?? p.average ?? 0);
  const labels = thinLabels(graphData.map((p) => p.labelText ?? ""));

  return (
    <LineChart
      data={{ labels, datasets: [{ data: values }] }}
      width={CHART_WIDTH + 32}
      height={CHART_HEIGHT + 40}
      chartConfig={chartConfig}
      bezier
      style={{ borderRadius: 10, marginLeft: -16 }}
      withHorizontalLabels={true}
      fromZero={false}
    />
  );
}

function LocationHistoryCard({ locationHistory, colors }) {
  const items = Array.isArray(locationHistory) ? locationHistory : [];

  return (
    <Card style={{ padding: 16, marginTop: 12, backgroundColor: colors.cardBackground }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
        Riwayat Perpindahan Lokasi
      </Text>
      {items.length > 0 ? (
        items.map((h, idx) => (
          <View key={idx} style={{ flexDirection: "row", gap: 12, marginBottom: idx === items.length - 1 ? 0 : 12 }}>
            <View style={{ alignItems: "center", width: 14 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: idx === 0 ? "#10b981" : "#0059AB", marginTop: 2 }} />
              {idx < items.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: "#cbd5e1", marginTop: 2 }} />}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: idx === 0 ? "#10b981" : "#0059AB" }}>
                {h.periodText || h.PeriodText}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text }}>
                {h.ruangan || h.Ruangan}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: "italic" }}>
          Belum ada riwayat perpindahan lokasi untuk perangkat ini.
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
  yAxis: { justifyContent: "space-between", height: CHART_HEIGHT, paddingRight: 4 },
  axisLabel: { fontSize: 9, fontWeight: "600" },
  chartPlaceholder: { height: CHART_HEIGHT, justifyContent: "center", alignItems: "center", gap: 8 },
  placeholderText: { fontSize: 13, fontWeight: "600" },
});
