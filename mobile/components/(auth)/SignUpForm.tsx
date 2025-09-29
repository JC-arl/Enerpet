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
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  role: "guardian" | "elderly";
};

export default function SignUpForm({ role }: Props) {
  const { signUp } = useAuth();

  // 🎨 역할별 색상 테마
  const themes = {
    guardian: { main: "#4CAF50", hover: "#43A047", disabled: "#A5D6A7" },
    elderly: { main: "#2196F3", hover: "#1976D2", disabled: "#90CAF9" },
  };
  const theme = themes[role];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");
  const [elderlyName, setElderlyName] = useState(""); // ✅ 보호자용 필드
  const [submitting, setSubmitting] = useState(false);

  const [focused, setFocused] = useState({
    name: false,
    email: false,
    pw: false,
    pwCheck: false,
    elderlyName: false,
  });

  const [hoveredSubmit, setHoveredSubmit] = useState(false);
  const scaleSubmit = useRef(new Animated.Value(1)).current;

  // ✅ 유효성 검사
  const isEmailValid =
    email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = pw === pwCheck || pwCheck === "";
  const isPasswordValid = pw.length >= 6;
  const isFormValid =
    name.trim() !== "" &&
    isEmailValid &&
    isPasswordValid &&
    isPasswordMatch &&
    pwCheck !== "" &&
    (role === "guardian" ? elderlyName.trim() !== "" : true); // ✅ 보호자일 때만 추가 체크

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
      await signUp(name.trim(), email.trim(), pw, role, elderlyName.trim()); // ✅ elderlyName도 전달
      router.replace({ pathname: "/sign-in", params: { role } });
    } catch (e: any) {
      const msg =
        mapFirebaseError(e?.code) ?? e?.message ?? "다시 시도해주세요.";
      Alert.alert("회원가입 실패", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onPressInSubmit = () => {
    Animated.spring(scaleSubmit, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };
  const onPressOutSubmit = () => {
    Animated.spring(scaleSubmit, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.flex}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          {role === "guardian" ? "👨‍👩‍👧 보호자 회원가입" : "👴 노인 회원가입"}
        </ThemedText>

        {/* 닉네임 */}
        <View style={styles.field}>
          <ThemedText>닉네임</ThemedText>
          <TextInput
            style={[styles.input, focused.name && styles.inputFocused]}
            value={name}
            onChangeText={setName}
            placeholder={focused.name ? "" : "닉네임"}
            onFocus={() => setFocused({ ...focused, name: true })}
            onBlur={() => setFocused({ ...focused, name: false })}
            editable={!submitting}
          />
        </View>

        {/* 보호자일 경우: 노인 이름 */}
        {role === "guardian" && (
          <View style={styles.field}>
            <ThemedText>피보호자 이름</ThemedText>
            <TextInput
              style={[styles.input, focused.elderlyName && styles.inputFocused]}
              value={elderlyName}
              onChangeText={setElderlyName}
              placeholder={focused.elderlyName ? "" : "예: 박영희"}
              onFocus={() => setFocused({ ...focused, elderlyName: true })}
              onBlur={() => setFocused({ ...focused, elderlyName: false })}
              editable={!submitting}
            />
          </View>
        )}

        {/* 이메일 */}
        <View style={styles.field}>
          <ThemedText>이메일</ThemedText>
          <TextInput
            style={[styles.input, focused.email && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            placeholder={focused.email ? "" : "you@example.com"}
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
          <ThemedText>비밀번호</ThemedText>
          <TextInput
            style={[styles.input, focused.pw && styles.inputFocused]}
            value={pw}
            onChangeText={setPw}
            placeholder={focused.pw ? "" : "최소 6자 이상"}
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
          <ThemedText>비밀번호 확인</ThemedText>
          <TextInput
            style={[styles.input, focused.pwCheck && styles.inputFocused]}
            value={pwCheck}
            onChangeText={setPwCheck}
            placeholder={focused.pwCheck ? "" : "비밀번호와 일치해야 합니다."}
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
          onPressIn={onPressInSubmit}
          onPressOut={onPressOutSubmit}
          onHoverIn={() => setHoveredSubmit(true)}
          onHoverOut={() => setHoveredSubmit(false)}
          style={[
            styles.button,
            {
              backgroundColor:
                !isFormValid || submitting ? theme.disabled : theme.main,
            },
            hoveredSubmit && isFormValid && { backgroundColor: theme.hover },
            { transform: [{ scale: scaleSubmit }] },
          ]}
        >
          <ThemedText style={styles.buttonText}>
            {submitting ? "가입 중…" : "가입하기"}
          </ThemedText>
        </AnimatedPressable>

        {/* 로그인 링크 */}
        <View style={styles.row}>
          <ThemedText>이미 계정이 있나요? </ThemedText>
          <Link href={{ pathname: "/sign-in", params: { role } }}>
            <ThemedText type="link" style={{ color: theme.main }}>
              로그인
            </ThemedText>
          </Link>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#EAF6FF" },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#333",
  },
  field: { marginBottom: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#F9F9F9",
    fontSize: 16,
  },
  inputFocused: {
    borderColor: "#FFD54F",
    shadowColor: "#FFD54F",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 17 },
  row: { marginTop: 16, flexDirection: "row", justifyContent: "center" },
  errorText: { marginTop: 4, color: "red", fontSize: 13 },
});
