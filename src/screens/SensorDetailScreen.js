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
import { ArrowLeft, Thermometer, Droplets, MapPin, Wifi, TrendingUp } from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 32 - 48;
const CHART_HEIGHT = 130;

const PERIOD_OPTIONS = [
  { label: "Per Menit", value: "Minutely" },
  { label: "Per Jam", value: "Hourly" },
  { label: "Harian", value: "Daily" },
  { label: "Bulanan", value: "Monthly" },
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

  // Load latest readings
  const loadLatestData = useCallback(async () => {
    setIsLoading(true);
    const response = await iotService.getDashboardLatest();
    setIsLoading(false);
    if (!response.error && Array.isArray(response)) {
      const dev = response.find((d) => d.id === deviceId);
      if (dev) {
        setDeviceStatus(dev.isActive !== false ? "Online" : "Offline");
        // limitMin = LatestValue (Temperature), limitMax = LatestHumidity
        if (dev.limitMin != null && !Number.isNaN(Number(dev.limitMin))) {
          setTemperature(Number(dev.limitMin));
        }
        if (dev.limitMax != null && !Number.isNaN(Number(dev.limitMax))) {
          setHumidity(Number(dev.limitMax));
        }
      }
    }
  }, [deviceId]);

  // Load chart data
  const loadChartData = useCallback(async (period) => {
    setIsChartLoading(true);
    const response = await iotService.getGraphData(deviceId, period);
    setIsChartLoading(false);
    if (!response.error && Array.isArray(response) && response.length > 0) {
      setGraphData(response);
    } else {
      setGraphData([]);
    }
  }, [deviceId]);

  useEffect(() => { loadLatestData(); }, [loadLatestData]);
  useEffect(() => { loadChartData(selectedPeriod); }, [selectedPeriod, loadChartData]);

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

        {/* Chart Section */}
        <Card style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Grafik Historis</Text>

          {/* Chart Mode Toggle */}
          <View style={styles.chartModeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, chartMode === "temp" && styles.modeBtnActiveRed]}
              onPress={() => setChartMode("temp")}
            >
              <Thermometer size={14} color={chartMode === "temp" ? "#fff" : "#ef4444"} />
              <Text style={[styles.modeBtnText, { color: chartMode === "temp" ? "#fff" : colors.textMuted }]}>Suhu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, chartMode === "humi" && styles.modeBtnActiveBlue]}
              onPress={() => setChartMode("humi")}
            >
              <Droplets size={14} color={chartMode === "humi" ? "#fff" : "#0284c7"} />
              <Text style={[styles.modeBtnText, { color: chartMode === "humi" ? "#fff" : colors.textMuted }]}>Kelembaban</Text>
            </TouchableOpacity>
          </View>

          {/* Period Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
            {PERIOD_OPTIONS.map((p) => {
              const isActive = selectedPeriod === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.periodBtn, isActive && styles.periodBtnActive]}
                  onPress={() => setSelectedPeriod(p.value)}
                >
                  <Text style={[styles.periodBtnText, { color: isActive ? "#fff" : colors.textMuted }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Chart */}
          <View style={{ minHeight: CHART_HEIGHT + 20 }}>
            <SensorChart
              isChartLoading={isChartLoading}
              graphData={graphData}
              chartMode={chartMode}
              colors={colors}
            />
          </View>
        </Card>
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
  let n;
  if (labels.length <= 6) { n = 1; }
  else if (labels.length <= 12) { n = 2; }
  else { n = 3; }
  return labels.map((lbl, i) => (i % n === 0 ? lbl : ""));
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
