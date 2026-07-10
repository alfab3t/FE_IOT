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
  const { colors, refreshInterval, theme } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Semua"); // Semua, Suhu, Kelembapan, Listrik, Air
  const [toggleMode, setToggleMode] = useState("Grafik"); // Grafik, Data
  const [timePeriod, setTimePeriod] = useState("Hari Ini"); // Hari Ini, Minggu Ini, Bulan Ini

  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [devicePickerVisible, setDevicePickerVisible] = useState(false);

  // Chart data (static initial data used in graphs)
  const graphData1 = [23.0, 22.9, 22.8, 22.7, 22.6, 22.7, 23.0, 23.1, 22.9, 22.8];
  const graphData2 = [64.2, 63.8, 63.5, 64.1, 64.4, 64.7, 64.2, 63.9, 63.6, 63.3];

  const loadMonitoringData = async () => {
    setIsLoading(true);
    const response = await iotService.getDashboardLatest();
    setIsLoading(false);

    if (!response.error && Array.isArray(response) && response.length > 0) {
      setDevices(response);
      // Auto pick first AC/Temp sensor or fallback
      const picked = response.find((d) => d.category === "AC" || d.category === "Temperatur & Kelembaban") || response[0];
      setActiveDevice(picked);
    }
  };

  useEffect(() => {
    loadMonitoringData();

    let intervalMs = 30000; // default 30s
    if (refreshInterval === "5 detik") intervalMs = 5000;
    else if (refreshInterval === "10 detik") intervalMs = 10000;
    else if (refreshInterval === "60 detik") intervalMs = 60000;

    const timer = setInterval(() => {
      iotService.getDashboardLatest().then((response) => {
        if (!response.error && Array.isArray(response) && response.length > 0) {
          setDevices(response);
        }
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [refreshInterval]);

  const chartConfig = {
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 89, 171, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#0059AB" },
  };

  // Mock historical log values for the table data
  const tableLogs = [
    { time: "08:31", temp: "23.0", hum: "64.2", power: "542.7", water: "13.8", status: "Normal" },
    { time: "08:26", temp: "22.9", hum: "63.8", power: "541.9", water: "13.6", status: "Normal" },
    { time: "08:21", temp: "22.8", hum: "63.5", power: "541.3", water: "13.4", status: "Normal" },
    { time: "08:16", temp: "22.7", hum: "64.1", power: "540.5", water: "13.2", status: "Normal" },
    { time: "08:11", temp: "22.6", hum: "64.4", power: "539.8", water: "13.1", status: "Normal" },
    { time: "08:06", temp: "22.7", hum: "64.7", power: "539.1", water: "13.0", status: "Normal" },
    { time: "08:01", temp: "23.0", hum: "64.2", power: "538.4", water: "12.9", status: "Normal" },
    { time: "07:56", temp: "23.1", hum: "63.9", power: "537.6", water: "12.7", status: "Normal" },
    { time: "07:51", temp: "22.9", hum: "63.6", power: "536.8", water: "12.6", status: "Normal" },
    { time: "07:46", temp: "22.8", hum: "63.3", power: "536.2", water: "12.5", status: "Normal" },
  ];

  const renderGrafikMode = () => (
    <View>
      {/* Suhu Grafik */}
      {(activeTab === "Semua" || activeTab === "Suhu") && (
        <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.chartMetricHeader}>
            <Text style={[styles.chartMetricLabel, { color: colors.text }]}>Suhu (°C)</Text>
            <Text style={[styles.chartMetricValue, { color: colors.text }]}>23°C</Text>
          </View>
          <LineChart
            data={{
              labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
              datasets: [{ data: graphData1.slice(0, 7) }],
            }}
            width={chartWidth - 24}
            height={150}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card>
      )}

      {/* Kelembaban Grafik */}
      {(activeTab === "Semua" || activeTab === "Kelembapan") && (
        <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.chartMetricHeader}>
            <Text style={[styles.chartMetricLabel, { color: colors.text }]}>Kelembapan (%)</Text>
            <Text style={[styles.chartMetricValue, { color: colors.text }]}>64.2%</Text>
          </View>
          <LineChart
            data={{
              labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
              datasets: [{ data: graphData2.slice(0, 7) }],
            }}
            width={chartWidth - 24}
            height={150}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card>
      )}

      {/* Listrik Grafik */}
      {(activeTab === "Semua" || activeTab === "Listrik") && (
        <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.chartMetricHeader}>
            <Text style={[styles.chartMetricLabel, { color: colors.text }]}>Listrik (kWh)</Text>
            <Text style={[styles.chartMetricValue, { color: colors.text }]}>542.7 kWh</Text>
          </View>
          <BarChart
            data={{
              labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
              datasets: [{ data: [300, 350, 420, 542, 510, 480, 450] }],
            }}
            width={chartWidth - 24}
            height={150}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={false}
          />
        </Card>
      )}

      {/* Air Grafik */}
      {(activeTab === "Semua" || activeTab === "Air") && (
        <Card style={[styles.chartMetricCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.chartMetricHeader}>
            <Text style={[styles.chartMetricLabel, { color: colors.text }]}>Air (L/menit)</Text>
            <Text style={[styles.chartMetricValue, { color: colors.text }]}>13.8 L/m</Text>
          </View>
          <BarChart
            data={{
              labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
              datasets: [{ data: [10, 11, 13, 13.8, 13, 12, 11] }],
            }}
            width={chartWidth - 24}
            height={150}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={false}
          />
        </Card>
      )}

      {/* Time Filter Row */}
      <View style={styles.timeFilterRow}>
        {["Hari Ini", "Minggu Ini", "Bulan Ini"].map((p) => {
          const active = timePeriod === p;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.timeBtn, active && styles.timeBtnActive]}
              onPress={() => setTimePeriod(p)}
            >
              <Text style={[styles.timeBtnLabel, active && styles.timeBtnLabelActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderDataTableMode = () => (
    <View>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableTitle, { color: colors.text }]}>Data {activeTab}</Text>
        <Text style={[styles.unitSubtitle, { color: colors.textMuted }]}>
          {/* Satuan unit berdasarkan tab aktif */}
          {(() => {
            let unit = "Semua";
            if (activeTab === "Suhu") unit = "°C";
            else if (activeTab === "Kelembapan") unit = "%";
            else if (activeTab === "Listrik") unit = "kWh";
            else if (activeTab === "Air") unit = "L/menit";
            return `Satuan: ${unit}`;
          })()}
        </Text>
      </View>

      {/* Time Period Filter above Table */}
      <View style={[styles.timeFilterRow, { marginTop: 0, marginBottom: 16 }]}>
        {["Hari Ini", "Minggu Ini", "Bulan Ini"].map((p) => {
          const active = timePeriod === p;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.timeBtn, active && [styles.timeBtnActive, { backgroundColor: "#0059AB" }]]}
              onPress={() => setTimePeriod(p)}
            >
              <Text style={[styles.timeBtnLabel, active ? styles.timeBtnLabelActive : { color: colors.textMuted }]}>
                {p}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Responsive Table Wrapper */}
      <Card style={[styles.tableCard, { backgroundColor: colors.cardBackground }]}>
        <View style={[styles.tableHead, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.thText, { flex: 0.8, color: colors.text }]}>Waktu</Text>
          {activeTab === "Semua" ? (
            <>
              <Text style={[styles.thText, { color: colors.text }]}>Suhu</Text>
              <Text style={[styles.thText, { color: colors.text }]}>Hum</Text>
              <Text style={[styles.thText, { color: colors.text }]}>Listrik</Text>
              <Text style={[styles.thText, { color: colors.text }]}>Air</Text>
            </>
          ) : (
            <Text style={[styles.thText, { flex: 2, textAlign: "center", color: colors.text }]}>Nilai {activeTab}</Text>
          )}
          <Text style={[styles.thText, { flex: 1, textAlign: "right", color: colors.text }]}>Status</Text>
        </View>

        {tableLogs.map((log) => (
          <View key={log.time} style={[styles.tableRow, tableLogs.indexOf(log) === tableLogs.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tdText, { flex: 0.8, color: colors.textMuted }]}>{log.time}</Text>
            {activeTab === "Semua" ? (
              <>
                <Text style={[styles.tdText, { color: colors.text }]}>{log.temp}°</Text>
                <Text style={[styles.tdText, { color: colors.text }]}>{log.hum}%</Text>
                <Text style={[styles.tdText, { color: colors.text }]}>{log.power}</Text>
                <Text style={[styles.tdText, { color: colors.text }]}>{log.water}</Text>
              </>
            ) : (
              <Text style={[styles.tdText, { flex: 2, textAlign: "center", fontWeight: "800", color: "#0059AB" }]}>
                {(() => {
                  if (activeTab === "Suhu") return `${log.temp} °C`;
                  if (activeTab === "Kelembapan") return `${log.hum} %`;
                  if (activeTab === "Listrik") return `${log.power} kWh`;
                  return `${log.water} L/m`;
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
      <Text style={[styles.tableFooterInfo, { color: colors.textMuted }]}>i Menampilkan 10 data terbaru</Text>
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
        <Text style={[styles.navTitle, { color: colors.text }]}>Monitoring</Text>
        <TouchableOpacity onPress={() => setDevicePickerVisible(true)} style={{ padding: 8 }}>
          <SlidersHorizontal size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Tabs list */}
      <View style={[styles.topTabBar, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        {["Semua", "Suhu", "Kelembapan", "Listrik", "Air"].map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.topTabItem, active && [styles.topTabItemActive, { borderBottomColor: "#0059AB" }]]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.topTabLabel, active ? styles.topTabLabelActive : { color: colors.textMuted }]}>
                {tab}
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
              Grafik
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeToggleBtn, toggleMode === "Data" && [styles.modeToggleBtnActive, { backgroundColor: "#0059AB" }]]}
            onPress={() => setToggleMode("Data")}
          >
            <Text style={[styles.modeToggleLabel, toggleMode === "Data" && styles.modeToggleLabelActive]}>
              Data
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

            {/* Title */}
            <Text style={[styles.dialogTitle, { color: colors.text, textAlign: "center", marginBottom: 8 }]}>Pilih Perangkat</Text>

            {/* Message */}
            <Text style={[styles.dialogMessage, { color: colors.textMuted }]}>
              Pilih perangkat sensor untuk melihat visualisasi data:
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
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Batal</Text>
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
    backgroundColor: "#f8fafc",
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
