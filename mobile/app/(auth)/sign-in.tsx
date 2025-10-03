import React, { useState, useRef, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
  Animated,
  Pressable,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth";
import { ThemedText } from "@/components/ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const options = { headerShown: false };

export default function SignIn() {
  const { signIn } = useAuth();
  const { role } = useLocalSearchParams<{ role?: "guardian" | "elderly" }>();
  const { width: W } = useWindowDimensions();

  // 역할별 색상 테마
  const isGuardian = role === "guardian";
  const primaryColor = isGuardian ? "#42A5F5" : "#66BB6A";
  const primaryHover = isGuardian ? "#1E88E5" : "#4CAF50";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const scaleLogin = useRef(new Animated.Value(1)).current;
  const scaleSignup = useRef(new Animated.Value(1)).current;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalName, setModalName] = useState<string>("");

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const useND = Platform.OS !== "web";
    if (modalVisible || errorModalVisible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: useND,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: useND,
        }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      modalScale.setValue(0.96);
    }
  }, [modalVisible, errorModalVisible, overlayOpacity, modalScale]);

  const pwRef = useRef<TextInput>(null);

  const onSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const { name, role: userRole, elderlyName } = await signIn(
        email.trim(),
        pw,
        role
      );

      let displayName = name;
      if (userRole === "guardian" && elderlyName) {
        displayName = `${name} - (${elderlyName})`;
      }

      await AsyncStorage.setItem("authToken", "1");
      setModalName(displayName);
      setModalVisible(true);
    } catch (e: any) {
      setErrorMessage("사용자 정보가 없습니다.");
      setErrorModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirm = () => {
    setModalVisible(false);
    if (role === "guardian") {
      router.replace("/guardian-home");
    } else {
      router.replace("/elderly-home");
    }
  };

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== "web",
    }).start();

  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
    }).start();

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="dark-content" translucent={Platform.OS !== "web"} />

      {/* 배경 그라디언트 */}
      <LinearGradient
        colors={isGuardian ? ["#B3E5FC", "#E1F5FE", "#F5FAFE"] : ["#C8E6C9", "#E8F5E9", "#F1F8E9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.flex}
        >
          <View style={styles.container}>
            {/* 🔙 뒤로가기 버튼 */}
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace("/role-select")} // ← 무조건 role-select로 이동
            >
              <Ionicons name="arrow-back" size={24} color="#37474F" />
            </Pressable>

            {/* 헤더 */}
            <View style={styles.header}>
              <View style={[styles.iconBadge, { backgroundColor: isGuardian ? "#FFE0B2" : "#C8E6C9" }]}>
                <ThemedText style={styles.iconEmoji}>
                  {isGuardian ? "👨‍👩‍👧" : "👴"}
                </ThemedText>
              </View>
              <ThemedText style={styles.title}>
                {isGuardian ? "보호자 로그인" : "피보호자 로그인"}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {isGuardian ? "가족의 건강을 함께 지켜요" : "건강한 하루를 시작해요"}
              </ThemedText>
            </View>

            {/* 입력 폼 */}
            <View style={styles.formContainer}>
              {/* 이메일 */}
              <View style={styles.field}>
                <ThemedText style={styles.label}>이메일</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    emailFocused && { borderColor: primaryColor, borderWidth: 2 }
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#B0BEC5"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!submitting}
                  returnKeyType="next"
                  onSubmitEditing={() => pwRef.current?.focus()}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              {/* 비밀번호 */}
              <View style={styles.field}>
                <ThemedText style={styles.label}>비밀번호</ThemedText>
                <TextInput
                  ref={pwRef}
                  style={[
                    styles.input,
                    pwFocused && { borderColor: primaryColor, borderWidth: 2 }
                  ]}
                  value={pw}
                  onChangeText={setPw}
                  placeholder="••••••••"
                  placeholderTextColor="#B0BEC5"
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!submitting}
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                  blurOnSubmit
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                />
              </View>

              {/* 로그인 버튼 */}
              <AnimatedPressable
                disabled={submitting}
                onPress={onSubmit}
                onPressIn={() => pressIn(scaleLogin)}
                onPressOut={() => pressOut(scaleLogin)}
                style={[
                  styles.button,
                  submitting && { opacity: 0.7 },
                  { transform: [{ scale: scaleLogin }] },
                ]}
              >
                <LinearGradient
                  colors={[primaryColor, primaryHover]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <ThemedText style={styles.buttonText}>
                    {submitting ? "로그인 중..." : "로그인"}
                  </ThemedText>
                </LinearGradient>
              </AnimatedPressable>

              {/* 회원가입 버튼 */}
              <AnimatedPressable
                onPress={() =>
                  router.push({ pathname: "/sign-up/[role]", params: { role } })
                }
                onPressIn={() => pressIn(scaleSignup)}
                onPressOut={() => pressOut(scaleSignup)}
                style={[
                  styles.secondaryButton,
                  { borderColor: primaryColor },
                  { transform: [{ scale: scaleSignup }] },
                ]}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: primaryColor }]}>
                  회원가입
                </ThemedText>
              </AnimatedPressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* 로그인 성공 모달 */}
      {modalVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Animated.View
            style={[
              styles.modalCard,
              { transform: [{ scale: modalScale }] },
            ]}
          >
            <View style={[styles.modalIconBadge, { backgroundColor: isGuardian ? "#FFE0B2" : "#C8E6C9" }]}>
              <ThemedText style={styles.modalIcon}>
                {isGuardian ? "👨‍👩‍👧" : "✓"}
              </ThemedText>
            </View>
            {isGuardian ? (
              <>
                <ThemedText style={styles.modalTitle}>
                  {modalName}
                </ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  보호자님, 환영합니다
                </ThemedText>
              </>
            ) : (
              <ThemedText style={styles.modalTitle}>
                {`${modalName}님\n환영합니다!`}
              </ThemedText>
            )}
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.modalButton,
                { backgroundColor: pressed ? primaryHover : primaryColor },
              ]}
            >
              <ThemedText style={styles.modalButtonText}>확인</ThemedText>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}

      {/* 로그인 실패 모달 */}
      {errorModalVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Animated.View
            style={[
              styles.modalCard,
              { transform: [{ scale: modalScale }] },
            ]}
          >
            <View style={[styles.modalIconBadge, { backgroundColor: "#FFCDD2" }]}>
              <ThemedText style={styles.modalIcon}>✕</ThemedText>
            </View>
            <ThemedText style={[styles.modalTitle, { color: "#D32F2F" }]}>
              {errorMessage}
            </ThemedText>
            <Pressable
              onPress={() => setErrorModalVisible(false)}
              style={({ pressed }) => [
                styles.modalButton,
                { backgroundColor: pressed ? "#C62828" : "#D32F2F" },
              ]}
            >
              <ThemedText style={styles.modalButtonText}>닫기</ThemedText>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#F5FAFE",
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 50,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconEmoji: {
    fontSize: 40,
    lineHeight: 48, // fontSize보다 살짝 크게
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#01579B",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#4FC3F7",
    fontWeight: "500",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
    justifyContent: "flex-start",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#37474F",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#CFD8DC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#263238",
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 17,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 17,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 32,
    lineHeight: 38,   // fontSize보다 살짝 크게
    textAlign: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#263238",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#263238",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 30,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.7)", // 반투명 배경 (옵션)
  },
});