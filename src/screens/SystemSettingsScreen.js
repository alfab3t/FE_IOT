import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import Card from "../components/Card";
import NotificationPopup from "../components/NotificationPopup";
import {
  ArrowLeft,
  Bell,
  RefreshCw,
  Globe,
  Sun,
  Info,
  Database,
  ChevronDown,
} from "lucide-react-native";

export default function SystemSettingsScreen({ navigation }) {
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");

  const triggerPopup = (title, message, type = "info") => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupVisible(true);
  };
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    refreshInterval,
    setRefreshInterval,
    language,
    setLanguage,
    theme,
    setTheme,
    t,
    colors,
  } = useUser();

  const [isBackingUp, setIsBackingUp] = useState(false);

  // Dropdown Picker Modals
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(""); // refresh, language, theme
  const [pickerOptions, setPickerOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState("");

  const openPicker = (type, options, current) => {
    setPickerType(type);
    setPickerOptions(options);
    setSelectedValue(current);
    setPickerVisible(true);
  };

  const handleRefreshSelect = (option) => {
    setRefreshInterval(option);
    const displayTime = language === "English" ? option.replace("detik", "seconds") : option;
    triggerPopup(
      language === "English" ? "Refresh Interval" : "Interval Refresh",
      language === "English"
        ? `Refresh interval successfully updated to ${displayTime}!`
        : `Interval refresh berhasil diatur ke ${displayTime}!`,
      "success"
    );
  };

  const handleLanguageSelect = (option) => {
    setLanguage(option);
    triggerPopup(
      option === "English" ? "App Language" : "Bahasa Aplikasi",
      option === "English"
        ? "Language successfully changed to English!"
        : "Bahasa aplikasi berhasil diubah ke Indonesia!",
      "success"
    );
  };

  const handleThemeSelect = (option) => {
    setTheme(option);
    if (option === "Dark Mode") {
      triggerPopup(
        language === "English" ? "Dark Theme" : "Tema Gelap",
        language === "English" ? "Dark Theme successfully enabled!" : "Tema Gelap berhasil diaktifkan!",
        "success"
      );
    } else {
      triggerPopup(
        language === "English" ? "Light Theme" : "Tema Terang",
        language === "English" ? "Light Theme successfully enabled!" : "Tema Terang berhasil diaktifkan!",
        "success"
      );
    }
  };

  const handleSelectOption = (option) => {
    if (pickerType === "refresh") {
      handleRefreshSelect(option);
    } else if (pickerType === "language") {
      handleLanguageSelect(option);
    } else if (pickerType === "theme") {
      handleThemeSelect(option);
    }
    setPickerVisible(false);
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    // Simulate database backup process
    setTimeout(() => {
      setIsBackingUp(false);
      triggerPopup(
        language === "English" ? "Backup Successful" : "Backup Sukses",
        language === "English"
          ? "System database backup successfully created and saved locally (Backup_ASTRATech_IoT.bak)."
          : "Backup database sistem berhasil dibuat dan disimpan secara lokal (Backup_ASTRATech_IoT.bak).",
        "success"
      );
    }, 2000);
  };

  let pickerTitleSuffix = "";
  if (pickerType === "refresh") {
    pickerTitleSuffix = t("refresh_interval");
  } else if (pickerType === "language") {
    pickerTitleSuffix = t("bahasa");
  } else if (pickerType === "theme") {
    pickerTitleSuffix = t("tema");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("pengaturan_sistem")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Notifikasi */}
        <Card style={[styles.settingsRowCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.leftInfoBlock}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
              <Bell size={20} color="#0059AB" />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.rowTitleText, { color: colors.text }]}>{t("notifikasi")}</Text>
              <Text style={[styles.rowDescText, { color: colors.textMuted }]}>{t("notifikasi_desc")}</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#cbd5e1", true: "#0059AB" }}
            thumbColor={notificationsEnabled ? "#fff" : "#f1f5f9"}
          />
        </Card>

        {/* 2. Interval Refresh */}
        <Card style={[styles.settingsRowCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.leftInfoBlock}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
              <RefreshCw size={20} color="#0059AB" />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.rowTitleText, { color: colors.text }]}>{t("refresh_interval")}</Text>
              <Text style={[styles.rowDescText, { color: colors.textMuted }]}>{t("refresh_desc")}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.dropdownSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => openPicker("refresh", ["5 detik", "10 detik", "30 detik", "60 detik"], refreshInterval)}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>
              {language === "English"
                ? refreshInterval.replace("detik", "seconds")
                : refreshInterval}
            </Text>
            <ChevronDown size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* 3. Bahasa */}
        <Card style={[styles.settingsRowCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.leftInfoBlock}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
              <Globe size={20} color="#0059AB" />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.rowTitleText, { color: colors.text }]}>{t("bahasa")}</Text>
              <Text style={[styles.rowDescText, { color: colors.textMuted }]}>{t("bahasa_desc")}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.dropdownSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => openPicker("language", ["Indonesia", "English"], language)}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>{language}</Text>
            <ChevronDown size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* 4. Tema Aplikasi */}
        <Card style={[styles.settingsRowCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.leftInfoBlock}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
              <Sun size={20} color="#0059AB" />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.rowTitleText, { color: colors.text }]}>{t("tema")}</Text>
              <Text style={[styles.rowDescText, { color: colors.textMuted }]}>{t("tema_desc")}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.dropdownSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => openPicker("theme", ["Light Mode", "Dark Mode"], theme)}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>{theme}</Text>
            <ChevronDown size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* 5. Informasi Aplikasi */}
        <Card style={[styles.settingsRowCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.leftInfoBlock}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
              <Info size={20} color="#0059AB" />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.rowTitleText, { color: colors.text }]}>{t("info_app")}</Text>
              <Text style={[styles.rowDescText, { color: colors.textMuted }]}>{t("info_desc")}</Text>
            </View>
          </View>
          <Text style={[styles.versionValueText, { color: colors.text }]}>1.0.0</Text>
        </Card>

        {/* 6. Backup Database */}
        <Card style={[styles.settingsRowCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.leftInfoBlock}>
            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
              <Database size={20} color="#0059AB" />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.rowTitleText, { color: colors.text }]}>{t("backup_db")}</Text>
              <Text style={[styles.rowDescText, { color: colors.textMuted }]}>{t("backup_desc")}</Text>
            </View>
          </View>
          {isBackingUp ? (
            <ActivityIndicator size="small" color="#0059AB" style={{ paddingRight: 20 }} />
          ) : (
            <TouchableOpacity style={[styles.backupBtnOutline, { borderColor: "#0059AB", backgroundColor: colors.background }]} onPress={handleBackup}>
              <Text style={styles.backupBtnText}>{t("backup_btn")}</Text>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>

      {/* Picker Selection Dialog Modal */}
      <Modal
        visible={pickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerDialogBox, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.pickerDialogTitle, { color: colors.text }]}>
              {t("pilih")} {pickerTitleSuffix}
            </Text>

            {pickerOptions.map((opt) => {
              let displayLabel = opt;
              if (language === "English") {
                if (opt === "5 detik") displayLabel = "5 seconds";
                else if (opt === "10 detik") displayLabel = "10 seconds";
                else if (opt === "30 detik") displayLabel = "30 seconds";
                else if (opt === "60 detik") displayLabel = "60 seconds";
              }
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionRow, selectedValue === opt && { backgroundColor: colors.background }]}
                  onPress={() => handleSelectOption(opt)}
                >
                  <Text style={[styles.optionLabelText, selectedValue === opt ? { color: "#0059AB" } : { color: colors.textMuted }]}>
                    {displayLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.background }]} onPress={() => setPickerVisible(false)}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>{t("batal")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <NotificationPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        onClose={() => setPopupVisible(false)}
      />
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
    gap: 12,
  },
  settingsRowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    minHeight: 70,
  },
  leftInfoBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1.2,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
  },
  rowTitleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },
  rowDescText: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
    lineHeight: 12,
  },
  dropdownSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  versionValueText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563eb",
    paddingRight: 10,
  },
  backupBtnOutline: {
    borderWidth: 1,
    borderColor: "#0059AB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  backupBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0059AB",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerDialogBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  pickerDialogTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 12,
  },
});
