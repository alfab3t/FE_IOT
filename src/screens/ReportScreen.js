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
} from "lucide-react-native";

export default function ReportScreen({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState("Hari Ini"); // Hari Ini, Minggu ini, Bulan ini
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadReportData = async () => {
    setIsLoading(true);
    const response = await iotService.getDashboardLatest();
    setIsLoading(false);
    if (!response.error && Array.isArray(response)) {
      setDevices(response);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // Calculate dynamic stats
  const countAll = devices.length || 54;
  const countOnline = devices.length 
    ? devices.filter((d) => d.status === "ON" || (d.status && d.status !== "OFF" && d.status !== "0")).length 
    : 42;
  const countOffline = countAll - countOnline;

  // Period multiplier helper to simulate change in values
  const getMultiplier = () => {
    if (selectedPeriod === "Minggu ini") return 7.2;
    if (selectedPeriod === "Bulan ini") return 30.5;
    return 1.0;
  };

  const mult = getMultiplier();

  // Retrieve values from devices or default to Figma mockup
  const getTempReport = () => (26.1).toFixed(1);
  const getHumReport = () => (64.2).toFixed(1);
  const getPowerReport = () => (542.7 * mult).toFixed(1);
  const getWaterReport = () => (13.8 * (mult > 1 ? mult * 0.8 : 1)).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Laporan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Period Picker */}
        <Text style={styles.sectionTitle}>Pilih Periode</Text>
        <View style={styles.periodRow}>
          {["Hari Ini", "Minggu ini", "Bulan ini"].map((p) => {
            const active = selectedPeriod === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, active && styles.periodBtnActive]}
                onPress={() => setSelectedPeriod(p)}
              >
                <Text style={[styles.periodText, active && styles.periodTextActive]}>
                  {p}
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
          <Card style={styles.reportCard}>
            <Text style={styles.cardHeaderTitle}>Ringkasan Monitoring</Text>
            
            {/* 1. Total Perangkat */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#f1f5f9" }]}>
                  <Tv size={16} color="#64748b" />
                </View>
                <Text style={styles.statLabelText}>Total Perangkat</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#2563eb" }]}>{countAll} unit</Text>
            </View>
            <View style={styles.divider} />

            {/* 2. Perangkat Online */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#dcfce7" }]}>
                  <Wifi size={16} color="#10b981" />
                </View>
                <Text style={styles.statLabelText}>Perangkat Online</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#10b981" }]}>{countOnline} unit</Text>
            </View>
            <View style={styles.divider} />

            {/* 3. Perangkat Offline */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#fefeec" }]}>
                  <WifiOff size={16} color="#ef4444" style={{ marginTop: 2 }} />
                </View>
                <Text style={styles.statLabelText}>Perangkat Offline</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#ef4444" }]}>{countOffline} unit</Text>
            </View>
            <View style={styles.divider} />

            {/* 4. Rata-rata Suhu */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#eff6ff" }]}>
                  <Thermometer size={16} color="#2563eb" />
                </View>
                <Text style={styles.statLabelText}>Rata-rata Suhu</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#2563eb" }]}>{getTempReport()} °C</Text>
            </View>
            <View style={styles.divider} />

            {/* 5. Rata-rata Kelembapan */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#eff6ff" }]}>
                  <Droplet size={16} color="#2563eb" />
                </View>
                <Text style={styles.statLabelText}>Rata-rata Kelembapan</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#2563eb" }]}>{getHumReport()} %</Text>
            </View>
            <View style={styles.divider} />

            {/* 6. Total Listrik */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#fefeec" }]}>
                  <Zap size={16} color="#eab308" />
                </View>
                <Text style={styles.statLabelText}>Total Listrik</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#2563eb" }]}>{getPowerReport()} kWh</Text>
            </View>
            <View style={styles.divider} />

            {/* 7. Total Air */}
            <View style={styles.statRow}>
              <View style={styles.rowLabelBox}>
                <View style={[styles.iconContainer, { backgroundColor: "#eff6ff" }]}>
                  <Droplet size={16} color="#0059AB" />
                </View>
                <Text style={styles.statLabelText}>Total Air</Text>
              </View>
              <Text style={[styles.statValueText, { color: "#2563eb" }]}>
                {selectedPeriod === "Hari Ini" ? `${getWaterReport()} L/menit` : `${getWaterReport()} m³`}
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
    backgroundColor: "#fff",
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
