import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { iotService } from "../services/iotService";
import { useUser } from "../context/UserContext";
import Card from "../components/Card";
import {
  Bell,
  Home,
  FileText,
  CheckSquare,
  Square,
  Trash2,
  CheckCircle,
  Edit2,
} from "lucide-react-native";

export default function NotificationsScreen({ navigation }) {
  const { colors, theme, t, language, translateNotification } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tabs: 0: Alarm, 1: Home, 2: Bulletin
  const [activeTab, setActiveTab] = useState(1); // Default to Home
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const loadNotifications = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    const response = await iotService.getNotifications();
    if (showLoader) setIsLoading(false);
    setIsRefreshing(false);

    if (response.error) {
      Alert.alert("Gagal", response.message || "Gagal memuat notifikasi.");
      return;
    }

    setNotifications(response || []);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Filter logic based on category message matches
  useEffect(() => {
    const filtered = notifications.filter((notif) => {
      const msg = (notif.message || "").toLowerCase();
      let cat = 2; // Bulletin
      
      if (
        msg.includes("added") ||
        msg.includes("removed") ||
        msg.includes("deleted") ||
        msg.includes("reset") ||
        msg.includes("home")
      ) {
        cat = 1; // Home
      } else if (
        msg.includes("melampaui") ||
        msg.includes("warning") ||
        msg.includes("normal") ||
        msg.includes("alert") ||
        msg.includes("limit") ||
        msg.includes("suhu") ||
        msg.includes("kelembaban") ||
        msg.includes("watt")
      ) {
        cat = 0; // Alarm
      }

      return cat === activeTab;
    });

    setFilteredNotifications(filtered);
  }, [notifications, activeTab]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadNotifications(false);
  };

  const toggleItemSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allSelected = filteredNotifications.every((n) => selectedIds.has(n.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredNotifications.forEach((n) => {
        if (allSelected) {
          next.delete(n.id);
        } else {
          next.add(n.id);
        }
      });
      return next;
    });
  };

  const handleMarkAsRead = async () => {
    if (selectedIds.size === 0) return;
    
    const ids = Array.from(selectedIds);
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((notif) => (selectedIds.has(notif.id) ? { ...notif, status: "Read" } : notif))
    );
    setIsEditMode(false);
    setSelectedIds(new Set());

    const response = await iotService.markNotificationsReadBulk(ids);
    if (response.error) {
      Alert.alert("Gagal", "Gagal sinkronisasi baca ke server.");
      loadNotifications(false);
    }
  };

  const executeDelete = async (ids) => {
    setNotifications((prev) => prev.filter((notif) => !selectedIds.has(notif.id)));
    setIsEditMode(false);
    setSelectedIds(new Set());

    const response = await iotService.deleteNotificationsBulk(ids);
    if (response.error) {
      Alert.alert("Gagal", "Gagal menghapus dari server.");
      loadNotifications(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    Alert.alert(
      "Hapus Notifikasi",
      `Apakah Anda yakin ingin menghapus ${selectedIds.size} notifikasi terpilih?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => executeDelete(ids),
        },
      ]
    );
  };

  const getNotificationTitle = (msg = "") => {
    const lower = msg.toLowerCase();
    const isId = language === "Indonesia";
    if (lower.includes("added")) return isId ? "Perangkat Ditambahkan" : "Device Added";
    if (lower.includes("deleted home") || lower.includes("removed home")) return isId ? "Home Dihapus" : "Home Deleted";
    if (lower.includes("removed")) return isId ? "Perangkat Dicabut" : "Device Removed";
    if (lower.includes("warning") || lower.includes("melampaui")) return isId ? "Peringatan Sensor" : "Sensor Warning";
    return isId ? "Pemberitahuan" : "Notification";
  };

  const getIconConfig = (msg = "") => {
    const lower = msg.toLowerCase();
    if (lower.includes("deleted home") || lower.includes("removed home")) {
      return { icon: Home, bg: "#ffedd5", fill: "#f97316" };
    }
    if (lower.includes("warning") || lower.includes("melampaui")) {
      return { icon: Bell, bg: "#fee2e2", fill: "#ef4444" };
    }
    return { icon: FileText, bg: "#dcfce7", fill: "#22c55e" };
  };

  const handleItemPress = (item) => {
    if (isEditMode) {
      toggleItemSelection(item.id);
    } else {
      // Optimistically mark as Read in local UI
      if (item.status !== "Read") {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === item.id ? { ...notif, status: "Read" } : notif))
        );
      }
      navigation.navigate("NotificationDetail", { notification: item });
    }
  };

  const renderNotifItem = ({ item }) => {
    const isUnread = item.status !== "Read";
    const isSelected = selectedIds.has(item.id);
    const time = item.triggeredDate ? item.triggeredDate.substring(11, 16) : "00:00";
    const iconConfig = getIconConfig(item.message);
    const Icon = iconConfig.icon;
    const readBg = theme === "Dark Mode" ? "#0b0f19" : "#cbd5e1";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleItemPress(item)}
      >
        <Card style={[
          styles.notifCard,
          { backgroundColor: colors.cardBackground },
          !isUnread && {
            backgroundColor: readBg,
            shadowOpacity: 0,
            elevation: 0,
            opacity: 0.55,
          }
        ]}>
          {isEditMode && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => toggleItemSelection(item.id)}
            >
              {isSelected ? (
                <CheckSquare size={20} color="#0059AB" />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          )}

          <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
            <Icon size={20} color={iconConfig.fill} />
          </View>

          <View style={styles.contentBox}>
            <View style={styles.notifHeader}>
              <Text style={[styles.notifTitle, { color: colors.text }]}>{getNotificationTitle(item.message)}</Text>
              <Text style={[styles.notifTime, { color: colors.textMuted }]}>{time}</Text>
            </View>
            <Text style={[styles.notifMessage, { color: colors.textMuted }]} numberOfLines={2}>
              {translateNotification(item.message)}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const allSelected = filteredNotifications.length > 0 && filteredNotifications.every((n) => selectedIds.has(n.id));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        {isEditMode ? (
          <TouchableOpacity style={styles.navActionTextBtn} onPress={handleSelectAll}>
            <Text style={styles.navActionText}>{allSelected ? "Batal Semua" : "Pilih Semua"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}

        <Text style={[styles.navTitle, { color: colors.text }]}>{isEditMode ? `${selectedIds.size} Terpilih` : "Notifikasi"}</Text>

        {isEditMode ? (
          <TouchableOpacity style={styles.navActionTextBtn} onPress={() => setIsEditMode(false)}>
            <Text style={[styles.navActionText, { color: colors.text }]}>Selesai</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditMode(true)}>
            <Edit2 size={20} color="#0059AB" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs Header */}
      {!isEditMode && (
        <View style={[styles.tabsHeader, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
          {[
            { id: 0, label: "Alarm", icon: Bell },
            { id: 1, label: "Home", icon: Home },
            { id: 2, label: "Bulletin", icon: FileText },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, isActive ? [styles.tabItemActive, { backgroundColor: colors.background, borderColor: "#0059AB" }] : { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => setActiveTab(tab.id)}
              >
                <TabIcon size={16} color={isActive ? "#0059AB" : colors.textMuted} />
                <Text style={[styles.tabText, isActive ? styles.tabTextActive : { color: colors.textMuted }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotifItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#0059AB"]} />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Tidak ada notifikasi dalam kategori ini</Text>
          }
        />
      )}

      {/* Edit Mode Bottom Panel */}
      {isEditMode && (
        <View style={[styles.bottomPanel, { backgroundColor: colors.navbarBg, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.panelBtn, selectedIds.size === 0 && styles.panelBtnDisabled]}
            disabled={selectedIds.size === 0}
            onPress={handleMarkAsRead}
          >
            <CheckCircle size={18} color={selectedIds.size === 0 ? "#adb5bd" : "#10b981"} />
            <Text style={[styles.panelBtnText, selectedIds.size === 0 && styles.panelBtnTextDisabled, { color: "#10b981" }]}>
              Sudah Dibaca
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.panelBtn, selectedIds.size === 0 && styles.panelBtnDisabled]}
            disabled={selectedIds.size === 0}
            onPress={handleDeleteSelected}
          >
            <Trash2 size={18} color={selectedIds.size === 0 ? "#adb5bd" : "#ef4444"} />
            <Text style={[styles.panelBtnText, selectedIds.size === 0 && styles.panelBtnTextDisabled, { color: "#ef4444" }]}>
              Hapus
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  navbar: {
    height: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
  },
  navActionTextBtn: {
    paddingVertical: 8,
  },
  navActionText: {
    fontSize: 14,
    color: "#0059AB",
    fontWeight: "700",
  },
  editBtn: {
    padding: 8,
  },
  tabsHeader: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: "#e0f2fe",
    borderColor: "#0059AB",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
  },
  tabTextActive: {
    color: "#0059AB",
  },
  listContent: {
    padding: 16,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  notifCardRead: {
    backgroundColor: "#f1f5f9",
    shadowOpacity: 0,
    elevation: 0,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contentBox: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  notifTime: {
    fontSize: 11,
    color: "#6c757d",
    fontWeight: "600",
  },
  notifMessage: {
    fontSize: 12,
    color: "#495057",
    lineHeight: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 40,
    fontWeight: "600",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomPanel: {
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  panelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  panelBtnDisabled: {
    opacity: 0.5,
  },
  panelBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  panelBtnTextDisabled: {
    color: "#adb5bd",
  },
});
