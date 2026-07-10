import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import { ArrowLeft, Wind, Snowflake, Compass } from "lucide-react-native";

export default function AcControlScreen({ navigation }) {
  const { user } = useUser();
  const [activeBuilding, setActiveBuilding] = useState("");
  const [acDeviceId, setAcDeviceId] = useState("DEV_LAMP01");
  const [tempDeviceId, setTempDeviceId] = useState("DEV_TEMP01");
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [temperature, setTemperature] = useState(22);
  
  const [acMode, setAcMode] = useState("Cool");
  const [fanSpeed, setFanSpeed] = useState("Auto");
  const [swingMode, setSwingMode] = useState("Auto");
  const [isLoading, setIsLoading] = useState(false);

  const isViewer = user?.selectedRole?.roleId === "ROL003";

  const loadAcStatus = async () => {
    setIsLoading(true);
    // Fetch latest dashboard data to check AC status
    const response = await iotService.getDashboardLatest();
    
    if (response.error) {
      Alert.alert("Gagal", response.message || "Gagal mengambil status AC.");
      setIsLoading(false);
      return;
    }

    // Find active building (we can use the first building found or fallback)
    let building = "Gedung Utama";
    if (response.length > 0) {
      building = response[0].gedung || "Gedung Utama";
    }
    setActiveBuilding(building);

    // Mapped variables
    let lampId = "DEV_LAMP01";
    let tId = "DEV_TEMP01";
    let pwrOn = false;

    response.forEach((dev) => {
      if (dev?.gedung?.toLowerCase() === building.toLowerCase()) {
        if (dev.category === "Lampu" || dev.category === "AC") {
          lampId = dev.id;
          pwrOn = dev.status === "ON";
        }
        if (dev.category === "Temperatur & Kelembaban") {
          tId = dev.id;
        }
      }
    });

    setAcDeviceId(lampId);
    setTempDeviceId(tId);
    setIsPowerOn(pwrOn);

    // Fetch device details for AC temperature limits
    const detailResponse = await iotService.getDeviceById(tId);
    setIsLoading(false);

    if (!detailResponse.error && detailResponse.limitMin !== null) {
      let temp = Math.round(detailResponse.limitMin);
      if (temp < 16) temp = 16;
      if (temp > 30) temp = 30;
      setTemperature(temp);
    }
  };

  useEffect(() => {
    loadAcStatus();
  }, []);

  const handleViewerBlock = () => {
    Alert.alert("Akses Ditolak", "Anda tidak memiliki akses untuk mengendalikan perangkat (Viewer).");
  };

  const handlePowerToggle = async (value) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    setIsPowerOn(value);
    const topic = acDeviceId === "DEV_AC01" ? "setPowerS3" : "setPower00121";
    const payload = value ? "1" : "0";
    
    const response = await iotService.controlAc(topic, payload);
    if (response.error) {
      setIsPowerOn(!value);
      Alert.alert("Gagal", "Gagal mengubah daya AC.");
    }
  };

  const changeTemperature = async (delta) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }

    const nextTemp = temperature + delta;
    if (nextTemp < 16 || nextTemp > 30) return;

    setTemperature(nextTemp);
    const topic = tempDeviceId === "DEV_TEMP02" ? "setTempS3" : "setTemp00122";
    
    const response = await iotService.controlAc(topic, String(nextTemp));
    if (response.error) {
      setTemperature((prev) => prev);
      Alert.alert("Gagal", "Gagal mengubah temperatur target.");
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
  };

  const changeFanSpeed = async (speed, value) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }
    setFanSpeed(speed);
    const topic = tempDeviceId === "DEV_TEMP02" ? "setFanS3" : "setFan00123";
    await iotService.controlAc(topic, String(value));
  };

  const changeSwingMode = async (swing, value) => {
    if (isViewer) {
      handleViewerBlock();
      return;
    }
    setSwingMode(swing);
    const topic = tempDeviceId === "DEV_TEMP02" ? "setSwingS3" : "setSwing00125";
    await iotService.controlAc(topic, String(value));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Kontrol AC</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
          <Text style={styles.loaderText}>Menghubungkan kontrol AC...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Active Info */}
          <Text style={styles.activeBuildingText}>Lokasi: {activeBuilding}</Text>

          {/* Power Switch Card */}
          <Card style={styles.powerCard}>
            <View style={styles.powerHeader}>
              <Text style={styles.powerTitle}>Daya AC</Text>
              <Text style={styles.powerStatusText}>{isPowerOn ? "ON" : "OFF"}</Text>
            </View>
            <Switch
              value={isPowerOn}
              onValueChange={handlePowerToggle}
              trackColor={{ false: "#dee2e6", true: "#0059AB" }}
              thumbColor={isPowerOn ? "#fff" : "#f4f3f4"}
              disabled={isViewer}
            />
          </Card>

          {/* Temperature Controls */}
          <Card style={styles.tempCard}>
            <Text style={styles.tempHeaderTitle}>Target Temperatur</Text>
            <View style={styles.tempSelectorRow}>
              <TouchableOpacity
                style={[styles.tempBtn, isViewer && styles.disabledBtn]}
                onPress={() => changeTemperature(-1)}
                disabled={isViewer || temperature <= 16}
              >
                <Text style={styles.tempBtnText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.tempValueText}>{temperature}°C</Text>

              <TouchableOpacity
                style={[styles.tempBtn, isViewer && styles.disabledBtn]}
                onPress={() => changeTemperature(1)}
                disabled={isViewer || temperature >= 30}
              >
                <Text style={styles.tempBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* AC Modes */}
          <Text style={styles.sectionTitle}>Mode Pengoperasian</Text>
          <Card style={styles.modeCard}>
            {[
              { label: "Auto", val: 1 },
              { label: "Cool", val: 2 },
              { label: "Dry", val: 3 },
            ].map((m) => {
              const active = acMode === m.label;
              return (
                <TouchableOpacity
                  key={m.label}
                  style={[styles.optionItem, active && styles.optionItemActive]}
                  onPress={() => changeMode(m.label, m.val)}
                  disabled={isViewer}
                >
                  <Snowflake size={20} color={active ? "#fff" : "#0059AB"} />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card>

          {/* Fan Speeds */}
          <Text style={styles.sectionTitle}>Kecepatan Kipas (Fan Speed)</Text>
          <Card style={styles.modeCard}>
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
                  style={[styles.optionItem, active && styles.optionItemActive]}
                  onPress={() => changeFanSpeed(f.label, f.val)}
                  disabled={isViewer}
                >
                  <Wind size={20} color={active ? "#fff" : "#0059AB"} />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card>

          {/* Swing Modes */}
          <Text style={styles.sectionTitle}>Arah Swing (Hembusan)</Text>
          <Card style={styles.modeCard}>
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
                  style={[styles.optionItem, active && styles.optionItemActive]}
                  onPress={() => changeSwingMode(s.label, s.val)}
                  disabled={isViewer}
                >
                  <Compass size={20} color={active ? "#fff" : "#0059AB"} />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
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
