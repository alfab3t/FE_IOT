import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  PanResponder,
  Alert,
} from "react-native";
import { iotService } from "../services/iotService";
import { useUser } from "../context/UserContext";
import Card from "../components/Card";
import NotificationPopup from "../components/NotificationPopup";
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

function SwipeableNotifItem({
  item,
  isUnread,
  isEditMode,
  isSelected,
  onPress,
  onSingleDelete,
  toggleItemSelection,
  getIconConfig,
  getNotificationTitle,
  translateNotification,
  colors,
  theme,
}) {
  const { language } = useUser();
  const pan = useRef(new Animated.ValueXY()).current;
  const [isOpen, setIsOpen] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          pan.setValue({ x: Math.max(-85, gestureState.dx), y: 0 });
        } else if (isOpen && gestureState.dx > 0) {
          pan.setValue({ x: Math.min(0, -85 + gestureState.dx), y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35) {
          Animated.spring(pan, {
            toValue: { x: -85, y: 0 },
            useNativeDriver: false,
          }).start();
          setIsOpen(true);
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
          setIsOpen(false);
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
    setIsOpen(false);
  };

  const time = item.triggeredDate ? item.triggeredDate.substring(11, 16) : "00:00";
  const iconConfig = getIconConfig(item.message);
  const Icon = iconConfig.icon;
  const readBg = theme === "Dark Mode" ? "#0b0f19" : "#cbd5e1";

  const deleteOpacity = pan.x.interpolate({
    inputRange: [-85, -15, 0],
    outputRange: [1, 0, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.swipeRowContainer}>
      <Animated.View style={[styles.deleteActionBox, { opacity: deleteOpacity }]}>
        <TouchableOpacity
          style={styles.deleteActionInner}
          activeOpacity={0.85}
          onPress={() => {
            closeSwipe();
            onSingleDelete(item.id);
          }}
        >
          <Trash2 size={22} color="#ffffff" />
          <Text style={styles.deleteActionText}>
            {language === "Indonesia" ? "Hapus" : "Delete"}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[{ transform: [{ translateX: pan.x }] }]}
        {...(!isEditMode ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (isOpen) {
              closeSwipe();
            } else {
              onPress(item);
            }
          }}
        >
          <Card
            style={[
              styles.notifCard,
              { backgroundColor: colors.cardBackground },
              !isUnread && {
                backgroundColor: readBg,
                shadowOpacity: 0,
                elevation: 0,
                opacity: 0.55,
              },
            ]}
          >
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
                <Text style={[styles.notifTitle, { color: colors.text }]}>
                  {getNotificationTitle(item.message)}
                </Text>
                <Text style={[styles.notifTime, { color: colors.textMuted }]}>{time}</Text>
              </View>
              <Text style={[styles.notifMessage, { color: colors.textMuted }]} numberOfLines={2}>
                {translateNotification(item.message)}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { colors, theme, language, translateNotification, t } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filter category state: "Semua", "Telah Dibaca", "Belum Dibaca"
  const [filterCategory, setFilterCategory] = useState("Semua");

  const getFilterPillBg = (isActive) => {
    if (isActive) return "#0059AB";
    return theme === "Dark Mode" ? "#1e293b" : "#f1f5f9";
  };

  const loadNotifications = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    const response = await iotService.getNotifications();
    if (showLoader) setIsLoading(false);
    setIsRefreshing(false);

    if (response.error) {
      Alert.alert(
        language === "Indonesia" ? "Gagal" : "Failed",
        response.message || (language === "Indonesia" ? "Gagal memuat notifikasi." : "Failed to load notifications.")
      );
      return;
    }

    setNotifications(response || []);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    let result = notifications;
    if (filterCategory === "Telah Dibaca") {
      result = notifications.filter((n) => n.status === "Read" || n.status === "Dibaca");
    } else if (filterCategory === "Belum Dibaca") {
      result = notifications.filter((n) => n.status !== "Read" && n.status !== "Dibaca");
    }
    setFilteredNotifications(result);
  }, [notifications, filterCategory]);

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
    setNotifications((prev) =>
      prev.map((notif) => (selectedIds.has(notif.id) ? { ...notif, status: "Read" } : notif))
    );
    setIsEditMode(false);
    setSelectedIds(new Set());

    const response = await iotService.markNotificationsReadBulk(ids);
    if (response.error) {
      Alert.alert(
        language === "Indonesia" ? "Gagal" : "Failed",
        language === "Indonesia" ? "Gagal sinkronisasi baca ke server." : "Failed to sync read status to server."
      );
      loadNotifications(false);
    }
  };

  // Custom Popup States
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");
  const [showCancel, setShowCancel] = useState(false);
  const [popupConfirmText, setPopupConfirmText] = useState("OK");
  const [popupCancelText, setPopupCancelText] = useState("Batal");
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const executeDelete = async (ids) => {
    setNotifications((prev) => prev.filter((notif) => !ids.includes(notif.id)));
    setIsEditMode(false);
    setSelectedIds(new Set());

    const response = await iotService.deleteNotificationsBulk(ids);
    if (response.error) {
      setPopupTitle(language === "Indonesia" ? "Gagal" : "Failed");
      setPopupMessage(language === "Indonesia" ? "Gagal menghapus dari server." : "Failed to delete from server.");
      setPopupType("error");
      setShowCancel(false);
      setPopupConfirmText("OK");
      setOnConfirmAction(() => () => setPopupVisible(false));
      setPopupVisible(true);
      loadNotifications(false);
    }
  };

  const handleSingleDelete = (id) => {
    const isId = language === "Indonesia";
    setPopupTitle(isId ? "Hapus Notifikasi" : "Delete Notification");
    setPopupMessage(
      isId
        ? "Apakah Anda yakin ingin menghapus notifikasi ini?"
        : "Are you sure you want to delete this notification?"
    );
    setPopupType("question");
    setShowCancel(true);
    setPopupConfirmText(isId ? "HAPUS" : "DELETE");
    setPopupCancelText(isId ? "BATAL" : "CANCEL");

    const doDelete = () => {
      setPopupVisible(false);
      executeDelete([id]);
    };

    setOnConfirmAction(() => doDelete);
    setPopupVisible(true);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const isId = language === "Indonesia";

    setPopupTitle(isId ? "Hapus Notifikasi" : "Delete Notifications");
    setPopupMessage(
      isId
        ? `Apakah Anda yakin ingin menghapus ${ids.length} notifikasi terpilih?`
        : `Are you sure you want to delete ${ids.length} selected notifications?`
    );
    setPopupType("question");
    setShowCancel(true);
    setPopupConfirmText(isId ? "HAPUS" : "DELETE");
    setPopupCancelText(isId ? "BATAL" : "CANCEL");

    const doDelete = () => {
      setPopupVisible(false);
      executeDelete(ids);
    };

    setOnConfirmAction(() => doDelete);
    setPopupVisible(true);
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

    return (
      <SwipeableNotifItem
        item={item}
        isUnread={isUnread}
        isEditMode={isEditMode}
        isSelected={isSelected}
        onPress={handleItemPress}
        onSingleDelete={handleSingleDelete}
        toggleItemSelection={toggleItemSelection}
        getIconConfig={getIconConfig}
        getNotificationTitle={getNotificationTitle}
        translateNotification={translateNotification}
        colors={colors}
        theme={theme}
      />
    );
  };

  const allSelected = filteredNotifications.length > 0 && filteredNotifications.every((n) => selectedIds.has(n.id));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        {isEditMode ? (
          <TouchableOpacity style={styles.navActionTextBtn} onPress={handleSelectAll}>
            <Text style={styles.navActionText}>{allSelected ? (language === "Indonesia" ? "Batal Semua" : "Deselect All") : (language === "Indonesia" ? "Pilih Semua" : "Select All")}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}

        <Text style={[styles.navTitle, { color: colors.text }]}>{isEditMode ? `${selectedIds.size} ${language === "Indonesia" ? "Terpilih" : "Selected"}` : t("notifikasi")}</Text>

        {isEditMode ? (
          <TouchableOpacity style={styles.navActionTextBtn} onPress={() => setIsEditMode(false)}>
            <Text style={[styles.navActionText, { color: colors.text }]}>{language === "Indonesia" ? "Selesai" : "Done"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditMode(true)}>
            <CheckSquare size={20} color="#0059AB" />
          </TouchableOpacity>
        )}
      </View>

      {/* 3 Kategori Filter Notifikasi */}
      <View style={[styles.filterBar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        {["Semua", "Telah Dibaca", "Belum Dibaca"].map((cat) => {
          const isActive = filterCategory === cat;
          const labelText = cat === "Semua" ? (language === "Indonesia" ? "Semua" : "All") : cat === "Telah Dibaca" ? (language === "Indonesia" ? "Telah Dibaca" : "Read") : (language === "Indonesia" ? "Belum Dibaca" : "Unread");
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterPill,
                {
                  backgroundColor: getFilterPillBg(isActive),
                  borderColor: isActive ? "#0059AB" : colors.border,
                },
              ]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text style={[styles.filterPillText, { color: isActive ? "#ffffff" : colors.textMuted }]}>
                {labelText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{language === "Indonesia" ? "Tidak ada notifikasi dalam kategori ini" : "No notifications in this category"}</Text>
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
              {language === "Indonesia" ? "Sudah Dibaca" : "Mark as Read"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.panelBtn, selectedIds.size === 0 && styles.panelBtnDisabled]}
            disabled={selectedIds.size === 0}
            onPress={handleDeleteSelected}
          >
            <Trash2 size={18} color={selectedIds.size === 0 ? "#adb5bd" : "#ef4444"} />
            <Text style={[styles.panelBtnText, selectedIds.size === 0 && styles.panelBtnTextDisabled, { color: "#ef4444" }]}>
              {language === "Indonesia" ? "Hapus" : "Delete"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <NotificationPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        showCancel={showCancel}
        confirmText={popupConfirmText}
        cancelText={popupCancelText}
        onConfirm={onConfirmAction}
        onClose={() => setPopupVisible(false)}
      />
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
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
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
  swipeRowContainer: {
    position: "relative",
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  deleteActionBox: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    zIndex: 0,
  },
  deleteActionInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  deleteActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
});
