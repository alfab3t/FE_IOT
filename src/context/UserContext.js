import React, { createContext, useContext, useState, useMemo, useCallback, useRef } from "react";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../services/authService";
import { iotService } from "../services/iotService";
import { setAuthToken } from "../services/apiClient";
import SwipeableToast from "../components/SwipeableToast";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ssoData, setSsoData] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);

  // Mock User Database matching Figma screen
  const [managedUsers] = useState([
    {
      id: "usr001",
      name: "Admin ASTRATech",
      email: "admin@astratech.co.id",
      role: "Admin",
      roleId: "ROL001",
      phone: "0812 3456 7890",
      status: "Aktif",
      registeredSince: "02 Juli 2025",
      lastLogin: "03 Juli 2025 08.34 WIB",
      photo: null,
    },
    {
      id: "usr002",
      name: "Pak Budi",
      email: "budi@astratech.co.id",
      role: "Owner/Controller",
      roleId: "ROL002",
      phone: "0812 8765 4321",
      status: "Aktif",
      registeredSince: "01 Juli 2025",
      lastLogin: "04 Juli 2025 09.12 WIB",
      photo: null,
    },
    {
      id: "usr003",
      name: "Bu Maya",
      email: "maya@astratech.co.id",
      role: "Viewer",
      roleId: "ROL003",
      phone: "0857 1122 3344",
      status: "Aktif",
      registeredSince: "03 Juli 2025",
      lastLogin: "05 Juli 2025 10.45 WIB",
      photo: null,
    },
  ]);

  // Global System Settings Config States
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("30 detik");
  const [language, setLanguage] = useState("Indonesia");
  const [theme, setTheme] = useState("Light Mode");
  const [timezone, setTimezone] = useState("WIB");

  // Toast state and auto-dismiss timer reference
  const [toast, setToast] = useState(null); // { message, type: 'info' | 'success' | 'warning' | 'error' }
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = "info", onPress = null) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type, onPress });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4500);
  }, []);

  // Colors palettes for Light Mode & Dark Mode
  const lightColors = {
    background: "#ffffff",
    cardBackground: "#ffffff",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#f1f5f9",
    cardBorder: "#e2e8f0",
    inputBackground: "#f8fafc",
    sidebarBg: "#ffffff",
    navbarBg: "#ffffff",
    divider: "#f1f5f9",
    statusBar: "dark-content",
    cardTitle: "#0f172a",
    shadow: "rgba(0,0,0,0.05)",
  };

  const darkColors = {
    background: "#0f172a",
    cardBackground: "#1e293b",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    border: "#1e293b",
    cardBorder: "#334155",
    inputBackground: "#0f172a",
    sidebarBg: "#1e293b",
    navbarBg: "#1e293b",
    divider: "#334155",
    statusBar: "light-content",
    cardTitle: "#f8fafc",
    shadow: "rgba(0,0,0,0.2)",
  };

  const colors = theme === "Dark Mode" ? darkColors : lightColors;

  // Translation Helper for system language localization
  const translations = {
    Indonesia: {
      menu_admin: "MENU ADMINISTRASI",
      kelola_pengguna: "Kelola Pengguna",
      laporan: "Laporan",
      pengaturan_sistem: "Pengaturan Sistem",
      tentang: "Tentang",
      lainnya: "LAINNYA",
      logout: "Keluar Sesi",
      logout_confirm: "Apakah Anda yakin ingin keluar?",
      logout_btn: "Logout",
      batal: "Batal",
      tambah_pengguna: "Tambah Pengguna",
      detail_pengguna: "Detail Pengguna",
      tambah_user: "Tambah User",
      simpan: "Simpan",
      aktif: "Aktif",
      nonaktif: "Tidak Aktif",
      notifikasi: "Notifikasi",
      notifikasi_desc: "Aktifkan atau nonaktifkan notifikasi aplikasi",
      refresh_interval: "Interval Refresh",
      refresh_desc: "Atur interval refresh data monitoring",
      bahasa: "Bahasa",
      bahasa_desc: "Pilih bahasa aplikasi",
      tema: "Tema Aplikasi",
      tema_desc: "Pilih tema tampilan aplikasi",
      info_app: "Informasi Aplikasi",
      info_desc: "Lihat informasi versi aplikasi yang digunakan",
      backup_db: "Backup Database",
      backup_desc: "Lakukan backup data sistem secara manual",
      backup_btn: "Backup Sekarang",
      pilih: "Pilih",
      // New bilingual additions
      beranda: "Beranda",
      perangkat: "Perangkat",
      monitoring: "Monitoring",
      profil: "Profil",
      selamat_datang: "Selamat Datang,",
      status_sistem: "Status Sistem",
      device_online: "Perangkat Aktif",
      device_offline: "Perangkat Tidak Aktif",
      total_user: "Total Pengguna",
      monitoring_sistem: "Monitoring Sistem",
      aktivitas_terakhir: "Aktivitas Terakhir",
      lihat_semua: "Lihat Semua",
      alarm: "Alarm",
      kontrol: "Kontrol",
      semua: "Semua",
      cari_perangkat: "Cari perangkat",
      tidak_ada_perangkat: "Tidak ada perangkat",
      tidak_ada_perangkat_desc: "Belum ada perangkat yang terdeteksi di status ini.",
      tambah_perangkat: "Tambah Perangkat",
      tambah_perangkat_btn: "+ Tambah Perangkat",
      nama_device: "Nama Device*",
      device_id: "Device ID (MAC/ID)*",
      mac_address: "MAC Address (Opsional)",
      jenis_device: "Jenis Device*",
      metode_komunikasi: "Metode Komunikasi*",
      mqtt_topic: "MQTT Topic*",
      lokasi_pemasangan: "Lokasi Pemasangan*",
      filter_kategori: "Filter Kategori",
      pilih_kategori: "Pilih kategori perangkat yang ingin ditampilkan:",
      suhu: "Suhu",
      kelembapan: "Kelembapan",
      listrik: "Listrik",
      air: "Air",
      grafik: "Grafik",
      data: "Data",
      hari_ini: "Hari Ini",
      minggu_ini: "Minggu Ini",
      bulan_ini: "Bulan Ini",
      data_tab: "Data",
      satuan: "Satuan",
      waktu: "Waktu",
      nilai: "Nilai",
      status: "Status",
      tampil_data_terbaru: "i Menampilkan 10 data terbaru",
      pilih_perangkat: "Pilih Perangkat",
      pilih_perangkat_desc: "Pilih perangkat untuk melihat statistik detail:",
      pengguna: "Pengguna",
      cari_pengguna: "Cari pengguna",
      tambah_user_btn: "+ Tambah User",
      filter_status_pengguna: "Filter Status Pengguna",
      pilih_status_pengguna: "Pilih status pengguna yang ingin ditampilkan:",
      informasi_pengguna: "Informasi Pengguna",
      nama_lengkap: "Nama Lengkap",
      role: "Role",
      email: "Email",
      nohp: "No.HP",
      terdaftar_sejak: "Terdaftar Sejak",
      login_terakhir: "Login Terakhir",
      aksi: "Aksi",
      edit_pengguna: "Edit Pengguna",
      ubah_info_pengguna: "Ubah Informasi Pengguna",
      hapus_pengguna: "Hapus Pengguna",
      hapus_pengguna_desc: "Hapus akun pengguna dari sistem",
      foto_profil: "Foto Profil",
      pengguna_dapat_login: "Pengguna dapat login & menggunakan sistem",
      pengguna_tidak_dapat_login: "Pengguna tidak dapat login",
      kontrol_ac: "Kontrol AC",
      kontrol_lampu: "Kontrol Lampu",
      lokasi: "Lokasi",
      daya_ac: "Daya AC",
      target_temperatur: "Target Temperatur",
      mode_pengoperasian: "Mode Pengoperasian",
      kecepatan_kipas: "Kecepatan Kipas (Fan Speed)",
      arah_swing: "Arah Swing (Hembusan)",
      sakelar_lampu: "Sakelar Lampu",
      hidupkan_matikan_lampu: "Hidupkan atau matikan aliran listrik lampu utama.",
    },
    English: {
      menu_admin: "ADMINISTRATION MENU",
      kelola_pengguna: "Manage Users",
      laporan: "Reports",
      pengaturan_sistem: "System Settings",
      tentang: "About",
      lainnya: "OTHERS",
      logout: "Logout Session",
      logout_confirm: "Are you sure you want to logout?",
      logout_btn: "Logout",
      batal: "Cancel",
      tambah_pengguna: "Add User",
      detail_pengguna: "User Details",
      tambah_user: "Add User",
      simpan: "Save",
      aktif: "Active",
      nonaktif: "Inactive",
      notifikasi: "Notifications",
      notifikasi_desc: "Enable or disable app notifications",
      refresh_interval: "Refresh Interval",
      refresh_desc: "Set data monitoring refresh interval",
      bahasa: "Language",
      bahasa_desc: "Select app language",
      tema: "App Theme",
      tema_desc: "Select app appearance theme",
      info_app: "App Information",
      info_desc: "View application version info",
      backup_db: "Database Backup",
      backup_desc: "Perform database backup manually",
      backup_btn: "Backup Now",
      pilih: "Select",
      // New bilingual additions
      beranda: "Home",
      perangkat: "Devices",
      monitoring: "Monitoring",
      profil: "Profile",
      selamat_datang: "Welcome,",
      status_sistem: "System Status",
      device_online: "Device Online",
      device_offline: "Device Offline",
      total_user: "Total Users",
      monitoring_sistem: "System Monitoring",
      aktivitas_terakhir: "Recent Activities",
      lihat_semua: "View All",
      alarm: "Alarm",
      kontrol: "Control",
      semua: "All",
      cari_perangkat: "Search devices",
      tidak_ada_perangkat: "No devices found",
      tidak_ada_perangkat_desc: "No devices detected in this status.",
      tambah_perangkat: "Add Device",
      tambah_perangkat_btn: "+ Add Device",
      nama_device: "Device Name*",
      device_id: "Device ID (MAC/ID)*",
      mac_address: "MAC Address (Optional)",
      jenis_device: "Device Type*",
      metode_komunikasi: "Communication Method*",
      mqtt_topic: "MQTT Topic*",
      lokasi_pemasangan: "Installation Location*",
      filter_kategori: "Filter Category",
      pilih_kategori: "Select device category to display:",
      suhu: "Temperature",
      kelembapan: "Humidity",
      listrik: "Electricity",
      air: "Water",
      grafik: "Chart",
      data: "Data",
      hari_ini: "Today",
      minggu_ini: "This Week",
      bulan_ini: "This Month",
      data_tab: "Data",
      satuan: "Unit",
      waktu: "Time",
      nilai: "Value",
      status: "Status",
      tampil_data_terbaru: "i Displaying latest 10 data points",
      pilih_perangkat: "Select Device",
      pilih_perangkat_desc: "Select device to view detailed statistics:",
      pengguna: "Users",
      cari_pengguna: "Search users",
      tambah_user_btn: "+ Add User",
      filter_status_pengguna: "Filter User Status",
      pilih_status_pengguna: "Select user status to display:",
      informasi_pengguna: "User Information",
      nama_lengkap: "Full Name",
      role: "Role",
      email: "Email",
      nohp: "Phone Number",
      terdaftar_sejak: "Registered Since",
      login_terakhir: "Last Login",
      aksi: "Actions",
      edit_pengguna: "Edit User",
      ubah_info_pengguna: "Modify user details",
      hapus_pengguna: "Delete User",
      hapus_pengguna_desc: "Delete user account from the system",
      foto_profil: "Profile Picture",
      pengguna_dapat_login: "User can login & use the system",
      pengguna_tidak_dapat_login: "User cannot login",
      kontrol_ac: "AC Control",
      kontrol_lampu: "Lamp Control",
      lokasi: "Location",
      daya_ac: "AC Power",
      target_temperatur: "Target Temperature",
      mode_pengoperasian: "Operation Mode",
      kecepatan_kipas: "Fan Speed",
      arah_swing: "Swing Direction",
      sakelar_lampu: "Lamp Switch",
      hidupkan_matikan_lampu: "Turn on or turn off main light power.",
    }
  };

  const t = (key) => {
    const lang = language === "Indonesia" ? "Indonesia" : "English";
    return translations[lang][key] || key;
  };

  const translateNotification = (msg) => {
    if (!msg) return msg;
    if (language === "Indonesia") return msg;

    let translated = msg;
    translated = translated.replaceAll("Peringatan: Perangkat", "Warning: Device");
    translated = translated.replaceAll("melampaui batas normal maksimum", "exceeded maximum normal limit");
    translated = translated.replaceAll("melampaui batas normal minimum", "exceeded minimum normal limit");
    translated = translated.replaceAll("Kembali ke status normal", "Returned to normal status");
    translated = translated.replaceAll("berhasil ditambahkan ke dalam sistem", "successfully added to the system");
    translated = translated.replaceAll("berhasil dihapus dari sistem", "successfully deleted from the system");
    translated = translated.replaceAll("status mati (OFF)", "OFF status");
    translated = translated.replaceAll("status hidup (ON)", "ON status");

    return translated;
  };

  const login = async (username, password) => {
    const response = await authService.login(username, password);
    if (response.error) {
      return response;
    }

    setAuthToken(response.token);

    try {
      if (username) {
        await AsyncStorage.setItem("username", username.trim());
      }
    } catch (e) {
      console.warn("AsyncStorage save username failed:", e);
    }

    setSsoData({
      username: username,
      nama: username,
      listAplikasi: response.listAplikasi,
    });

    // Set user immediately so UI responds instantly with the exact login username!
    setUser({
      username: username,
      nama: username,
      nickname: username,
      foto: response.foto || null,
    });

    // Load custom nickname & avatar in background asynchronously
    const safeUserKey = (username || "admin").toLowerCase();
    AsyncStorage.getItem(`nickname_${safeUserKey}`).then((nick) => {
      if (nick) setUser((prev) => (prev ? { ...prev, nickname: nick } : prev));
    }).catch(() => {});

    AsyncStorage.getItem(`avatar_${safeUserKey}`).then((savedPhoto) => {
      if (savedPhoto) {
        setUser((prev) => (prev ? { ...prev, foto: savedPhoto } : prev));
      }
    }).catch(() => {});

    return response;
  };

  const selectRole = async (appId, roleId, roleName, appName) => {
    if (!user) return { error: true, message: "User tidak ditemukan" };

    const response = await authService.getPermission(user.username, appId, roleId);
    if (response.error) {
      return response;
    }

    setAuthToken(response.token);
    setRolePermissions(response.listPermission || []);

    setUser((prev) => ({
      ...prev,
      selectedRole: {
        appId,
        roleId,
        roleName,
        appName,
      },
    }));

    return response;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setSsoData(null);
    setRolePermissions([]);
  };

  // User Management Actions
  const addUser = async (userData) => {
    return await iotService.createUser(userData.username, userData.roleId, userData.status, userData.email, userData.password);
  };

  const updateUser = async (userId, userData) => {
    return await iotService.updateUser(userId, userData.roleId, userData.status, userData.email, userData.password);
  };

  const deleteUser = async (username) => {
    return await iotService.deleteUser(username);
  };

  const contextValue = useMemo(() => ({
    user,
    ssoData,
    rolePermissions,
    login,
    selectRole,
    logout,
    setUser,
    managedUsers,
    addUser,
    updateUser,
    deleteUser,
    notificationsEnabled,
    setNotificationsEnabled,
    refreshInterval,
    setRefreshInterval,
    language,
    setLanguage,
    theme,
    setTheme,
    timezone,
    setTimezone,
    t,
    translateNotification,
    colors,
    showToast,
  }), [
    user,
    ssoData,
    rolePermissions,
    managedUsers,
    notificationsEnabled,
    refreshInterval,
    language,
    theme,
    timezone,
    showToast
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
      {toast && (
        <SwipeableToast
          message={toast.message}
          type={toast.type}
          onPress={toast.onPress}
          colors={colors}
          onDismiss={() => setToast(null)}
        />
      )}
    </UserContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 9999,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser harus digunakan di dalam UserProvider");
  }
  return context;
};
