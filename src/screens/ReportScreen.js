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
  Tv,
  Wifi,
  WifiOff,
  Thermometer,
  Droplet,
  Zap,
  User,
} from "lucide-react-native";


export default function ReportScreen({ navigation }) {
  const { colors, theme, t } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState("Hari Ini");
  const [summary, setSummary]   = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const periodMap = {
    "Hari Ini"   : "today",
    "Minggu ini" : "week",
    "Bulan ini"  : "month",
  };

  const loadReportData = async (period) => {
    setIsLoading(true);
    const response = await iotService.getReportSummary(periodMap[period] ?? "today");
    setIsLoading(false);
    if (!response.error) {
      setSummary(response);
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
            const transP = p === "Hari Ini" ? t("hari_ini") : p === "Minggu ini" ? t("minggu_ini") : t("bulan_ini");
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
          /* Ringkasan Monitoring Card */
          <Card style={[styles.reportCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardHeaderTitle, { color: colors.textMuted }]}>
              {t("bahasa") === "Indonesia" ? "Ringkasan Monitoring" : "Monitoring Summary"}
            </Text>
            
            {/* 1. Total Perangkat */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: theme === "Dark Mode" ? "#334155" : "#f1f5f9" }]}>
                  <Tv size={16} color="#64748b" />
                </View>
                <Text style={[styles.statLabelText, { color: colors.text }]}>Total Devices</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#2563eb" }]}>
                {summary?.totalDevice ?? "-"} {t("bahasa") === "Indonesia" ? "unit" : "units"}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* 2. Perangkat Online */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#dcfce7" }]}>
                  <Wifi size={16} color="#10b981" />
                </View>
                <Text style={[styles.statLabelText, { color: colors.text }]}>{t("perangkat_online") || "Devices Online"}</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#10b981" }]}>
                {summary?.deviceOnline ?? "-"} {t("bahasa") === "Indonesia" ? "unit" : "units"}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* 3. Perangkat Offline */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#fefeec" }]}>
                  <WifiOff size={16} color="#ef4444" style={{ marginTop: 2 }} />
                </View>
                <Text style={[styles.statLabelText, { color: colors.text }]}>{t("perangkat_offline") || "Devices Offline"}</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#ef4444" }]}>
                {summary?.deviceOffline ?? "-"} {t("bahasa") === "Indonesia" ? "unit" : "units"}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Total Users */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#f3e8ff" }]}>
                  <User size={16} color="#a855f7" />
                </View>
                <Text style={[styles.statLabelText, { color: colors.text }]}>{t("total_user") || "Total Users"}</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#a855f7" }]}>
                {summary?.totalUsers ?? "-"} {t("bahasa") === "Indonesia" ? "orang" : "users"}
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
                  {t("bahasa") === "Indonesia" ? "Rata-rata Suhu" : "Average Temperature"}
                </Text>
              </View>
              <Text style={[styles.statValueText, { color: "#2563eb" }]}>
                {summary ? parseFloat(summary.avgTemperature).toFixed(1) : "-"} °C
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
                  {t("bahasa") === "Indonesia" ? "Rata-rata Kelembapan" : "Average Humidity"}
                </Text>
              </View>
              <Text style={[styles.statValueText, { color: "#2563eb" }]}>
                {summary ? parseFloat(summary.avgHumidity).toFixed(1) : "-"} %
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
                  {t("bahasa") === "Indonesia" ? "Total Listrik" : "Total Electricity"}
                </Text>
              </View>
              <Text style={[styles.statValueText, { color: "#2563eb" }]}>
                {summary ? parseFloat(summary.totalPowerKwh).toFixed(2) : "-"} kWh
              </Text>
            </View>

          </Card>
        )}

      </ScrollView>
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
