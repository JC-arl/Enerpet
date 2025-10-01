import React, { useState, useRef } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
  Animated,
  Pressable,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { ThemedText } from "@/components/ThemedText";
import { LinearGradient } from "expo-linear-gradient";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  role: "guardian" | "elderly";
};

export default function SignUpForm({ role }: Props) {
  const { signUp } = useAuth();

  // 역할별 색상 테마
  const isGuardian = role === "guardian";
  const primaryColor = isGuardian ? "#42A5F5" : "#66BB6A";
  const primaryHover = isGuardian ? "#1E88E5" : "#4CAF50";
  const primaryDisabled = isGuardian ? "#90CAF9" : "#C8E6C9";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");
  const [elderlyName, setElderlyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [focused, setFocused] = useState({
    name: false,
    email: false,
    pw: false,
    pwCheck: false,
    elderlyName: false,
  });

  const scaleSubmit = useRef(new Animated.Value(1)).current;

  // 유효성 검사
  const isEmailValid = email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = pw === pwCheck || pwCheck === "";
  const isPasswordValid = pw.length >= 6;
  const isFormValid =
    name.trim() !== "" &&
    isEmailValid &&
    isPasswordValid &&
    isPasswordMatch &&
    pwCheck !== "" &&
    (role === "guardian" ? elderlyName.trim() !== "" : true);

  const mapFirebaseError = (code?: string) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "이미 사용 중인 이메일입니다.";
      case "auth/invalid-email":
        return "이메일 형식이 올바르지 않아요.";
      case "auth/weak-password":
        return "비밀번호는 6자 이상으로 설정해주세요.";
      case "auth/network-request-failed":
        return "네트워크 오류가 발생했어요. 연결을 확인해주세요.";
      default:
        return "회원가입에 실패했어요. 잠시 후 다시 시도해주세요.";
    }
  };

  const onSubmit = async () => {
    if (submitting || !isFormValid) return;
    try {
      setSubmitting(true);
      await signUp(name.trim(), email.trim(), pw, role, elderlyName.trim());
      router.replace({ pathname: "/sign-in", params: { role } });
    } catch (e: any) {
      const msg = mapFirebaseError(e?.code) ?? e?.message ?? "다시 시도해주세요.";
      Alert.alert("회원가입 실패", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pressIn = () => {
    Animated.spring(scaleSubmit, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scaleSubmit, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

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
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 헤더 */}
            <View style={styles.header}>
              <View style={[styles.iconBadge, { backgroundColor: isGuardian ? "#FFE0B2" : "#C8E6C9" }]}>
                <ThemedText style={styles.iconEmoji}>
                  {isGuardian ? "👨‍👩‍👧" : "👴"}
                </ThemedText>
              </View>
              <ThemedText style={styles.title}>
                {isGuardian ? "보호자 회원가입" : "피보호자 회원가입"}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {isGuardian ? "가족의 건강을 함께 관리해요" : "건강한 삶을 시작해요"}
              </ThemedText>
            </View>

            {/* 입력 폼 */}
            <View style={styles.formContainer}>
              {/* 닉네임 */}
              <View style={styles.field}>
                <ThemedText style={styles.label}>닉네임</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    focused.name && { borderColor: primaryColor, borderWidth: 2 }
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="닉네임"
                  placeholderTextColor="#B0BEC5"
                  onFocus={() => setFocused({ ...focused, name: true })}
                  onBlur={() => setFocused({ ...focused, name: false })}
                  editable={!submitting}
                />
              </View>

              {/* 보호자일 경우: 피보호자 이름 */}
              {role === "guardian" && (
                <View style={styles.field}>
                  <ThemedText style={styles.label}>피보호자 이름</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      focused.elderlyName && { borderColor: primaryColor, borderWidth: 2 }
                    ]}
                    value={elderlyName}
                    onChangeText={setElderlyName}
                    placeholder="예: 박영희"
                    placeholderTextColor="#B0BEC5"
                    onFocus={() => setFocused({ ...focused, elderlyName: true })}
                    onBlur={() => setFocused({ ...focused, elderlyName: false })}
                    editable={!submitting}
                  />
                </View>
              )}

              {/* 이메일 */}
              <View style={styles.field}>
                <ThemedText style={styles.label}>이메일</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    focused.email && { borderColor: primaryColor, borderWidth: 2 }
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#B0BEC5"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocused({ ...focused, email: true })}
                  onBlur={() => setFocused({ ...focused, email: false })}
                  editable={!submitting}
                />
                {!isEmailValid && email !== "" && (
                  <ThemedText style={styles.errorText}>
                    올바른 이메일 형식이 아닙니다.
                  </ThemedText>
                )}
              </View>

              {/* 비밀번호 */}
              <View style={styles.field}>
                <ThemedText style={styles.label}>비밀번호</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    focused.pw && { borderColor: primaryColor, borderWidth: 2 }
                  ]}
                  value={pw}
                  onChangeText={setPw}
                  placeholder="최소 6자 이상"
                  placeholderTextColor="#B0BEC5"
                  secureTextEntry
                  onFocus={() => setFocused({ ...focused, pw: true })}
                  onBlur={() => setFocused({ ...focused, pw: false })}
                  editable={!submitting}
                />
                {!isPasswordValid && pw !== "" && (
                  <ThemedText style={styles.errorText}>
                    비밀번호는 최소 6자 이상이어야 합니다.
                  </ThemedText>
                )}
              </View>

              {/* 비밀번호 확인 */}
              <View style={styles.field}>
                <ThemedText style={styles.label}>비밀번호 확인</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    focused.pwCheck && { borderColor: primaryColor, borderWidth: 2 }
                  ]}
                  value={pwCheck}
                  onChangeText={setPwCheck}
                  placeholder="비밀번호와 일치해야 합니다"
                  placeholderTextColor="#B0BEC5"
                  secureTextEntry
                  onFocus={() => setFocused({ ...focused, pwCheck: true })}
                  onBlur={() => setFocused({ ...focused, pwCheck: false })}
                  editable={!submitting}
                  onSubmitEditing={onSubmit}
                />
                {!isPasswordMatch && pwCheck !== "" && (
                  <ThemedText style={styles.errorText}>
                    비밀번호가 일치하지 않습니다.
                  </ThemedText>
                )}
              </View>

              {/* 가입 버튼 */}
              <AnimatedPressable
                disabled={!isFormValid || submitting}
                onPress={onSubmit}
                onPressIn={pressIn}
                onPressOut={pressOut}
                style={[
                  styles.button,
                  (!isFormValid || submitting) && { opacity: 0.7 },
                  { transform: [{ scale: scaleSubmit }] },
                ]}
              >
                <LinearGradient
                  colors={
                    !isFormValid || submitting
                      ? [primaryDisabled, primaryDisabled]
                      : [primaryColor, primaryHover]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <ThemedText style={styles.buttonText}>
                    {submitting ? "가입 중..." : "가입하기"}
                  </ThemedText>
                </LinearGradient>
              </AnimatedPressable>

              {/* 로그인 링크 */}
              <View style={styles.row}>
                <ThemedText style={styles.linkText}>이미 계정이 있나요? </ThemedText>
                <Link href={{ pathname: "/sign-in", params: { role } }}>
                  <ThemedText style={[styles.linkButton, { color: primaryColor }]}>
                    로그인
                  </ThemedText>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
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
  row: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: "#546E7A",
  },
  linkButton: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 6,
    color: "#D32F2F",
    fontSize: 13,
    fontWeight: "500",
  },
});