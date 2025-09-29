// app/(tabs)/mypage.tsx
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
} from "react-native";
import { Redirect, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import LogoutSuccessModal from "@/components/LogoutSuccessModal";

export default function MyPage() {
  const { user, initializing, signOut } = useAuth();
  const [name, setName] = useState(user?.displayName ?? "");
  const [loading, setLoading] = useState(true);
  const [loadedFrom, setLoadedFrom] = useState<"server" | "firestore" | null>(
    null
  );

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutSuccessVisible, setLogoutSuccessVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
        <ActivityIndicator />
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
      Alert.alert("저장 완료", "프로필이 업데이트되었습니다.");
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
      console.log("로그아웃 완료");
    } catch (e) {
      console.warn("로그아웃 실패:", e);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>마이페이지</Text>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={styles.label}>UID</Text>
              <Text style={styles.value}>{user?.uid ?? "-"}</Text>
            </View>
            <View>
              <Text style={styles.label}>이메일</Text>
              <Text style={styles.value}>{user?.email ?? "-"}</Text>
            </View>

            <View>
              <Text style={styles.inputLabel}>
                이름{" "}
                <Text style={styles.subLabel}>
                  ({loadedFrom === "server" ? "서버" : "Firestore"}에서 로드)
                </Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="이름"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <Pressable style={styles.primaryBtn} onPress={onSave}>
              <Text style={styles.primaryBtnText}>저장</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setLogoutModalVisible(true)}
            >
              <Text style={styles.secondaryBtnText}>로그아웃</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* 1. 로그아웃 확인 모달 */}
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

      {/* 2. 로그아웃 완료 모달 */}
      <LogoutSuccessModal
        visible={logoutSuccessVisible}
        role="elderly"
        onClose={() => {
          setLogoutSuccessVisible(false);
          router.replace("/sign-in?role=elderly");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 24, fontWeight: "700", marginBottom: 10 },

  label: { fontSize: 12, color: "#666" },
  value: { fontSize: 14, color: "#333", marginTop: 2 },

  inputLabel: { marginBottom: 6, fontSize: 14, fontWeight: "600" },
  subLabel: { fontSize: 11, color: "#999" },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  primaryBtn: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  secondaryBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#2196F3", fontWeight: "700", fontSize: 16 },
});
