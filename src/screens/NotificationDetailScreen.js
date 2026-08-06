import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import {
  ArrowLeft,
  Clock,
  Bell,
  Home,
  Calendar,
  CheckCircle,
} from "lucide-react-native";

export default function NotificationDetailScreen({ route, navigation }) {
  const { notification } = route.params;
  const { colors, translateNotification, t, language } = useUser();

  const time = notification.triggeredDate
    ? notification.triggeredDate.substring(11, 16)
    : "00:00";
  const date = notification.triggeredDate
    ? notification.triggeredDate.substring(0, 10).split("-").reverse().join("/")
    : "-";

  // Mark notification as read when viewing the detail page
  useEffect(() => {
    if (notification.status !== "Read") {
      iotService.markNotificationRead(notification.id).then((res) => {
        if (res?.error) {
          console.log("Gagal menandai telah dibaca di server:", res.message);
        }
      });
    }
  }, [notification]);

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

  const title = getNotificationTitle(notification.message);
  const iconConfig = getIconConfig(notification.message);
  const IconComponent = iconConfig.icon;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>
          {language === "Indonesia" ? "Detail Notifikasi" : "Notification Detail"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.detailCard, { backgroundColor: colors.cardBackground }]}>
          {/* Badge Icon Header */}
          <View style={styles.headerRow}>
            <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
              <IconComponent size={28} color={iconConfig.fill} />
            </View>
            <View style={styles.titleBox}>
              <Text style={[styles.titleText, { color: colors.text }]}>{title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Calendar size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{time} WIB</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Description Content */}
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            {language === "Indonesia" ? "Pesan" : "Message"}
          </Text>
          <Text style={[styles.messageContent, { color: colors.text }]}>
            {translateNotification(notification.message)}
          </Text>

          {/* Additional details */}
          <View style={[styles.detailItemRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
              {language === "Indonesia" ? "Kategori" : "Category"}
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {notification.alertType || "Info"}
            </Text>
          </View>
          <View style={[styles.detailItemRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{t("status")}</Text>
            <View style={styles.statusRowBadge}>
              <CheckCircle size={14} color="#10b981" style={{ marginRight: 4 }} />
              <Text style={[styles.detailValue, { color: "#10b981", fontWeight: "700" }]}>
                {language === "Indonesia" ? "Telah Dibaca" : "Read"}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  deleteBtn: {
    padding: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 16,
  },
  detailCard: {
    padding: 20,
    borderRadius: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  titleBox: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  detailItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusRowBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
});
