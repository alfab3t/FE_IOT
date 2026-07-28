import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import * as Device from "expo-device";

// Import Tab Screens
import DeviceDashboardScreen from "./DeviceDashboardScreen";
import DevicesListScreen from "./DevicesListScreen";
import AggregateDashboardScreen from "./AggregateDashboardScreen";
import NotificationsScreen from "./NotificationsScreen";
import ProfileScreen from "./ProfileScreen";

// Import Icons
import { LayoutDashboard, Smartphone, Activity, Bell, User } from "lucide-react-native";

// Import Expo Notifications
let Notifications = null;
let isExpoGo = false;
try {
  const Constants = require("expo-constants").default;
  isExpoGo = Constants.appOwnership === "expo";
} catch (e) {
  // Safe fallback if Constants is not available
}

try {
  Notifications = require("expo-notifications");
  // Configure foreground notification presentation options
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.log("Failed to load expo-notifications:", e);
}

export default function HomeScreen({ navigation }) {
  const { colors, t } = useUser();
  const [activeTab, setActiveTab] = useState(0); // 0: Beranda, 1: Perangkat, 2: Monitoring, 3: Notifikasi, 4: Profil
  const [unreadCount, setUnreadCount] = useState(0);
  const maxNotifIdRef = useRef(0);

  const checkUnreadNotifs = async () => {
    try {
      const response = await iotService.getNotifications();
      if (!response.error && Array.isArray(response)) {
        const unreadList = response.filter((n) => n.status !== "Read");
        setUnreadCount(unreadList.length);

        // Cari ID notifikasi terbesar dari semua notifikasi yang diambil
        let currentMaxId = 0;
        response.forEach((n) => {
          if (n.id > currentMaxId) currentMaxId = n.id;
        });

        // Jika ada notifikasi baru dengan ID lebih tinggi, dan statusnya belum dibaca
        if (maxNotifIdRef.current > 0 && currentMaxId > maxNotifIdRef.current) {
          const newNotif = response.find((n) => n.id === currentMaxId);
          if (newNotif && newNotif.status !== "Read" && Notifications) {
            try {
              // Trigger local notification to show in system status bar
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Peringatan Sensor!",
                  body: newNotif.message,
                  sound: true,
                },
                trigger: null,
              });
            } catch (err) {
              console.log("Error scheduling local notification:", err);
            }
          }
        }

        if (currentMaxId > 0) {
          maxNotifIdRef.current = currentMaxId;
        }
      }
    } catch (e) {
      console.log("Error inside checkUnreadNotifs polling loop:", e);
    }
  };

  const registerForPushNotifications = async () => {
    if (!Notifications) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get notification permissions!");
        return;
      }

      // Set up notification channel for Android Oreo and above
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7A",
        });
      }

      if (isExpoGo) {
        console.log("Expo Go: push token registration skipped. Local notification fallback enabled.");
        return;
      }

      if (!Device.isDevice) {
        console.log("Push notifications require a physical device.");
        return;
      }

      // Retrieve Native Device Push Token (FCM token on Android, APNs token on iOS)
      const tokenData = await Notifications.getDevicePushTokenAsync();
      const token = tokenData.data;
      console.log("Device Push Token (FCM):", token);

      // Register the push token on the backend
      await iotService.registerPushToken(token);
    } catch (error) {
      console.log("Push token registration skipped:", error);
    }
  };

  useEffect(() => {
    registerForPushNotifications();
    checkUnreadNotifs();
    const interval = setInterval(checkUnreadNotifs, 10000);

    let notificationListener = null;
    let responseListener = null;

    if (Notifications) {
      // Listen to notifications received while the app is in the foreground
      notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        checkUnreadNotifs();
      });

      // Navigate to notifications tab when user taps on push notification popup
      responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        setActiveTab(3);
      });
    }

    return () => {
      clearInterval(interval);
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
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
        return <NotificationsScreen navigation={navigation} onNotificationsUpdated={checkUnreadNotifs} />;
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
            setUnreadCount(0);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Bell size={22} color={activeTab === 3 ? "#0059AB" : colors.textMuted} />
            {unreadCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
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
  badgeCount: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
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
