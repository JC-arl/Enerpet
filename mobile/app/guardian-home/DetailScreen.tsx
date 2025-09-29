import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import LogoutSuccessModal from "@/components/LogoutSuccessModal";

type HealthRecord = {
  id: number;
  timestamp: string;
  heart_rate: number;
  steps: number;
  calories: number;
};

export default function DetailScreen() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const { signOut } = useAuth();

  // ✅ 로그아웃 상태값
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutSuccessVisible, setLogoutSuccessVisible] = useState(false);

  useEffect(() => {
    fetch("http://10.0.2.2:4000/api/elderly/uuid-1234/health-data?date=2025-09-27")
      .then((res) => res.json())
      .then((data) => setRecords(data.records))
      .catch(() => {
        // 더미 데이터
        setRecords([
          { id: 1, timestamp: "2025-09-27 08:00", heart_rate: 85, steps: 1200, calories: 100 },
          { id: 2, timestamp: "2025-09-27 12:00", heart_rate: 90, steps: 3000, calories: 200 },
          { id: 3, timestamp: "2025-09-27 18:00", heart_rate: 95, steps: 5000, calories: 350 },
        ]);
      });
  }, []);

  // ✅ 실제 로그아웃 처리
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
    <View style={styles.container}>
      {/* 상단 로그아웃 버튼 */}
      <View style={styles.topRow}>
        <Pressable
          onPress={() => setLogoutModalVisible(true)}
          disabled={loggingOut}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutBtnPressed,
            loggingOut && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.logoutText}>
            {loggingOut ? "로그아웃 중…" : "로그아웃"}
          </Text>
        </Pressable>
      </View>

      {/* 건강 데이터 리스트 */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.time}>🕒 {item.timestamp}</Text>
            <Text>❤️ 심박수: {item.heart_rate}</Text>
            <Text>👣 걸음 수: {item.steps}</Text>
            <Text>🔥 칼로리: {item.calories}</Text>
          </View>
        )}
      />

      {/* 1. 로그아웃 확인 모달 */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={loggingOut}
        role="guardian" // ✅ 보호자용
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={() => {
          setLogoutModalVisible(false);
          setLogoutSuccessVisible(true); // ✅ 완료 모달 먼저 띄우기
          onSignOut(); // ✅ 실제 로그아웃 비동기 실행
        }}
      />

      {/* 2. 로그아웃 완료 모달 */}
      <LogoutSuccessModal
        visible={logoutSuccessVisible}
        role="guardian" // ✅ 보호자용
        onClose={() => {
          setLogoutSuccessVisible(false);
          router.replace("/sign-in?role=guardian"); // ✅ 보호자 로그인 페이지로 이동
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },

  // ✅ 보호자용: 초록 계열 색상 적용
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#388E3C",  // 조금 더 진한 초록
    backgroundColor: "#4CAF50", // 기본 초록색 배경
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  logoutBtnPressed: {
    backgroundColor: "#388E3C", // 눌렀을 때 진한 초록
    borderColor: "#2E7D32",
  },
  logoutText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  time: { fontWeight: "bold", marginBottom: 4 },
});
