import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  TextInput,
  Switch,
  Platform,
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
  Edit2,
  MapPin,
  Thermometer,
  Zap,
  Droplet,
  Lightbulb,
  Cpu,
  SlidersHorizontal,
  HelpCircle,
  CheckCircle,
  Check,
  ChevronRight,
  AlertCircle,
} from "lucide-react-native";

const formatLocationHistoryText = (text, language) => {
  if (!text || typeof text !== "string") return text || "-";
  if (language === "Indonesia") return text;
  return text
    .replace(/\bSekarang\b/gi, "Present")
    .replace(/\bLokasi Terbaru\b/gi, "Latest Location")
    .replace(/\bTerbaru\b/gi, "Latest")
    .replace(/\bHari Ini\b/gi, "Today")
    .replace(/\bMinggu Ini\b/gi, "This Week")
    .replace(/\bBulan Ini\b/gi, "This Month")
    .replace(/\bDari\b/gi, "From")
    .replace(/\bKe\b/gi, "To")
    .replace(/\bs\/d\b/gi, "-")
    .replace(/\bsd\b/gi, "-")
    .replace(/\bsampai\b/gi, "to")

    // Specific Dashboard Device Titles & Rooms
    .replace(/\bAC Ruang Lab\b/gi, "Lab Room AC")
    .replace(/\bLampu Ruang Lab\b/gi, "Lab Room Lamp")
    .replace(/\bPower Meter Gedung B\b/gi, "Building B Power Meter")
    .replace(/\bPower Meter Gedung C\b/gi, "Building C Power Meter")
    .replace(/\bPower Meter Gedung D\b/gi, "Building D Power Meter")
    .replace(/\bPower Meter Gedung\b/gi, "Building Power Meter")
    .replace(/\bWater Meter Gedung C\b/gi, "Building C Water Meter")
    .replace(/\bWater Meter Gedung\b/gi, "Building Water Meter")
    .replace(/\bRuang Dosen PSI\b/gi, "PSI Lecturer Room")
    .replace(/\bRuang Lab\b/gi, "Lab Room")

    // General Category Filters & Devices
    .replace(/\bTemperatur & Kelembaban\b/gi, "Temperature & Humidity")
    .replace(/\bTemperatur & Kelembapan\b/gi, "Temperature & Humidity")
    .replace(/\bSensor Suhu & Kelembaban\b/gi, "Temperature & Humidity Sensor")
    .replace(/\bSensor Suhu dan Kelembaban\b/gi, "Temperature & Humidity Sensor")
    .replace(/\bSensor Suhu & Kelembapan\b/gi, "Temperature & Humidity Sensor")
    .replace(/\bSensor Suhu\b/gi, "Temperature Sensor")
    .replace(/\bSensor Kelembaban\b/gi, "Humidity Sensor")
    .replace(/\bSensor Kelembapan\b/gi, "Humidity Sensor")
    .replace(/\bPower Meter\b/gi, "Power Meter")
    .replace(/\bWater Meter\b/gi, "Water Meter")
    .replace(/\bMeteran Air\b/gi, "Water Meter")
    .replace(/\bMeteran Listrik\b/gi, "Power Meter")
    .replace(/\bKontrol AC\b/gi, "AC Control")
    .replace(/\bKontrol Lampu\b/gi, "Lamp Control")
    .replace(/\bLampu Utama\b/gi, "Main Lamp")
    .replace(/\bLampu\b/gi, "Lamp")
    .replace(/\bListrik\b/gi, "Power / Electricity")
    .replace(/\bSemua Perangkat\b/gi, "All Devices")
    .replace(/\bSemua Kategori\b/gi, "All Categories")
    .replace(/\bSemua\b/gi, "All")
    .replace(/\bPerangkat Aktif\b/gi, "Active Devices")
    .replace(/\bPerangkat Tidak Aktif\b/gi, "Inactive Devices")

    // Labs & Rooms
    .replace(/\bLab IoT\b/gi, "IoT Lab")
    .replace(/\bLab Kontrol\b/gi, "Control Lab")
    .replace(/\bLab Otomotif\b/gi, "Automotive Lab")
    .replace(/\bLab Pemrograman\b/gi, "Programming Lab")
    .replace(/\bLab AI\b/gi, "AI Lab")
    .replace(/\bLab Mekatronika\b/gi, "Mechatronics Lab")
    .replace(/\bLab Komputer\b/gi, "Computer Lab")
    .replace(/\bLab Otomasi\b/gi, "Automation Lab")
    .replace(/\bLab Robotika\b/gi, "Robotics Lab")
    .replace(/\bLab Elektronika\b/gi, "Electronics Lab")
    .replace(/\bLab Jaringan\b/gi, "Network Lab")
    .replace(/\bLab Telekomunikasi\b/gi, "Telecommunication Lab")
    .replace(/\bLab Manufaktur\b/gi, "Manufacturing Lab")
    .replace(/\bLab Multimedia\b/gi, "Multimedia Lab")
    .replace(/\bLab Basis Data\b/gi, "Database Lab")
    .replace(/\bLab Bahasa\b/gi, "Language Lab")
    .replace(/\bLaboratorium\b/gi, "Laboratory")
    .replace(/\bRuang Dosen\b/gi, "Lecturer Room")
    .replace(/\bRuang Dekan\b/gi, "Dean Room")
    .replace(/\bRuang Kaprodi\b/gi, "Department Head Room")
    .replace(/\bRuang Rapat Utama\b/gi, "Main Meeting Room")
    .replace(/\bRuang Rapat\b/gi, "Meeting Room")
    .replace(/\bRuang Server\b/gi, "Server Room")
    .replace(/\bRuang Kontrol\b/gi, "Control Room")
    .replace(/\bRuang Direktur\b/gi, "Director Room")
    .replace(/\bRuang Staf\b/gi, "Staff Room")
    .replace(/\bRuang Kuliah\b/gi, "Lecture Room")
    .replace(/\bRuang Kelas\b/gi, "Classroom")
    .replace(/\bRuangan\b/gi, "Room")
    .replace(/\bRuang\b/gi, "Room")
    .replace(/\bGedung A\b/gi, "Building A")
    .replace(/\bGedung B\b/gi, "Building B")
    .replace(/\bGedung C\b/gi, "Building C")
    .replace(/\bGedung D\b/gi, "Building D")
    .replace(/\bGedung E\b/gi, "Building E")
    .replace(/\bGedung Utama\b/gi, "Main Building")
    .replace(/\bGedung\b/gi, "Building")
    .replace(/\bLantai\b/gi, "Floor")
    .replace(/\bSenin\b/gi, "Monday")
    .replace(/\bSelasa\b/gi, "Tuesday")
    .replace(/\bRabu\b/gi, "Wednesday")
    .replace(/\bKamis\b/gi, "Thursday")
    .replace(/\bJum'at\b/gi, "Friday")
    .replace(/\bJumat\b/gi, "Friday")
    .replace(/\bSabtu\b/gi, "Saturday")
    .replace(/\bMinggu\b/gi, "Sunday")
    .replace(/\bJanuari\b/gi, "January")
    .replace(/\bFebruari\b/gi, "February")
    .replace(/\bMaret\b/gi, "March")
    .replace(/\bMei\b/gi, "May")
    .replace(/\bJuni\b/gi, "June")
    .replace(/\bJuli\b/gi, "July")
    .replace(/\bAgustus\b/gi, "August")
    .replace(/\bAgt\b/gi, "Aug")
    .replace(/\bAgu\b/gi, "Aug")
    .replace(/\bSeptember\b/gi, "September")
    .replace(/\bSept?\b/gi, "Sep")
    .replace(/\bOktober\b/gi, "October")
    .replace(/\bOkt\b/gi, "Oct")
    .replace(/\bNovember\b/gi, "November")
    .replace(/\bNov\b/gi, "Nov")
    .replace(/\bDesember\b/gi, "December")
    .replace(/\bDes\b/gi, "Dec");
};

export default function DevicesListScreen({ route, navigation, isTab = false }) {
  const { user, colors, theme, showToast, t, language } = useUser();
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Top Tab filter: Semua, Online, Offline
  const [statusTab, setStatusTab] = useState("Semua");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Semua");

  // Multi-step Add Form Wizard State (Step 1: Kategori, Step 2: Nama, Step 3: Lokasi)
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1);

  const [formCategory, setFormCategory] = useState("Lampu"); // Lampu, AC, Listrik, Debit Air
  const [formName, setFormName] = useState("");
  const [formNameError, setFormNameError] = useState("");
  const [formId, setFormId] = useState("");
  const [formMac, setFormMac] = useState("");
  const [formLocationId, setFormLocationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Device Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [editFormName, setEditFormName] = useState("");
  const [editFormNameError, setEditFormNameError] = useState("");
  const [editFormLocationId, setEditFormLocationId] = useState("");

  // Delete Device Confirmation Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

  // Success Confirmation Modal State
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState("");

  // Role Permissions
  const selectedRoleName = user?.selectedRole?.roleName || "Viewer";
  const isAdmin = user?.selectedRole?.roleId === "ROL001" || user?.selectedRole?.roleId === "ROL01" || selectedRoleName.toLowerCase().includes("admin");
  const canCrud = isAdmin; // Hanya Admin yang bisa Tambah, Edit, Hapus Perangkat! Controller hanya bisa ON/OFF & Remot AC.

  // Check if routed with scan parameters
  useEffect(() => {
    if (route?.params?.scannedCode) {
      const code = route.params.scannedCode;
      handleOpenAdd();
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
    try {
      const devResponse = await iotService.getDevices();
      const locResponse = await iotService.getLocations();

      if (!devResponse?.error) {
        const list = Array.isArray(devResponse)
          ? devResponse
          : (devResponse.data || devResponse.Data || []);
        setDevices(list);
      }
      if (!locResponse?.error) {
        const locList = Array.isArray(locResponse)
          ? locResponse
          : (locResponse.data || locResponse.Data || []);
        setLocations(locList);
        if (locList.length > 0 && !formLocationId) {
          setFormLocationId(String(locList[0].id));
        }
      }
    } catch (error) {
      console.error("loadDevicesAndLocations error:", error);
      showToast("Gagal memuat data dari server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDevicesAndLocations();
    }, [])
  );

  // Switch wizard steps instantly without flickering
  const animateNextStep = (nextStep) => {
    setStep(nextStep);
  };

  const resetAddForm = () => {
    setStep(1);
    setFormCategory("Lampu");
    setFormName("");
    setFormNameError("");
    setFormId("");
    setFormMac("");
    if (locations.length > 0) {
      setFormLocationId(String(locations[0].id));
    }
  };

  const handleOpenAdd = () => {
    if (!canCrud) {
      showToast("Anda tidak memiliki hak akses untuk menambahkan perangkat.", "error");
      return;
    }
    resetAddForm();
    setModalVisible(true);
  };

  const handleAddDevice = async () => {
    if (!formName.trim() || !formLocationId) {
      showToast("Nama Perangkat dan Lokasi Pemasangan wajib diisi.", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      let generatedId = formId.trim();
      if (!generatedId) {
        if (formCategory === "AC") generatedId = "DEV_AC01";
        else if (formCategory === "Listrik") generatedId = "DEV_PWR01";
        else if (formCategory === "Debit Air" || formCategory.includes("Air")) generatedId = "DEV_WAT01";
        else generatedId = "DEV_LAMP01";
      }

      const macAddress = formMac.trim() || Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join(":").toUpperCase(); // NOSONAR

      const response = await iotService.createDevice(
        generatedId,
        macAddress,
        formName.trim(),
        formCategory,
        null,
        null,
        formLocationId
      );

      if (response?.error) {
        showToast(response.message || "Gagal menambahkan perangkat baru.", "error");
      } else {
        setModalVisible(false);
        resetAddForm();
        await loadDevicesAndLocations();
        setSuccessModalMessage(language === "Indonesia" ? "Perangkat baru berhasil ditambahkan!" : "New device added successfully!");
        setSuccessModalVisible(true);
      }
    } catch (err) {
      console.error("Create device error:", err);
      showToast("Terjadi kesalahan saat menambahkan perangkat.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (device) => {
    if (!canCrud) {
      showToast("Anda tidak memiliki hak akses untuk mengubah perangkat.", "error");
      return;
    }
    const devId = device?.id || device?.Id || device?.dev_id;
    const devName = device?.name || device?.Name || device?.dev_name || "";
    setEditDevice({ ...device, id: devId, name: devName });
    setEditFormName(devName);
    const targetLocId = device?.locationId || device?.LocationId || device?.loc_id;
    let matchingLoc = null;
    if (targetLocId) {
      matchingLoc = locations.find(
        (loc) => String(loc.id || loc.Id || loc.loc_id) === String(targetLocId)
      );
    }
    if (!matchingLoc) {
      const devRuangan = device?.ruangan || device?.loc_ruangan || "";
      const devGedung = device?.gedung || device?.loc_gedung || "";
      matchingLoc = locations.find(
        (loc) =>
          (loc.ruangan || loc.rua_nama || loc.loc_ruangan) === devRuangan &&
          (loc.gedung || loc.rua_gedung || loc.loc_gedung) === devGedung
      );
    }

    let defaultEditLocId = "";
    if (matchingLoc) {
      defaultEditLocId = String(matchingLoc.id || matchingLoc.Id || matchingLoc.loc_id);
    } else if (locations.length > 0) {
      defaultEditLocId = String(locations[0].id || locations[0].Id || locations[0].loc_id);
    }
    setEditFormLocationId(defaultEditLocId);
    setEditModalVisible(true);
  };

  const handleUpdateDevice = async () => {
    if (!editFormName.trim()) {
      setEditFormNameError("Nama Perangkat wajib diisi.");
      showToast("Nama Perangkat wajib diisi.", "error");
      return;
    }
    setEditFormNameError("");

    const targetId = editDevice?.id || editDevice?.Id || editDevice?.dev_id;
    if (!targetId) {
      showToast("ID Perangkat tidak ditemukan.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const category = editDevice?.category || editDevice?.Category || editDevice?.dev_category || "Lampu";
      const limitMin = editDevice?.limitMin ?? editDevice?.LimitMin ?? editDevice?.dev_limit_min;
      const limitMax = editDevice?.limitMax ?? editDevice?.LimitMax ?? editDevice?.dev_limit_max;

      const resUpdate = await iotService.updateDevice(
        targetId,
        editFormName.trim(),
        category,
        limitMin,
        limitMax
      );
      const resLoc = editFormLocationId ? await iotService.setDeviceLocation(targetId, Number(editFormLocationId)) : { error: false };

      const isUpdateError = resUpdate?.error === true || resUpdate?.status >= 400;
      const isLocError = resLoc?.error === true || resLoc?.status >= 400;

      if (isUpdateError || isLocError) {
        const errorMsg = isUpdateError ? resUpdate?.message : resLoc?.message;
        showToast(errorMsg || "Gagal memperbarui perangkat.", "error");
      } else {
        setEditModalVisible(false);
        await loadDevicesAndLocations();
        setSuccessModalMessage(language === "Indonesia" ? "Informasi perangkat berhasil diperbarui." : "Device information updated successfully.");
        setSuccessModalVisible(true);
      }
    } catch (err) {
      console.error("Update device error:", err);
      showToast("Terjadi kesalahan saat memperbarui perangkat.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDevice = (device) => {
    if (!canCrud) {
      showToast("Anda tidak memiliki hak akses untuk menghapus perangkat.", "error");
      return;
    }
    const devId = device?.id || device?.Id || device?.dev_id;
    setDeviceToDelete({ ...device, id: devId });
    setDeleteModalVisible(true);
  };

  const confirmDeleteDevice = async () => {
    const targetId = deviceToDelete?.id || deviceToDelete?.Id || deviceToDelete?.dev_id;
    if (!targetId) return;
    try {
      setIsSubmitting(true);
      const response = await iotService.deleteDevice(targetId);
      setDeleteModalVisible(false);

      if (response?.error) {
        showToast(response.message || "Gagal menghapus perangkat.", "error");
      } else {
        setDevices((prev) => prev.filter((d) => (d.id || d.Id || d.dev_id) !== targetId));
        setDeviceToDelete(null);
        setSuccessModalMessage(language === "Indonesia" ? "Perangkat berhasil dihapus." : "Device deleted successfully.");
        setSuccessModalVisible(true);
      }
    } catch (err) {
      console.error("Delete device error:", err);
      showToast("Terjadi kesalahan saat menghapus perangkat.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentIsActive) => {
    const safeId = id || "";
    const newIsActive = !currentIsActive;
    setDevices((prev) =>
      prev.map((d) => ((d.id || d.Id || d.dev_id) === safeId ? { ...d, isActive: newIsActive } : d))
    );
    const response = await iotService.toggleDeviceActive(safeId, newIsActive);
    if (response?.error) {
      setDevices((prev) =>
        prev.map((d) => ((d.id || d.Id || d.dev_id) === safeId ? { ...d, isActive: currentIsActive } : d))
      );
      showToast(response.message || (language === "Indonesia" ? "Gagal mengubah status perangkat." : "Failed to change device status."), "error");
    } else {
      showToast(
        newIsActive
          ? (language === "Indonesia" ? "Perangkat berhasil diaktifkan." : "Device activated successfully.")
          : (language === "Indonesia" ? "Perangkat dinonaktifkan." : "Device deactivated."),
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
    if (selectedCategoryFilter === "AC") return cat === "AC" || name.toLowerCase().includes("ac") || name.toLowerCase().includes("air conditioner");
    if (selectedCategoryFilter === "Listrik") return cat === "Listrik" || name.toLowerCase().includes("listrik");
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

  const countAll = devices.filter((dev) => {
    const nameMatch = dev.name?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory(dev) && nameMatch;
  }).length;

  const countOnline = devices.filter((dev) => {
    const nameMatch = dev.name?.toLowerCase().includes(search.toLowerCase());
    const isOnline = dev.isActive !== false;

    return isOnline && matchesCategory(dev) && nameMatch;
  }).length;

  const countOffline = devices.filter((dev) => {
    const nameMatch = dev.name?.toLowerCase().includes(search.toLowerCase());
    const isOnline = dev.isActive !== false;

    return !isOnline && matchesCategory(dev) && nameMatch;
  }).length;

  const renderCategoryIcon = (category, name) => {
    const catLower = category?.toLowerCase() || "";
    const nameLower = name?.toLowerCase() || "";

    if (catLower.includes("lamp") || nameLower.includes("lamp")) {
      return <Lightbulb size={24} color="#eab308" />;
    }
    if (catLower.includes("ac") || nameLower.includes("ac") || nameLower.includes("air conditioner")) {
      return <Cpu size={24} color="#0059AB" />;
    }
    if (catLower.includes("listrik") || nameLower.includes("listrik") || catLower.includes("pwr")) {
      return <Zap size={24} color="#0284c7" />;
    }
    return <Thermometer size={24} color="#3b82f6" />;
  };

  const getValueDisplay = (dev) => {
    const cat = dev.category || "";
    const name = dev.name || "";
    if (cat === "Lampu" || name.toLowerCase().includes("lamp")) {
      return "";
    }
    if (cat === "AC" || name.toLowerCase().includes("ac") || name.toLowerCase().includes("air conditioner")) {
      return "";
    }
    if (cat === "Listrik" || name.toLowerCase().includes("listrik") || name.toLowerCase().includes("pwr")) {
      return "";
    }
    if (dev.limitMin != null && !Number.isNaN(Number(dev.limitMin))) {
      return `${Number(dev.limitMin).toFixed(1)}°C`;
    }
    return "";
  };

  const renderDeviceRow = ({ item }) => {
    const isActive = item.isActive !== false;
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
          disabled={!isActive}
          onPress={() => {
            if (!isActive) return;
            const cat = item.category || "";
            const name = item.name?.toLowerCase() || "";

            if (cat === "Lampu" || name.includes("lamp")) {
              navigation.navigate("LampControl");
            } else if (cat === "AC" || name.includes("ac") || name.includes("air conditioner")) {
              navigation.navigate("AcControl", {
                deviceId: item.id,
                deviceName: item.name,
                deviceLocation: [item.ruangan || item.loc_ruangan, item.gedung || item.loc_gedung].filter(Boolean).join(" — "),
              });
            } else if (cat === "Listrik" || name.includes("listrik") || name.includes("power meter") || name.includes("pwr")) {
              navigation.navigate("PowerMeterDetail", {
                deviceId: item.id,
                deviceName: item.name,
                deviceLocation: [item.ruangan, item.gedung].filter(Boolean).join(" — "),
              });
            } else {
              navigation.navigate("SensorDetail", {
                deviceId: item.id,
                deviceName: item.name,
                deviceLocation: [item.ruangan, item.gedung].filter(Boolean).join(" — "),
              });
            }
          }}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
            {renderCategoryIcon(item.category, item.name)}
          </View>

          <View style={styles.deviceDetails}>
            <Text style={[styles.deviceNameText, { color: colors.text }]}>
              {formatLocationHistoryText(item.name || item.Name || item.dev_name, language)}
            </Text>
            <Text style={[styles.deviceLocText, { color: colors.textMuted }]}>
              {formatLocationHistoryText(
                [item.ruangan || item.loc_ruangan || item.Ruangan || "Lobby Utama", item.gedung || item.loc_gedung || item.Gedung].filter(Boolean).join(" — "),
                language
              )}
            </Text>
            <View style={styles.statusDotRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? "#10b981" : "#ef4444" }]} />
              <Text style={[styles.statusText, { color: isOnline ? "#10b981" : "#ef4444" }]}>
                {isOnline ? "ON" : "OFF"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.rightStateColumn}>
          <View style={styles.topRightRow}>
            {isActive && Boolean(getValueDisplay(item)) && (
              <Text style={[styles.valueText, { color: colors.text }]}>{getValueDisplay(item)}</Text>
            )}
            {canCrud && isActive && (
              <TouchableOpacity style={styles.actionIconButton} onPress={() => handleOpenEdit(item)}>
                <Edit2 size={16} color="#0059AB" />
              </TouchableOpacity>
            )}
            {canCrud && isActive && (
              <TouchableOpacity style={styles.actionIconButton} onPress={() => handleDeleteDevice(item)}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          {canCrud ? (
            <Switch
              value={isActive}
              onValueChange={() => handleToggleActive(item.id || item.Id || item.dev_id, isActive)}
              trackColor={{ false: "#ef4444", true: "#10b981" }}
              thumbColor="#ffffff"
              style={styles.toggleSwitch}
            />
          ) : null}
        </View>
      </Card>
    );
  };

  const getCategoryIcon = (cat) => {
    if (cat === "Lampu") return <Lightbulb size={24} color="#eab308" />;
    if (cat === "AC") return <Cpu size={24} color="#0059AB" />;
    if (cat === "Debit Air") return <Droplet size={24} color="#10b981" />;
    return <Zap size={24} color="#0284c7" />;
  };

  const getCategoryBgColor = (cat) => {
    if (cat === "Lampu") return "#fef9c3";
    if (cat === "AC") return "#e0f2fe";
    if (cat === "Debit Air") return "#dcfce7";
    return "#e0f2fe";
  };

  const renderStepProgressTracker = () => (
    <View style={[styles.trackerContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
      {[
        { num: 1, label: language === "Indonesia" ? "Pilih Jenis" : "Select Type" },
        { num: 2, label: language === "Indonesia" ? "Nama Perangkat" : "Device Name" },
        { num: 3, label: language === "Indonesia" ? "Tempat Lokasi" : "Installation Location" },
      ].map((item, idx) => {
        const isCurrent = step === item.num;
        const isCompleted = step > item.num;
        return (
          <React.Fragment key={item.num}>
            {idx > 0 && (
              <View
                style={[
                  styles.trackerLine,
                  { backgroundColor: step >= item.num ? "#0059AB" : colors.border },
                ]}
              />
            )}
            <View style={styles.trackerStepItem}>
              <View
                style={[
                  styles.trackerBadgeCircle,
                  isCurrent && styles.trackerBadgeCircleCurrent,
                  isCompleted && styles.trackerBadgeCircleCompleted,
                  !isCurrent && !isCompleted && [styles.trackerBadgeCircleInactive, { borderColor: colors.border, backgroundColor: colors.background }],
                ]}
              >
                {isCompleted ? (
                  <Check size={14} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.trackerBadgeNum,
                      isCurrent && styles.trackerBadgeNumCurrent,
                      !isCurrent && { color: colors.textMuted },
                    ]}
                  >
                    {item.num}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.trackerStepLabel,
                  isCurrent ? { color: "#0059AB", fontWeight: "800" } : { color: colors.textMuted },
                ]}
              >
                {item.label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );

  // ── Render Wizard Step 1: Kategori Perangkat ─────────────────────────────
  const renderStep1 = () => (
    <View>
      <Text style={[styles.wizardTitle, { color: colors.text }]}>{language === "Indonesia" ? "Pilih Jenis Perangkat" : "Select Device Type"}</Text>
      <Text style={[styles.wizardSubtitle, { color: colors.textMuted }]}>
        {language === "Indonesia"
          ? "Pilih jenis perangkat IoT yang ingin Anda tambahkan ke sistem"
          : "Select the type of IoT device you want to add to the system"}
      </Text>

      <View style={styles.categoryGrid}>
        {[
          {
            id: "Lampu",
            title: language === "Indonesia" ? "Lampu" : "Lamp",
            desc: language === "Indonesia" ? "Kontrol saklar & penerangan" : "Switch control & lighting",
            icon: Lightbulb,
            color: "#eab308",
            bgColor: "#fef9c3",
          },
          {
            id: "AC",
            title: "AC (Air Conditioner)",
            desc: language === "Indonesia" ? "Pengatur suhu & AC ruangan" : "Room temperature & AC control",
            icon: Cpu,
            color: "#0059AB",
            bgColor: "#e0f2fe",
          },
          {
            id: "Listrik",
            title: "Smartplug / Power Meter",
            desc: language === "Indonesia" ? "Monitoring daya & konsumsi listrik" : "Power monitoring & electricity consumption",
            icon: Zap,
            color: "#0284c7",
            bgColor: "#e0f2fe",
          },
        ].map((item) => {
          const IconComp = item.icon;
          const isSelected = formCategory === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.categoryCard,
                { backgroundColor: colors.cardBackground, borderColor: isSelected ? item.color : colors.border },
                isSelected && styles.categoryCardSelected,
              ]}
              onPress={() => setFormCategory(item.id)}
            >
              <View style={[styles.categoryIconCircle, { backgroundColor: item.bgColor }]}>
                <IconComp size={28} color={item.color} />
              </View>
              <Text style={[styles.categoryCardTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.categoryCardDesc, { color: colors.textMuted }]}>{item.desc}</Text>
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: item.color }]}>
                  <Check size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.wizardBtnRow}>
        <TouchableOpacity
          style={styles.wizardNextBtnFull}
          onPress={() => animateNextStep(2)}
        >
          <Text style={styles.wizardNextBtnText}>{language === "Indonesia" ? "Lanjut" : "Next"}</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render Wizard Step 2: Nama Device ─────────────────────────────────────
  const renderStep2 = () => (
    <View>
      {/* Selected Category Hero Badge */}
      <View style={[styles.selectedCategoryHeroCard, { backgroundColor: theme === "Dark Mode" ? "#1e293b" : "#f0f9ff", borderColor: colors.border }]}>
        <View style={[styles.selectedCategoryIconCircle, { backgroundColor: getCategoryBgColor(formCategory) }]}>
          {getCategoryIcon(formCategory)}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.selectedCategoryLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Jenis Perangkat Dipilih" : "Selected Device Type"}</Text>
          <Text style={[styles.selectedCategoryTitle, { color: colors.text }]}>{formCategory}</Text>
        </View>
      </View>

      <Text style={[styles.wizardTitle, { color: colors.text }]}>{language === "Indonesia" ? "Nama Perangkat" : "Device Name"}</Text>
      <Text style={[styles.wizardSubtitle, { color: colors.textMuted }]}>
        {language === "Indonesia"
          ? `Beri nama untuk perangkat ${formCategory} baru ini`
          : `Enter a name for this new ${formCategory} device`}
      </Text>

      {formNameError ? (
        <View style={styles.inlineErrorBanner}>
          <AlertCircle size={16} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.inlineErrorText}>{formNameError}</Text>
        </View>
      ) : null}

      <Input
        label={language === "Indonesia" ? "Nama Perangkat *" : "Device Name *"}
        placeholder={language === "Indonesia" ? `Contoh: ${formCategory} Ruang Lab Utama` : `Example: Main Lab Room ${formCategory}`}
        value={formName}
        onChangeText={(text) => {
          setFormName(text);
          if (text.trim()) setFormNameError("");
        }}
        error={formNameError}
        hideErrorText={true}
        editable={!isSubmitting}
      />

      <View style={styles.wizardBtnRow}>
        <TouchableOpacity
          style={[styles.wizardBackBtn, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}
          onPress={() => {
            setFormNameError("");
            animateNextStep(1);
          }}
        >
          <Text style={[styles.wizardBackBtnText, { color: colors.text }]}>{language === "Indonesia" ? "Kembali" : "Back"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.wizardNextBtn}
          onPress={() => {
            if (!formName.trim()) {
              setFormNameError("Nama Perangkat wajib diisi.");
              showToast("Nama Perangkat wajib diisi.", "error");
              return;
            }
            setFormNameError("");
            animateNextStep(3);
          }}
        >
          <Text style={styles.wizardNextBtnText}>{language === "Indonesia" ? "Lanjut" : "Next"}</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render Wizard Step 3: Pilih Lokasi Pemasangan ─────────────────────────
  const renderStep3 = () => (
    <View>
      {/* Device Target Hero Banner */}
      <View style={[styles.selectedCategoryHeroCard, { backgroundColor: theme === "Dark Mode" ? "#1e293b" : "#f0f9ff", borderColor: colors.border }]}>
        <View style={[styles.selectedCategoryIconCircle, { backgroundColor: getCategoryBgColor(formCategory) }]}>
          {getCategoryIcon(formCategory)}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.selectedCategoryLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Perangkat Didaftarkan" : "Registering Device"}</Text>
          <Text style={[styles.selectedCategoryTitle, { color: colors.text }]}>{formName}</Text>
        </View>
      </View>

      <Text style={[styles.wizardTitle, { color: colors.text }]}>{language === "Indonesia" ? "Pilih Tempat Lokasi" : "Select Installation Location"}</Text>
      <Text style={[styles.wizardSubtitle, { color: colors.textMuted }]}>
        {language === "Indonesia" ? "Pilih tempat lokasi" : "Select room / installation location"}
      </Text>

      <View style={styles.locationDropdownList}>
        {locations.map((loc) => {
          const isSelected = formLocationId === String(loc.id);
          return (
            <TouchableOpacity
              key={loc.id}
              style={[
                styles.locationRowCard,
                { backgroundColor: colors.cardBackground, borderColor: isSelected ? "#0059AB" : colors.border },
                isSelected && styles.locationRowCardSelected,
              ]}
              onPress={() => setFormLocationId(String(loc.id))}
              disabled={isSubmitting}
            >
              <View style={styles.locationRowLeft}>
                <View style={[styles.locationIconBox, { backgroundColor: isSelected ? "#0059AB" : colors.background }]}>
                  <MapPin size={18} color={isSelected ? "#fff" : colors.textMuted} />
                </View>
                <View>
                  <Text style={[styles.locationRuanganText, { color: colors.text }]}>
                    {formatLocationHistoryText(loc.ruangan, language)}
                  </Text>
                  <Text style={[styles.locationGedungText, { color: colors.textMuted }]}>
                    {formatLocationHistoryText(`${language === "Indonesia" ? "Lantai" : "Floor"} ${loc.lantai} — ${loc.gedung}`, language)}
                  </Text>
                </View>
              </View>
              {isSelected && (
                <View style={styles.selectedCheckCircle}>
                  <Check size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.wizardBtnRow}>
        <TouchableOpacity
          style={[styles.wizardBackBtn, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}
          onPress={() => animateNextStep(2)}
          disabled={isSubmitting}
        >
          <Text style={[styles.wizardBackBtnText, { color: colors.text }]}>{language === "Indonesia" ? "Kembali" : "Back"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.wizardSubmitBtn}
          onPress={handleAddDevice}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.wizardSubmitBtnText}>{language === "Indonesia" ? "Simpan Perangkat" : "Save Device"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

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
          { label: t("semua"), count: countAll, val: "Semua" },
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
                {tab.label} ({tab.count})
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
              {canCrud && (
                <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAdd}>
                  <Text style={styles.emptyAddBtnText}>{t("tambah_perangkat_btn")}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Add Button for Admin / Owner / Controller */}
      {canCrud && filteredDevices.length > 0 && (
        <TouchableOpacity style={styles.floatingAddBtn} onPress={handleOpenAdd}>
          <Plus size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.floatingAddBtnText}>{t("tambah_perangkat")}</Text>
        </TouchableOpacity>
      )}

      {/* Multi-step Add Device Wizard Modal */}
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
            <View style={{ width: 40 }} />
          </View>

          {renderStepProgressTracker()}

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Device Modal (Ubah Nama & Lokasi) */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setEditModalVisible(false)}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.navTitle, { color: colors.text }]}>{language === "Indonesia" ? "Edit Perangkat" : "Edit Device"}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {/* Device Being Edited Hero Badge */}
            {editDevice && (
              <View style={[styles.selectedCategoryHeroCard, { backgroundColor: theme === "Dark Mode" ? "#1e293b" : "#f0f9ff", borderColor: colors.border }]}>
                <View style={[styles.selectedCategoryIconCircle, { backgroundColor: getCategoryBgColor(editDevice.category) }]}>
                  {getCategoryIcon(editDevice.category)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectedCategoryLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Perangkat Dipilih" : "Selected Device"}</Text>
                  <Text style={[styles.selectedCategoryTitle, { color: colors.text }]}>{editDevice.name || editDevice.id}</Text>
                </View>
              </View>
            )}

            <Text style={[styles.wizardTitle, { color: colors.text }]}>{language === "Indonesia" ? "Ubah Perangkat" : "Edit Device"}</Text>
            <Text style={[styles.wizardSubtitle, { color: colors.textMuted }]}>
              {language === "Indonesia"
                ? "Ubah nama dan tempat lokasi perangkat dipasang"
                : "Change device name and installation location"}
            </Text>

            {editFormNameError ? (
              <View style={styles.inlineErrorBanner}>
                <AlertCircle size={16} color="#ef4444" style={{ marginRight: 8 }} />
                <Text style={styles.inlineErrorText}>{editFormNameError}</Text>
              </View>
            ) : null}

            <Input
              label={language === "Indonesia" ? "Nama Perangkat *" : "Device Name *"}
              placeholder={language === "Indonesia" ? "Masukkan nama perangkat" : "Enter device name"}
              value={editFormName}
              onChangeText={(text) => {
                setEditFormName(text);
                if (text.trim()) setEditFormNameError("");
              }}
              error={editFormNameError}
              hideErrorText={true}
              editable={!isSubmitting}
            />

            <Text style={[styles.formLabel, { color: colors.text, marginTop: 16 }]}>
              {language === "Indonesia" ? "Pilih Tempat Lokasi" : "Select Installation Location"} <Text style={{ color: "#ef4444", fontWeight: "800" }}>*</Text>
            </Text>
            <View style={styles.locationDropdownList}>
              {locations.map((loc) => {
                const isSelected = editFormLocationId === String(loc.id);
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.locationRowCard,
                      { backgroundColor: colors.cardBackground, borderColor: isSelected ? "#0059AB" : colors.border },
                      isSelected && styles.locationRowCardSelected,
                    ]}
                    onPress={() => setEditFormLocationId(String(loc.id))}
                    disabled={isSubmitting}
                  >
                    <View style={styles.locationRowLeft}>
                      <View style={[styles.locationIconBox, { backgroundColor: isSelected ? "#0059AB" : colors.background }]}>
                        <MapPin size={18} color={isSelected ? "#fff" : colors.textMuted} />
                      </View>
                      <View>
                        <Text style={[styles.locationRuanganText, { color: colors.text }]}>
                          {formatLocationHistoryText(loc.ruangan, language)}
                        </Text>
                        <Text style={[styles.locationGedungText, { color: colors.textMuted }]}>
                          {formatLocationHistoryText(`${language === "Indonesia" ? "Lantai" : "Floor"} ${loc.lantai} — ${loc.gedung}`, language)}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedCheckCircle}>
                        <Check size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.wizardBtnRow}>
              <TouchableOpacity
                style={[styles.wizardBackBtn, { backgroundColor: colors.border, borderColor: colors.cardBorder }]}
                onPress={() => setEditModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.wizardBackBtnText, { color: colors.text }]}>{language === "Indonesia" ? "Batal" : "Cancel"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.wizardSubmitBtn}
                onPress={handleUpdateDevice}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.wizardSubmitBtnText}>{language === "Indonesia" ? "Simpan Perubahan" : "Save Changes"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Custom Delete Confirmation Modal (Matching Screenshot 2) */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalCard, { backgroundColor: colors.cardBackground || "#fff" }]}>
            {/* Top Icon Badge */}
            <View style={styles.deleteIconCircle}>
              <HelpCircle size={32} color="#0059AB" />
            </View>

            {/* Title */}
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>
              {language === "Indonesia" ? "Hapus Perangkat" : "Delete Device"}
            </Text>

            {/* Message Body */}
            <Text style={[styles.deleteModalMessage, { color: colors.textMuted }]}>
              {language === "Indonesia" ? "Apakah Anda yakin ingin menghapus perangkat " : "Are you sure you want to delete device "}
              <Text style={{ fontWeight: "800", color: colors.text }}>
                {deviceToDelete?.name || deviceToDelete?.id}?
              </Text>{" "}
              {language === "Indonesia" ? "Semua data telemetri dan notifikasi terkait akan ikut terhapus." : "All related telemetry data and notifications will also be deleted."}
            </Text>

            {/* Action Buttons Row */}
            <View style={styles.deleteModalBtnRow}>
              <TouchableOpacity
                style={[styles.deleteModalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.deleteModalCancelText, { color: colors.textMuted }]}>{language === "Indonesia" ? "BATAL" : "CANCEL"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteModalConfirmBtn}
                onPress={confirmDeleteDevice}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>{language === "Indonesia" ? "HAPUS" : "DELETE"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Success Modal (Matching Screenshot) */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalCard, { backgroundColor: colors.cardBackground || "#fff" }]}>
            {/* Green Checkmark Circle Icon */}
            <View style={styles.successIconCircle}>
              <CheckCircle size={36} color="#10b981" />
            </View>

            {/* Title */}
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>
              {language === "Indonesia" ? "Sukses" : "Success"}
            </Text>

            {/* Subtitle Message */}
            <Text style={[styles.deleteModalMessage, { color: colors.textMuted }]}>
              {successModalMessage}
            </Text>

            {/* Buttons Row */}
            <View style={styles.deleteModalBtnRow}>
              <TouchableOpacity
                style={styles.successModalOkBtn}
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={styles.successModalOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
              <SlidersHorizontal size={32} color="#0059AB" />
            </View>
            <Text style={[styles.dialogTitle, { color: colors.text, textAlign: "center", marginBottom: 8 }]}>{t("filter_kategori")}</Text>
            <Text style={[styles.dialogMessage, { color: colors.textMuted }]}>
              {t("pilih_kategori")}
            </Text>
            {["Semua", "Lampu", "AC", "Listrik", "Temperatur & Kelembaban"].map((catOption) => {
              const isSelected = selectedCategoryFilter === catOption;
              let transCatLabel = catOption;
              if (language !== "Indonesia") {
                if (catOption === "Semua") transCatLabel = "All";
                else if (catOption === "Lampu") transCatLabel = "Lamp";
                else if (catOption === "AC") transCatLabel = "AC";
                else if (catOption === "Listrik") transCatLabel = "Power / Electricity";
                else if (catOption === "Temperatur & Kelembaban" || catOption === "Temperatur & Kelembapan") transCatLabel = "Temperature & Humidity";
                else transCatLabel = formatLocationHistoryText(catOption, language);
              } else {
                if (catOption === "Semua") transCatLabel = t("semua");
              }
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
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  segmentTabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
    paddingVertical: 0,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  deviceNameText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  deviceLocText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  valueText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  floatingAddBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  stepIndicatorText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  wizardTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  wizardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  categoryCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  categoryCardDesc: {
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 14,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  locationRuanganText: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  locationGedungText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
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
  rightStateColumn: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 52,
  },
  topRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconButton: {
    padding: 4,
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
    paddingBottom: 40,
  },
  stepIndicatorRow: {
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  categoryCardSelected: {
    backgroundColor: "#f0f9ff",
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  creatorHistoryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 16,
  },
  creatorHistoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  creatorHistoryTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  creatorHistoryBody: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  creatorHistorySub: {
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 6,
  },
  locationDropdownList: {
    gap: 10,
    marginVertical: 16,
  },
  locationRowCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  locationRowCardSelected: {
    backgroundColor: "#f0f9ff",
  },
  locationRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0059AB",
    alignItems: "center",
    justifyContent: "center",
  },
  wizardBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  wizardBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wizardBackBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  wizardNextBtn: {
    flex: 2,
    backgroundColor: "#0059AB",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  wizardNextBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  wizardNextBtnFull: {
    flex: 1,
    backgroundColor: "#0059AB",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  wizardSubmitBtn: {
    flex: 2,
    backgroundColor: "#0059AB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  wizardSubmitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  trackerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  trackerStepItem: {
    alignItems: "center",
    gap: 4,
  },
  trackerLine: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  trackerBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  trackerBadgeCircleCurrent: {
    backgroundColor: "#0059AB",
    borderColor: "#0059AB",
    shadowColor: "#0059AB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  trackerBadgeCircleCompleted: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  trackerBadgeCircleInactive: {
    borderColor: "#cbd5e1",
  },
  trackerBadgeNum: {
    fontSize: 12,
    fontWeight: "800",
  },
  trackerBadgeNumCurrent: {
    color: "#fff",
  },
  trackerStepLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  selectedCategoryHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  selectedCategoryIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCategoryLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  selectedCategoryTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  changeCategoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#0059AB",
  },
  changeCategoryBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
    marginTop: 10,
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
  inlineErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  inlineErrorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deleteModalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  deleteIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  deleteModalMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  deleteModalBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalCancelText: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  deleteModalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#0059AB",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalConfirmText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successModalOkBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  successModalOkText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
});
