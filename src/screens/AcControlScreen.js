import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import { ArrowLeft, Wind, Snowflake, Compass } from "lucide-react-native";

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

export default function AcControlScreen({ route, navigation }) {
  const { user, colors, t, language } = useUser();
  const [activeBuilding, setActiveBuilding] = useState("");
  const [acDeviceId, setAcDeviceId] = useState("DEV_AC01");
  const [tempDeviceId, setTempDeviceId] = useState("DEV_TEMP01");
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [temperature, setTemperature] = useState(22);
  
  const [acMode, setAcMode] = useState("Cool");
  const [fanSpeed, setFanSpeed] = useState("Auto");
  const [swingMode, setSwingMode] = useState("Auto");
  const [isLoading, setIsLoading] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);

  const selectedRoleName = user?.selectedRole?.roleName || "Viewer";
  const isViewer = user?.selectedRole?.roleId === "ROL003" || user?.selectedRole?.roleId === "ROL03" || selectedRoleName.toLowerCase().includes("viewer");

  const processAcDeviceDetail = async (currentDevice, allDevices) => {
    const buildingName = currentDevice.gedung || "Gedung Utama";
    const locText = [currentDevice.ruangan, currentDevice.gedung].filter(Boolean).join(" — ");
    setActiveBuilding(locText || buildingName);
    setAcDeviceId(currentDevice.id);

    const tempDevInBuilding = Array.isArray(allDevices)
      ? allDevices.find(
          (dev) => dev?.gedung?.toLowerCase() === buildingName.toLowerCase() && dev?.category?.includes("Temp")
        )
      : null;
    let targetTempId = "DEV_TEMP01";
    if (tempDevInBuilding) {
      targetTempId = tempDevInBuilding.id;
    } else if (currentDevice.id === "DEV_AC01") {
      targetTempId = "DEV_TEMP02";
    }
    setTempDeviceId(targetTempId);

    const devDetail = await iotService.getDeviceById(currentDevice.id);
    const historyList = devDetail?.locationHistory || devDetail?.LocationHistory || devDetail?.data?.locationHistory || devDetail?.data?.LocationHistory;
    if (Array.isArray(historyList)) {
      setLocationHistory(historyList);
    }

    const savedSettings = await iotService.getAcSettings(currentDevice.id);
    if (!savedSettings?.error && savedSettings) {
      setTemperature(savedSettings.temperature ?? 22);
      setAcMode(savedSettings.mode ?? "Cool");
      setFanSpeed(savedSettings.fanSpeed ?? "Auto");
      setSwingMode(savedSettings.swingMode ?? "Auto");
    }
  };

  const loadAcStatus = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true);
    const selectedDeviceId = route.params?.deviceId;
    
    const response = await iotService.getDashboardLatest();
    if (response?.error) {
      if (isInitial) setIsLoading(false);
      return;
    }

    const currentDevice = selectedDeviceId
      ? response.find(dev => dev.id === selectedDeviceId)
      : response.find(dev => dev.category === "AC") || response[0];

    if (currentDevice) {
      await processAcDeviceDetail(currentDevice, response);
    }

    if (isInitial) setIsLoading(false);
  }, [route.params?.deviceId]);

  useFocusEffect(
    useCallback(() => {
      loadAcStatus(true);
    }, [loadAcStatus])
  );

  useEffect(() => {
    loadAcStatus(true);
    const timer = setInterval(() => {
      loadAcStatus(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [loadAcStatus]);

  const handleViewerBlock = () => {
    Alert.alert(
      language === "Indonesia" ? "Akses Ditolak" : "Access Denied",
      language === "Indonesia" ? "Anda tidak memiliki akses untuk mengendalikan perangkat (Viewer)." : "You do not have access to control devices (Viewer)."
    );
  };

  const handlePowerToggle = async (value) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    setIsPowerOn(value);
    const cmd = value ? "1" : "0";
    
    const topic = tempDeviceId === "DEV_TEMP02" ? "setPowerS3" : "setPower00121";
    const response = await iotService.controlAc(topic, cmd);
    
    if (response.error) {
      setIsPowerOn(!value);
      Alert.alert(language === "Indonesia" ? "Gagal" : "Failed", response.message || (language === "Indonesia" ? "Gagal mengontrol daya AC." : "Failed to control AC power."));
    }
  };

  const persistSettings = async (temp, mode, fan, swing) => {
    await iotService.saveAcSettings(acDeviceId, temp, mode, fan, swing);
  };

  const changeTemperature = async (delta) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    const prevTemp = temperature;
    const newTemp = Math.min(Math.max(temperature + delta, 16), 30);
    setTemperature(newTemp);
    
    const topic = tempDeviceId === "DEV_TEMP02" ? "setTempS3" : "setTemp00122";
    const response = await iotService.controlAc(topic, String(newTemp));
    if (response.error) {
      setTemperature(prevTemp);
      Alert.alert(language === "Indonesia" ? "Gagal" : "Failed", response.message || (language === "Indonesia" ? "Gagal mengubah temperatur." : "Failed to change temperature."));
    } else {
      await persistSettings(newTemp, acMode, fanSpeed, swingMode);
    }
  };

  const changeMode = async (modeName, modeVal) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    const prevMode = acMode;
    setAcMode(modeName);
    
    const topic = tempDeviceId === "DEV_TEMP02" ? "setModeS3" : "setMode00124";
    const response = await iotService.controlAc(topic, String(modeVal));
    if (response.error) {
      setAcMode(prevMode);
      Alert.alert(language === "Indonesia" ? "Gagal" : "Failed", response.message || (language === "Indonesia" ? "Gagal mengubah mode." : "Failed to change mode."));
    } else {
      await persistSettings(temperature, modeName, fanSpeed, swingMode);
    }
  };

  const changeFanSpeed = async (speedName, speedVal) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    const prevSpeed = fanSpeed;
    setFanSpeed(speedName);

    const topic = tempDeviceId === "DEV_TEMP02" ? "setFanS3" : "setFan00123";
    const response = await iotService.controlAc(topic, String(speedVal));
    if (response.error) {
      setFanSpeed(prevSpeed);
      Alert.alert(language === "Indonesia" ? "Gagal" : "Failed", response.message || (language === "Indonesia" ? "Gagal mengubah fan speed." : "Failed to change fan speed."));
    } else {
      await persistSettings(temperature, acMode, speedName, swingMode);
    }
  };

  const changeSwingMode = async (swingName, swingVal) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    const prevSwing = swingMode;
    setSwingMode(swingName);

    const topic = tempDeviceId === "DEV_TEMP02" ? "setSwingS3" : "setSwing00125";
    const response = await iotService.controlAc(topic, String(swingVal));
    if (response.error) {
      setSwingMode(prevSwing);
      Alert.alert(language === "Indonesia" ? "Gagal" : "Failed", response.message || (language === "Indonesia" ? "Gagal mengubah swing." : "Failed to change swing mode."));
    } else {
      await persistSettings(temperature, acMode, fanSpeed, swingName);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{t("kontrol_ac")}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>{language === "Indonesia" ? "Menghubungkan kontrol AC..." : "Connecting AC control..."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.activeBuildingText, { color: colors.textMuted }]}>
            {language === "Indonesia" ? "Lokasi:" : "Location:"} {formatLocationHistoryText(activeBuilding, language)}
          </Text>

          <Card style={[styles.powerCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.powerHeader}>
              <Text style={[styles.powerTitle, { color: colors.text }]}>{t("daya_ac")}</Text>
              <Text style={styles.powerStatusText}>
                {language === "Indonesia" ? (isPowerOn ? "Nyala" : "Mati") : (isPowerOn ? "ON" : "OFF")}
              </Text>
            </View>
            {isViewer ? (
              <View style={[styles.readOnlyBadge, { backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }]}>
                <Text style={{ color: colors.textMuted, fontWeight: "600", fontSize: 12 }}>{language === "Indonesia" ? "Hanya Lihat" : "Read Only"}</Text>
              </View>
            ) : (
              <Switch
                value={isPowerOn}
                onValueChange={handlePowerToggle}
                trackColor={{ false: "#dee2e6", true: "#0059AB" }}
                thumbColor={isPowerOn ? "#fff" : "#f4f3f4"}
              />
            )}
          </Card>

          <Card style={[styles.tempCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.tempHeaderTitle, { color: colors.text }]}>{t("target_temperatur")}</Text>
            <View style={[styles.tempSelectorRow, { justifyContent: "center" }]}>
              {!isViewer && (
                <TouchableOpacity
                  style={[styles.tempBtn, isViewer && styles.disabledBtn]}
                  onPress={() => changeTemperature(-1)}
                  disabled={temperature <= 16}
                >
                  <Text style={styles.tempBtnText}>-</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.tempValueText, { color: colors.text, marginHorizontal: isViewer ? 0 : 24 }]}>{temperature}°C</Text>

              {!isViewer && (
                <TouchableOpacity
                  style={[styles.tempBtn, isViewer && styles.disabledBtn]}
                  onPress={() => changeTemperature(1)}
                  disabled={temperature >= 30}
                >
                  <Text style={styles.tempBtnText}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>

          {/* AC Modes */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("mode_pengoperasian")}</Text>
          <Card style={[styles.modeCard, { backgroundColor: colors.cardBackground }]}>
            {[
              { label: "Auto", val: 1 },
              { label: "Cool", val: 2 },
              { label: "Dry", val: 3 },
            ].map((m) => {
              const active = acMode === m.label;
              return (
                <TouchableOpacity
                  key={m.label}
                  style={[styles.optionItem, { backgroundColor: colors.border }, active && styles.optionItemActive]}
                  onPress={() => changeMode(m.label, m.val)}
                  disabled={isViewer}
                >
                  <Snowflake size={20} color={active ? "#fff" : "#0059AB"} />
                  <Text style={[styles.optionText, active ? styles.optionTextActive : { color: colors.text }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card>

          {/* Fan Speeds */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("kecepatan_kipas")}</Text>
          <Card style={[styles.modeCard, { backgroundColor: colors.cardBackground }]}>
            {[
              { label: "Auto", val: 1 },
              { label: "Quiet", val: 2 },
              { label: "Low", val: 3 },
              { label: "Medium", val: 4 },
              { label: "High", val: 5 },
            ].map((f) => {
              const active = fanSpeed === f.label;
              return (
                <TouchableOpacity
                  key={f.label}
                  style={[styles.optionItem, { backgroundColor: colors.border }, active && styles.optionItemActive]}
                  onPress={() => changeFanSpeed(f.label, f.val)}
                  disabled={isViewer}
                >
                  <Wind size={20} color={active ? "#fff" : "#0059AB"} />
                  <Text style={[styles.optionText, active ? styles.optionTextActive : { color: colors.text }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card>

          {/* Swing Modes */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("arah_swing")}</Text>
          <Card style={[styles.modeCard, { backgroundColor: colors.cardBackground }]}>
            {[
              { label: "Auto", val: 1 },
              { label: "Highest", val: 2 },
              { label: "High", val: 3 },
              { label: "Middle", val: 4 },
              { label: "Low", val: 5 },
            ].map((s) => {
              const active = swingMode === s.label;
              return (
                <TouchableOpacity
                  key={s.label}
                  style={[styles.optionItem, { backgroundColor: colors.border }, active && styles.optionItemActive]}
                  onPress={() => changeSwingMode(s.label, s.val)}
                  disabled={isViewer}
                >
                  <Compass size={20} color={active ? "#fff" : "#0059AB"} />
                  <Text style={[styles.optionText, active ? styles.optionTextActive : { color: colors.text }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card>

          {/* Riwayat Perpindahan Lokasi Timeline */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
            {language === "Indonesia" ? "Riwayat Perpindahan Lokasi" : "Location Transfer History"}
          </Text>
          <Card style={{ backgroundColor: colors.cardBackground, padding: 16, borderRadius: 16, marginVertical: 8 }}>
            {Array.isArray(locationHistory) && locationHistory.length > 0 ? (
              locationHistory.map((h, idx) => {
                const rawPeriod = h.periodText || h.PeriodText || h.timestampText || h.TimestampText || "-";
                const rawRoom = h.ruangan || h.Ruangan || h.locationName || h.roomName || h.Gedung || "-";
                const period = formatLocationHistoryText(rawPeriod, language);
                const room = formatLocationHistoryText(rawRoom, language);
                return (
                  <View key={h.id || h.historyId || `loc-${idx}`} style={{ flexDirection: "row", marginBottom: idx === locationHistory.length - 1 ? 0 : 14 }}>
                    <View style={{ alignItems: "center", width: 16, marginRight: 12 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: idx === 0 ? "#10b981" : "#0059AB", marginTop: 4 }} />
                      {idx < locationHistory.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: "#cbd5e1", marginTop: 4 }} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: idx === 0 ? "#10b981" : "#0059AB", marginBottom: 2 }}>
                        {period}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text || "#0f172a" }}>
                        {room}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: "italic" }}>
                {language === "Indonesia"
                  ? "Belum ada riwayat perpindahan lokasi untuk perangkat ini."
                  : "No location transfer history recorded for this device."}
              </Text>
            )}
          </Card>
        </ScrollView>
      )}
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
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
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
    color: "#333",
  },
  scrollContent: {
    padding: 16,
  },
  activeBuildingText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "600",
    marginBottom: 16,
  },
  powerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  powerHeader: {
    flexDirection: "column",
  },
  powerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  powerStatusText: {
    fontSize: 13,
    color: "#6c757d",
    fontWeight: "600",
    marginTop: 2,
  },
  tempCard: {
    alignItems: "center",
    paddingVertical: 20,
  },
  tempHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6c757d",
    marginBottom: 12,
  },
  tempSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
  },
  tempBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    backgroundColor: "#f1f3f5",
  },
  tempBtnText: {
    fontSize: 26,
    color: "#0059AB",
    fontWeight: "bold",
  },
  tempValueText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6c757d",
    marginBottom: 10,
    marginTop: 18,
  },
  modeCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    backgroundColor: "#f0f9ff",
  },
  optionItemActive: {
    backgroundColor: "#0059AB",
    borderColor: "#0059AB",
  },
  optionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0059AB",
    marginLeft: 6,
  },
  optionTextActive: {
    color: "#fff",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6c757d",
  },
});
