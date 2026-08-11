import React, { useState, useEffect } from "react";
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
import { LineChart } from "react-native-chart-kit";
import { iotService } from "../services/iotService";
import { useUser } from "../context/UserContext";
import Card from "../components/Card";
import { ArrowLeft } from "lucide-react-native";
import DateRangeFilter from "../components/DateRangeFilter";

const chartWidth = (Dimensions.get("window")?.width || 360) - 32;

export default function AggregateDashboardScreen({ route, navigation, isTab = false }) {
  const { colors, refreshInterval, theme, t, language } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Semua"); // Semua, Suhu, Kelembapan, Listrik
  const [toggleMode, setToggleMode] = useState("Grafik"); // Grafik, Data
  const [timePeriod, setTimePeriod] = useState("Per Jam");
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);

  const [activeDevice, setActiveDevice] = useState(null);

  // Telemetry graph & table data
  const [tempPoints, setTempPoints] = useState([]);
  const [humiPoints, setHumiPoints] = useState([]);
  const [powerPoints, setPowerPoints] = useState([]);
  const [graphLabels, setGraphLabels] = useState([]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === "Per Jam") {
      setRangeStart(null);
      setRangeEnd(null);
    }
    setTimePeriod(newPeriod);
  };

  const loadMonitoringData = async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    const response = await iotService.getDashboardLatest();
    if (isInitialLoad) setIsLoading(false);

    if (!response?.error && Array.isArray(response) && response.length > 0) {
      setActiveDevice((prev) => {
        if (!prev) return null;
        const updated = response.find((d) => d.id === prev.id);
        return updated || prev;
      });
    }
  };

  const getPeriodKey = (tPeriod) => {
    if (tPeriod === "Per Hari") return "Daily";
    if (tPeriod === "Per Minggu") return "Monthly";
    return "Hourly";
  };

  const parseDevCategory = (dev) => {
    const cat = dev.category || "";
    const nameLower = (dev.name || "").toLowerCase();
    return cat === "AC" || cat === "Lampu" || cat === "Listrik" || cat.toLowerCase().includes("power") || nameLower.includes("ac") || nameLower.includes("lamp") || nameLower.includes("power") || nameLower.includes("listrik") || nameLower.includes("pwr");
  };

  const fetchSingleDeviceGraph = async (dev, period) => {
    const startISO = rangeStart ? rangeStart.toISOString() : null;
    const endISO = rangeEnd ? rangeEnd.toISOString() : null;
    const hasCustomRange = !!(rangeStart && rangeEnd);

    let res = await iotService.getDashboardGraph(dev.id, period, startISO, endISO);
    if (res?.error || !Array.isArray(res) || res.length === 0) {
      setTempPoints([]);
      setHumiPoints([]);
      setPowerPoints([]);
      setGraphLabels([]);
      return;
    }

    if (!hasCustomRange && res.length > 7) res = res.slice(-7);

    const values = res.map((pt) => Number.parseFloat(pt.averageValue || 0));
    setGraphLabels(res.map((pt) => pt.labelText || ""));

    if (parseDevCategory(dev)) {
      setTempPoints([]);
      setHumiPoints([]);
      setPowerPoints(values.map((v) => (v > 100 ? v / 1000.0 : v)));
    } else {
      setTempPoints(values);
      const humiRes = await iotService.getGraphAverage("Kelembaban", period, startISO, endISO);
      setHumiPoints(!humiRes?.error && Array.isArray(humiRes) ? humiRes.map((pt) => Number.parseFloat(pt.averageValue || 0)) : []);
      setPowerPoints([]);
    }
  };

const fillMissingDataPoints = (points) => {
  if (!points || !Array.isArray(points) || points.length === 0) return [];
  let lastVal = 0;
  for (const v of points) {
    const num = Number(v);
    if (num && !Number.isNaN(num) && num > 0) {
      lastVal = num;
      break;
    }
  }
  return points.map((v) => {
    const num = Number(v);
    if (num && !Number.isNaN(num) && num > 0) {
      lastVal = num;
      return num;
    }
    return lastVal;
  });
};

const formatTableTime = (timeStr, lang) => {
  if (!timeStr || lang === "Indonesia") return timeStr;
  let formatted = timeStr;
  formatted = formatted.replace(/^Minggu\s+(\d+)/i, "Week $1");
  formatted = formatted.replace(/^Minggu ke-(\d+)/i, "Week $1");
  formatted = formatted.replace(/^Minggu ke (\d+)/i, "Week $1");
  formatted = formatted.replace(/^Senin\b/i, "Monday");
  formatted = formatted.replace(/^Selasa\b/i, "Tuesday");
  formatted = formatted.replace(/^Rabu\b/i, "Wednesday");
  formatted = formatted.replace(/^Kamis\b/i, "Thursday");
  formatted = formatted.replace(/^Jumat\b/i, "Friday");
  formatted = formatted.replace(/^Sabtu\b/i, "Saturday");
  formatted = formatted.replace(/^Minggu\b/i, "Sunday");
  formatted = formatted.replace(/^Mgg\b/i, "Sun");
  formatted = formatted.replace(/\bJanuari\b/gi, "January");
  formatted = formatted.replace(/\bFebruari\b/gi, "February");
  formatted = formatted.replace(/\bMaret\b/gi, "March");
  formatted = formatted.replace(/\bMei\b/gi, "May");
  formatted = formatted.replace(/\bJuni\b/gi, "June");
  formatted = formatted.replace(/\bJuli\b/gi, "July");
  formatted = formatted.replace(/\bAgustus\b/gi, "August");
  formatted = formatted.replace(/\bAgt\b/gi, "Aug");
  formatted = formatted.replace(/\bAgu\b/gi, "Aug");
  formatted = formatted.replace(/\bSeptember\b/gi, "September");
  formatted = formatted.replace(/\bSept?\b/gi, "Sep");
  formatted = formatted.replace(/\bOktober\b/gi, "October");
  formatted = formatted.replace(/\bOkt\b/gi, "Oct");
  formatted = formatted.replace(/\bNovember\b/gi, "November");
  formatted = formatted.replace(/\bNov\b/gi, "Nov");
  formatted = formatted.replace(/\bDesember\b/gi, "December");
  formatted = formatted.replace(/\bDes\b/gi, "Dec");
  return formatted;
};

const extractPoints = (res, divisor = 1.0) => {
  if (!res || res.error || !Array.isArray(res)) return [];
  const rawValues = res.map((pt) => Number.parseFloat(pt.averageValue || 0) / divisor);
  return fillMissingDataPoints(rawValues);
};

const extractLabelsFromRes = (res) => {
  if (!res || res.error || !Array.isArray(res) || res.length === 0) return null;
  return res.map((pt) => pt.labelText || "");
};

const resolveCategoryLabels = (tab, suhuRes, humiRes, pwrRes) => {
  return extractLabelsFromRes(pwrRes) || extractLabelsFromRes(suhuRes) || extractLabelsFromRes(humiRes) || [];
};

  const fetchCategoryAverageGraph = async (period) => {
    const startISO = rangeStart ? rangeStart.toISOString() : null;
    const endISO = rangeEnd ? rangeEnd.toISOString() : null;
    const hasCustomRange = !!(rangeStart && rangeEnd);

    const [suhuRaw, humiRaw, pwrRaw] = await Promise.all([
      iotService.getGraphAverage("Suhu", period, startISO, endISO),
      iotService.getGraphAverage("Kelembaban", period, startISO, endISO),
      iotService.getGraphAverage("Listrik", period, startISO, endISO),
    ]);

    const suhuRes = !hasCustomRange && Array.isArray(suhuRaw) && suhuRaw.length > 7 ? suhuRaw.slice(-7) : suhuRaw;
    const humiRes = !hasCustomRange && Array.isArray(humiRaw) && humiRaw.length > 7 ? humiRaw.slice(-7) : humiRaw;
    const pwrRes = !hasCustomRange && Array.isArray(pwrRaw) && pwrRaw.length > 7 ? pwrRaw.slice(-7) : pwrRaw;

    setTempPoints(extractPoints(suhuRes));
    setHumiPoints(extractPoints(humiRes));
    setPowerPoints(extractPoints(pwrRes, 1000.0));
    setGraphLabels(resolveCategoryLabels(activeTab, suhuRes, humiRes, pwrRes));
  };

  const loadGraphs = async (showSpinner = false) => {
    if (showSpinner) setIsGraphLoading(true);
    const period = getPeriodKey(timePeriod);

    try {
      if (activeDevice?.id) {
        await fetchSingleDeviceGraph(activeDevice, period);
      } else {
        await fetchCategoryAverageGraph(period);
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
  }, [timePeriod, activeDevice?.id, activeTab, rangeStart, rangeEnd]);

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
  }, [refreshInterval, timePeriod, activeDevice?.id, activeTab, rangeStart, rangeEnd]);

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

  const formatVal = (num) => {
    if (num === undefined || num === null || Number.isNaN(Number(num))) return "-";
    const str = Number(num).toFixed(1);
    return language === "Indonesia" ? str.replace(".", ",") : str;
  };

  const tableLogs = graphLabels.length > 0
    ? graphLabels.map((lbl, idx) => {
        let tempVal = "-";
        if (tempPoints[idx] !== undefined && tempPoints[idx] !== null) {
          tempVal = formatVal(tempPoints[idx]);
        } else if (tempPoints.length > 0) {
          tempVal = formatVal(tempPoints[tempPoints.length - 1]);
        }

        let humVal = "-";
        if (humiPoints[idx] !== undefined && humiPoints[idx] !== null) {
          humVal = formatVal(humiPoints[idx]);
        } else if (humiPoints.length > 0) {
          humVal = formatVal(humiPoints[humiPoints.length - 1]);
        }

        let powerVal = "-";
        if (powerPoints[idx] !== undefined && powerPoints[idx] !== null) {
          powerVal = formatVal(powerPoints[idx]);
        } else if (powerPoints.length > 0) {
          powerVal = formatVal(powerPoints[powerPoints.length - 1]);
        }

        return {
          time: lbl,
          temp: tempVal,
          hum: humVal,
          power: powerVal,
          status: "Normal"
        };
      }).reverse()
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

  const renderTableHeadCells = () => {
    if (activeTab !== "Semua") {
      return <Text style={[styles.thText, { flex: 3, textAlign: "center", color: colors.textMuted }]}>{t("nilai")}</Text>;
    }
    if (isAcOrLampOrPower) {
      return <Text style={[styles.thText, { flex: 3, textAlign: "center", color: colors.textMuted }]}>{t("listrik")} (kWh)</Text>;
    }
    if (activeDevice) {
      return (
        <>
          <Text style={[styles.thText, { flex: 1.5, textAlign: "center", color: colors.textMuted }]}>{t("suhu")}</Text>
          <Text style={[styles.thText, { flex: 1.5, textAlign: "center", color: colors.textMuted }]}>{t("kelembapan")}</Text>
        </>
      );
    }
    return (
      <>
        <Text style={[styles.thText, { flex: 1, textAlign: "center", color: colors.textMuted }]}>{t("suhu")}</Text>
        <Text style={[styles.thText, { flex: 1, textAlign: "center", color: colors.textMuted }]}>{t("kelembapan")}</Text>
        <Text style={[styles.thText, { flex: 1, textAlign: "center", color: colors.textMuted }]}>{t("listrik")}</Text>
      </>
    );
  };

  const renderTableRowCells = (log) => {
    if (activeTab === "Suhu") {
      return <Text style={[styles.tdText, { flex: 3, textAlign: "center", fontWeight: "800", color: "#0059AB" }]}>{log.temp}</Text>;
    }
    if (activeTab === "Kelembapan") {
      return <Text style={[styles.tdText, { flex: 3, textAlign: "center", fontWeight: "800", color: "#0059AB" }]}>{log.hum}</Text>;
    }
    if (activeTab === "Listrik") {
      return <Text style={[styles.tdText, { flex: 3, textAlign: "center", fontWeight: "800", color: "#0059AB" }]}>{log.power}</Text>;
    }
    if (isAcOrLampOrPower) {
      return <Text style={[styles.tdText, { flex: 3, textAlign: "center", fontWeight: "800", color: "#0059AB" }]}>{log.power} kWh</Text>;
    }
    if (activeDevice) {
      return (
        <>
          <Text style={[styles.tdText, { flex: 1.5, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.temp}°C</Text>
          <Text style={[styles.tdText, { flex: 1.5, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.hum}%</Text>
        </>
      );
    }
    return (
      <>
        <Text style={[styles.tdText, { flex: 1, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.temp}°C</Text>
        <Text style={[styles.tdText, { flex: 1, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.hum}%</Text>
        <Text style={[styles.tdText, { flex: 1, textAlign: "center", color: colors.text, fontWeight: "600" }]}>{log.power}</Text>
      </>
    );
  };

  const getEmptyTableNotice = () => {
    if (activeTab === "Suhu" && isAcOrLampOrPower) return "Perangkat ini tidak mengukur data suhu.";
    if (activeTab === "Kelembapan" && isAcOrLampOrPower) return "Perangkat ini tidak mengukur data kelembapan.";
    if (activeTab === "Listrik" && !isAcOrLampOrPower && activeDevice) return "Perangkat ini tidak mengukur daya listrik.";
    return language === "Indonesia" ? "Belum ada riwayat data tabel pada periode ini." : "No historical data table recorded for this period.";
  };

  const renderDataTableMode = () => {
    let activeTabTranslated = t("semua");
    if (activeTab === "Suhu") activeTabTranslated = t("suhu");
    else if (activeTab === "Kelembapan") activeTabTranslated = t("kelembapan");
    else if (activeTab === "Listrik") activeTabTranslated = t("listrik");

    const tableTitleText = `${t("data_tab")} ${activeTabTranslated}`;
    let unit = t("semua");
    if (activeTab === "Suhu") unit = "°C";
    else if (activeTab === "Kelembapan") unit = "%";
    else if (activeTab === "Listrik") unit = "kWh";

    if (isGraphLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>
            {language === "Indonesia" ? "Memuat data tabel..." : "Loading table data..."}
          </Text>
        </View>
      );
    }

    if (!hasTelemetry || tableLogs.length === 0) {
      return (
        <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground, padding: 24, alignItems: "center" }]}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16, textAlign: "center", marginBottom: 8 }}>
            {language === "Indonesia" ? "Tidak Ada Data Telemetri" : "No Telemetry Data"}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
            {getEmptyTableNotice()}
          </Text>
        </Card>
      );
    }

    return (
      <View>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>{tableTitleText}</Text>
          <Text style={[styles.unitSubtitle, { color: colors.textMuted }]}>{`${t("satuan")}: ${unit}`}</Text>
        </View>

        <View style={[styles.timeFilterRow, { marginTop: 0, marginBottom: 16 }]}>
          {["Per Jam", "Per Hari", "Per Minggu"].map((p) => {
            const active = timePeriod === p;
            let pLabel = p;
            if (language === "English") {
              if (p === "Per Jam") pLabel = "Hourly";
              else if (p === "Per Hari") pLabel = "Daily";
              else if (p === "Per Minggu") pLabel = "Weekly";
            }
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.timeBtn,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  active && [styles.timeBtnActive, { backgroundColor: "#0059AB", borderColor: "#0059AB" }]
                ]}
                onPress={() => handlePeriodChange(p)}
              >
                <Text style={[styles.timeBtnLabel, active ? styles.timeBtnLabelActive : { color: colors.textMuted }]}>{pLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Card style={[styles.tableCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={[styles.tableHead, { borderBottomColor: colors.border }]}>
            <Text style={[styles.thText, { flex: 1.2, color: colors.textMuted }]}>{t("waktu")}</Text>
            {renderTableHeadCells()}
            <Text style={[styles.thText, { flex: 1, textAlign: "right", color: colors.textMuted }]}>{t("status")}</Text>
          </View>

          {tableLogs.map((log, idx) => {
            const formattedTime = formatTableTime(log.time, language);
            return (
              <View key={log.time + idx} style={[styles.tableRow, idx === tableLogs.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tdText, { flex: 1.2, color: colors.textMuted }]}>{formattedTime}</Text>
                {renderTableRowCells(log)}
                <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
                  <View style={styles.normalDot} />
                  <Text style={[styles.tdText, { flex: 0, color: "#10b981", fontWeight: "700" }]}>{log.status || t("normal")}</Text>
                </View>
              </View>
            );
          })}
        </Card>
        <Text style={[styles.tableFooterInfo, { color: colors.textMuted }]}>{t("tampil_data_terbaru")}</Text>
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
          setTimePeriod={handlePeriodChange}
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

        {timePeriod !== "Per Jam" && (
          <DateRangeFilter
            startDate={rangeStart}
            endDate={rangeEnd}
            onChange={(s, e) => { setRangeStart(s); setRangeEnd(e); }}
            colors={colors}
          />
        )}

        {renderMainContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers & Subcomponents ───────────────────────────────────────────────
function ChartXLabel({ xLabel, colors }) {
  return (
    <Text
      style={{
        textAlign: "center",
        fontSize: 11,
        fontWeight: "700",
        color: colors.textMuted,
        marginTop: -5,
        marginBottom: 5,
      }}
    >
      {xLabel}
    </Text>
  );
}

function ChartYLabel({ yLabel, colors, chartHeight = 190 }) {
  return (
    <View style={{ width: 20, height: chartHeight, justifyContent: "center", alignItems: "center" }}>
      <Text
        style={{
          width: chartHeight,
          textAlign: "center",
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          transform: [{ rotate: "-90deg" }],
        }}
        numberOfLines={1}
      >
        {yLabel}
      </Text>
    </View>
  );
}

const thinLabels = (labels) => {
  if (!labels || labels.length === 0) return [];
  const len = labels.length;
  const n = len > 15 ? Math.max(1, Math.ceil(len / 8)) : 1;

  return labels.map((lbl, i) => {
    if (!lbl || (len > 15 && i !== 0 && i !== len - 1 && i % n !== 0)) return "";
    let s = lbl.trim();

    // Membedakan antara Hari Minggu (e.g. "Minggu (26/07)") vs Minggu ke-N (e.g. "Minggu 1 (Agustus 2026)")
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

const formatDecimal = (value, digits = 1, lang = "Indonesia") =>
  Number(value).toLocaleString(lang === "Indonesia" ? "id-ID" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

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
        <Text style={[styles.chartMetricValue, { color: colors.text }]}>{formatDecimal(latestTemp, 1, language)}°C</Text>
      </View>

      <View style={[styles.chartStatsRow, { backgroundColor: theme === "Dark Mode" ? "#0f172a" : "#f8fafc" }]}>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Rata-rata" : "Average"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{formatDecimal(avgTemp, 1, language)}°C</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Tertinggi" : "Highest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{formatDecimal(maxTemp, 1, language)}°C</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Terendah" : "Lowest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{formatDecimal(minTemp, 1, language)}°C</Text>
        </View>
      </View>

       <ChartXLabel xLabel={t("waktu")} colors={colors} />

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ChartYLabel yLabel={`${t("suhu")} (°C)`} colors={colors} chartHeight={190} />
        <LineChart
          data={{
            labels: thinLabels(graphLabels),
            datasets: [{ data: tempPoints }],
          }}
          width={chartWidth - 24 - 20}
          height={190}
          chartConfig={chartConfig}
          formatYLabel={(yValue) => language === "Indonesia" ? String(yValue).replace(".", ",") : String(yValue)}
          bezier={tempPoints.length > 1 && Math.max(...tempPoints) !== Math.min(...tempPoints)}
          verticalLabelRotation={0}
          xLabelsOffset={2}
          style={styles.chart}
          withHorizontalLabels={true}
          fromZero={false}
        />
      </View>
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
        <Text style={[styles.chartMetricValue, { color: colors.text }]}>{formatDecimal(latestHumi, 1, language)}%</Text>
      </View>

      <View style={[styles.chartStatsRow, { backgroundColor: theme === "Dark Mode" ? "#0f172a" : "#f8fafc" }]}>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Rata-rata" : "Average"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{formatDecimal(avgHum, 1, language)}%</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Tertinggi" : "Highest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{formatDecimal(maxHum, 1, language)}%</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Terendah" : "Lowest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{formatDecimal(minHum, 1, language)}%</Text>
        </View>
      </View>

      <ChartXLabel xLabel={t("waktu")} colors={colors} />

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ChartYLabel yLabel={`${t("kelembapan")} (%)`} colors={colors} chartHeight={190} />
        <LineChart
          data={{
            labels: thinLabels(graphLabels),
            datasets: [{ data: humiPoints }],
          }}
          width={chartWidth - 24 - 20}
          height={190}
          chartConfig={chartConfig}
          formatYLabel={(yValue) => language === "Indonesia" ? String(yValue).replace(".", ",") : String(yValue)}
          bezier={humiPoints.length > 1 && Math.max(...humiPoints) !== Math.min(...humiPoints)}
          verticalLabelRotation={0}
          xLabelsOffset={2}
          style={styles.chart}
          withHorizontalLabels={true}
          fromZero={false}
        />
      </View>
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
        <Text style={[styles.chartMetricValue, { color: colors.text }]}>{formatDecimal(latestPower, 1, language)} kWh</Text>
      </View>

      <View style={[styles.chartStatsRow, { backgroundColor: theme === "Dark Mode" ? "#0f172a" : "#f8fafc" }]}>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Rata-rata" : "Average"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{formatDecimal(avgPower, 1, language)} kWh</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Tertinggi" : "Highest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{formatDecimal(maxPower, 1, language)} kWh</Text>
        </View>
        <View style={styles.chartStatBox}>
          <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Terendah" : "Lowest"}</Text>
          <Text style={[styles.chartStatValue, { color: colors.text }]}>{formatDecimal(minPower, 1, language)} kWh</Text>
        </View>
      </View>

      <ChartXLabel xLabel={t("waktu")} colors={colors} />

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ChartYLabel yLabel={`${t("listrik")} (kWh)`} colors={colors} chartHeight={190} />
        <LineChart
          data={{
            labels: thinLabels(graphLabels),
            datasets: [{ data: powerPoints }],
          }}
          width={chartWidth - 24 - 20}
          height={190}
          chartConfig={chartConfig}
          formatYLabel={(yValue) => language === "Indonesia" ? String(yValue).replace(".", ",") : String(yValue)}
          bezier={powerPoints.length > 1 && Math.max(...powerPoints) !== Math.min(...powerPoints)}
          verticalLabelRotation={0}
          xLabelsOffset={2}
          style={styles.chart}
          withHorizontalLabels={true}
          fromZero={false}
        />
      </View>
    </Card>
  );
}

function TimePeriodFilter({ timePeriod, setTimePeriod, colors, t, language }) {
  const getPeriodLabel = (p) => {
    if (p === "Per Jam") return language === "Indonesia" ? "Per Jam" : "Hourly";
    if (p === "Per Hari") return language === "Indonesia" ? "Per Hari" : "Daily";
    if (p === "Per Minggu") return language === "Indonesia" ? "Per Minggu" : "Weekly";
    return p;
  };
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
              {getPeriodLabel(p)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
  
  function CategoryEmptyCard({ title, subtext, colors, theme, language }) {
    return (
      <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground, padding: 20 }]}>
        <View style={styles.chartMetricHeader}>
          <Text style={[styles.chartMetricLabel, { color: colors.text }]}>{title}</Text>
        </View>
        <View style={[{ paddingVertical: 24, alignItems: "center", justifyContent: "center", borderRadius: 12, marginTop: 8 }, { backgroundColor: theme === "Dark Mode" ? "#0f172a" : "#f8fafc" }]}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15, textAlign: "center", marginBottom: 4 }}>
            {language === "Indonesia" ? "Tidak Ada Data Telemetri" : "No Telemetry Data"}
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
          language={language}
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
          language={language}
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
          language={language}
        />
      );
    };

    const renderSemuaActiveDevice = () => {
      if (isAcOrLampOrPowerDev) {
        if (powerPoints.length > 0) return renderPowerSection();
        return <TelemetryEmptyState hasTelemetry={false} colors={colors} language={language} />;
      }
      const hasTemp = tempPoints.length > 0;
      const hasHumi = humiPoints.length > 0;
      if (!hasTemp && !hasHumi) {
        return <TelemetryEmptyState hasTelemetry={false} colors={colors} language={language} />;
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
    };

    const renderSemuaSummary = () => {
      const hasTemp = tempPoints.length > 0;
      const hasHumi = humiPoints.length > 0;
      const hasPower = powerPoints.length > 0;
      if (!hasTemp && !hasHumi && !hasPower) {
        return <TelemetryEmptyState hasTelemetry={false} colors={colors} language={language} />;
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
    };

    const renderContentForTab = () => {
      if (activeTab === "Suhu") return renderSuhuSection();
      if (activeTab === "Kelembapan") return renderHumiSection();
      if (activeTab === "Listrik") return renderPowerSection();
      if (activeDevice) return renderSemuaActiveDevice();
      return renderSemuaSummary();
    };

    return (
      <View>
        <TimePeriodFilter
          timePeriod={timePeriod}
          setTimePeriod={setTimePeriod}
          colors={colors}
          t={t}
          language={language}
        />

        {isGraphLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0059AB" />
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>
              {language === "Indonesia" ? "Memuat grafik telemetri..." : "Loading telemetry chart..."}
            </Text>
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
