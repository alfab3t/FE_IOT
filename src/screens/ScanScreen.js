import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import Button from "../components/Button";

export default function ScanScreen({ route, navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const { returnScreen } = route.params || {};

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.infoText}>Memuat izin kamera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
          <Text style={styles.permissionText}>
            Aplikasi membutuhkan akses kamera untuk memindai kode QR / MAC Address yang tertempel di perangkat fisik IoT Anda.
          </Text>
          <Button label="Berikan Izin Kamera" onPress={requestPermission} type="primary" />
          <TouchableOpacity
            style={styles.cancelTextBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate(returnScreen || "DevicesList");
              }
            }}
          >
            <Text style={styles.cancelTextLink}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = ({ data }) => {
    // Navigate back to the devices list form and feed scanned value
    navigation.navigate(returnScreen || "DevicesList", { scannedCode: data });
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan QR Code Perangkat</Text>
        </View>
        
        <View style={styles.scannerFrame} />
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate(returnScreen || "DevicesList");
            }
          }}
        >
          <Text style={styles.cancelText}>Batal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  infoText: {
    fontSize: 14,
    color: "#6c757d",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
  },
  permissionContent: {
    padding: 24,
    alignItems: "center",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  cancelTextBtn: {
    marginTop: 16,
    padding: 8,
  },
  cancelTextLink: {
    fontSize: 15,
    color: "#0059AB",
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  header: {
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#10b981",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
