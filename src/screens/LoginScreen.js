import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import AnimatedEntrance from "../components/AnimatedEntrance";
import OrbitingNetwork from "../components/OrbitingNetwork";
import {
  Wifi,
  Thermometer,
  Lightbulb,
  Droplet,
  Zap,
  Activity,
  User,
  Lock,
  Eye,
  EyeOff,
  RotateCw,
  Radio,
} from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const { login, showToast, colors } = useUser();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);

  // Captcha states
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  const memoizedHeader = useMemo(() => {
    return (
      <View style={styles.skyHeader}>
        {/* Hexagon IoT Network Circles */}
        <AnimatedEntrance type="zoom" duration={800} style={styles.networkContainer}>
          {/* Outer Dashed Circle */}
          <View style={styles.dashedCircleOuter} />
          {/* Inner Dashed Circle */}
          <View style={styles.dashedCircleInner} />

          {/* Center Logo Card */}
          <View style={styles.logoCard}>
            <Image
              source={require("../../assets/logo_icon_iot.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* 6 Orbiting Network Badges around Logo */}
          <OrbitingNetwork radius={110} duration={18000}>
            <View style={styles.badgeContainer}>
              <Wifi size={18} color="#0059AB" />
            </View>
            <View style={styles.badgeContainer}>
              <Thermometer size={18} color="#0059AB" />
            </View>
            <View style={styles.badgeContainer}>
              <Lightbulb size={18} color="#0059AB" />
            </View>
            <View style={styles.badgeContainer}>
              <Activity size={18} color="#0059AB" />
            </View>
            <View style={styles.badgeContainer}>
              <Zap size={18} color="#0059AB" />
            </View>
            <View style={styles.badgeContainer}>
              <Droplet size={18} color="#0059AB" />
            </View>
          </OrbitingNetwork>
        </AnimatedEntrance>

        {/* ASTRATech IoT Title Header */}
        <AnimatedEntrance type="fade" delay={200} style={styles.titleWrapper}>
          <Text style={styles.appTitle}>ASTRAtech IoT</Text>
          <Text style={styles.appDescription}>
            Kelola perangkat, pantau data sensor, dan kendalikan sistem IoT secara real-time dalam satu platform yang terintegrasi.
          </Text>
        </AnimatedEntrance>
      </View>
    );
  }, [colors]);

  const generateCaptcha = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    let localSeed = Date.now();
    for (let i = 0; i < 6; i++) {
      localSeed = (localSeed * 1664525 + 1013904223) % 4294967296;
      const randomIndex = Math.floor((localSeed / 4294967296) * chars.length);
      code += chars.charAt(randomIndex);
    }
    setCaptchaCode(code);
    setCaptchaInput("");
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleLogin = async () => {
    if (!username || !password || !captchaInput) {
      showToast("Username, Password, dan Captcha wajib diisi.", "error");
      return;
    }

    if (captchaInput !== captchaCode) {
      showToast("Kode captcha salah.", "error");
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    const response = await login(username, password);
    setIsLoading(false);

    if (response.error) {
      showToast(response.message || "Username atau password tidak valid.", "error");
      generateCaptcha();
    } else {
      showToast("Login berhasil!", "success");
      navigation.replace("SSOSelectRole");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Memoized Top Header Space to prevent flickering on keystroke state changes */}
          {memoizedHeader}

          {/* Conditional Screens: Splash Page OR Bottom Sheet Login Form */}
          {!showLoginForm ? (
            /* ================= SPLASH PAGE ================= */
            <View style={styles.splashContent}>
              <AnimatedEntrance type="slideUp" delay={300} style={styles.loginBtnWrapper}>
                <TouchableOpacity
                  style={styles.splashLoginBtn}
                  onPress={() => {
                    setShowLoginForm(true);
                    setHasSeenIntro(true);
                  }}
                >
                  <Text style={styles.splashLoginBtnText}>Login</Text>
                </TouchableOpacity>
              </AnimatedEntrance>

              {/* Campus Building Illustration at the bottom */}
              {hasSeenIntro ? (
                <View style={styles.campusIllustrationWrapper}>
                  <Image
                    source={require("../../assets/login_bottom.png")}
                    style={styles.campusImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <AnimatedEntrance type="fade" delay={500} style={styles.campusIllustrationWrapper}>
                  <Image
                    source={require("../../assets/login_bottom.png")}
                    style={styles.campusImage}
                    resizeMode="contain"
                  />
                </AnimatedEntrance>
              )}
            </View>
          ) : (
            /* ================= LOGIN FORM BOTTOM SHEET ================= */
            <AnimatedEntrance type="slideUp" duration={500} style={styles.bottomSheet}>
              <Text style={styles.sheetTitle}>Login</Text>
              <Text style={styles.sheetSubtitle}>Kelola perangkat IoT dengan mudah</Text>

              {/* Input Username */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>
                  Username<Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan username"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Input Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>
                  Password<Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secureText}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setSecureText(!secureText)}
                  >
                    {secureText ? (
                      <Eye size={18} color="#94a3b8" />
                    ) : (
                      <EyeOff size={18} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Verification Captcha */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>
                  Verifikasi Captcha<Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.captchaRow}>
                  <View style={styles.captchaBox}>
                    <Text style={styles.captchaText}>{captchaCode}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.captchaRefreshBtn}
                    onPress={generateCaptcha}
                    disabled={isLoading}
                  >
                    <RotateCw size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan kode captcha"
                    placeholderTextColor="#94a3b8"
                    value={captchaInput}
                    onChangeText={setCaptchaInput}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.btnSubmit, { flex: 1 }]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnSubmitText}>Masuk</Text>
                  )}
                </TouchableOpacity>
              </View>
            </AnimatedEntrance>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0f2fe", // soft blue light gradient top background
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  skyHeader: {
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 24,
  },
  networkContainer: {
    width: 260,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  dashedCircleOuter: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderStyle: "dashed",
  },
  dashedCircleInner: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderStyle: "dashed",
  },
  logoCard: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#bae6fd",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  badgeContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#bae6fd",
  },
  titleWrapper: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0059AB",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  appDescription: {
    fontSize: 12.5,
    color: "#0369a1", // deep sky blue
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
  },
  splashContent: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
    marginTop: 30,
  },
  loginBtnWrapper: {
    width: "100%",
    paddingHorizontal: 36,
    marginBottom: 40,
  },
  splashLoginBtn: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#b9e6fe",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  splashLoginBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0059AB",
    backgroundColor: "transparent",
  },
  campusIllustrationWrapper: {
    width: width,
    height: height * 0.20,
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  campusImage: {
    width: "85%",
    height: "100%",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 10,
    marginTop: 40,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0059AB",
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 12.5,
    color: "#64748b",
    marginBottom: 24,
    fontWeight: "500",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: "#ef4444",
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: "#fff",
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
    height: "100%",
  },
  eyeBtn: {
    padding: 6,
  },
  captchaRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  captchaBox: {
    flex: 1,
    height: 48,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  captchaText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 4,
    color: "#1e3a8a",
    textDecorationLine: "line-through",
    fontStyle: "italic",
  },
  captchaRefreshBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#0059AB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  btnBack: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  btnBackText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  btnSubmit: {
    flex: 2,
    backgroundColor: "#0059AB",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0059AB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
});
