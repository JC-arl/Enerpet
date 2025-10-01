import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Redirect, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import LogoutSuccessModal from "@/components/LogoutSuccessModal";
import SaveSuccessModal from "@/components/SaveSuccessModal";

export default function MyPage() {
  const { user, initializing, signOut } = useAuth();
  const [name, setName] = useState(user?.displayName ?? "");
  const [loading, setLoading] = useState(true);
  const [loadedFrom, setLoadedFrom] = useState<"server" | "firestore" | null>(null);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutSuccessVisible, setLogoutSuccessVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        if (data?.name) setName(String(data.name));
        setLoadedFrom((prev) => prev ?? "firestore");
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user?.uid]);

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    );
  }

  if (!user && !logoutSuccessVisible) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const onSave = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: name || "" });
      await setDoc(
        doc(db, "users", user.uid),
        { name: name || "" },
        { merge: true }
      );
      // ✅ Alert 대신 모달 열기
      setSaveSuccessVisible(true);
    } catch (e: any) {
      Alert.alert("오류", e?.message ?? "저장 중 문제가 발생했습니다.");
    }
  };

  const onSignOut = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await signOut();
      await AsyncStorage.removeItem("authToken");
    } catch (e) {
      console.warn("로그아웃 실패:", e);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* 배경 그라디언트 */}
      <LinearGradient
        colors={["#C8E6C9", "#E8F5E9", "#F1F8E9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>마이페이지</Text>
            <Text style={styles.pageSubtitle}>내 정보를 확인하고 수정하세요</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#66BB6A" />
            </View>
          ) : (
            <View style={styles.content}>
              {/* 정보 카드 */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>이메일</Text>
                  <Text style={styles.infoValue}>{user?.email ?? "-"}</Text>
                </View>
              </View>

              {/* 이름 수정 카드 */}
              <View style={styles.editCard}>
                <Text style={styles.cardTitle}>이름 수정</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="이름을 입력하세요"
                  placeholderTextColor="#B0BEC5"
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    nameFocused && styles.inputFocused
                  ]}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
                <Text style={styles.helpText}>
                  {loadedFrom === "server" ? "서버" : "Firestore"}에서 로드됨
                </Text>
              </View>

              {/* 저장 버튼 */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && styles.saveBtnPressed
                ]}
                onPress={onSave}
              >
                <LinearGradient
                  colors={["#66BB6A", "#4CAF50"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGradient}
                >
                  <Text style={styles.saveBtnText}>저장하기</Text>
                </LinearGradient>
              </Pressable>

              {/* 로그아웃 버튼 */}
              <Pressable
                style={({ pressed }) => [
                  styles.logoutBtn,
                  pressed && styles.logoutBtnPressed
                ]}
                onPress={() => setLogoutModalVisible(true)}
              >
                <Text style={styles.logoutBtnText}>로그아웃</Text>
              </Pressable>

              {/* UID (선택사항 - 개발자용) */}
              <View style={styles.debugInfo}>
                <Text style={styles.debugLabel}>UID (개발자 정보)</Text>
                <Text style={styles.debugValue}>{user?.uid ?? "-"}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* 로그아웃 확인 모달 */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={loggingOut}
        role="elderly"
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={() => {
          setLogoutModalVisible(false);
          setLogoutSuccessVisible(true);
          onSignOut();
        }}
      />

      {/* 로그아웃 완료 모달 */}
      <LogoutSuccessModal
        visible={logoutSuccessVisible}
        role="elderly"
        onClose={() => {
          setLogoutSuccessVisible(false);
          router.replace("/sign-in?role=elderly");
        }}
      />

      {/* 저장 완료 모달 */}
      <SaveSuccessModal
        visible={saveSuccessVisible}
        onClose={() => setSaveSuccessVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F8E9",
  },

  header: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2E7D32",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15,
    color: "#66BB6A",
    fontWeight: "500",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },

  content: {
    gap: 16,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: "#66BB6A",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: "#2E7D32",
    fontWeight: "600",
  },

  editCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F9F9F9",
    fontSize: 16,
    color: "#263238",
  },
  inputFocused: {
    borderColor: "#66BB6A",
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  helpText: {
    fontSize: 12,
    color: "#81C784",
    marginTop: 8,
    fontWeight: "500",
  },

  saveBtn: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  saveBtnPressed: {
    opacity: 0.9,
  },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 17,
  },

  logoutBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FF7043",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutBtnPressed: {
    backgroundColor: "#FFF3E0",
  },
  logoutBtnText: {
    color: "#FF7043",
    fontWeight: "700",
    fontSize: 17,
  },

  debugInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  debugLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  debugValue: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
  },
});