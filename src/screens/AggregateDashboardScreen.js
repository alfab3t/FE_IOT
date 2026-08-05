import React, { useState, useEffect, useCallback } from "react";
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
import { LineChart } from "react-native-chart-kit";
import { iotService } from "../services/iotService";
import { useUser } from "../context/UserContext";
import Card from "../components/Card";
import { ArrowLeft, SlidersHorizontal } from "lucide-react-native";

const chartWidth = Dimensions.get("window").width - 32;

export default function AggregateDashboardScreen({ route, navigation, isTab = false }) {
  const { colors, refreshInterval, theme, t, language } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Semua"); // Semua, Suhu, Kelembapan, Listrik
  const [toggleMode, setToggleMode] = useState("Grafik"); // Grafik, Data
  const [timePeriod, setTimePeriod] = useState("Per Jam"); // Per Jam, Per Hari, Per Minggu

  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [devicePickerVisible, setDevicePickerVisible] = useState(false);

  // Telemetry graph & table data
  const [tempPoints, setTempPoints] = useState([]);
  const [humiPoints, setHumiPoints] = useState([]);
  const [powerPoints, setPowerPoints] = useState([]);
  const [graphLabels, setGraphLabels] = useState([]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  const loadMonitoringData = async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    const response = await iotService.getDashboardLatest();
    if (isInitialLoad) setIsLoading(false);

    if (!response.error && Array.isArray(response) && response.length > 0) {
      setDevices(response);
      setActiveDevice((prev) => {
        if (!prev) return null; // Keep null as default for "Semua Perangkat" (System Overview) so graphs never flash/disappear!
        const updated = response.find((d) => d.id === prev.id);
        return updated || prev;
      });
    }
  };

  const loadGraphs = async (showSpinner = false) => {
    if (showSpinner) setIsGraphLoading(true);

    let period = "Hourly";
    if (timePeriod === "Per Jam") {
      period = "Hourly";
    } else if (timePeriod === "Per Hari") {
      period = "Daily";
    } else if (timePeriod === "Per Minggu") {
      period = "Monthly";
    }

    try {
      if (activeDevice && activeDevice.id) {
        let res = await iotService.getDashboardGraph(activeDevice.id, period);
        if (!res?.error && Array.isArray(res) && res.length > 0) {
          if (period === "Hourly" && res.length > 8) {
            res = res.slice(-8);
          }
          const values = res.map((pt) => Number.parseFloat(pt.averageValue || 0));
          const labels = res.map((pt) => pt.labelText || "");
          setGraphLabels(labels);

          const cat = activeDevice.category || "";
          const nameLower = (activeDevice.name || "").toLowerCase();
          const isAcOrLampOrPowerDev =
            cat === "AC" ||
            cat === "Lampu" ||
            cat === "Listrik" ||
            cat.toLowerCase().includes("power") ||
            nameLower.includes("ac") ||
            nameLower.includes("lamp") ||
            nameLower.includes("power") ||
            nameLower.includes("listrik") ||
            nameLower.includes("pwr");

          if (isAcOrLampOrPowerDev) {
            setTempPoints([]);
            setHumiPoints([]);
            setPowerPoints(values.map((v) => (v > 100 ? v / 1000.0 : v)));
          } else {
            setTempPoints(values);
            // Ambil data kelembapan asli dari API jika sensor
            let humiRes = await iotService.getGraphAverage("Kelembapan", period);
            if (!humiRes?.error && Array.isArray(humiRes) && humiRes.length > 0) {
              setHumiPoints(humiRes.map((pt) => Number.parseFloat(pt.averageValue || 0)));
            } else {
              setHumiPoints([]);
            }
            setPowerPoints([]);
          }
        } else {
          setTempPoints([]);
          setHumiPoints([]);
          setPowerPoints([]);
          setGraphLabels([]);
        }
      } else {
        // Fallback: Fetch category average
        let [suhuRes, humiRes, pwrRes] = await Promise.all([
          iotService.getGraphAverage("Suhu", period),
          iotService.getGraphAverage("Kelembapan", period),
          iotService.getGraphAverage("Listrik", period),
        ]);

        if (period === "Hourly") {
          if (Array.isArray(suhuRes) && suhuRes.length > 8) suhuRes = suhuRes.slice(-8);
          if (Array.isArray(humiRes) && humiRes.length > 8) humiRes = humiRes.slice(-8);
          if (Array.isArray(pwrRes) && pwrRes.length > 8) pwrRes = pwrRes.slice(-8);
        }

        let labels = [];
        if (!suhuRes?.error && Array.isArray(suhuRes) && suhuRes.length > 0) {
          setTempPoints(suhuRes.map((pt) => Number.parseFloat(pt.averageValue || 0)));
          labels = suhuRes.map((pt) => pt.labelText || "");
        } else {
          setTempPoints([]);
        }

        if (!humiRes?.error && Array.isArray(humiRes) && humiRes.length > 0) {
          setHumiPoints(humiRes.map((pt) => Number.parseFloat(pt.averageValue || 0)));
          if (labels.length === 0) labels = humiRes.map((pt) => pt.labelText || "");
        } else {
          setHumiPoints([]);
        }

        if (!pwrRes?.error && Array.isArray(pwrRes) && pwrRes.length > 0) {
          setPowerPoints(pwrRes.map((pt) => Number.parseFloat(pt.averageValue || 0) / 1000.0));
          if (labels.length === 0) labels = pwrRes.map((pt) => pt.labelText || "");
        } else {
          setPowerPoints([]);
        }

        setGraphLabels(labels);
      }
    } catch (err) {
      console.error("loadGraphs error:", err);
    } finally {
      if (showSpinner) setIsGraphLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData(true);
  }, []);

  useEffect(() => {
    loadGraphs(true);
  }, [timePeriod, activeDevice?.id]);

  useEffect(() => {
    let intervalMs = 30000;
    if (refreshInterval === "5 detik") intervalMs = 5000;
    else if (refreshInterval === "10 detik") intervalMs = 10000;
    else if (refreshInterval === "60 detik") intervalMs = 60000;

    const timer = setInterval(() => {
      loadMonitoringData(false);
      loadGraphs(false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [refreshInterval, timePeriod, activeDevice?.id]);

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

  const latestTemp = tempPoints.length > 0 ? tempPoints[tempPoints.length - 1] : 0;
  const latestHumi = humiPoints.length > 0 ? humiPoints[humiPoints.length - 1] : 0;
  const latestPower = powerPoints.length > 0 ? powerPoints[powerPoints.length - 1] : 0;

  const tableLogs = graphLabels.length > 0
    ? graphLabels.map((lbl, idx) => ({
        time: lbl,
        temp: tempPoints[idx] !== undefined ? tempPoints[idx].toFixed(1) : latestTemp.toFixed(1),
        hum: humiPoints[idx] !== undefined ? humiPoints[idx].toFixed(1) : latestHumi.toFixed(1),
        power: powerPoints[idx] !== undefined ? powerPoints[idx].toFixed(1) : latestPower.toFixed(1),
        status: "Normal"
      })).reverse()
    : [];

  const deviceCategory = (activeDevice?.category || "").toLowerCase();
  const deviceNameLower = (activeDevice?.name || "").toLowerCase();
  const isAcOrLampOrPower =
    Boolean(activeDevice) && (
      deviceCategory.includes("ac") ||
      deviceCategory.includes("lamp") ||
      deviceCategory.includes("listrik") ||
      deviceCategory.includes("power") ||
      deviceCategory.includes("elektronik") ||
      deviceCategory.includes("aktuator") ||
      deviceNameLower.includes("ac") ||
      deviceNameLower.includes("lamp") ||
      deviceNameLower.includes("power") ||
      deviceNameLower.includes("listrik") ||
      deviceNameLower.includes("pwr")
    );

  const showSuhu = !isAcOrLampOrPower && tempPoints.length > 0;
  const showHumi = !isAcOrLampOrPower && humiPoints.length > 0;
  const showPower = (isAcOrLampOrPower || !activeDevice) && powerPoints.length > 0;

  const hasTelemetry = (() => {
    if (activeTab === "Suhu") return !isAcOrLampOrPower && tempPoints.length > 0;
    if (activeTab === "Kelembapan") return !isAcOrLampOrPower && humiPoints.length > 0;
    if (activeTab === "Listrik") return (isAcOrLampOrPower || !activeDevice) && powerPoints.length > 0;
    if (activeDevice) {
      if (isAcOrLampOrPower) return powerPoints.length > 0;
      return tempPoints.length > 0 || humiPoints.length > 0;
    }
    return tempPoints.length > 0 || humiPoints.length > 0 || powerPoints.length > 0;
  })();

  const renderDataTableMode = () => {
    let activeTabTranslated = t("semua");
    if (activeTab === "Suhu") {
      activeTabTranslated = t("suhu");
    } else if (activeTab === "Kelembapan") {
      activeTabTranslated = t("kelembapan");
    } else if (activeTab === "Listrik") {
      activeTabTranslated = t("listrik");
    }
    const tableTitleText = `${t("data_tab")} ${activeTabTranslated}`;

    return (
      <View>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>
            {tableTitleText}
          </Text>
          <Text style={[styles.unitSubtitle, { color: colors.textMuted }]}>
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
          {["Per Jam", "Per Hari", "Per Minggu"].map((p) => {
            const active = timePeriod === p;
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
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isGraphLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0059AB" />
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>Memuat data tabel...</Text>
          </View>
        ) : !hasTelemetry || tableLogs.length === 0 ? (
          <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground, padding: 24, alignItems: "center" }]}>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16, textAlign: "center", marginBottom: 8 }}>
              {language === "Indonesia" ? "Tidak Ada Data Telemetri" : "No Telemetry Data"}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
              {(() => {
                if (activeTab === "Suhu" && isAcOrLampOrPower) {
                  return "Perangkat ini tidak mengukur data suhu.";
                }
                if (activeTab === "Kelembapan" && isAcOrLampOrPower) {
                  return "Perangkat ini tidak mengukur data kelembapan.";
                }
                if (activeTab === "Listrik" && !isAcOrLampOrPower && activeDevice) {
                  return "Perangkat ini tidak mengukur daya listrik.";
                }
                return language === "Indonesia"
                  ? "Belum ada riwayat data tabel pada periode ini."
                  : "No historical data table recorded for this period.";
              })()}
            </Text>
          </Card>
        ) : (
          <>
            <Card style={[styles.tableCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              {/* Header */}
              <View style={[styles.tableHead, { borderBottomColor: colors.border }]}>
                <Text style={[styles.thText, { flex: 1.2, color: colors.textMuted }]}>{t("waktu")}</Text>
                {activeTab === "Semua" ? (
                  isAcOrLampOrPower ? (
                    <Text style={[styles.thText, { flex: 3, textAlign: "center", color: colors.textMuted }]}>{t("listrik")} (kWh)</Text>
                  ) : activeDevice ? (
                    <>
                      <Text style={[styles.thText, { flex: 1.5, textAlign: "center", color: colors.textMuted }]}>{t("suhu")}</Text>
                      <Text style={[styles.thText, { flex: 1.5, textAlign: "center", color: colors.textMuted }]}>{t("kelembapan")}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.thText, { flex: 1, textAlign: "center", color: colors.textMuted }]}>{t("suhu")}</Text>
                      <Text style={[styles.thText, { flex: 1, textAlign: "center", color: colors.textMuted }]}>{t("kelembapan")}</Text>
                      <Text style={[styles.thText, { flex: 1, textAlign: "center", color: colors.textMuted }]}>{t("listrik")}</Text>
                    </>
                  )
                ) : (
                  <Text style={[styles.thText, { flex: 3, textAlign: "center", color: colors.textMuted }]}>{t("nilai")}</Text>
                )}
                <Text style={[styles.thText, { flex: 1, textAlign: "right", color: colors.textMuted }]}>{t("status")}</Text>
              </View>

              {/* Data Rows */}
              {tableLogs.map((log, idx) => (
                <View key={log.time + idx} style={[styles.tableRow, idx === tableLogs.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.tdText, { flex: 1.2, color: colors.textMuted }]}>{log.time}</Text>
                  {activeTab === "Semua" ? (
                    isAcOrLampOrPower ? (
                      <Text style={[styles.tdText, { flex: 3, textAlign: "center", fontWeight: "800", color: "#0059AB" }]}>{log.power} kWh</Text>
                    ) : activeDevice ? (
                      <>
                        <Text style={[styles.tdText, { flex: 1.5, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.temp}°C</Text>
                        <Text style={[styles.tdText, { flex: 1.5, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.hum}%</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.tdText, { flex: 1, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.temp}°C</Text>
                        <Text style={[styles.tdText, { flex: 1, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.hum}%</Text>
                        <Text style={[styles.tdText, { flex: 1, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.power}</Text>
                      </>
                    )
                  ) : (
                    <Text style={[styles.tdText, { flex: 3, textAlign: "center", fontWeight: "800", color: "#0059AB" }]}>
                      {(() => {
                        if (activeTab === "Suhu") return `${log.temp} °C`;
                        if (activeTab === "Kelembapan") return `${log.hum} %`;
                        return `${log.power} kWh`;
                      })()}
                    </Text>
                  )}
                  <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
                    <View style={styles.normalDot} />
                    <Text style={[styles.tdText, { flex: 0, color: "#10b981", fontWeight: "700" }]}>{log.status}</Text>
                  </View>
                </View>
              ))}
            </Card>
            <Text style={[styles.tableFooterInfo, { color: colors.textMuted }]}>{t("tampil_data_terbaru")}</Text>
          </>
        )}
      </View>
    );
  };

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
        </View>
      );
    }
    if (toggleMode === "Grafik") {
      return (
        <GrafikMode
          isGraphLoading={isGraphLoading}
          hasTelemetry={hasTelemetry}
          showSuhu={showSuhu}
          showHumi={showHumi}
          showPower={showPower}
          tempPoints={tempPoints}
          humiPoints={humiPoints}
          powerPoints={powerPoints}
          latestTemp={latestTemp}
          latestHumi={latestHumi}
          latestPower={latestPower}
          colors={colors}
          theme={theme}
          t={t}
          language={language}
          graphLabels={graphLabels}
          chartConfig={chartConfig}
          timePeriod={timePeriod}
          setTimePeriod={setTimePeriod}
          activeTab={activeTab}
          activeDevice={activeDevice}
        />
      );
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
    </SafeAreaView>
  );
}

// ── Helpers & Subcomponents ───────────────────────────────────────────────
const thinLabels = (labels) => {
  if (!labels || labels.length === 0) return [];
  const len = labels.length;
  const n = Math.max(1, Math.ceil(len / 5));

  return labels.map((lbl, i) => {
    if (!lbl || (i !== 0 && i !== len - 1 && i % n !== 0)) return "";
    let s = lbl.trim();

    // Membedakan antara Hari Minggu (e.g. "Minggu (26/07)") vs Minggu ke-N (e.g. "Minggu 1 (Agustus 2026)")
    if (s.includes("(") && s.includes(")")) {
      const matchParen = s.match(/\(([^)]+)\)/);
      if (matchParen && matchParen[1]) {
        const inside = matchParen[1].trim(); // e.g. "26/07" atau "Agustus 2026"
        // Hanya anggap Minggu ke-N jika diikuti angka (misal: "Minggu 1", "Minggu 2")
        if (/^Minggu\s+\d+/i.test(s) || /^Mgg\s+\d+/i.test(s)) {
          const mggNum = s.split("(")[0].replace("Minggu", "M").replace("Mgg", "M").trim();
          const monthParts = inside.split(" ");
          const monthShort = monthParts[0] ? monthParts[0].substring(0, 3) : "";
          return `${mggNum} ${monthShort}`; // e.g. "M1 Jul"
        }
        // Jika Hari (termasuk Hari Minggu: "Minggu (26/07)", "Jumat (17/07)", dll.)
        return inside; // e.g. "26/07", "17/07", "22/07"
      }
    }

    return s;
  });
};

function TelemetryEmptyState({ hasTelemetry, colors, language }) {
  if (hasTelemetry) return null;
  return (
    <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground, padding: 24, alignItems: "center" }]}>
      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, textAlign: "center", marginBottom: 8 }}>
        {language === "Indonesia" ? "Tidak Ada Data Telemetri" : "No Telemetry Data"}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
        {language === "Indonesia"
          ? "Belum ada riwayat telemetri grafik pada periode ini."
          : "No historical telemetry graph recorded for this period."}
      </Text>
    </Card>
  );
}

function SuhuChart({ showSuhu, tempPoints, latestTemp, colors, theme, language, t, graphLabels, chartConfig }) {
  if (!showSuhu || tempPoints.length === 0) return null;

  const avgTemp = tempPoints.reduce((a, b) => a + b, 0) / tempPoints.length;
  const maxTemp = Math.max(...tempPoints);
  const minTemp = Math.min(...tempPoints);

  return (
    <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.chartMetricHeader}>
        <Text style={[styles.chartMetricLabel, { color: colors.text }]}>{t("suhu")} (°C)</Text>
        <Text style={[styles.chartMetricValue, { color: colors.text }]}>{latestTemp.toFixed(1)}°C</Text>
      </View>

      <View style={[styles.chartStatsRow, { backgroundColor: theme === "Dark Mode" ? "#0f172a" : "#f8fafc" }]}>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Rata-rata" : "Average"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{avgTemp.toFixed(1)}°C</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Tertinggi" : "Highest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{maxTemp.toFixed(1)}°C</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Terendah" : "Lowest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{minTemp.toFixed(1)}°C</Text>
        </View>
      </View>

      <LineChart
        data={{
          labels: thinLabels(graphLabels),
          datasets: [{ data: tempPoints }],
        }}
        width={chartWidth - 24}
        height={190}
        chartConfig={chartConfig}
        bezier
        verticalLabelRotation={0}
        xLabelsOffset={2}
        style={styles.chart}
        withHorizontalLabels={true}
        fromZero={false}
      />
    </Card>
  );
}

function HumiChart({ showHumi, humiPoints, latestHumi, colors, theme, language, t, graphLabels, chartConfig }) {
  if (!showHumi || humiPoints.length === 0) return null;

  const avgHum = humiPoints.reduce((a, b) => a + b, 0) / humiPoints.length;
  const maxHum = Math.max(...humiPoints);
  const minHum = Math.min(...humiPoints);

  return (
    <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.chartMetricHeader}>
        <Text style={[styles.chartMetricLabel, { color: colors.text }]}>{t("kelembapan")} (%)</Text>
        <Text style={[styles.chartMetricValue, { color: colors.text }]}>{latestHumi.toFixed(1)}%</Text>
      </View>

      <View style={[styles.chartStatsRow, { backgroundColor: theme === "Dark Mode" ? "#0f172a" : "#f8fafc" }]}>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Rata-rata" : "Average"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{avgHum.toFixed(1)}%</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Tertinggi" : "Highest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{maxHum.toFixed(1)}%</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Terendah" : "Lowest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{minHum.toFixed(1)}%</Text>
        </View>
      </View>

      <LineChart
        data={{
          labels: thinLabels(graphLabels),
          datasets: [{ data: humiPoints }],
        }}
        width={chartWidth - 24}
        height={190}
        chartConfig={chartConfig}
        bezier
        verticalLabelRotation={0}
        xLabelsOffset={2}
        style={styles.chart}
        withHorizontalLabels={true}
        fromZero={false}
      />
    </Card>
  );
}

function PowerChart({ showPower, powerPoints, latestPower, colors, theme, language, t, graphLabels, chartConfig }) {
  if (!showPower || powerPoints.length === 0) return null;

  const avgPower = powerPoints.reduce((a, b) => a + b, 0) / powerPoints.length;
  const maxPower = Math.max(...powerPoints);
  const minPower = Math.min(...powerPoints);

  return (
    <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.chartMetricHeader}>
        <Text style={[styles.chartMetricLabel, { color: colors.text }]}>{t("listrik")} (kWh)</Text>
        <Text style={[styles.chartMetricValue, { color: colors.text }]}>{latestPower.toFixed(3)} kWh</Text>
      </View>

      <View style={[styles.chartStatsRow, { backgroundColor: theme === "Dark Mode" ? "#0f172a" : "#f8fafc" }]}>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Rata-rata" : "Average"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{avgPower.toFixed(3)} kWh</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Tertinggi" : "Highest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{maxPower.toFixed(3)} kWh</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Terendah" : "Lowest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{minPower.toFixed(3)} kWh</Text>
        </View>
      </View>

      <LineChart
        data={{
          labels: thinLabels(graphLabels),
          datasets: [{ data: powerPoints }],
        }}
        width={chartWidth - 24}
        height={190}
        chartConfig={chartConfig}
        bezier
        verticalLabelRotation={0}
        xLabelsOffset={2}
        style={styles.chart}
        withHorizontalLabels={true}
        fromZero={false}
      />
    </Card>
  );
}

function TimePeriodFilter({ timePeriod, setTimePeriod, colors, t }) {
  return (
    <View style={styles.timeFilterRow}>
      {["Per Jam", "Per Hari", "Per Minggu"].map((p) => {
        const active = timePeriod === p;
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
              {p}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
  
  function CategoryEmptyCard({ title, subtext, colors, theme }) {
    return (
      <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground, padding: 20 }]}>
        <View style={styles.chartMetricHeader}>
          <Text style={[styles.chartMetricLabel, { color: colors.text }]}>{title}</Text>
        </View>
        <View style={[{ paddingVertical: 24, alignItems: "center", justifyContent: "center", borderRadius: 12, marginTop: 8 }, { backgroundColor: theme === "Dark Mode" ? "#0f172a" : "#f8fafc" }]}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15, textAlign: "center", marginBottom: 4 }}>
            Tidak Ada Data Telemetri
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>
            {subtext}
          </Text>
        </View>
      </Card>
    );
  }
  
  function GrafikMode({
    isGraphLoading,
    tempPoints,
    humiPoints,
    powerPoints,
    latestTemp,
    latestHumi,
    latestPower,
    colors,
    theme,
    t,
    language,
    graphLabels,
    chartConfig,
    timePeriod,
    setTimePeriod,
    activeTab,
    activeDevice
  }) {
    const deviceCategory = (activeDevice?.category || "").toLowerCase();
    const deviceNameLower = (activeDevice?.name || "").toLowerCase();
    const isAcOrLampOrPowerDev =
      Boolean(activeDevice) && (
        deviceCategory.includes("ac") ||
        deviceCategory.includes("lamp") ||
        deviceCategory.includes("listrik") ||
        deviceCategory.includes("power") ||
        deviceCategory.includes("elektronik") ||
        deviceCategory.includes("aktuator") ||
        deviceNameLower.includes("ac") ||
        deviceNameLower.includes("lamp") ||
        deviceNameLower.includes("power") ||
        deviceNameLower.includes("listrik") ||
        deviceNameLower.includes("pwr")
      );

    const renderSuhuSection = () => {
      if (!isAcOrLampOrPowerDev && tempPoints.length > 0) {
        return (
          <SuhuChart
            showSuhu={true}
            tempPoints={tempPoints}
            latestTemp={latestTemp}
            colors={colors}
            theme={theme}
            language={language}
            t={t}
            graphLabels={graphLabels}
            chartConfig={chartConfig}
          />
        );
      }
      return (
        <CategoryEmptyCard
          title={`${t("suhu")} (°C)`}
          subtext={
            isAcOrLampOrPowerDev
              ? "Perangkat ini tidak mengukur data suhu."
              : "Belum ada riwayat data telemetri suhu."
          }
          colors={colors}
          theme={theme}
        />
      );
    };

    const renderHumiSection = () => {
      if (!isAcOrLampOrPowerDev && humiPoints.length > 0) {
        return (
          <HumiChart
            showHumi={true}
            humiPoints={humiPoints}
            latestHumi={latestHumi}
            colors={colors}
            theme={theme}
            language={language}
            t={t}
            graphLabels={graphLabels}
            chartConfig={chartConfig}
          />
        );
      }
      return (
        <CategoryEmptyCard
          title={`${t("kelembapan")} (%)`}
          subtext={
            isAcOrLampOrPowerDev
              ? "Perangkat ini tidak mengukur data kelembapan."
              : "Belum ada riwayat data telemetri kelembapan."
          }
          colors={colors}
          theme={theme}
        />
      );
    };

    const renderPowerSection = () => {
      if ((isAcOrLampOrPowerDev || !activeDevice) && powerPoints.length > 0) {
        return (
          <PowerChart
            showPower={true}
            powerPoints={powerPoints}
            latestPower={latestPower}
            colors={colors}
            theme={theme}
            language={language}
            t={t}
            graphLabels={graphLabels}
            chartConfig={chartConfig}
          />
        );
      }
      return (
        <CategoryEmptyCard
          title={`${t("listrik")} (kWh)`}
          subtext={
            !isAcOrLampOrPowerDev && activeDevice
              ? "Perangkat ini tidak mengukur daya listrik."
              : "Belum ada riwayat data telemetri listrik."
          }
          colors={colors}
          theme={theme}
        />
      );
    };

    const renderContentForTab = () => {
      if (activeTab === "Suhu") {
        return renderSuhuSection();
      }
      if (activeTab === "Kelembapan") {
        return renderHumiSection();
      }
      if (activeTab === "Listrik") {
        return renderPowerSection();
      }

      // activeTab === "Semua"
      // Tampilkan data yang ada saja (tanpa card kosong jika perangkat hanya mendukung tipe telemetri tertentu)
      if (activeDevice) {
        if (isAcOrLampOrPowerDev) {
          // Perangkat Elektronik: Hanya tampilkan Listrik (jika ada data)
          if (powerPoints.length > 0) {
            return renderPowerSection();
          }
          return (
            <TelemetryEmptyState
              hasTelemetry={false}
              colors={colors}
              language={language}
            />
          );
        } else {
          // Perangkat Suhu & Kelembapan: Tampilkan Suhu dan/atau Kelembapan
          const hasTemp = tempPoints.length > 0;
          const hasHumi = humiPoints.length > 0;
          if (!hasTemp && !hasHumi) {
            return (
              <TelemetryEmptyState
                hasTelemetry={false}
                colors={colors}
                language={language}
              />
            );
          }
          return (
            <>
              {hasTemp && (
                <SuhuChart
                  showSuhu={true}
                  tempPoints={tempPoints}
                  latestTemp={latestTemp}
                  colors={colors}
                  theme={theme}
                  language={language}
                  t={t}
                  graphLabels={graphLabels}
                  chartConfig={chartConfig}
                />
              )}
              {hasHumi && (
                <HumiChart
                  showHumi={true}
                  humiPoints={humiPoints}
                  latestHumi={latestHumi}
                  colors={colors}
                  theme={theme}
                  language={language}
                  t={t}
                  graphLabels={graphLabels}
                  chartConfig={chartConfig}
                />
              )}
            </>
          );
        }
      } else {
        // activeDevice === null ("Semua Perangkat / Ringkasan Sistem")
        const hasTemp = tempPoints.length > 0;
        const hasHumi = humiPoints.length > 0;
        const hasPower = powerPoints.length > 0;
        if (!hasTemp && !hasHumi && !hasPower) {
          return (
            <TelemetryEmptyState
              hasTelemetry={false}
              colors={colors}
              language={language}
            />
          );
        }
        return (
          <>
            {hasTemp && (
              <SuhuChart
                showSuhu={true}
                tempPoints={tempPoints}
                latestTemp={latestTemp}
                colors={colors}
                theme={theme}
                language={language}
                t={t}
                graphLabels={graphLabels}
                chartConfig={chartConfig}
              />
            )}
            {hasHumi && (
              <HumiChart
                showHumi={true}
                humiPoints={humiPoints}
                latestHumi={latestHumi}
                colors={colors}
                theme={theme}
                language={language}
                t={t}
                graphLabels={graphLabels}
                chartConfig={chartConfig}
              />
            )}
            {hasPower && (
              <PowerChart
                showPower={true}
                powerPoints={powerPoints}
                latestPower={latestPower}
                colors={colors}
                theme={theme}
                language={language}
                t={t}
                graphLabels={graphLabels}
                chartConfig={chartConfig}
              />
            )}
          </>
        );
      }
    };

    return (
      <View>
        <TimePeriodFilter
          timePeriod={timePeriod}
          setTimePeriod={setTimePeriod}
          colors={colors}
          t={t}
        />

        {isGraphLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0059AB" />
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>Memuat grafik telemetri...</Text>
          </View>
        ) : (
          renderContentForTab()
        )}
      </View>
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
    marginTop: 4,
    marginBottom: 16,
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
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  thText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tdText: {
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
