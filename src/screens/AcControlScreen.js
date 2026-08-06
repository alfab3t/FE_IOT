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

export default function AcControlScreen({ route, navigation }) {
  const { user, colors } = useUser();
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

  const processAcDeviceDetail = async (currentDevice, response) => {
    const locText = [currentDevice.ruangan, currentDevice.gedung].filter(Boolean).join(" — ");
    setActiveBuilding(locText || "Gedung Utama");
    setAcDeviceId(currentDevice.id);
    setIsPowerOn(currentDevice.status === "ON");

    const devDetail = await iotService.getDeviceById(currentDevice.id);
    const historyList = devDetail?.locationHistory || devDetail?.LocationHistory || devDetail?.data?.locationHistory || devDetail?.data?.LocationHistory;
    if (Array.isArray(historyList)) {
      setLocationHistory(historyList);
    }

    const buildingName = currentDevice.gedung || "";
    const tempDevInBuilding = Array.isArray(response)
      ? response.find(
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
    Alert.alert("Akses Ditolak", "Anda tidak memiliki akses untuk mengendalikan perangkat (Viewer).");
  };

  const handlePowerToggle = async (value) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    setIsPowerOn(value);
    const cmd = value ? "1" : "0";
    
    // Send valid AC power topic (setPowerS3 for S3, setPower00121 for standard AC)
    const topic = tempDeviceId === "DEV_TEMP02" ? "setPowerS3" : "setPower00121";
    const response = await iotService.controlAc(topic, cmd);
    
    if (response.error) {
      setIsPowerOn(!value);
      Alert.alert("Gagal", response.message || "Gagal mengontrol daya AC.");
    }
  };

  // Helper: simpan semua setting AC ke database
  const persistSettings = async (temp, mode, fan, swing) => {
    await iotService.saveAcSettings(acDeviceId, temp, mode, fan, swing);
  };

  const changeTemperature = async (delta) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    const prevTemp = temperature;
    const nextTemp = prevTemp + delta;
    if (nextTemp < 16 || nextTemp > 30) return;

    setTemperature(nextTemp);
    const topic = tempDeviceId === "DEV_TEMP02" ? "setTempS3" : "setTemp00122";
    
    const response = await iotService.controlAc(topic, String(nextTemp));
    if (response.error) {
      setTemperature(prevTemp);
      Alert.alert("Gagal", response.message || "Gagal mengubah suhu AC.");
    } else {
      await persistSettings(nextTemp, acMode, fanSpeed, swingMode);
    }
  };

  const changeMode = async (mode, value) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }
    setAcMode(mode);
    const topic = tempDeviceId === "DEV_TEMP02" ? "setModeS3" : "setMode00124";
    await iotService.controlAc(topic, String(value));
    await persistSettings(temperature, mode, fanSpeed, swingMode);
  };

  const changeFanSpeed = async (speed, value) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }
    setFanSpeed(speed);
    const topic = tempDeviceId === "DEV_TEMP02" ? "setFanS3" : "setFan00123";
    await iotService.controlAc(topic, String(value));
    await persistSettings(temperature, acMode, speed, swingMode);
  };

  const changeSwingMode = async (swing, value) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }
    setSwingMode(swing);
    const topic = tempDeviceId === "DEV_TEMP02" ? "setSwingS3" : "setSwing00125";
    await iotService.controlAc(topic, String(value));
    await persistSettings(temperature, acMode, fanSpeed, swing);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.navbarBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Kontrol AC</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>Menghubungkan kontrol AC...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Active Info */}
          <Text style={[styles.activeBuildingText, { color: colors.textMuted }]}>Lokasi: {activeBuilding}</Text>

          {/* Power Switch Card */}
          <Card style={[styles.powerCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.powerHeader}>
              <Text style={[styles.powerTitle, { color: colors.text }]}>Daya AC</Text>
              <Text style={styles.powerStatusText}>{isPowerOn ? "ON" : "OFF"}</Text>
            </View>
            {isViewer ? (
              <View style={[styles.readOnlyBadge, { backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }]}>
                <Text style={{ color: colors.textMuted, fontWeight: "600", fontSize: 12 }}>Read Only</Text>
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

          {/* Temperature Controls */}
          <Card style={[styles.tempCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.tempHeaderTitle, { color: colors.text }]}>Target Temperatur</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mode Pengoperasian</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kecepatan Kipas (Fan Speed)</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Arah Swing (Hembusan)</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Riwayat Perpindahan Lokasi</Text>
          <Card style={{ backgroundColor: colors.cardBackground, padding: 16, borderRadius: 16, marginVertical: 8 }}>
            {Array.isArray(locationHistory) && locationHistory.length > 0 ? (
              locationHistory.map((h, idx) => {
                const period = h.periodText || h.PeriodText || h.timestampText || h.TimestampText || "-";
                const room = h.ruangan || h.Ruangan || h.locationName || h.roomName || h.Gedung || "-";
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
                Belum ada riwayat perpindahan lokasi untuk perangkat ini.
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
