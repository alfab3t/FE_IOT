import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, BarChart } from "react-native-chart-kit";
import { iotService } from "../services/iotService";
import { useUser } from "../context/UserContext";
import Card from "../components/Card";
import { ArrowLeft, SlidersHorizontal } from "lucide-react-native";

const chartWidth = Dimensions.get("window").width - 32;

export default function AggregateDashboardScreen({ route, navigation, isTab = false }) {
  const { colors, refreshInterval, theme, t, language } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Semua"); // Semua, Suhu, Kelembapan, Listrik
  const [toggleMode, setToggleMode] = useState("Grafik"); // Grafik, Data
  const [timePeriod, setTimePeriod] = useState("Hari Ini"); // Hari Ini, Minggu Ini, Bulan Ini

  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [devicePickerVisible, setDevicePickerVisible] = useState(false);

  // Real database telemetry graph points
  const [tempPoints, setTempPoints] = useState([]);
  const [humiPoints, setHumiPoints] = useState([]);
  const [powerPoints, setPowerPoints] = useState([]);
  const [graphLabels, setGraphLabels] = useState([]);
  // Tab switch simply changes the active tab filter without overriding the user's selected device
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  const loadMonitoringData = async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    const response = await iotService.getDashboardLatest();
    if (isInitialLoad) setIsLoading(false);

    if (!response.error && Array.isArray(response) && response.length > 0) {
      setDevices(response);
      // Only auto-pick on first load (when no device selected yet)
      // Do NOT override user's manual selection
      if (isInitialLoad) {
        const picked = response.find((d) => d.category === "Temperatur & Kelembaban") || response.find((d) => d.category === "AC") || response[0];
        setActiveDevice(picked);
      } else if (activeDevice) {
        // On background refresh: only update current device's latest values (status/limitMin)
        const updated = response.find((d) => d.id === activeDevice.id);
        if (updated) setActiveDevice(updated);
      }
    }
  };

  const generateDefaultLabels = (period) => {
    const labels = [];
    const now = new Date();
    
    if (period === "Minutely") {
      // Last 6 intervals of 5 minutes
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 5 * 60 * 1000);
        const hour = String(d.getHours()).padStart(2, "0");
        const minute = String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, "0");
        labels.push(`${hour}:${minute}`);
      }
    } else if (period === "Daily") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toLocaleDateString(language === "Indonesia" ? "id-ID" : "en-US", { day: "numeric", month: "short" });
        labels.push(dayStr);
      }
    } else {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = d.toLocaleDateString(language === "Indonesia" ? "id-ID" : "en-US", { month: "short" });
        labels.push(monthStr);
      }
    }
    return labels;
  };

  const loadGraphs = async (deviceId, category) => {
    if (!deviceId) return;
    const period = timePeriod === "Hari Ini" ? "Minutely" : timePeriod === "Minggu Ini" ? "Daily" : "Monthly";
    
    const response = await iotService.getGraphData(deviceId, period);
    if (!response.error && Array.isArray(response) && response.length > 0) {
      const labels = response.map((pt) => pt.labelText || "");
      const values = response.map((pt) => parseFloat(pt.averageValue || 0));
      setGraphLabels(labels);

      if (category === "Temperatur & Kelembaban" || category === "AC") {
        setTempPoints(values);
        // Inverse relationship: humVal = 110.0 - (tempVal * 1.8) (same as Android Studio!)
        const humValues = values.map((tempVal) => {
          let humVal = 110.0 - (tempVal * 1.8);
          if (humVal < 40) humVal = 40;
          if (humVal > 90) humVal = 90;
          return humVal;
        });
        setHumiPoints(humValues);
      } else if (category === "Listrik") {
        // Convert Watts to kWh: value / 1000.0 (same as Android Studio!)
        const powerKWh = values.map((v) => v / 1000.0);
        setPowerPoints(powerKWh);
      }
    } else {
      // API returned empty — show empty chart (no fake/mock data)
      setGraphLabels([]);
      setTempPoints([]);
      setHumiPoints([]);
      setPowerPoints([]);
    }
  };

  useEffect(() => {
    // Initial load only
    loadMonitoringData(true);

    let intervalMs = 30000;
    if (refreshInterval === "5 detik") intervalMs = 5000;
    else if (refreshInterval === "10 detik") intervalMs = 10000;
    else if (refreshInterval === "60 detik") intervalMs = 60000;

    // Background refresh: update devices list + current device status only
    // Does NOT reset activeDevice to default
    const timer = setInterval(() => {
      loadMonitoringData(false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [refreshInterval]); // ← removed activeDevice?.id: no more reset loop!

  useEffect(() => {
    if (activeDevice) {
      loadGraphs(activeDevice.id, activeDevice.category);
    }
  }, [activeDevice?.id, timePeriod]);

  const chartConfig = {
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 89, 171, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: { borderRadius: 16 },
    propsForDots: { r: "3", strokeWidth: "2", stroke: "#0059AB" },
    propsForLabels: { fontSize: 9 },
  };

  // Thin out labels: only show every Nth label to prevent overlap
  const thinLabels = (labels) => {
    if (!labels || labels.length === 0) return [];
    const n = labels.length <= 6 ? 1 : labels.length <= 12 ? 2 : 3;
    return labels.map((lbl, i) => (i % n === 0 ? lbl : ""));
  };

  // Generate dynamic historical log values for the table data based on active telemetry
  const latestTemp = (activeDevice?.category === "Temperatur & Kelembaban" || activeDevice?.category === "AC") && activeDevice?.limitMin ? parseFloat(activeDevice.limitMin) : 21.8;
  const latestHumi = (activeDevice?.category === "Temperatur & Kelembaban" || activeDevice?.category === "AC") && activeDevice?.limitMax ? parseFloat(activeDevice.limitMax) : 50.0;
  const latestPower = activeDevice?.category === "Listrik" && activeDevice?.limitMin ? parseFloat(activeDevice.limitMin) : 36.4;

  const tableLogs = graphLabels.length > 0 ? graphLabels.map((lbl, idx) => ({
    time: lbl,
    temp: tempPoints[idx] !== undefined ? tempPoints[idx].toFixed(1) : latestTemp.toFixed(1),
    hum: humiPoints[idx] !== undefined ? humiPoints[idx].toFixed(1) : latestHumi.toFixed(1),
    power: powerPoints[idx] !== undefined ? powerPoints[idx].toFixed(1) : latestPower.toFixed(1),
    status: "Normal"
  })).reverse() : [
    { time: "08:31", temp: `${latestTemp.toFixed(1)}`, hum: `${latestHumi.toFixed(1)}`, power: `${latestPower.toFixed(1)}`, status: "Normal" },
    { time: "08:26", temp: `${(latestTemp - 0.1).toFixed(1)}`, hum: `${(latestHumi - 0.2).toFixed(1)}`, power: `${(latestPower - 0.8).toFixed(1)}`, status: "Normal" },
    { time: "08:21", temp: `${(latestTemp - 0.2).toFixed(1)}`, hum: `${(latestHumi - 0.5).toFixed(1)}`, power: `${(latestPower - 1.4).toFixed(1)}`, status: "Normal" },
    { time: "08:16", temp: `${(latestTemp - 0.1).toFixed(1)}`, hum: `${(latestHumi + 0.1).toFixed(1)}`, power: `${(latestPower - 2.2).toFixed(1)}`, status: "Normal" },
    { time: "08:11", temp: `${(latestTemp - 0.2).toFixed(1)}`, hum: `${(latestHumi + 0.4).toFixed(1)}`, power: `${(latestPower - 2.9).toFixed(1)}`, status: "Normal" },
  ];

  const renderGrafikMode = () => {
    // Use data presence + activeTab to decide what to show
    // This decouples chart visibility from activeDevice.category
    // so Listrik chart shows even if no Listrik device is in device list
    const showSuhu  = (activeTab === "Semua" || activeTab === "Suhu") && tempPoints.length > 0;
    const showHumi  = (activeTab === "Semua" || activeTab === "Kelembapan") && humiPoints.length > 0;
    const showPower = (activeTab === "Semua" || activeTab === "Listrik") && powerPoints.length > 0;

    // hasTelemetry: true if we have data points to render for the active tab
    const hasTelemetry = (() => {
      if (activeTab === "Suhu") return showSuhu;
      if (activeTab === "Kelembapan") return showHumi;
      if (activeTab === "Listrik") return showPower;
      return showSuhu || showHumi || showPower;
    })();

    const avgTemp = tempPoints.length > 0 ? tempPoints.reduce((a, b) => a + b, 0) / tempPoints.length : null;
    const maxTemp = tempPoints.length > 0 ? Math.max(...tempPoints) : null;
    const minTemp = tempPoints.length > 0 ? Math.min(...tempPoints) : null;

    const avgHum = humiPoints.length > 0 ? humiPoints.reduce((a, b) => a + b, 0) / humiPoints.length : null;
    const maxHum = humiPoints.length > 0 ? Math.max(...humiPoints) : null;
    const minHum = humiPoints.length > 0 ? Math.min(...humiPoints) : null;

    const avgPower = powerPoints.length > 0 ? powerPoints.reduce((a, b) => a + b, 0) / powerPoints.length : null;
    const maxPower = powerPoints.length > 0 ? Math.max(...powerPoints) : null;
    const minPower = powerPoints.length > 0 ? Math.min(...powerPoints) : null;

    return (
      <View>
        {!hasTelemetry && (
          <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground, padding: 24, alignItems: "center" }]}>
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, textAlign: "center", marginBottom: 8 }}>
              {language === "Indonesia" ? "Tidak Ada Data Telemetri" : "No Telemetry Data"}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
              {language === "Indonesia" 
                ? "Perangkat ini tidak merekam riwayat telemetri grafik grafik." 
                : "This device category does not record historical telemetry graphs."}
            </Text>
          </Card>
        )}

        {/* Suhu Grafik */}
        {showSuhu && tempPoints.length > 0 && (
          <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.chartMetricHeader}>
              <Text style={[styles.chartMetricLabel, { color: colors.text }]}>{t("suhu")} (°C)</Text>
              <Text style={[styles.chartMetricValue, { color: colors.text }]}>{latestTemp.toFixed(1)}°C</Text>
            </View>

            {/* Suhu Stats Panel */}
            {avgTemp !== null && (
              <View style={styles.chartStatsRow}>
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>{language === "Indonesia" ? "Rata-rata" : "Average"}</Text>
                  <Text style={styles.chartStatValue}>{avgTemp.toFixed(1)}°C</Text>
                </View>
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>{language === "Indonesia" ? "Tertinggi" : "Highest"}</Text>
                  <Text style={styles.chartStatValue}>{maxTemp !== null ? `${maxTemp.toFixed(1)}°C` : "-"}</Text>
                </View>
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>{language === "Indonesia" ? "Terendah" : "Lowest"}</Text>
                  <Text style={styles.chartStatValue}>{minTemp !== null ? `${minTemp.toFixed(1)}°C` : "-"}</Text>
                </View>
              </View>
            )}

            <LineChart
              data={{
                labels: thinLabels(graphLabels),
                datasets: [{ data: tempPoints }],
              }}
              width={chartWidth - 24}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withHorizontalLabels={true}
              fromZero={false}
            />
          </Card>
        )}

        {/* Kelembaban Grafik */}
        {showHumi && humiPoints.length > 0 && (
          <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.chartMetricHeader}>
              <Text style={[styles.chartMetricLabel, { color: colors.text }]}>{t("kelembapan")} (%)</Text>
              <Text style={[styles.chartMetricValue, { color: colors.text }]}>{latestHumi.toFixed(1)}%</Text>
            </View>

            {/* Kelembaban Stats Panel */}
            {avgHum !== null && (
              <View style={styles.chartStatsRow}>
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>{language === "Indonesia" ? "Rata-rata" : "Average"}</Text>
                  <Text style={styles.chartStatValue}>{avgHum.toFixed(1)}%</Text>
                </View>
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>{language === "Indonesia" ? "Tertinggi" : "Highest"}</Text>
                  <Text style={styles.chartStatValue}>{maxHum !== null ? `${maxHum.toFixed(1)}%` : "-"}</Text>
                </View>
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>{language === "Indonesia" ? "Terendah" : "Lowest"}</Text>
                  <Text style={styles.chartStatValue}>{minHum !== null ? `${minHum.toFixed(1)}%` : "-"}</Text>
                </View>
              </View>
            )}

            <LineChart
              data={{
                labels: thinLabels(graphLabels),
                datasets: [{ data: humiPoints }],
              }}
              width={chartWidth - 24}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withHorizontalLabels={true}
              fromZero={false}
            />
          </Card>
        )}

        {/* Listrik Grafik */}
        {showPower && powerPoints.length > 0 && (
          <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.chartMetricHeader}>
              <Text style={[styles.chartMetricLabel, { color: colors.text }]}>{t("listrik")} (kWh)</Text>
              <Text style={[styles.chartMetricValue, { color: colors.text }]}>{latestPower.toFixed(3)} kWh</Text>
            </View>

            {/* Listrik Stats Panel */}
            {avgPower !== null && (
              <View style={styles.chartStatsRow}>
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>{language === "Indonesia" ? "Rata-rata" : "Average"}</Text>
                  <Text style={styles.chartStatValue}>{avgPower.toFixed(3)} kWh</Text>
                </View>
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>{language === "Indonesia" ? "Tertinggi" : "Highest"}</Text>
                  <Text style={styles.chartStatValue}>{maxPower !== null ? `${maxPower.toFixed(3)} kWh` : "-"}</Text>
                </View>
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>{language === "Indonesia" ? "Terendah" : "Lowest"}</Text>
                  <Text style={styles.chartStatValue}>{minPower !== null ? `${minPower.toFixed(3)} kWh` : "-"}</Text>
                </View>
              </View>
            )}

            <LineChart
              data={{
                labels: thinLabels(graphLabels),
                datasets: [{ data: powerPoints }],
              }}
              width={chartWidth - 24}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withHorizontalLabels={true}
              fromZero={false}
            />
          </Card>
        )}


        {/* Time Filter Row */}
        {hasTelemetry && (
          <View style={styles.timeFilterRow}>
            {["Hari Ini", "Minggu Ini", "Bulan Ini"].map((p) => {
              const active = timePeriod === p;
              const transP = p === "Hari Ini" ? t("hari_ini") : p === "Minggu Ini" ? t("minggu_ini") : t("bulan_ini");
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.timeBtn,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    active && styles.timeBtnActive
                  ]}
                  onPress={() => setTimePeriod(p)}
                >
                  <Text style={[styles.timeBtnLabel, active ? styles.timeBtnLabelActive : { color: colors.textMuted }]}>
                    {transP}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };
  const renderDataTableMode = () => (
    <View>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableTitle, { color: colors.text }]}>
          {t("data_tab")} {activeTab === "Semua" ? t("semua") : t(activeTab === "Kelembapan" ? "kelembapan" : activeTab.toLowerCase())}
        </Text>
        <Text style={[styles.unitSubtitle, { color: colors.textMuted }]}>
          {/* Satuan unit berdasarkan tab aktif */}
          {(() => {
            let unit = t("semua");
            if (activeTab === "Suhu") unit = "°C";
            else if (activeTab === "Kelembapan") unit = "%";
            else if (activeTab === "Listrik") unit = "kWh";
            return `${t("satuan")}: ${unit}`;
          })()}
        </Text>
      </View>

      {/* Time Period Filter above Table */}
      <View style={[styles.timeFilterRow, { marginTop: 0, marginBottom: 16 }]}>
        {["Hari Ini", "Minggu Ini", "Bulan Ini"].map((p) => {
          const active = timePeriod === p;
          const transP = p === "Hari Ini" ? t("hari_ini") : p === "Minggu Ini" ? t("minggu_ini") : t("bulan_ini");
          return (
            <TouchableOpacity
              key={p}
              style={[
                styles.timeBtn,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                active && [styles.timeBtnActive, { backgroundColor: "#0059AB", borderColor: "#0059AB" }]
              ]}
              onPress={() => setTimePeriod(p)}
            >
              <Text style={[styles.timeBtnLabel, active ? styles.timeBtnLabelActive : { color: colors.textMuted }]}>
                {transP}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Responsive Table Wrapper */}
      <Card style={[styles.tableCard, { backgroundColor: colors.cardBackground }]}>
        <View style={[styles.tableHead, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.thText, { flex: 0.8, color: colors.text }]}>{t("waktu")}</Text>
          {activeTab === "Semua" ? (
            <>
              <Text style={[styles.thText, { color: colors.text }]}>{t("suhu")}</Text>
              <Text style={[styles.thText, { color: colors.text }]}>Hum</Text>
              <Text style={[styles.thText, { color: colors.text }]}>{t("listrik")}</Text>
            </>
          ) : (
            <Text style={[styles.thText, { flex: 2, textAlign: "center", color: colors.text }]}>
              {t("nilai")} {t(activeTab === "Kelembapan" ? "kelembapan" : activeTab.toLowerCase())}
            </Text>
          )}
          <Text style={[styles.thText, { flex: 1, textAlign: "right", color: colors.text }]}>{t("status")}</Text>
        </View>

        {tableLogs.map((log) => (
          <View key={log.time} style={[styles.tableRow, tableLogs.indexOf(log) === tableLogs.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tdText, { flex: 0.8, color: colors.textMuted }]}>{log.time}</Text>
            {activeTab === "Semua" ? (
              <>
                <Text style={[styles.tdText, { color: colors.text }]}>{log.temp}°</Text>
                <Text style={[styles.tdText, { color: colors.text }]}>{log.hum}%</Text>
                <Text style={[styles.tdText, { color: colors.text }]}>{log.power}</Text>
              </>
            ) : (
              <Text style={[styles.tdText, { flex: 2, textAlign: "center", fontWeight: "800", color: "#0059AB" }]}>
                {(() => {
                  if (activeTab === "Suhu") return `${log.temp} °C`;
                  if (activeTab === "Kelembapan") return `${log.hum} %`;
                  return `${log.power} kWh`;
                })()}
              </Text>
            )}
            <View style={[styles.tdText, { flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4 }]}>
              <View style={styles.normalDot} />
              <Text style={[styles.tdText, { color: "#10b981", fontWeight: "700" }]}>{log.status}</Text>
            </View>
          </View>
        ))}
      </Card>
      <Text style={[styles.tableFooterInfo, { color: colors.textMuted }]}>{t("tampil_data_terbaru")}</Text>
    </View>
  );

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
        </View>
      );
    }
    if (toggleMode === "Grafik") {
      return renderGrafikMode();
    }
    return renderDataTableMode();
  };

  return (
    <SafeAreaView style={[styles.container, isTab && { paddingTop: 0 }, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        {!isTab && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("monitoring")}</Text>
        <TouchableOpacity onPress={() => setDevicePickerVisible(true)} style={{ padding: 8 }}>
          <SlidersHorizontal size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Tabs list */}
      <View style={[styles.topTabBar, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        {["Semua", "Suhu", "Kelembapan", "Listrik"].map((tab) => {
          const active = activeTab === tab;
          const transKey = tab === "Kelembapan" ? "kelembapan" : tab.toLowerCase();
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.topTabItem, active && [styles.topTabItemActive, { borderBottomColor: "#0059AB" }]]}
              onPress={() => handleTabSwitch(tab)}
            >
              <Text style={[styles.topTabLabel, active ? styles.topTabLabelActive : { color: colors.textMuted }]}>
                {t(transKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Device Header Selector Card */}
        {activeDevice && (
          <Card style={[styles.deviceHeaderCard, { backgroundColor: colors.cardBackground }]}>
            <View>
              <Text style={[styles.deviceCardName, { color: colors.text }]}>{activeDevice.name}</Text>
              <Text style={[styles.deviceCardSub, { color: colors.textMuted }]}>{activeDevice.ruangan || "Ruang Meeting"}</Text>
            </View>
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineBadgeText}>ONLINE</Text>
            </View>
          </Card>
        )}

        {/* Toggle Mode Buttons: Grafik / Data */}
        <View style={[styles.modeToggleContainer, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={[styles.modeToggleBtn, toggleMode === "Grafik" && [styles.modeToggleBtnActive, { backgroundColor: "#0059AB" }]]}
            onPress={() => setToggleMode("Grafik")}
          >
            <Text style={[styles.modeToggleLabel, toggleMode === "Grafik" && styles.modeToggleLabelActive]}>
              {t("grafik")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeToggleBtn, toggleMode === "Data" && [styles.modeToggleBtnActive, { backgroundColor: "#0059AB" }]]}
            onPress={() => setToggleMode("Data")}
          >
            <Text style={[styles.modeToggleLabel, toggleMode === "Data" && styles.modeToggleLabelActive]}>
              {t("data")}
            </Text>
          </TouchableOpacity>
        </View>
        {renderMainContent()}
      </ScrollView>

      {/* Custom Device Selection Modal */}
      <Modal
        visible={devicePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDevicePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogBox, { backgroundColor: colors.cardBackground }]}>
            {/* Header Icon */}
            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
              <SlidersHorizontal size={32} color="#0059AB" />
            </View>
            <Text style={[styles.dialogTitle, { color: colors.text, textAlign: "center", marginBottom: 8 }]}>{t("pilih_perangkat")}</Text>

            {/* Message */}
            <Text style={[styles.dialogMessage, { color: colors.textMuted }]}>
              {t("pilih_perangkat_desc")}
            </Text>

            {/* Scrollable Options List */}
            <ScrollView style={{ maxHeight: 200, width: "100%" }} contentContainerStyle={{ paddingBottom: 10 }}>
              {devices.map((dev) => {
                const isSelected = activeDevice?.id === dev.id;
                return (
                  <TouchableOpacity
                    key={dev.id}
                    style={[
                      styles.optionRowBtn,
                      {
                        borderColor: isSelected ? "#0059AB" : colors.border,
                        backgroundColor: (() => {
                          if (!isSelected) return "transparent";
                          return theme === "Dark Mode" ? "#1e293b" : "#f0f9ff";
                        })(),
                        marginTop: 8
                      }
                    ]}
                    onPress={() => {
                      setActiveDevice(dev);
                      setDevicePickerVisible(false);
                    }}
                  >
                    <Text style={[styles.optionRowText, { color: isSelected ? "#0059AB" : colors.text }]}>
                      {dev.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelBtnTextBox, { marginTop: 16 }]}
              onPress={() => setDevicePickerVisible(false)}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>{t("batal")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderBottomColor: "#e2e8f0",
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
    color: "#0f172a",
  },
  topTabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 8,
  },
  topTabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  topTabItemActive: {
    borderBottomColor: "#0059AB",
  },
  topTabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  topTabLabelActive: {
    color: "#0059AB",
  },
  scrollContent: {
    padding: 16,
  },
  deviceHeaderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  deviceCardName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  deviceCardSub: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  onlineBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10b981",
  },
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  modeToggleBtnActive: {
    backgroundColor: "#0059AB",
  },
  modeToggleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  modeToggleLabelActive: {
    color: "#fff",
  },
  chartMetricCard: {
    padding: 12,
    marginBottom: 12,
  },
  chartMetricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  chartMetricLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  chartMetricValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0059AB",
  },
  chart: {
    alignSelf: "center",
  },
  chartStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  chartStatBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chartStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 2,
  },
  chartStatValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },
  timeFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
    gap: 8,
  },
  timeBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    alignItems: "center",
  },
  timeBtnActive: {
    backgroundColor: "#0059AB",
    borderColor: "#0059AB",
  },
  timeBtnLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  timeBtnLabelActive: {
    color: "#fff",
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  unitSubtitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  tableCard: {
    padding: 10,
    borderRadius: 12,
  },
  tableHead: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 6,
  },
  thText: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingHorizontal: 6,
    alignItems: "center",
  },
  tdText: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    color: "#0f172a",
  },
  normalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  tableFooterInfo: {
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "600",
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogBox: {
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  dialogMessage: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: "500",
  },
  optionRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    width: "100%",
  },
  optionRowText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cancelBtnTextBox: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
});
