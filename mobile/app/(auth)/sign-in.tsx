// app/(auth)/sign-in.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
  Animated,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const options = { headerShown: false };

export default function SignIn() {
  const { signIn } = useAuth();
  const { role } = useLocalSearchParams<{ role?: "guardian" | "elderly" }>();

  // 🎨 역할별 색상 테마
  const roleColor = role === "guardian" ? "#4CAF50" : "#2196F3";
  const roleHover = role === "guardian" ? "#43A047" : "#1976D2";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const scaleLogin = useRef(new Animated.Value(1)).current;
  const scaleSignup = useRef(new Animated.Value(1)).current;
  const [hoverLogin, setHoverLogin] = useState(false);
  const [hoverSignup, setHoverSignup] = useState(false);

  // ✅ 로그인 완료 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [modalName, setModalName] = useState<string>("");

  // ✅ 로그인 실패 모달 상태
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ 모달 애니메이션 값
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

  // 로그인 동작
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

  // 로그인 성공 후 이동
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
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.flex}
    >
      <ThemedView style={styles.container}>
        {/* 역할별 타이틀 */}
        <ThemedText type="title" style={styles.title}>
          {role === "guardian" ? "👨‍👩‍👧 보호자 로그인" : "👴 피보호자 로그인"}
        </ThemedText>

        {/* 이메일 입력 */}
        <View style={styles.field}>
          <ThemedText>이메일</ThemedText>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            placeholder={emailFocused ? "" : "you@example.com"}
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

        {/* 비밀번호 입력 */}
        <View style={styles.field}>
          <ThemedText>비밀번호</ThemedText>
          <TextInput
            ref={pwRef}
            style={[styles.input, pwFocused && styles.inputFocused]}
            value={pw}
            onChangeText={setPw}
            placeholder={pwFocused ? "" : "••••••••"}
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
          onHoverIn={() => setHoverLogin(true)}
          onHoverOut={() => setHoverLogin(false)}
          style={[
            styles.button,
            { backgroundColor: hoverLogin ? roleHover : roleColor },
            submitting && { opacity: 0.7 },
            { transform: [{ scale: scaleLogin }] },
          ]}
        >
          <ThemedText style={styles.buttonText}>
            {submitting ? "로그인 중…" : "로그인"}
          </ThemedText>
        </AnimatedPressable>

        {/* 회원가입 버튼 */}
        <AnimatedPressable
          onPress={() =>
            router.push({ pathname: "/sign-up/[role]", params: { role } })
          }
          onPressIn={() => pressIn(scaleSignup)}
          onPressOut={() => pressOut(scaleSignup)}
          onHoverIn={() => setHoverSignup(true)}
          onHoverOut={() => setHoverSignup(false)}
          style={[
            styles.secondaryButton,
            { borderColor: roleColor, backgroundColor: "#FFF" },
            hoverSignup && { backgroundColor: "#F0F9FF" },
            { transform: [{ scale: scaleSignup }] },
          ]}
        >
          <ThemedText
            style={[styles.secondaryButtonText, { color: roleColor }]}
          >
            회원가입
          </ThemedText>
        </AnimatedPressable>
      </ThemedView>

      {/* ✅ 로그인 성공 모달 */}
      {modalVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Animated.View
            style={[
              styles.modalCard,
              { transform: [{ scale: modalScale }], borderColor: roleColor, borderWidth: 2 },
            ]}
          >
            {role === "guardian" ? (
              <>
                <ThemedText style={[styles.modalTitle, { color: roleColor }]}>
                  {modalName}
                </ThemedText>
                <ThemedText style={[styles.modalSubTitle, { color: roleColor }]}>
                  보호자님 환영합니다!
                </ThemedText>
              </>
            ) : (
              <ThemedText style={[styles.modalTitle, { color: roleColor }]}>
                {modalName}님 환영합니다!
              </ThemedText>
            )}
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.modalButton,
                { backgroundColor: pressed ? roleHover : roleColor },
              ]}
            >
              <ThemedText style={styles.modalButtonText}>확인</ThemedText>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}

      {/* ❌ 로그인 실패 모달 */}
      {errorModalVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Animated.View
            style={[
              styles.modalCard,
              { transform: [{ scale: modalScale }], borderColor: "red", borderWidth: 2 },
            ]}
          >
            <ThemedText style={[styles.modalTitle, { color: "red" }]}>
              {errorMessage}
            </ThemedText>
            <Pressable
              onPress={() => setErrorModalVisible(false)}
              style={({ pressed }) => [
                styles.modalButton,
                { backgroundColor: pressed ? "#c62828" : "red" },
              ]}
            >
              <ThemedText style={styles.modalButtonText}>닫기</ThemedText>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#EAF6FF" },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 24, textAlign: "center", color: "#333" },
  field: { marginBottom: 18 },
  input: {
    borderWidth: 1, borderColor: "#DDD", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: "#F9F9F9", fontSize: 16,
  },
  inputFocused: { borderColor: "#FFD54F", shadowColor: "#FFD54F", shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  button: { marginTop: 12, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 17 },
  secondaryButton: { marginTop: 12, paddingVertical: 16, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  secondaryButtonText: { fontWeight: "600", fontSize: 17 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", zIndex: 9999, paddingHorizontal: 24 },
  modalCard: { width: "100%", maxWidth: 340, borderRadius: 14, paddingVertical: 20, paddingHorizontal: 16, backgroundColor: "#FFF", alignItems: "center", gap: 12, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  modalTitle: { fontSize: 18, lineHeight: 24, fontWeight: "bold", textAlign: "center" },
  modalSubTitle: { fontSize: 15, lineHeight: 22, textAlign: "center", fontWeight: "500" },
  modalButton: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  modalButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
