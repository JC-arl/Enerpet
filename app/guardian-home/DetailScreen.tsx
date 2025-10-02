import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import LogoutSuccessModal from "@/components/LogoutSuccessModal";
import { useAuth } from "@/lib/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from "@react-native-firebase/firestore";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  NativeModules,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { HealthModule } = NativeModules;

type HealthRecord = {
  id: number;
  timestamp: string;
  heart_rate: number;
  steps: number;
  calories: number;
};

export default function DetailScreen() {
  const { signOut } = useAuth();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutSuccessVisible, setLogoutSuccessVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Health Connect에서 데이터 가져오기 및 Firestore 저장
  const fetchAndSaveHealthData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      if (!HealthModule) throw new Error("Health Connect 모듈을 찾을 수 없습니다.");

      // 오늘 날짜
      const today = new Date().toISOString().split("T")[0];

      // 네이티브 모듈 호출
      const data = await HealthModule.getTodayHealthData();

      // Firestore에 저장/업데이트
      const existing = await firestore()
        .collection("healthData")
        .where("date", "==", today)
        .limit(1)
        .get();

      if (existing.empty) {
        await firestore().collection("healthData").add({
          heartRate: data.heartRate ?? 0,
          steps: data.steps ?? 0,
          calories: data.calories ?? 0,
          distance: data.distance ?? 0,
          activeCalories: data.activeCalories ?? 0,
          date: today,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
        console.log("헬스 데이터가 Firestore에 저장되었습니다.");
      } else {
        await firestore()
          .collection("healthData")
          .doc(existing.docs[0].id)
          .update({
            heartRate: data.heartRate ?? 0,
            steps: data.steps ?? 0,
            calories: data.calories ?? 0,
            distance: data.distance ?? 0,
            activeCalories: data.activeCalories ?? 0,
            timestamp: firestore.FieldValue.serverTimestamp(),
          });
        console.log("헬스 데이터가 Firestore에 업데이트되었습니다.");
      }
    } catch (err) {
      console.error("건강 데이터 처리 오류:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 초기 데이터 로딩
  useEffect(() => {
    fetchAndSaveHealthData(true);
  }, [fetchAndSaveHealthData]);

  // 1) 일정 주기마다 Health Connect → Firestore 저장 (1분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAndSaveHealthData(false);
    }, 60000); // 1분마다

    return () => clearInterval(interval);
  }, [fetchAndSaveHealthData]);

  // 2) Firestore 실시간 구독 (오늘 데이터 자동 반영)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    const unsubscribe = firestore()
      .collection("healthData")
      .where("date", "==", today)
      .limit(1)
      .onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0].data();
          
          // 현재 시간으로 타임스탬프 생성
          const now = new Date();
          const timeString = `${today} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          // UI용 레코드 생성
          const newRecord: HealthRecord = {
            id: 1,
            timestamp: timeString,
            heart_rate: doc.heartRate ?? 0,
            steps: doc.steps ?? 0,
            calories: doc.calories ?? 0,
          };

          setRecords([newRecord]);
        }
      });

    return () => unsubscribe();
  }, []);

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

  // 수동 새로고침
  const handleRefresh = () => {
    fetchAndSaveHealthData(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={{ marginTop: 8 }}>건강 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>상세 기록</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString("ko-KR")}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={({ pressed }) => [
              styles.refreshBtn,
              pressed && styles.refreshBtnPressed,
              isRefreshing && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.refreshText}>
              {isRefreshing ? "⏳" : "🔄"}
            </Text>
          </Pressable>
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
      </View>

      {/* 타임라인 리스트 */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item, index }) => (
          <View style={styles.timelineItem}>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {item.timestamp.split(" ")[1]}
              </Text>
            </View>

            <View style={styles.timelineTrack}>
              <View style={styles.timelineDot} />
              {index !== records.length - 1 && (
                <View style={styles.timelineLine} />
              )}
            </View>

            <View style={styles.dataCard}>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataIcon}>❤️</Text>
                  <View>
                    <Text style={styles.dataValue}>
                      {item.heart_rate > 0 ? item.heart_rate : '-'}
                    </Text>
                    <Text style={styles.dataLabel}>심박수</Text>
                  </View>
                </View>

                <View style={styles.dataItem}>
                  <Text style={styles.dataIcon}>👣</Text>
                  <View>
                    <Text style={styles.dataValue}>
                      {item.steps.toLocaleString()}
                    </Text>
                    <Text style={styles.dataLabel}>걸음 수</Text>
                  </View>
                </View>

                <View style={styles.dataItem}>
                  <Text style={styles.dataIcon}>🔥</Text>
                  <View>
                    <Text style={styles.dataValue}>{item.calories}</Text>
                    <Text style={styles.dataLabel}>칼로리</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>오늘의 건강 데이터가 없습니다.</Text>
            <Pressable style={styles.emptyRefreshBtn} onPress={handleRefresh}>
              <Text style={styles.emptyRefreshText}>데이터 불러오기</Text>
            </Pressable>
          </View>
        }
      />

      {/* 모달 */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={loggingOut}
        role="guardian"
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={() => {
          setLogoutModalVisible(false);
          setLogoutSuccessVisible(true);
          onSignOut();
        }}
      />

      <LogoutSuccessModal
        visible={logoutSuccessVisible}
        role="guardian"
        onClose={() => {
          setLogoutSuccessVisible(false);
          router.replace("/sign-in?role=guardian");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    backgroundColor: "#1E88E5",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerDate: { fontSize: 15, color: "#E3F2FD", fontWeight: "500" },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  refreshBtn: {
    backgroundColor: "#1976D2",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1565C0",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshBtnPressed: { backgroundColor: "#1565C0" },
  refreshText: { fontSize: 18 },
  logoutBtn: {
    backgroundColor: "#1976D2",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1565C0",
  },
  logoutBtnPressed: { backgroundColor: "#1565C0" },
  logoutText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  listContainer: { padding: 20 },
  timelineItem: { flexDirection: "row", marginBottom: 24 },
  timeContainer: { width: 60, paddingTop: 4 },
  timeText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  timelineTrack: { width: 40, alignItems: "center" },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1E88E5",
    borderWidth: 3,
    borderColor: "#E3F2FD",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E3F2FD",
    marginTop: 4,
  },
  dataCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dataRow: { flexDirection: "row", justifyContent: "space-between" },
  dataItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dataIcon: { fontSize: 24 },
  dataValue: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  dataLabel: { fontSize: 12, color: "#64748B", marginTop: 2 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 16,
  },
  emptyRefreshBtn: {
    backgroundColor: "#1E88E5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  emptyRefreshText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});