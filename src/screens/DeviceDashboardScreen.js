import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import { authService } from "../services/authService";
import Card from "../components/Card";
import NotificationPopup from "../components/NotificationPopup";
import {
  Bell,
  User,
  Thermometer,
  Zap,
  Droplet,
  Smartphone,
  CheckCircle,
  Activity,
  ChevronRight,
  Menu,
  FileText,
  Settings,
  Info,
  LogOut,
  ChevronLeft,
  Radio,
} from "lucide-react-native";

const chartWidth = Dimensions.get("window").width - 32;

// Persistent global set to track shown notifications across tab switches and remounts
const globalSeenNotifsSet = new Set();

export default function DeviceDashboardScreen({ navigation, setActiveTab }) {
  const { user, logout, setUser, refreshInterval, t, translateNotification, colors, showToast, theme } = useUser();
  const [devices, setDevices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ totalDevices: 0, onlineDevices: 0, offlineDevices: 0, totalUsers: 0, avgSuhu: 0, avgHumi: 0, avgPower: 0, estKWh: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Custom Navigation Drawers / Modals
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [logoutPopupVisible, setLogoutPopupVisible] = useState(false);

  // Role info
  const selectedRoleName = user?.selectedRole?.roleName || "User";
  const isOwner = selectedRoleName.toLowerCase().includes("owner") || selectedRoleName.toLowerCase().includes("controller");
  const isAdmin = selectedRoleName.toLowerCase().includes("admin");

  // Chart Interactive State
  const [activeChartTab, setActiveChartTab] = useState("Suhu"); // Suhu, Kelembaban, Listrik
  const [chartDataState, setChartDataState] = useState([]);
  const [chartLabelsState, setChartLabelsState] = useState([]);

  const loadChartData = async (tab, devicesList = devices) => {
    // Call the average graph endpoint directly with the selected category tab (Hourly / Per Jam)
    let response = await iotService.getGraphAverage(tab, "Hourly");
    if (!response.error && Array.isArray(response) && response.length > 0) {
      if (response.length > 8) {
        response = response.slice(-8);
      }
      const labels = response.map((pt) => pt.labelText || "");
      const values = response.map((pt) => Number.parseFloat(pt.averageValue || 0));
      setChartLabelsState(labels);

      if (tab === "Suhu") {
        setChartDataState(values);
      } else if (tab === "Kelembaban") {
        // Use true average humidity values directly from DB
        setChartDataState(values);
      } else if (tab === "Listrik") {
        // Convert Watts to kW for cleaner Y-axis labels
        const powerKW = values.map((v) => v / 1000.0);
        setChartDataState(powerKW);
      }
    } else {
      // API returned empty — show empty chart
      setChartLabelsState([]);
      setChartDataState([]);
    }
  };

  const loadDashboardData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const devResponse = await iotService.getDashboardLatest();
      const actResponse = await iotService.getNotifications();
      const statsResponse = await iotService.getDashboardStats();

      if (!devResponse.error && Array.isArray(devResponse)) {
        setDevices(devResponse);
        loadChartData(activeChartTab, devResponse);
      }
      if (!statsResponse.error && statsResponse) {
        setStats(statsResponse);
      }
      if (!actResponse.error && Array.isArray(actResponse)) {
        setActivities(actResponse);

        actResponse.forEach((notif) => {
          const isUrgent = notif.alertType === "Urgent" || notif.message?.toLowerCase().includes("melampaui") || notif.message?.toLowerCase().includes("warning");
          if (notif.status !== "Read" && isUrgent) {
            if (!globalSeenNotifsSet.has(notif.id)) {
              globalSeenNotifsSet.add(notif.id);
              showToast(`⚠️ Alarm: ${translateNotification(notif.message)}`, "warning", () => {
                navigation.navigate("NotificationDetail", { notification: notif });
              });
            }
          }
        });
      }
    } catch (error) {
      console.error("loadDashboardData error:", error);
      showToast("Gagal menyinkronkan data dashboard.", "error");
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    if (user && !user.foto) {
      authService.getProfilePhoto().then((res) => {
        if (res && !res.error && res.photo) {
          setUser((prev) => ({ ...prev, foto: res.photo }));
        }
      });
    }

    let intervalMs = 30000;
    if (refreshInterval === "5 detik") intervalMs = 5000;
    else if (refreshInterval === "10 detik") intervalMs = 10000;
    else if (refreshInterval === "60 detik") intervalMs = 60000;

    const timer = setInterval(() => {
      loadDashboardData(false);
      loadChartData(activeChartTab);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [refreshInterval]);

  useEffect(() => {
    loadChartData(activeChartTab);
  }, [activeChartTab]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData(false);
  };

  // Generate date string in Indonesian/English based on translation context
  const getIndonesianDate = () => {
    const date = new Date();
    const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
    const isId = t("bahasa") === "Indonesia";
    const dateStr = date.toLocaleDateString(isId ? "id-ID" : "en-US", options);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${dateStr} • ${hours}:${minutes} WIB`;
  };

  // Extract Summary Statistics
  const totalDevices = stats.totalDevices;
  const onlineDevices = stats.onlineDevices;
  const offlineDevices = stats.offlineDevices;

  // Active Metric values
  const getMetricValue = (category) => {
    if (category === "Suhu") {
      return stats.avgSuhu > 0 ? `${stats.avgSuhu.toFixed(1)}°C` : "26.3°C";
    }
    if (category === "Kelembaban") {
      return stats.avgHumi > 0 ? `${stats.avgHumi.toFixed(1)}%` : "64.2%";
    }
    if (category === "Listrik") {
      // stats.avgPower is in Watts, convert to kW
      return stats.avgPower > 0 ? `${(stats.avgPower / 1000.0).toFixed(1)} kW` : "542.7 kWh";
    }
    if (category === "Air") {
      return "13.8 m³";
    }
    return "N/A";
  };

  useEffect(() => {
    loadChartData(activeChartTab);
  }, [activeChartTab]);

  const getChartStats = () => {
    if (!chartDataState || chartDataState.length === 0) {
      return { avg: "-", min: "-", max: "-", energy: "-" };
    }
    const sum = chartDataState.reduce((a, b) => a + b, 0);
    const avg = sum / chartDataState.length;
    const min = Math.min(...chartDataState);
    const max = Math.max(...chartDataState);

    let unit = "";
    if (activeChartTab === "Suhu") unit = "°C";
    else if (activeChartTab === "Kelembaban") unit = "%";
    else if (activeChartTab === "Listrik") unit = " kW";

    // Estimasi total energi untuk Listrik (rata-rata kW * 2 jam)
    const energyVal = activeChartTab === "Listrik" ? `${(avg * 2.0).toFixed(2)} kWh` : "-";

    return {
      avg: `${avg.toFixed(1)}${unit}`,
      min: `${min.toFixed(1)}${unit}`,
      max: `${max.toFixed(1)}${unit}`,
      energy: energyVal
    };
  };

  const chartConfig = {
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: activeChartTab === "Listrik" ? 2 : 1,
    color: (opacity = 1) => `rgba(0, 89, 171, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: { borderRadius: 16 },
    propsForDots: { r: "3", strokeWidth: "2", stroke: "#0059AB" },
    propsForLabels: { fontSize: 9 },
  };

  // Thin out labels: only show every Nth label to prevent X-axis overlap
  const thinLabels = (labels) => {
    if (!labels || labels.length === 0) return [];
    const len = labels.length;
    let n = 3;
    if (len <= 6) {
      n = 1;
    } else if (len <= 12) {
      n = 2;
    }
    return labels.map((lbl, i) => (i === 0 || i === len - 1 || i % n === 0 ? lbl : ""));
  };

  // Render Admin Dashboard
  const renderAdminDashboard = () => {
    return (
      <View>
        {/* Ringkasan Sistem (4 cards in a row) */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("status_sistem")}</Text>
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
            <Smartphone size={24} color="#0059AB" />
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Devices</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{totalDevices || 54}</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
            <Smartphone size={24} color="#10b981" />
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t("device_online")}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{onlineDevices || 42}</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
            <Smartphone size={24} color="#ef4444" />
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t("device_offline")}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{offlineDevices || 12}</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
            <User size={24} color="#8b5cf6" />
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t("total_user")}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.totalUsers || 6}</Text>
          </Card>
        </View>

        {/* Grafik Monitoring Card */}
        <Card style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>{t("monitoring_sistem")}</Text>
          </View>

          {/* Interactive Chart Tabs */}
          <View style={[styles.chartTabs, { backgroundColor: colors.border }]}>
            {["Suhu", "Kelembaban", "Listrik"].map((tab) => {
              const active = activeChartTab === tab;
              const transKey = tab === "Kelembaban" ? "kelembapan" : tab.toLowerCase();
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.chartTabBtn, active && styles.chartTabBtnActive, { backgroundColor: active ? "#0059AB" : "transparent" }]}
                  onPress={() => setActiveChartTab(tab)}
                >
                  <Text style={[styles.chartTabLabel, active ? styles.chartTabLabelActive : { color: colors.textMuted }]}>
                    {t(transKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stats Summary Info Panel */}
          {chartDataState.length > 0 && (
            <View style={[styles.chartStatsRow, { backgroundColor: theme === "Dark Mode" ? "#0f172a" : "#f8fafc" }]}>
              <View style={styles.chartStatBox}>
                <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>Rata-rata</Text>
                <Text style={[styles.chartStatValue, { color: colors.text }]}>{getChartStats().avg}</Text>
              </View>
              <View style={styles.chartStatBox}>
                <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>Tertinggi</Text>
                <Text style={[styles.chartStatValue, { color: colors.text }]}>{getChartStats().max}</Text>
              </View>
              <View style={styles.chartStatBox}>
                <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>Terendah</Text>
                <Text style={[styles.chartStatValue, { color: colors.text }]}>{getChartStats().min}</Text>
              </View>
              {activeChartTab === "Listrik" && (
                <View style={styles.chartStatBox}>
                  <Text style={[styles.chartStatLabel, { color: colors.textMuted }]}>Est. Konsumsi</Text>
                  <Text style={[styles.chartStatValue, { color: "#10b981" }]}>{getChartStats().energy}</Text>
                </View>
              )}
            </View>
          )}

          {/* Graph visual */}
          {chartDataState.length === 0 ? (
            <View style={[styles.chartVisual, { justifyContent: "center", alignItems: "center", height: 180, backgroundColor: colors.background, borderRadius: 12 }]}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>
                {"Belum ada data telemetri"}
              </Text>
            </View>
          ) : (
            <LineChart
              data={{
                labels: thinLabels(chartLabelsState),
                datasets: [{ data: chartDataState }],
              }}
              width={chartWidth}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chartVisual}
              withHorizontalLabels={true}
              fromZero={false}
            />
          )}

          <TouchableOpacity style={styles.chartLink} onPress={() => setActiveTab(2)}>
            <Text style={styles.chartLinkText}>{t("lihat_semua")}</Text>
            <ChevronRight size={16} color="#0059AB" />
          </TouchableOpacity>
        </Card>

        {/* Stack Lists for Mobile: Recent Devices and System Timeline */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Device Status</Text>
        <Card style={[styles.listCard, { backgroundColor: colors.cardBackground }]}>
          {devices.slice(0, 5).map((dev, idx) => {
            const isOnline = dev.status === "ON" || (dev.status && dev.status !== "OFF" && dev.status !== "0");
            return (
              <View key={dev.id} style={[styles.listItemRow, idx === 4 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={[styles.listItemName, { color: colors.text }]}>{dev.name}</Text>
                  <Text style={[styles.listItemSub, { color: colors.textMuted }]}>{dev.ruangan || "Lab AI-Lantai 1"}</Text>
                </View>
                <View style={styles.statusRowBadge}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? "#10b981" : "#ef4444" }]} />
                  <Text style={[styles.statusText, { color: isOnline ? "#10b981" : "#ef4444" }]}>
                    {isOnline ? "Online" : "Offline"}
                  </Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={styles.chartLink} onPress={() => setActiveTab(1)}>
            <Text style={styles.chartLinkText}>{t("lihat_semua")}</Text>
            <ChevronRight size={16} color="#0059AB" />
          </TouchableOpacity>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("aktivitas_terakhir")}</Text>
        <Card style={[styles.listCard, { backgroundColor: colors.cardBackground }]}>
          {activities.length === 0 ? (
            <View style={styles.emptyActivityBox}>
              <CheckCircle size={32} color="#10b981" />
              <Text style={[styles.emptyActivityText, { color: colors.textMuted }]}>
                {t("bahasa") === "Indonesia" ? "Sistem berjalan normal. Tidak ada alarm." : "System running normally. No alarms."}
              </Text>
            </View>
          ) : (
            activities.slice(0, 4).map((act, idx) => {
              const isUrgent = act.alertType === "Urgent" || act.title?.toLowerCase().includes("offline");
              return (
                <View key={act.id} style={[styles.timelineRow, idx === activities.slice(0, 4).length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]}>
                  <View style={[styles.timelineDot, { backgroundColor: isUrgent ? "#ef4444" : "#eab308" }]} />
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineBadgeText, { color: colors.textMuted }]}>
                      {isUrgent ? t("alarm") : t("kontrol")}
                    </Text>
                    <Text style={[styles.timelineMessage, { color: colors.text }]}>{translateNotification(act.message)}</Text>
                  </View>
                </View>
              );
            })
          )}
          <TouchableOpacity style={styles.chartLink} onPress={() => setActiveTab(3)}>
            <Text style={styles.chartLinkText}>{t("lihat_semua")}</Text>
            <ChevronRight size={16} color="#0059AB" />
          </TouchableOpacity>
        </Card>
      </View>
    );
  };

  // Render Owner Dashboard
  const renderOwnerDashboard = () => {
    return (
      <View>
        {/* Ringkasan Monitoring Hari Ini (Grid) */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("monitoring_sistem")}</Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }, activeChartTab === "Suhu" && styles.metricCardActive]}
              onPress={() => setActiveChartTab("Suhu")}
            >
              <View style={styles.metricCardHeader}>
                <Thermometer size={22} color={activeChartTab === "Suhu" ? "#0059AB" : "#64748b"} />
                <Text style={[styles.metricCardLabel, { color: colors.textMuted }]}>{t("suhu")}</Text>
              </View>
              <Text style={[styles.metricCardValue, { color: colors.text }]}>{getMetricValue("Suhu")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }, activeChartTab === "Kelembaban" && styles.metricCardActive]}
              onPress={() => setActiveChartTab("Kelembaban")}
            >
              <View style={styles.metricCardHeader}>
                <Droplet size={22} color={activeChartTab === "Kelembaban" ? "#0059AB" : "#64748b"} />
                <Text style={[styles.metricCardLabel, { color: colors.textMuted }]}>{t("kelembapan")}</Text>
              </View>
              <Text style={[styles.metricCardValue, { color: colors.text }]}>{getMetricValue("Kelembaban")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity
              style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }, activeChartTab === "Listrik" && styles.metricCardActive]}
              onPress={() => setActiveChartTab("Listrik")}
            >
              <View style={styles.metricCardHeader}>
                <Zap size={22} color={activeChartTab === "Listrik" ? "#0059AB" : "#64748b"} />
                <Text style={[styles.metricCardLabel, { color: colors.textMuted }]}>{t("listrik")}</Text>
              </View>
              <Text style={[styles.metricCardValue, { color: colors.text }]}>{getMetricValue("Listrik")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Embedded Interactive Chart */}
        <Card style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {t("grafik")} {t(activeChartTab === "Kelembaban" ? "kelembapan" : activeChartTab.toLowerCase())}
          </Text>

          {/* Stats Summary Info Panel */}
          {chartDataState.length > 0 && (
            <View style={styles.chartStatsRow}>
              <View style={styles.chartStatBox}>
                <Text style={styles.chartStatLabel}>Rata-rata</Text>
                <Text style={styles.chartStatValue}>{getChartStats().avg}</Text>
              </View>
              <View style={styles.chartStatBox}>
                <Text style={styles.chartStatLabel}>Tertinggi</Text>
                <Text style={styles.chartStatValue}>{getChartStats().max}</Text>
              </View>
              <View style={styles.chartStatBox}>
                <Text style={styles.chartStatLabel}>Terendah</Text>
                <Text style={styles.chartStatValue}>{getChartStats().min}</Text>
              </View>
              {activeChartTab === "Listrik" && (
                <View style={styles.chartStatBox}>
                  <Text style={styles.chartStatLabel}>Est. Konsumsi</Text>
                  <Text style={[styles.chartStatValue, { color: "#10b981" }]}>{getChartStats().energy}</Text>
                </View>
              )}
            </View>
          )}

          {chartDataState.length === 0 ? (
            <View style={[styles.chartVisual, { justifyContent: "center", alignItems: "center", height: 180, backgroundColor: colors.background, borderRadius: 12 }]}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>
                {"Belum ada data telemetri"}
              </Text>
            </View>
          ) : (
            <LineChart
              data={{
                labels: thinLabels(chartLabelsState),
                datasets: [{ data: chartDataState }],
              }}
              width={chartWidth}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chartVisual}
              withHorizontalLabels={true}
              fromZero={false}
            />
          )}
          <TouchableOpacity style={styles.chartLink} onPress={() => setActiveTab(2)}>
            <Text style={styles.chartLinkText}>{t("lihat_semua")}</Text>
            <ChevronRight size={16} color="#0059AB" />
          </TouchableOpacity>
        </Card>

        {/* Perangkat Aktif */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Devices</Text>
        <Card style={[styles.listCard, { backgroundColor: colors.cardBackground }]}>
          {devices.filter((d) => d.category === "AC" || d.category === "Lampu").slice(0, 3).map((dev) => {
            const isOnline = dev.status === "ON" || (dev.status && dev.status !== "OFF" && dev.status !== "0");
            return (
              <TouchableOpacity
                key={dev.id}
                style={[styles.listItemRow, { paddingVertical: 14 }, { borderBottomColor: colors.border }]}
                onPress={() => {
                  if (dev.category === "AC") {
                    navigation.navigate("AcControl", {
                      deviceId: dev.id,
                      deviceName: dev.name,
                      deviceLocation: [dev.ruangan, dev.gedung].filter(Boolean).join(" — "),
                    });
                  } else {
                    navigation.navigate("LampControl");
                  }
                }}
              >
                <View>
                  <Text style={[styles.listItemName, { color: colors.text }]}>{dev.name}</Text>
                  <Text style={[styles.listItemSub, { color: colors.textMuted }]}>{dev.ruangan || "Ruang Meeting"}</Text>
                </View>
                <View style={styles.statusRowBadge}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? "#10b981" : "#ef4444" }]} />
                  <Text style={[styles.statusText, { color: isOnline ? "#10b981" : "#ef4444" }]}>
                    {isOnline ? "Online" : "Offline"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.chartLink} onPress={() => setActiveTab(1)}>
            <Text style={styles.chartLinkText}>{t("lihat_semua")}</Text>
            <ChevronRight size={16} color="#0059AB" />
          </TouchableOpacity>
        </Card>

        {/* Aktivitas Terakhir */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("aktivitas_terakhir")}</Text>
        <Card style={[styles.listCard, { backgroundColor: colors.cardBackground }]}>
          {activities.slice(0, 3).map((act, idx) => {
            const isUrgent = act.alertType === "Urgent" || act.title?.toLowerCase().includes("offline");
            return (
              <View key={act.id} style={[styles.timelineRow, idx === 2 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]}>
                <View style={[styles.timelineDot, { backgroundColor: isUrgent ? "#ef4444" : "#eab308" }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineBadgeText, { color: colors.textMuted }]}>
                    {isUrgent ? t("alarm") : t("kontrol")}
                  </Text>
                  <Text style={[styles.timelineMessage, { color: colors.text }]}>{translateNotification(act.message)}</Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={styles.chartLink} onPress={() => setActiveTab(3)}>
            <Text style={styles.chartLinkText}>{t("lihat_semua")}</Text>
            <ChevronRight size={16} color="#0059AB" />
          </TouchableOpacity>
        </Card>
      </View>
    );
  };

  // Render Viewer Dashboard
  const renderViewerDashboard = () => {
    return renderOwnerDashboard();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
          <Menu size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.navbarCenter}>
          <Text style={[styles.navTitleCenter, { color: colors.text }]}>ASTRATech IoT</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Card illustration */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.welcomeTextSection}>
            <Text style={[styles.welcomeGreeting, { color: colors.text }]}>{t("selamat_datang")}</Text>
            <Text style={[styles.welcomeUser, { color: colors.text }]}>{user?.nickname || user?.username || (t("bahasa") === "Indonesia" ? "Pengguna" : "User")}</Text>
            <View style={styles.roleBadgeBox}>
              <Text style={styles.roleBadgeText}>{selectedRoleName}</Text>
            </View>
            <Text style={[styles.welcomeDate, { color: colors.textMuted }]}>{getIndonesianDate()}</Text>
          </View>
           <Image
            source={require("../../assets/beranda_welcome.png")}
            style={styles.welcomeImage}
            resizeMode="contain"
          />
        </View>

        {/* Dynamic dashboards based on role */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0059AB" />
            <Text style={styles.loaderText}>Menghubungkan ke sensor...</Text>
          </View>
        ) : (
          (() => {
            if (isAdmin) return renderAdminDashboard();
            if (isOwner) return renderOwnerDashboard();
            return renderViewerDashboard();
          })()
        )}
      </ScrollView>

      {/* Sidebar Drawer Modal */}
      <Modal
        visible={drawerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setDrawerVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          {/* Drawer Content Area */}
          <View style={[styles.drawerContainer, { backgroundColor: colors.sidebarBg }]}>
            {/* Drawer Brand Header */}
            <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.logoRow}>
                <View style={styles.logoBadge}>
                  <Radio size={18} color="#0059AB" />
                </View>
                <Text style={[styles.drawerBrandText, { color: colors.text }]}>ASTRATech IoT</Text>
              </View>
            </View>

            {/* Profile Section */}
            <View style={[styles.drawerProfileBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.drawerAvatar}>
                {user?.foto ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${user.foto}` }}
                    style={styles.drawerAvatarImage}
                  />
                ) : (
                  <User size={20} color="#fff" />
                )}
              </View>
              <View style={styles.drawerProfileInfo}>
                <Text style={[styles.drawerProfileName, { color: colors.text }]}>{user?.nickname || user?.username || "Admin ASTRATech"}</Text>
                <View style={styles.drawerStatusRow}>
                  <View style={styles.drawerStatusDot} />
                  <Text style={[styles.drawerStatusText, { color: colors.textMuted }]}>Online</Text>
                </View>
              </View>
            </View>

            {/* Menu List */}
            <ScrollView contentContainerStyle={styles.drawerMenuScroll}>
              <Text style={[styles.drawerSectionHeader, { color: colors.textMuted }]}>{t("menu_admin")}</Text>

              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerVisible(false);
                  navigation.navigate("UsersList");
                }}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: colors.background }]}>
                  <User size={18} color="#0059AB" />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t("kelola_pengguna")}</Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerVisible(false);
                  navigation.navigate("Report");
                }}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: colors.background }]}>
                  <FileText size={18} color="#0059AB" />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t("laporan")}</Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerVisible(false);
                  navigation.navigate("SystemSettings");
                }}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: colors.background }]}>
                  <Settings size={18} color="#0059AB" />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t("pengaturan_sistem")}</Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  setDrawerVisible(false);
                  setAboutModalVisible(true);
                }}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: colors.background }]}>
                  <Info size={18} color="#0059AB" />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t("tentang")}</Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <Text style={[styles.drawerSectionHeader, { marginTop: 24, color: colors.textMuted }]}>{t("lainnya")}</Text>

              <TouchableOpacity
                style={styles.drawerLogoutItem}
                onPress={() => {
                  setDrawerVisible(false);
                  setLogoutPopupVisible(true);
                }}
              >
                <View style={styles.menuLogoutIconContainer}>
                  <LogOut size={18} color="#ef4444" />
                </View>
                <Text style={styles.menuLogoutItemText}>{t("logout_btn")}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Transparent Backdrop to close drawer */}
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setDrawerVisible(false)}
          />
        </View>
      </Modal>

      {/* Tentang Modal (Figma Style) */}
      <Modal
        visible={aboutModalVisible}
        animationType="slide"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <SafeAreaView style={[styles.aboutModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.aboutNavbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setAboutModalVisible(false)}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.navTitle, { color: colors.text }]}>Tentang</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.aboutContent}>
            <Card style={[styles.aboutBrandCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.aboutLogoText, { color: colors.text }]}>ASTRATech IoT</Text>
              <Text style={[styles.aboutDescText, { color: colors.textMuted }]}>
                Aplikasi monitoring perangkat IoT untuk memantau sensor dan mengendalikan perangkat secara real-time.
              </Text>
            </Card>

            <Text style={[styles.aboutSectionTitle, { color: colors.text }]}>Informasi Aplikasi</Text>
            <Card style={[styles.aboutInfoCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.aboutInfoRow}>
                <View style={styles.aboutRowLabelBox}>
                  <Info size={16} color="#0059AB" />
                  <Text style={[styles.aboutRowLabel, { color: colors.text }]}>Versi Aplikasi</Text>
                </View>
                <Text style={[styles.aboutRowValue, { color: colors.textMuted }]}>1.0.0</Text>
              </View>
              <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />

              <View style={styles.aboutInfoRow}>
                <View style={styles.aboutRowLabelBox}>
                  <User size={16} color="#0059AB" />
                  <Text style={[styles.aboutRowLabel, { color: colors.text }]}>Developer</Text>
                </View>
                <Text style={[styles.aboutRowValue, { color: colors.textMuted }]}>Kelompok 6 & 7</Text>
              </View>
              <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />

              <View style={styles.aboutInfoRow}>
                <View style={styles.aboutRowLabelBox}>
                  <Smartphone size={16} color="#0059AB" />
                  <Text style={[styles.aboutRowLabel, { color: colors.text }]}>Platform</Text>
                </View>
                <Text style={[styles.aboutRowValue, { color: colors.textMuted }]}>Android</Text>
              </View>
              <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />

              <View style={styles.aboutInfoRow}>
                <View style={styles.aboutRowLabelBox}>
                  <Zap size={16} color="#0059AB" />
                  <Text style={[styles.aboutRowLabel, { color: colors.text }]}>Database</Text>
                </View>
                <Text style={[styles.aboutRowValue, { color: colors.textMuted }]}>SQL Server</Text>
              </View>
              <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />

              <View style={styles.aboutInfoRow}>
                <View style={styles.aboutRowLabelBox}>
                  <Activity size={16} color="#0059AB" />
                  <Text style={[styles.aboutRowLabel, { color: colors.text }]}>Communication</Text>
                </View>
                <Text style={[styles.aboutRowValue, { color: colors.textMuted }]}>MQTT</Text>
              </View>
            </Card>

            <View style={styles.aboutFooterBox}>
              <Text style={[styles.aboutFooterText, { color: colors.textMuted }]}>© 2026 AstraTech IoT</Text>
              <Text style={[styles.aboutFooterSubText, { color: colors.textMuted }]}>Semua hak dilindungi.</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <NotificationPopup
        visible={logoutPopupVisible}
        title={t("logout")}
        message={t("logout_confirm")}
        type="warning"
        confirmText={t("logout_btn")}
        cancelText={t("batal")}
        onClose={() => setLogoutPopupVisible(false)}
        onConfirm={() => {
          setLogoutPopupVisible(false);
          logout();
          navigation.replace("Login");
        }}
      />
    </View>
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
  menuBtn: {
    padding: 8,
  },
  navbarCenter: {
    flex: 1,
    alignItems: "center",
  },
  navTitleCenter: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0059AB",
    letterSpacing: 0.5,
  },
  bellBtn: {
    padding: 8,
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  scrollContent: {
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: "#e0f2fe",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  welcomeTextSection: {
    flex: 1.2,
  },
  welcomeGreeting: {
    fontSize: 13,
    color: "#0369a1",
    fontWeight: "600",
  },
  welcomeUser: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginVertical: 2,
  },
  roleBadgeBox: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#0284c7",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginVertical: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0284c7",
  },
  welcomeDate: {
    fontSize: 10,
    color: "#0369a1",
    fontWeight: "500",
    marginTop: 4,
  },
  welcomeImage: {
    flex: 0.8,
    height: 100,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 85,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#64748b",
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  gridContainer: {
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    minHeight: 75,
    justifyContent: "space-between",
  },
  metricCardActive: {
    borderColor: "#0059AB",
    backgroundColor: "#f0f9ff",
  },
  metricCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 4,
  },
  chartCard: {
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  chartTabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  chartTabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 6,
  },
  chartTabBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartTabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  chartTabLabelActive: {
    color: "#ffffff",
  },
  chartVisual: {
    marginVertical: 4,
    alignSelf: "center",
  },
  chartLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 8,
    gap: 4,
  },
  chartLinkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0059AB",
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
  listCard: {
    padding: 12,
    marginBottom: 16,
  },
  listItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  listItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  listItemSub: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
  },
  statusRowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyActivityBox: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyActivityText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  timelineMessage: {
    fontSize: 11,
    color: "#0f172a",
    fontWeight: "500",
    marginTop: 2,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },

  // =================== SIDEBAR DRAWER STYLES ===================
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: "75%",
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: 45,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#0059AB",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerBrandText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0059AB",
    letterSpacing: 0.5,
  },
  drawerProfileBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0f2fe",
  },
  drawerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0059AB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  drawerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  drawerProfileInfo: {
    flex: 1,
  },
  drawerProfileName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  drawerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  drawerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  drawerStatusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#10b981",
  },
  drawerMenuScroll: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  drawerSectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  drawerMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  drawerLogoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  menuLogoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuLogoutItemText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ef4444",
  },

  // =================== TENTANG MODAL STYLES ===================
  aboutModalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  aboutNavbar: {
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
  aboutContent: {
    padding: 16,
  },
  aboutBrandCard: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginBottom: 20,
  },
  aboutLogoText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0059AB",
    marginBottom: 10,
  },
  aboutDescText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
  },
  aboutSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
    paddingLeft: 4,
  },
  aboutInfoCard: {
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  aboutInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  aboutRowLabelBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aboutRowLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
  },
  aboutRowValue: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "800",
  },
  aboutDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 16,
  },
  aboutFooterBox: {
    alignItems: "center",
    marginVertical: 16,
  },
  aboutFooterText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
  },
  aboutFooterSubText: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "600",
  },
});
