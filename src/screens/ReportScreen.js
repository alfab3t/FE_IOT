import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Thermometer,
  Droplet,
  Zap,
  Tv,
  User,
} from "lucide-react-native";

const formatDecimal = (value, digits = 1, language = "Indonesia") => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString(language === "Indonesia" ? "id-ID" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export default function ReportScreen({ navigation }) {
  const { colors, theme, t, language } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState("Hari Ini");
  const [summary, setSummary]   = useState(null);
  const [deviceStats, setDeviceStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const periodMap = {
    "Hari Ini"   : "today",
    "Minggu ini" : "week",
    "Bulan ini"  : "month",
  };

  const isDeviceActive = (dev) => {
    if (!dev) return false;
    if (dev.isActive !== undefined) return dev.isActive !== false;
    if (dev.use_status !== undefined) return String(dev.use_status) !== "0" && String(dev.use_status) !== "false";
    if (dev.is_active !== undefined) return String(dev.is_active) !== "0" && String(dev.is_active) !== "false";
    if (dev.status === 0 || dev.status === "0") return false;
    return true;
  };

  const extractDeviceArray = (res) => {
    if (!res || res.error) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.devices)) return res.devices;
    if (Array.isArray(res.Devices)) return res.Devices;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.Items)) return res.Items;
    return [];
  };

  const loadReportData = async (period) => {
    setIsLoading(true);
    const [response, devListRes, dashDevRes] = await Promise.all([
      iotService.getReportSummary(periodMap[period] ?? "today"),
      iotService.getDevices("", ""),
      iotService.getDashboardLatest(),
    ]);
    setIsLoading(false);
    if (!response.error) {
      setSummary(response);
    }

    const devList = extractDeviceArray(devListRes);
    const dashList = extractDeviceArray(dashDevRes);
    const combinedMap = new Map();
    [...devList, ...dashList].forEach((d) => {
      const dId = d.id || d.Id || d.dev_id;
      if (dId && !combinedMap.has(dId)) {
        combinedMap.set(dId, d);
      }
    });

    const finalDevArray = Array.from(combinedMap.values());
    if (finalDevArray.length > 0) {
      const activeCount = finalDevArray.filter(isDeviceActive).length;
      setDeviceStats({
        total: finalDevArray.length,
        active: activeCount,
        inactive: finalDevArray.length - activeCount,
      });
    }
  };

  useEffect(() => {
    loadReportData(selectedPeriod);
  }, [selectedPeriod]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("laporan")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Horizontal Period Selector */}
        <View style={styles.periodRow}>
          {["Hari Ini", "Minggu ini", "Bulan ini"].map((p) => {
            const active = selectedPeriod === p;
            let transP = t("bulan_ini");
            if (p === "Hari Ini") {
              transP = t("hari_ini");
            } else if (p === "Minggu ini") {
              transP = t("minggu_ini");
            }
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodBtn,
                  { backgroundColor: colors.border, borderColor: colors.border },
                  active && styles.periodBtnActive
                ]}
                onPress={() => setSelectedPeriod(p)}
              >
                <Text style={[styles.periodText, active ? styles.periodTextActive : { color: colors.textMuted }]}>
                  {transP}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading Spinner */}
        {isLoading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#0059AB" />
          </View>
        ) : (
          <ReportStatsCard summary={summary} deviceStats={deviceStats} colors={colors} theme={theme} t={t} language={language} />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers & Subcomponents ───────────────────────────────────────────────
function ReportStatsCard({ summary, deviceStats, colors, theme, t , language }) {
  if (!summary) return null;

  const unitText = language === "Indonesia" ? "unit" : "units";
  const userText = language === "Indonesia" ? "pengguna" : "users";

  const totalDevCount = deviceStats && deviceStats.total > 0 ? deviceStats.total : (summary.totalDevice ?? 0);
  const activeDevCount = deviceStats && deviceStats.total > 0 ? deviceStats.active : (summary.deviceOnline ?? 0);
  const inactiveDevCount = deviceStats && deviceStats.total > 0 ? deviceStats.inactive : (summary.deviceOffline ?? 0);

  const totalDevStr = `${totalDevCount} ${unitText}`;
  const onlineDevStr = `${activeDevCount} ${unitText}`;
  const offlineDevStr = `${inactiveDevCount} ${unitText}`;
  const totalUsersStr = `${summary.totalUsers ?? "-"} ${userText}`;  
 
  const avgTemp = formatDecimal(summary.avgTemperature || 0, 1, language);
  const avgHum = formatDecimal(summary.avgHumidity || 0, 1, language);
  const rawPower = Number(summary.totalPowerKwh || 0);
  const powerInKwh = rawPower > 100 ? rawPower / 1000.0 : rawPower;
  const totalPower = formatDecimal(powerInKwh, 2, language);

  const monitoringTitle =
    language === "Indonesia"
      ? "Ringkasan Monitoring"
      : "Monitoring Summary";
  const deviceOnlineTitle =
    language === "Indonesia"
      ? "Perangkat Aktif"
      : "Active Devices";
  const deviceOfflineTitle =
    language === "Indonesia"
      ? "Perangkat Tidak Aktif"
      : "Inactive Devices";
  const totalUserTitle =
    language === "Indonesia"
      ? "Total Pengguna"
      : "Total Users";
  const avgSuhuTitle =
    language === "Indonesia"
      ? "Rata-rata Suhu"
      : "Average Temperature";
  const avgHumiTitle =
  language === "Indonesia"
    ? "Rata-rata Kelembapan"
    : "Average Humidity";
const totalPowerTitle =
  language === "Indonesia"
    ? "Total Listrik"
    : "Total Electricity";
  const isDark = theme === "Dark Mode";

  return (
    <Card style={[styles.reportCard, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.cardHeaderTitle, { color: colors.textMuted }]}>
        {monitoringTitle}
      </Text>
      
      {/* 1. Total Perangkat */}
      <View style={styles.statRow}>
        <View style={styles.rowLabelBox}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? "#334155" : "#f1f5f9" }]}>
            <Tv size={16} color="#64748b" />
          </View>
            <Text style={[styles.statLabelText, { color: colors.text }]}>
              {language === "Indonesia" ? "Total Perangkat" : "Total Devices"}
            </Text>        
          </View>
        <Text style={[styles.statValueText, { color: "#2563eb" }]}>
          {totalDevStr}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* 2. Perangkat Online */}
      <View style={styles.statRow}>
        <View style={styles.rowLabelBox}>
          <View style={[styles.iconContainer, { backgroundColor: "#dcfce7" }]}>
            <Wifi size={16} color="#10b981" />
          </View>
          <Text style={[styles.statLabelText, { color: colors.text }]}>{deviceOnlineTitle}</Text>
        </View>
        <Text style={[styles.statValueText, { color: "#10b981" }]}>
          {onlineDevStr}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* 3. Perangkat Offline */}
      <View style={styles.statRow}>
        <View style={styles.rowLabelBox}>
          <View style={[styles.iconContainer, { backgroundColor: "#fefeec" }]}>
            <WifiOff size={16} color="#ef4444" style={{ marginTop: 2 }} />
          </View>
          <Text style={[styles.statLabelText, { color: colors.text }]}>{deviceOfflineTitle}</Text>
        </View>
        <Text style={[styles.statValueText, { color: "#ef4444" }]}>
          {offlineDevStr}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Total Users */}
      <View style={styles.statRow}>
        <View style={styles.rowLabelBox}>
          <View style={[styles.iconContainer, { backgroundColor: "#f3e8ff" }]}>
            <User size={16} color="#a855f7" />
          </View>
          <Text style={[styles.statLabelText, { color: colors.text }]}>{totalUserTitle}</Text>
        </View>
        <Text style={[styles.statValueText, { color: "#a855f7" }]}>
          {totalUsersStr}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* 4. Rata-rata Suhu */}
      <View style={styles.statRow}>
        <View style={styles.rowLabelBox}>
          <View style={[styles.iconContainer, { backgroundColor: "#eff6ff" }]}>
            <Thermometer size={16} color="#2563eb" />
          </View>
          <Text style={[styles.statLabelText, { color: colors.text }]}>
            {avgSuhuTitle}
          </Text>
        </View>
        <Text style={[styles.statValueText, { color: "#2563eb" }]}>
          {avgTemp} °C
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* 5. Rata-rata Kelembapan */}
      <View style={styles.statRow}>
        <View style={styles.rowLabelBox}>
          <View style={[styles.iconContainer, { backgroundColor: "#eff6ff" }]}>
            <Droplet size={16} color="#2563eb" />
          </View>
          <Text style={[styles.statLabelText, { color: colors.text }]}>
            {avgHumiTitle}
          </Text>
        </View>
        <Text style={[styles.statValueText, { color: "#2563eb" }]}>
          {avgHum} %
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* 6. Total Listrik */}
      <View style={styles.statRow}>
        <View style={styles.rowLabelBox}>
          <View style={[styles.iconContainer, { backgroundColor: "#fefeec" }]}>
            <Zap size={16} color="#eab308" />
          </View>
          <Text style={[styles.statLabelText, { color: colors.text }]}>
            {totalPowerTitle}
          </Text>
        </View>
        <Text style={[styles.statValueText, { color: "#2563eb" }]}>
          {totalPower} kWh
        </Text>
      </View>
    </Card>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  navbar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: {
    padding: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
    paddingLeft: 4,
  },
  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  periodBtnActive: {
    backgroundColor: "#0059AB",
    borderColor: "#0059AB",
  },
  periodText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  periodTextActive: {
    color: "#fff",
  },
  reportCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 14,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowLabelBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  statValueText: {
    fontSize: 12,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: "center",
  },
});
