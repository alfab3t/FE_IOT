import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";

// Import Tab Screens
import DeviceDashboardScreen from "./DeviceDashboardScreen";
import DevicesListScreen from "./DevicesListScreen";
import AggregateDashboardScreen from "./AggregateDashboardScreen";
import NotificationsScreen from "./NotificationsScreen";
import ProfileScreen from "./ProfileScreen";

// Import Icons
import { LayoutDashboard, Smartphone, Activity, Bell, User } from "lucide-react-native";

export default function HomeScreen({ navigation }) {
  const { colors, t } = useUser();
  const [activeTab, setActiveTab] = useState(0); // 0: Beranda, 1: Perangkat, 2: Monitoring, 3: Notifikasi, 4: Profil
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnreadNotifs = async () => {
    const response = await iotService.getNotifications();
    if (!response.error && Array.isArray(response)) {
      const unread = response.some((n) => n.status !== "Read");
      setHasUnread(unread);
    }
  };

  useEffect(() => {
    checkUnreadNotifs();
    const interval = setInterval(checkUnreadNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 0:
        return <DeviceDashboardScreen navigation={navigation} setActiveTab={setActiveTab} />;
      case 1:
        return <DevicesListScreen navigation={navigation} isTab={true} />;
      case 2:
        return <AggregateDashboardScreen navigation={navigation} isTab={true} route={{ params: { category: "Suhu" } }} />;
      case 3:
        return <NotificationsScreen navigation={navigation} />;
      case 4:
        return <ProfileScreen navigation={navigation} />;
      default:
        return <DeviceDashboardScreen navigation={navigation} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Screen Area */}
      <View style={[styles.screenArea, { backgroundColor: colors.background }]}>{renderActiveScreen()}</View>

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.navbarBg, borderTopColor: colors.border }]}>
        {/* Tab 0: Beranda */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab(0)}
          activeOpacity={0.8}
        >
          <LayoutDashboard size={22} color={activeTab === 0 ? "#0059AB" : colors.textMuted} />
          <Text style={[styles.tabLabel, { color: activeTab === 0 ? "#0059AB" : colors.textMuted }]}>
            {t("beranda")}
          </Text>
        </TouchableOpacity>

        {/* Tab 1: Perangkat */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab(1)}
          activeOpacity={0.8}
        >
          <Smartphone size={22} color={activeTab === 1 ? "#0059AB" : colors.textMuted} />
          <Text style={[styles.tabLabel, { color: activeTab === 1 ? "#0059AB" : colors.textMuted }]}>
            {t("perangkat")}
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Monitoring */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab(2)}
          activeOpacity={0.8}
        >
          <Activity size={22} color={activeTab === 2 ? "#0059AB" : colors.textMuted} />
          <Text style={[styles.tabLabel, { color: activeTab === 2 ? "#0059AB" : colors.textMuted }]}>
            {t("monitoring")}
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Notifikasi */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab(3);
            setHasUnread(false);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Bell size={22} color={activeTab === 3 ? "#0059AB" : colors.textMuted} />
            {hasUnread && <View style={styles.badgeDot} />}
          </View>
          <Text style={[styles.tabLabel, { color: activeTab === 3 ? "#0059AB" : colors.textMuted }]}>
            {t("notifikasi")}
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Profil */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab(4)}
          activeOpacity={0.8}
        >
          <User size={22} color={activeTab === 4 ? "#0059AB" : colors.textMuted} />
          <Text style={[styles.tabLabel, { color: activeTab === 4 ? "#0059AB" : colors.textMuted }]}>
            {t("profil")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  screenArea: {
    flex: 1,
  },
  tabBar: {
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 6,
  },
  iconContainer: {
    position: "relative",
  },
  badgeDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    marginTop: 4,
  },
  tabLabelActive: {
    color: "#0059AB",
  },
});
