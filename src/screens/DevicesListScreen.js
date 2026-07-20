import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import Input from "../components/Input";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Camera,
  MapPin,
  Thermometer,
  Zap,
  Droplet,
  Lightbulb,
  Cpu,
  SlidersHorizontal,
} from "lucide-react-native";

export default function DevicesListScreen({ route, navigation, isTab = false }) {
  const { user, colors, theme, showToast, t } = useUser();
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Top Tab filter: Semua, Online, Offline
  const [statusTab, setStatusTab] = useState("Semua"); // Semua, Online, Offline

  // Search
  const [search, setSearch] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Semua");

  // Add Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName] = useState("");
  const [formId, setFormId] = useState("");
  const [formMac, setFormMac] = useState("");
  const [formCategory, setFormCategory] = useState("Sensor"); // Sensor, Aktuator, Meter
  const [formComm, setFormComm] = useState("WiFi"); // WiFi, Bluetooth, LoRa
  const [formTopic, setFormTopic] = useState("");
  const [formLocationId, setFormLocationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.selectedRole?.roleId === "ROL001";

  // Check if routed with scan parameters
  useEffect(() => {
    if (route?.params?.scannedCode) {
      const code = route.params.scannedCode;
      setModalVisible(true);
      if (code.includes(":") && code.length >= 12) {
        setFormMac(code);
      } else {
        setFormId(code);
      }
      navigation.setParams({ scannedCode: undefined });
    }
  }, [route?.params?.scannedCode]);

  const loadDevicesAndLocations = async () => {
    setIsLoading(true);
    const devResponse = await iotService.getDashboardLatest();
    const locResponse = await iotService.getLocations();
    setIsLoading(false);

    if (!devResponse.error && Array.isArray(devResponse)) {
      setDevices(devResponse);
    }
    if (!locResponse.error && Array.isArray(locResponse)) {
      setLocations(locResponse);
      if (locResponse.length > 0 && !formLocationId) {
        setFormLocationId(String(locResponse[0].id));
      }
    }
  };

  useEffect(() => {
    loadDevicesAndLocations();
  }, []);

  const handleOpenAdd = () => {
    if (!isAdmin) {
      Alert.alert("Akses Ditolak", "Hanya Administrator yang memiliki akses untuk menambahkan perangkat.");
      return;
    }
    setModalVisible(true);
  };

  const handleAddDevice = async () => {
    if (!formName || !formId || !formLocationId) {
      Alert.alert("Perhatian", "Nama Device, Device ID, dan Lokasi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    // Map UI "Jenis Device" category to backend categories (Lampu, AC, Listrik, Debit Air)
    let backendCategory = "Temperatur & Kelembaban";
    if (formCategory === "Aktuator") {
      backendCategory = formName.toLowerCase().includes("ac") ? "AC" : "Lampu";
    } else if (formCategory === "Meter") {
      backendCategory = formName.toLowerCase().includes("air") ? "Debit Air" : "Listrik";
    }

    const response = await iotService.createDevice(
      formId,
      formMac || "00:00:00:00:00:00",
      formName,
      backendCategory,
      null, // Limit min
      null, // Limit max
      formLocationId
    );
    setIsSubmitting(false);

    if (response.error) {
      showToast(response.message || "Gagal menambahkan perangkat baru.", "error");
    } else {
      showToast("Perangkat baru berhasil ditambahkan!", "success");
      setModalVisible(false);
      setFormName("");
      setFormId("");
      setFormMac("");
      setFormTopic("");
      loadDevicesAndLocations();
    }
  };

  const handleScanQR = () => {
    setModalVisible(false);
    navigation.navigate("Scan", { returnScreen: "Home" });
  };

  const handleDeleteDevice = async (id) => {
    Alert.alert(
      "Hapus Perangkat",
      "Apakah Anda yakin ingin menghapus perangkat ini? Semua data telemetri dan notifikasi terkait akan ikut terhapus.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const response = await iotService.deleteDevice(id);
            if (response.error) {
              Alert.alert("Gagal", response.message || "Gagal menghapus perangkat.");
            } else {
              showToast("Perangkat berhasil dihapus.", "success");
              setDevices(devices.filter((d) => d.id !== id));
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (id, currentIsActive) => {
    const newIsActive = !currentIsActive;
    // Optimistic update
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: newIsActive } : d))
    );
    const response = await iotService.toggleDeviceActive(id, newIsActive);
    if (response.error) {
      // Rollback jika gagal
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isActive: currentIsActive } : d))
      );
      showToast(response.message || "Gagal mengubah status perangkat.", "error");
    } else {
      showToast(
        newIsActive ? "Perangkat berhasil diaktifkan." : "Perangkat dinonaktifkan.",
        newIsActive ? "success" : "info"
      );
    }
  };

  // Filter devices based on Search input, Online/Offline tab, and selectedCategoryFilter
  const matchesCategory = (dev) => {
    if (selectedCategoryFilter === "Semua") return true;
    const cat = dev.category || "";
    const name = dev.name || "";
    if (selectedCategoryFilter === "Lampu") return cat === "Lampu" || name.toLowerCase().includes("lamp");
    if (selectedCategoryFilter === "AC") return cat === "AC" || name.toLowerCase().includes("ac");
    if (selectedCategoryFilter === "Listrik") return cat === "Listrik" || name.toLowerCase().includes("listrik");
    if (selectedCategoryFilter === "Debit Air") return cat === "Debit Air" || name.toLowerCase().includes("air");
    if (selectedCategoryFilter === "Temperatur & Kelembaban") {
      return cat === "Temperatur & Kelembaban" || cat.toLowerCase().includes("temp") || cat.toLowerCase().includes("suhu");
    }
    return true;
  };

  const getFilteredDevices = () => {
    return devices.filter((dev) => {
      const nameMatch = dev.name?.toLowerCase().includes(search.toLowerCase());
      const isOnline = dev.isActive !== false;

      if (statusTab === "Online" && !isOnline) return false;
      if (statusTab === "Offline" && isOnline) return false;
      if (!matchesCategory(dev)) return false;

      return nameMatch;
    });
  };

  const filteredDevices = getFilteredDevices();
  const countAll = devices.length;
  const countOnline = devices.filter((d) => d.isActive !== false).length;
  const countOffline = countAll - countOnline;

  const renderCategoryIcon = (category, name) => {
    const catLower = category?.toLowerCase() || "";
    const nameLower = name?.toLowerCase() || "";

    if (catLower.includes("lamp") || nameLower.includes("lamp")) {
      return <Lightbulb size={24} color="#eab308" />;
    }
    if (catLower.includes("ac") || nameLower.includes("ac")) {
      return <Cpu size={24} color="#0059AB" />;
    }
    if (catLower.includes("air") || nameLower.includes("air") || catLower.includes("debit")) {
      return <Droplet size={24} color="#10b981" />;
    }
    if (catLower.includes("listrik") || nameLower.includes("listrik") || catLower.includes("pwr")) {
      return <Zap size={24} color="#0284c7" />;
    }
    return <Thermometer size={24} color="#3b82f6" />;
  };

  // Get current value display on the right
  const getValueDisplay = (dev) => {
    const cat = dev.category || "";
    const name = dev.name || "";
    if (cat === "Lampu" || name.toLowerCase().includes("lamp")) {
      return dev.status || "OFF";
    }
    if (cat === "AC" || name.toLowerCase().includes("ac")) {
      return dev.status === "ON" ? "ON" : "OFF";
    }
    // Cek Debit Air DULU sebelum Listrik agar kata "meter" tidak salah tangkap
    if (cat === "Debit Air" || name.toLowerCase().includes("debit") || (name.toLowerCase().includes("air") && !name.toLowerCase().includes("pair"))) {
      if (dev.limitMin != null && !Number.isNaN(Number(dev.limitMin))) {
        return `${Number(dev.limitMin).toFixed(2)} m³`;
      }
      return "— m³";
    }
    if (cat === "Listrik" || name.toLowerCase().includes("listrik") || name.toLowerCase().includes("pwr")) {
      if (dev.limitMin != null && !Number.isNaN(Number(dev.limitMin))) {
        return `${(Number(dev.limitMin) / 1000).toFixed(2)} kWh`;
      }
      return "— kWh";
    }
    // Temperatur & Kelembaban
    if (dev.limitMin != null && !Number.isNaN(Number(dev.limitMin))) {
      return `${Number(dev.limitMin).toFixed(1)}°C`;
    }
    return "—";
  };

  const renderDeviceRow = ({ item }) => {
    const isActive = item.isActive !== false; // default true
    const isOnline = isActive;
    
    let cardBgColor;
    if (isActive) {
      cardBgColor = colors.cardBackground;
    } else {
      cardBgColor = theme === "Dark Mode" ? "#1e293b" : "#f1f5f9";
    }

    return (
      <Card
        style={[
          styles.deviceRowCard,
          { backgroundColor: cardBgColor },
          !isActive && styles.deviceRowCardInactive,
        ]}
      >
        <TouchableOpacity
          style={[styles.deviceClickArea, !isActive && { opacity: 0.45 }]}
          onPress={() => {
            if (!isActive) return;
            const cat = item.category || "";
            const name = item.name?.toLowerCase() || "";

            if (cat === "Lampu" || name.includes("lamp")) {
              navigation.navigate("LampControl");
            } else if (cat === "Debit Air" || name.includes("debit") || (name.includes("air") && !name.includes("pair"))) {
              navigation.navigate("WaterMeterDetail", {
                deviceId: item.id,
                deviceName: item.name,
                deviceLocation: [item.ruangan, item.gedung].filter(Boolean).join(" — "),
              });
            } else if (cat === "Listrik" || name.includes("listrik") || name.includes("power meter") || name.includes("pwr")) {
              navigation.navigate("PowerMeterDetail", {
                deviceId: item.id,
                deviceName: item.name,
                deviceLocation: [item.ruangan, item.gedung].filter(Boolean).join(" — "),
              });
            } else if (cat === "AC" || name.includes("ac")) {
              navigation.navigate("AcControl");
            } else {
              // Fallback untuk Temperatur & Kelembaban dan sensor/device lainnya
              navigation.navigate("SensorDetail", {
                deviceId: item.id,
                deviceName: item.name,
                deviceLocation: [item.ruangan, item.gedung].filter(Boolean).join(" — "),
              });
            }
          }}
        >
          {/* Icon Box */}
          <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
            {renderCategoryIcon(item.category, item.name)}
          </View>

          {/* Info */}
          <View style={styles.deviceDetails}>
            <Text style={[styles.deviceNameText, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.deviceLocText, { color: colors.textMuted }]}>{item.ruangan || "Lobby Utama"}</Text>
            <View style={styles.statusDotRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? "#10b981" : "#ef4444" }]} />
              <Text style={[styles.statusText, { color: isOnline ? "#10b981" : "#ef4444" }]}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Value + Controls on right */}
        <View style={styles.rightStateColumn}>
          {/* Baris atas: nilai + tombol hapus */}
          <View style={styles.topRightRow}>
            {isActive && (
              <Text style={[styles.valueText, { color: colors.text }]}>{getValueDisplay(item)}</Text>
            )}
            {isAdmin && isActive && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteDevice(item.id)}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Baris bawah: toggle switch */}
          {isAdmin && (
            <Switch
              value={isActive}
              onValueChange={() => handleToggleActive(item.id, isActive)}
              trackColor={{ false: "#ef4444", true: "#10b981" }}
              thumbColor="#ffffff"
              style={styles.toggleSwitch}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isTab && { paddingTop: 0 }, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        {!isTab && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("perangkat")}</Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ padding: 8 }}>
          <SlidersHorizontal size={20} color={selectedCategoryFilter !== "Semua" ? "#0059AB" : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.segmentTabBar, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        {[
          { label: "Semua", count: countAll, val: "Semua" },
          { label: "Online", count: countOnline, val: "Online" },
          { label: "Offline", count: countOffline, val: "Offline" },
        ].map((tab) => {
          const active = statusTab === tab.val;
          return (
            <TouchableOpacity
              key={tab.val}
              style={[styles.segmentTabItem, active && [styles.segmentTabItemActive, { borderBottomColor: "#0059AB" }]]}
              onPress={() => setStatusTab(tab.val)}
            >
              <Text style={[styles.segmentTabLabel, active ? styles.segmentTabLabelActive : { color: colors.textMuted }]}>
                {tab.val === "Semua" ? t("semua") : tab.val}({tab.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchBarInput, { color: colors.text }]}
          placeholder={t("cari_perangkat")}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceRow}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Search size={40} color="#0059AB" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("tidak_ada_perangkat")}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {t("tidak_ada_perangkat_desc")}
              </Text>
              {isAdmin && (
                <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAdd}>
                  <Text style={styles.emptyAddBtnText}>{t("tambah_perangkat_btn")}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Add Button for Admin */}
      {isAdmin && filteredDevices.length > 0 && (
        <TouchableOpacity style={styles.floatingAddBtn} onPress={handleOpenAdd}>
          <Plus size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.floatingAddBtnText}>{t("tambah_perangkat")}</Text>
        </TouchableOpacity>
      )}

      {/* Add Device Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setModalVisible(false)}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.navTitle, { color: colors.text }]}>{t("tambah_perangkat")}</Text>
            <TouchableOpacity style={styles.scanBtn} onPress={handleScanQR}>
              <Camera size={22} color={colors.primary || "#0059AB"} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Input
              label={t("nama_device")}
              placeholder="Contoh: ESP32-Ruang Lab"
              value={formName}
              onChangeText={setFormName}
              editable={!isSubmitting}
            />

            <Input
              label={t("device_id")}
              placeholder="Contoh: ESP32-LAB-01"
              value={formId}
              onChangeText={setFormId}
              editable={!isSubmitting}
            />

            <Input
              label={t("mac_address")}
              placeholder="Contoh: 00:1A:2B:3C:4D:5E"
              value={formMac}
              onChangeText={setFormMac}
              editable={!isSubmitting}
            />

            {/* Type selector */}
            <Text style={[styles.formLabel, { color: colors.text }]}>{t("jenis_device")}</Text>
            <View style={styles.pillSelector}>
              {["Sensor", "Aktuator", "Meter"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pillItem,
                    formCategory === type ? styles.pillItemActive : [styles.pillItemInactive, { backgroundColor: colors.cardBackground, borderColor: colors.border }],
                  ]}
                  onPress={() => setFormCategory(type)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.pillText, { color: formCategory === type ? "#fff" : colors.text }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Comm Method selector */}
            <Text style={[styles.formLabel, { color: colors.text }]}>{t("metode_komunikasi")}</Text>
            <View style={styles.pillSelector}>
              {["WiFi", "Bluetooth", "LoRa"].map((comm) => (
                <TouchableOpacity
                  key={comm}
                  style={[
                    styles.pillItem,
                    formComm === comm ? styles.pillItemActive : [styles.pillItemInactive, { backgroundColor: colors.cardBackground, borderColor: colors.border }],
                  ]}
                  onPress={() => setFormComm(comm)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.pillText, { color: formComm === comm ? "#fff" : colors.text }]}>
                    {comm}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label={t("mqtt_topic")}
              placeholder="Contoh: astratech/lab/temp01"
              value={formTopic}
              onChangeText={setFormTopic}
              editable={!isSubmitting}
            />

            {/* Location selector */}
            <Text style={[styles.formLabel, { color: colors.text }]}>{t("lokasi_pemasangan")}</Text>
            <View style={styles.locationSelectorList}>
              {locations.map((loc) => {
                const isSelected = formLocationId === String(loc.id);
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.locItemBadge,
                      isSelected ? styles.locItemBadgeActive : [styles.locItemBadgeInactive, { backgroundColor: colors.cardBackground, borderColor: colors.border }],
                    ]}
                    onPress={() => setFormLocationId(String(loc.id))}
                    disabled={isSubmitting}
                  >
                    <MapPin size={14} color={isSelected ? "#fff" : colors.textMuted} />
                    <Text style={[styles.locItemBadgeText, isSelected ? styles.locItemBadgeTextActive : { color: colors.text }]}>
                      {loc.ruangan} ({loc.gedung})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t("batal")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddDevice} disabled={isSubmitting}>
                <Text style={styles.modalSaveText}>{t("simpan")}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Custom Category Filter picker Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogBox, { backgroundColor: colors.cardBackground }]}>
            {/* Header Icon */}
            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
              <SlidersHorizontal size={32} color="#0059AB" />
            </View>

            {/* Title */}
            <Text style={[styles.dialogTitle, { color: colors.text, textAlign: "center", marginBottom: 8 }]}>{t("filter_kategori")}</Text>

            {/* Message */}
            <Text style={[styles.dialogMessage, { color: colors.textMuted }]}>
              {t("pilih_kategori")}
            </Text>

            {/* Options list */}
            {["Semua", "Lampu", "AC", "Listrik", "Debit Air", "Temperatur & Kelembaban"].map((catOption) => {
              const isSelected = selectedCategoryFilter === catOption;
              const transCatLabel = catOption === "Semua" ? t("semua") : catOption;
              return (
                <TouchableOpacity
                  key={catOption}
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
                    setSelectedCategoryFilter(catOption);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionRowText, { color: isSelected ? "#0059AB" : colors.text }]}>{transCatLabel}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelBtnTextBox, { marginTop: 16 }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>{t("batal")}</Text>
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
  segmentTabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 8,
  },
  segmentTabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  segmentTabItemActive: {
    borderBottomColor: "#0059AB",
  },
  segmentTabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  segmentTabLabelActive: {
    color: "#0059AB",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
    paddingVertical: 0,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 85,
  },
  deviceRowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  deviceClickArea: {
    flexDirection: "row",
    flex: 1.2,
    alignItems: "center",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceNameText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  deviceLocText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  statusDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
  },
  rightStateColumn: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 52,
  },
  topRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  deleteBtn: {
    padding: 2,
  },
  switchRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  toggleSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  deviceRowCardInactive: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
  },
  floatingAddBtn: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "#0059AB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  floatingAddBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 18,
    fontWeight: "500",
  },
  emptyAddBtn: {
    backgroundColor: "#0059AB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyAddBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scanBtn: {
    padding: 8,
  },
  modalScrollContent: {
    padding: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
    marginTop: 10,
  },
  pillSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  pillItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  pillItemActive: {
    backgroundColor: "#0059AB",
    borderColor: "#0059AB",
  },
  pillItemInactive: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  pillTextActive: {
    color: "#fff",
  },
  locationSelectorList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  locItemBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  locItemBadgeActive: {
    backgroundColor: "#0059AB",
    borderColor: "#0059AB",
  },
  locItemBadgeInactive: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
  },
  locItemBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  locItemBadgeTextActive: {
    color: "#fff",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  modalSaveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#0059AB",
    alignItems: "center",
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "800",
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
