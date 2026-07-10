import React, { createContext, useContext, useState, useMemo, useCallback, useRef } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import { authService } from "../services/authService";
import { setAuthToken } from "../services/apiClient";
import SwipeableToast from "../components/SwipeableToast";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ssoData, setSsoData] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);

  // Mock User Database matching Figma screen
  const [managedUsers, setManagedUsers] = useState([
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
      nonaktif: "Nonaktif",
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
    },
    English: {
      menu_admin: "ADMIN MENU",
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
      notifikasi_desc: "Enable or disable application notifications",
      refresh_interval: "Refresh Interval",
      refresh_desc: "Set data monitoring refresh interval",
      bahasa: "Language",
      bahasa_desc: "Select application language",
      tema: "App Theme",
      tema_desc: "Select application display theme",
      info_app: "App Information",
      info_desc: "View application version info",
      backup_db: "Database Backup",
      backup_desc: "Perform database backup manually",
      backup_btn: "Backup Now",
      pilih: "Select",
    }
  };

  const t = (key) => {
    const lang = language === "Indonesia" ? "Indonesia" : "English";
    return translations[lang][key] || key;
  };

  const login = async (username, password) => {
    const response = await authService.login(username, password);
    if (response.error) {
      return response;
    }

    setAuthToken(response.token);

    setSsoData({
      username: username,
      nama: response.nama,
      listAplikasi: response.listAplikasi,
    });

    setUser({
      username: username,
      nama: response.nama,
      foto: response.foto || null,
    });

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
  const addUser = (userData) => {
    const newUser = {
      id: `usr${Math.floor(100 + Math.random() * 900)}`,
      registeredSince: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      lastLogin: "-",
      ...userData,
    };
    setManagedUsers((prev) => [...prev, newUser]);
    return { success: true, user: newUser };
  };

  const updateUser = (userId, userData) => {
    setManagedUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...userData } : u))
    );
    return { success: true };
  };

  const deleteUser = (userId) => {
    setManagedUsers((prev) => prev.filter((u) => u.id !== userId));
    return { success: true };
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
    t,
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
