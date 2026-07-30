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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { iotService } from "../services/iotService";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { ArrowLeft, Search, Plus, MapPin } from "lucide-react-native";

export default function LocationsScreen({ route, navigation }) {
  const { user } = useUser();
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

  const loadLocations = async () => {
    setIsLoading(true);
    const response = await iotService.getLocations(search);
    setIsLoading(false);

    if (response.error) {
      Alert.alert("Gagal", response.message || "Gagal memuat daftar ruangan.");
      return;
    }

    setLocations(response);
  };

  useEffect(() => {
    loadLocations();
  }, [search]);

  const handleOpenAdd = () => {
    if (!isAdmin) {
      Alert.alert("Akses Ditolak", "Hanya Administrator yang memiliki akses untuk menambahkan ruangan.");
      return;
    }
    
    // Set default building from existing buildings if available
    if (locations.length > 0) {
      setFormGedung(locations[0].gedung || "");
    }
    setModalVisible(true);
  };

  const handleAddLocation = async () => {
    if (!formGedung || !formLantai || !formRuangan) {
      Alert.alert("Perhatian", "Gedung, Lantai, dan Ruangan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const response = await iotService.createLocation(formGedung, formLantai, formRuangan);
    setIsSubmitting(false);

    if (response.error) {
      Alert.alert("Gagal", response.message || "Gagal menambahkan ruangan baru.");
    } else {
      Alert.alert("Sukses", "Ruangan baru berhasil ditambahkan!");
      setModalVisible(false);
      setFormLantai("");
      setFormRuangan("");
      loadLocations();
    }
  };

  const renderLocationItem = ({ item }) => {
    return (
      <Card style={styles.locationItemCard}>
        <View style={styles.locIconContainer}>
          <MapPin size={24} color="#0059AB" />
        </View>
        <View style={styles.locInfoContainer}>
          <Text style={styles.locName}>{item.ruangan}</Text>
          <Text style={styles.locBuilding}>
            {item.gedung} - Lantai {item.lantai}
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Kelola Ruangan</Text>
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
          placeholder="Cari nama ruangan"
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
            <Text style={styles.emptyListText}>Tidak ada ruangan ditemukan</Text>
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
            <Text style={styles.navTitle}>Tambah Ruangan</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Input
              label="Nama Gedung"
              placeholder="Contoh: Gedung A"
              value={formGedung}
              onChangeText={setFormGedung}
              editable={!isSubmitting}
            />

            <Input
              label="Lantai"
              placeholder="Contoh: 3"
              value={formLantai}
              onChangeText={setFormLantai}
              keyboardType="numeric"
              editable={!isSubmitting}
            />

            <Input
              label="Nama Ruangan"
              placeholder="Contoh: Ruang Rapat Utama"
              value={formRuangan}
              onChangeText={setFormRuangan}
              editable={!isSubmitting}
            />

            <Button
              label="Simpan Ruangan"
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
