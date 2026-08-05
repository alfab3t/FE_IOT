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
import { ArrowLeft, Droplets, MapPin, Wifi, TrendingUp, Clock, History, Calendar } from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 32 - 32;
const CHART_HEIGHT = 160;

const PERIOD_OPTIONS = [
  { label: "Per Menit", value: "Minutely" },
  { label: "Per Jam", value: "Hourly" },
  { label: "Harian", value: "Daily" },
  { label: "Bulanan", value: "Monthly" },
];

export default function WaterMeterScreen({ navigation, route }) {
  const { colors } = useUser();
  const { deviceId, deviceName, deviceLocation } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [latestValue, setLatestValue] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState("Online");
  const [graphData, setGraphData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("Hourly");
  const [locationHistory, setLocationHistory] = useState([]);

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
      if (dev) {
        setDeviceStatus(dev.isActive !== false ? "Online" : "Offline");
        if (dev.limitMin != null && !Number.isNaN(Number(dev.limitMin))) {
          setLatestValue(Number(dev.limitMin));
        }
      }
    }
  }, [deviceId]);

  const loadChartData = useCallback(async (period) => {
    setIsChartLoading(true);
    const response = await iotService.getGraphData(deviceId, period);
    setIsChartLoading(false);
    if (!response?.error && Array.isArray(response) && response.length > 0) {
      const sliced = response.length > 7 ? response.slice(-7) : response;
      setGraphData(sliced);
    } else {
      setGraphData([]);
    }
  }, [deviceId]);

  useFocusEffect(
    useCallback(() => {
      loadLatestData(true);
      loadChartData(selectedPeriod);
    }, [loadLatestData, loadChartData, selectedPeriod])
  );

  useEffect(() => {
    loadLatestData(true);
    loadChartData(selectedPeriod);
    const timer = setInterval(() => {
      loadLatestData(false);
      loadChartData(selectedPeriod);
    }, 5000); // 5s REAL-TIME live telemetry and location updates
    return () => clearInterval(timer);
  }, [loadLatestData, loadChartData, selectedPeriod]);

  // ── Line Chart ────────────────────────────────────────────────────────────
  const thinLabels = (labels) => {
    if (!labels || labels.length === 0) return [];
    const len = labels.length;
    const n = len > 7 ? Math.max(1, Math.ceil(len / 4)) : 1;
    return labels.map((lbl, i) => (len > 7 && i % n !== 0 && i !== 0 && i !== len - 1 ? "" : lbl));
  };

  const chartConfig = {
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(2,132,199,${opacity})`,
    labelColor: () => colors.textMuted,
    propsForDots: { r: "3", strokeWidth: "2", stroke: "#0284c7" },
    propsForLabels: { fontSize: 9 },
  };

  const renderChart = () => {
    if (isChartLoading) {
      return (
        <View style={styles.chartPlaceholder}>
          <ActivityIndicator size="small" color="#0284c7" />
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Memuat grafik...</Text>
        </View>
      );
    }
    if (!graphData || graphData.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <TrendingUp size={32} color={colors.textMuted} />
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
  };

  // Stats
  const avgValue = graphData.length > 0
    ? (graphData.reduce((s, p) => s + (p.averageValue ?? p.average ?? 0), 0) / graphData.length).toFixed(2)
    : "—";
  const maxValue = graphData.length > 0
    ? Math.max(...graphData.map((p) => p.maximumValue ?? p.max ?? 0)).toFixed(2)
    : "—";
  const minValue = graphData.length > 0
    ? Math.min(...graphData.map((p) => p.minimumValue ?? p.min ?? 0)).toFixed(2)
    : "—";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
          {deviceName || "Meteran Air"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>Memuat data...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Device Info */}
          <Card style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: "#e0f2fe" }]}>
                <Droplets size={28} color="#0284c7" />
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={[styles.infoName, { color: colors.text }]}>{deviceName || "Meteran Air"}</Text>
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

          {/* Current Reading */}
          <Card style={[styles.readingCard, { backgroundColor: "#0284c7" }]}>
            <Text style={styles.readingLabel}>Debit Air Saat Ini</Text>
            <View style={styles.readingValueRow}>
              <Text style={styles.readingValue}>
                {latestValue !== null && latestValue !== undefined
                  ? Number(latestValue).toFixed(2)
                  : "—"}
              </Text>
              <Text style={styles.readingUnit}>m³</Text>
            </View>
          </Card>

          {/* Location History */}
          <LocationHistoryCard locationHistory={locationHistory} colors={colors} />

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: "Rata-rata", value: avgValue, unit: "m³", color: "#0284c7" },
              { label: "Tertinggi", value: maxValue, unit: "m³", color: "#ef4444" },
              { label: "Terendah", value: minValue, unit: "m³", color: "#10b981" },
            ].map((s) => (
              <Card key={s.label} style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statUnit, { color: colors.textMuted }]}>{s.unit}</Text>
              </Card>
            ))}
          </View>

          {/* Chart */}
          <Card style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Grafik Debit Air</Text>
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
            <View style={{ minHeight: CHART_HEIGHT + 20 }}>
              {renderChart()}
            </View>
          </Card>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function LocationHistoryCard({ locationHistory, colors }) {
  const items = Array.isArray(locationHistory) ? locationHistory : [];

  return (
    <Card style={[styles.historyCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.historyHeaderRow}>
        <View style={[styles.historyIconCircle, { backgroundColor: "#e0f2fe" }]}>
          <History size={18} color="#0284c7" />
        </View>
        <Text style={[styles.historyTitle, { color: colors.text }]}>Riwayat Perpindahan Lokasi</Text>
      </View>

      {items.length === 0 ? (
        <View style={{ paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: "italic" }}>
            Belum ada riwayat perpindahan lokasi untuk perangkat ini.
          </Text>
        </View>
      ) : (
        <View style={styles.timelineContainer}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const period = item.periodText || item.PeriodText;
            const rua = item.ruangan || item.Ruangan;
            const gdg = item.gedung || item.Gedung;

            return (
              <View key={index} style={styles.timelineItemRow}>
                <View style={styles.timelineLeftColumn}>
                  <View style={[styles.timelineDot, isLast ? styles.timelineDotActive : styles.timelineDotInactive]} />
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={[styles.timelineContentBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.timelineHeaderRow}>
                    <View style={styles.dateBadge}>
                      <Calendar size={12} color="#0284c7" />
                      <Text style={styles.dateBadgeText}>{period}</Text>
                    </View>
                    {isLast && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Lokasi Terbaru</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.locationName, { color: colors.text }]}>{rua}</Text>
                  <View style={styles.locationMetaRow}>
                    <MapPin size={12} color={colors.textMuted} />
                    <Text style={[styles.locationMetaText, { color: colors.textMuted }]}>{gdg}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbar: {
    height: 60, borderBottomWidth: 1, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16,
  },
  backBtn: { padding: 8 },
  navTitle: { fontSize: 16, fontWeight: "800", flex: 1, textAlign: "center" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },
  infoCard: { padding: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  infoTextBlock: { flex: 1, gap: 4 },
  infoName: { fontSize: 15, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontWeight: "500" },
  readingCard: { padding: 24, borderRadius: 16, alignItems: "center" },
  readingLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  readingValueRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  readingValue: { color: "#fff", fontSize: 52, fontWeight: "900", lineHeight: 60 },
  readingUnit: { color: "rgba(255,255,255,0.85)", fontSize: 20, fontWeight: "700", marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, padding: 12, alignItems: "center", gap: 2 },
  statLabel: { fontSize: 11, fontWeight: "600" },
  statValue: { fontSize: 18, fontWeight: "900" },
  statUnit: { fontSize: 10, fontWeight: "600" },
  chartCard: { padding: 16 },
  chartTitle: { fontSize: 14, fontWeight: "800", marginBottom: 12 },
  periodScroll: { marginBottom: 16 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginRight: 8, backgroundColor: "#f1f5f9" },
  periodBtnActive: { backgroundColor: "#0284c7" },
  periodBtnText: { fontSize: 12, fontWeight: "700" },
  chartPlaceholder: { height: CHART_HEIGHT, justifyContent: "center", alignItems: "center", gap: 8 },
  placeholderText: { fontSize: 13, fontWeight: "600" },

  // Location History Card
  historyCard: { padding: 16 },
  historyHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  historyIconCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  historyTitle: { fontSize: 15, fontWeight: "800" },
  timelineContainer: { paddingLeft: 4 },
  timelineItemRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  timelineLeftColumn: { alignItems: "center", width: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineDotActive: { backgroundColor: "#0284c7", borderWidth: 2, borderColor: "#93c5fd" },
  timelineDotInactive: { backgroundColor: "#cbd5e1" },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#e2e8f0", marginTop: 4 },
  timelineContentBox: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  timelineHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  dateBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#eff6ff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  dateBadgeText: { fontSize: 11, fontWeight: "700", color: "#0284c7" },
  activeBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  activeBadgeText: { fontSize: 10, fontWeight: "800", color: "#16a34a" },
  locationName: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  locationMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationMetaText: { fontSize: 12, fontWeight: "600" },
});

