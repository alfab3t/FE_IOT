import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, X } from "lucide-react-native";
import { useUser } from "../context/UserContext";

const formatDate = (date, lang = "Indonesia") => {
  if (!date) return lang === "Indonesia" ? "Pilih" : "Select";
  return date.toLocaleDateString(lang === "Indonesia" ? "id-ID" : "en-US", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * Props:
 * - startDate, endDate: Date | null
 * - onChange: (start, end) => void
 * - colors: theme colors from useUser()
 */
export default function DateRangeFilter({ startDate, endDate, onChange, colors }) {
  const { language } = useUser();
  const [activeTarget, setActiveTarget] = useState(null); // "start" | "end" | null
  const [tempDate, setTempDate] = useState(new Date());

  const openPicker = (target) => {
    setTempDate((target === "start" ? startDate : endDate) || new Date());
    setActiveTarget(target);
  };

  const closePicker = () => setActiveTarget(null);

  // Android: langsung apply begitu user pilih tanggal (native dialog udah punya tombol sendiri)
  const handleAndroidChange = (event, selectedDate) => {
    setActiveTarget(null);
    if (event.type === "dismissed" || !selectedDate) return;
    if (activeTarget === "start") onChange(selectedDate, endDate);
    else if (activeTarget === "end") onChange(startDate, selectedDate);
  };

  // iOS: user geser-geser dulu di dalam modal, baru "Selesai" apply
  const handleIosChange = (event, selectedDate) => {
    if (selectedDate) setTempDate(selectedDate);
  };

  const confirmIos = () => {
    if (activeTarget === "start") onChange(tempDate, endDate);
    else if (activeTarget === "end") onChange(startDate, tempDate);
    closePicker();
  };

  const clearRange = () => onChange(null, null);

  return (
    <View style={styles.wrapper}>
      <View style={styles.pillRow}>
        <TouchableOpacity
          style={[styles.pillBtn, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
          onPress={() => openPicker("start")}
        >
          <Calendar size={13} color="#0059AB" />
          <View>
            <Text style={[styles.pillLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Dari" : "From"}</Text>
            <Text style={[styles.pillText, { color: colors.text }]}>{formatDate(startDate, language)}</Text>
          </View>
        </TouchableOpacity>

        <Text style={{ color: colors.textMuted, fontWeight: "700" }}>—</Text>

        <TouchableOpacity
          style={[styles.pillBtn, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
          onPress={() => openPicker("end")}
        >
          <Calendar size={13} color="#0059AB" />
          <View>
            <Text style={[styles.pillLabel, { color: colors.textMuted }]}>{language === "Indonesia" ? "Sampai" : "To"}</Text>
            <Text style={[styles.pillText, { color: colors.text }]}>{formatDate(endDate, language)}</Text>
          </View>
        </TouchableOpacity>

        {(startDate || endDate) && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearRange}>
            <X size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Android: native dialog, tidak butuh Modal pembungkus */}
      {Platform.OS === "android" && activeTarget && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          maximumDate={new Date()}
        />
      )}

      {/* iOS: dibungkus Modal biar nggak dorong layout & keluar dari card */}
      {Platform.OS === "ios" && (
        <Modal visible={!!activeTarget} transparent animationType="fade" onRequestClose={closePicker}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {activeTarget === "start" ? (language === "Indonesia" ? "Pilih Tanggal Mulai" : "Select Start Date") : (language === "Indonesia" ? "Pilih Tanggal Selesai" : "Select End Date")}
                </Text>
                <TouchableOpacity onPress={closePicker}>
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={handleIosChange}
                maximumDate={new Date()}
                style={{ alignSelf: "center" }}
              />

              <TouchableOpacity style={styles.confirmBtn} onPress={confirmIos}>
                <Text style={styles.confirmBtnText}>{language === "Indonesia" ? "Selesai" : "Done"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: "600",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  clearBtn: {
    padding: 4,
  },
  // Modal (iOS)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalSheet: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  confirmBtn: {
    backgroundColor: "#0059AB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});