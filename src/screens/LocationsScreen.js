import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { Search, Plus, MapPin, ArrowLeft } from "lucide-react-native";

export default function LocationsScreen({ route, navigation }) {
  const { user, language } = useUser();
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Add Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formGedung, setFormGedung] = useState("");
  const [formLantai, setFormLantai] = useState("");
  const [formRuangan, setFormRuangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.selectedRole?.roleId === "ROL001";

  // Check if routed with action parameters to open add dialog directly
  useEffect(() => {
    if (route.params?.openAddDialog) {
      handleOpenAdd();
      // Reset params so it doesn't trigger again
      navigation.setParams({ openAddDialog: undefined });
    }
  }, [route.params?.openAddDialog]);

  const fetchLocations = async (searchKeyword = "") => {
    setIsLoading(true);
    const res = await iotService.getLocations(searchKeyword);
    setIsLoading(false);
    if (res?.error) {
      Alert.alert(language === "Indonesia" ? "Gagal" : "Error", res.message || (language === "Indonesia" ? "Gagal memuat daftar ruangan." : "Failed to load room list."));
    } else if (Array.isArray(res)) {
      setLocations(res);
    }
  };

  useEffect(() => {
    fetchLocations(search);
  }, [search]);

  const handleOpenAdd = () => {
    setFormGedung("");
    setFormLantai("");
    setFormRuangan("");
    setModalVisible(true);
  };

  const handleAddLocation = async () => {
    if (!formGedung.trim() || !formLantai.trim() || !formRuangan.trim()) {
      Alert.alert(language === "Indonesia" ? "Peringatan" : "Warning", language === "Indonesia" ? "Harap isi semua kolom informasi ruangan." : "Please fill in all room info fields.");
      return;
    }

    setIsSubmitting(true);
    const res = await iotService.createLocation(formGedung.trim(), formLantai.trim(), formRuangan.trim());
    setIsSubmitting(false);

    if (res?.error) {
      Alert.alert(language === "Indonesia" ? "Gagal" : "Error", res.message || (language === "Indonesia" ? "Gagal menambahkan ruangan baru." : "Failed to add new room."));
    } else {
      Alert.alert(language === "Indonesia" ? "Berhasil" : "Success", language === "Indonesia" ? "Ruangan baru berhasil ditambahkan." : "New room added successfully.");
      setModalVisible(false);
      fetchLocations(search);
    }
  };

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

  const renderLocationItem = ({ item }) => (
    <Card style={styles.locationItemCard}>
      <View style={styles.locIconContainer}>
        <MapPin size={22} color="#0059AB" />
      </View>
      <View style={styles.locInfoContainer}>
        <Text style={styles.locName}>{formatLocationHistoryText(item.ruangan, language)}</Text>
        <Text style={styles.locBuilding}>
          {formatLocationHistoryText(item.gedung, language)} - {language === "Indonesia" ? "Lantai" : "Floor"} {item.lantai}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{language === "Indonesia" ? "Kelola Ruangan" : "Manage Rooms"}</Text>
        {isAdmin ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
            <Plus size={24} color="#0059AB" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#aaa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBarInput}
          placeholder={language === "Indonesia" ? "Cari nama ruangan" : "Search room name"}
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0059AB" />
        </View>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLocationItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              {language === "Indonesia" ? "Tidak ada ruangan ditemukan" : "No rooms found"}
            </Text>
          }
        />
      )}

      {/* Add Location Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.navbar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setModalVisible(false)}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>{language === "Indonesia" ? "Tambah Ruangan" : "Add Room"}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Input
              label={language === "Indonesia" ? "Nama Gedung" : "Building Name"}
              placeholder={language === "Indonesia" ? "Contoh: Gedung A" : "e.g. Building A"}
              value={formGedung}
              onChangeText={setFormGedung}
              editable={!isSubmitting}
            />

            <Input
              label={language === "Indonesia" ? "Lantai" : "Floor"}
              placeholder={language === "Indonesia" ? "Contoh: 3" : "e.g. 3"}
              value={formLantai}
              onChangeText={setFormLantai}
              keyboardType="numeric"
              editable={!isSubmitting}
            />

            <Input
              label={language === "Indonesia" ? "Nama Ruangan" : "Room Name"}
              placeholder={language === "Indonesia" ? "Contoh: Ruang Rapat Utama" : "e.g. Main Meeting Room"}
              value={formRuangan}
              onChangeText={setFormRuangan}
              editable={!isSubmitting}
            />

            <Button
              label={language === "Indonesia" ? "Simpan Ruangan" : "Save Room"}
              onPress={handleAddLocation}
              type="success"
              loading={isSubmitting}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  addBtn: {
    padding: 8,
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
    color: "#333",
  },
  listContent: {
    padding: 16,
  },
  locationItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
  },
  locIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  locInfoContainer: {
    flex: 1,
  },
  locName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  locBuilding: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 4,
    fontWeight: "600",
  },
  emptyListText: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalScrollContent: {
    padding: 20,
  },
});
