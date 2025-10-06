import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import LogoutSuccessModal from "@/components/LogoutSuccessModal";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  NativeModules,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const { HealthModule } = NativeModules;

type HealthRecord = {
  id: number;
  timestamp: string;
  heart_rate: number;
  steps: number;
  calories: number;
  distance: number;
};

type CurrentHealthData = {
  heartRate: number;
  steps: number;
  calories: number;
  distance: number;
};

export default function DetailScreen() {
  const { user, role, elderlyId, signOut } = useAuth();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [currentData, setCurrentData] = useState<CurrentHealthData | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutSuccessVisible, setLogoutSuccessVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState(false);

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const newDate = current.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };

  const fetchAndSaveHealthData = useCallback(async (showLoading = true) => {
    if (!isToday) return;

    // 보호자는 데이터를 저장하지 않음 (읽기만)
    if (role === "guardian") {
      if (showLoading) setLoading(false);
      if (!showLoading) setIsRefreshing(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      else setIsRefreshing(true);

      if (!HealthModule) throw new Error("Health Connect 모듈을 찾을 수 없습니다.");

      // 피보호자만 자신의 uid로 저장
      const targetUid = user?.uid;
      if (!targetUid) {
        console.warn("uid가 아직 로드되지 않았습니다.");
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const data = await HealthModule.getTodayHealthData();

      const q = query(
        collection(db, "healthData"),
        where("uid", "==", targetUid),
        where("date", "==", today),
        limit(1)
      );
      const existing = await getDocs(q);

      const payload = {
        heartRate: data.heartRate ?? 0,
        steps: data.steps ?? 0,
        calories: data.calories ?? 0,
        distance: data.distance ?? 0,
        date: today,
        timestamp: serverTimestamp(),
      };

      if (existing.empty) {
        await addDoc(collection(db, "healthData"), {
          uid: targetUid,
          ...payload,
        });
        console.log("헬스 데이터 Firestore에 저장 완료");
      } else {
        const docId = existing.docs[0].id;
        await updateDoc(doc(db, "healthData", docId), payload);
        console.log("헬스 데이터 Firestore에 업데이트 완료");
      }
    } catch (err) {
      console.error("건강 데이터 처리 오류:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [role, user, isToday]);

  const saveTimelineRecord = useCallback(async () => {
    if (!isToday) return;

    // 보호자는 기록을 추가하지 않음 (읽기만)
    if (role === "guardian") return;

    try {
      if (!HealthModule) return;

      // 피보호자만 자신의 uid로 저장
      const targetUid = user?.uid;
      if (!targetUid) {
        console.warn("uid가 아직 로드되지 않았습니다.");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const data = await HealthModule.getTodayHealthData();

      const now = new Date();
      const timeString = `${today} ${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      await addDoc(collection(db, "healthTimeline"), {
        uid: targetUid,
        date: today,
        timestamp: timeString,
        heartRate: data.heartRate ?? 0,
        steps: data.steps ?? 0,
        calories: data.calories ?? 0,
        distance: data.distance ?? 0,
        createdAt: serverTimestamp(),
      });

      console.log("시간별 기록 추가 완료:", timeString);
    } catch (err) {
      console.error("시간별 기록 저장 오류:", err);
    }
  }, [role, user, isToday]);

  // 실시간 구독: 최신 데이터 (메인 카드)
  useEffect(() => {
    const targetUid = role === "guardian" ? elderlyId : user?.uid;
    if (!targetUid) return;

    const q = query(
      collection(db, "healthData"),
      where("uid", "==", targetUid),
      where("date", "==", selectedDate),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();

        setCurrentData({
          heartRate: docData.heartRate ?? 0,
          steps: docData.steps ?? 0,
          calories: docData.calories ?? 0,
          distance: docData.distance ?? 0,
        });
      } else {
        setCurrentData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role, elderlyId, user, selectedDate]);

  // 실시간 구독: 시간별 기록
  useEffect(() => {
    const targetUid = role === "guardian" ? elderlyId : user?.uid;
    if (!targetUid) return;

    const q = query(
      collection(db, "healthTimeline"),
      where("uid", "==", targetUid),
      where("date", "==", selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const timelineRecords: HealthRecord[] = snapshot.docs
        .map((doc, index) => {
          const data = doc.data();
          return {
            id: index,
            timestamp: data.timestamp,
            heart_rate: data.heartRate ?? 0,
            steps: data.steps ?? 0,
            calories: data.calories ?? 0,
            distance: data.distance ?? 0,
          };
        })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      setRecords(timelineRecords);
    });

    return () => unsubscribe();
  }, [role, elderlyId, user, selectedDate]);

  // 초기 로드 (피보호자만 저장)
  useEffect(() => {
    if (isToday && role === "elderly") {
      fetchAndSaveHealthData(true);
      saveTimelineRecord();
    } else {
      setLoading(false);
    }
  }, [fetchAndSaveHealthData, saveTimelineRecord, isToday, role]);

  // 1분마다 최신 데이터 업데이트 (피보호자만)
  useEffect(() => {
    if (!isToday || role === "guardian") return;

    const interval = setInterval(() => {
      fetchAndSaveHealthData(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchAndSaveHealthData, isToday, role]);

  // 5분마다 시간별 기록 추가 (피보호자만)
  useEffect(() => {
    if (!isToday || role === "guardian") return;

    const interval = setInterval(() => {
      saveTimelineRecord();
    }, 300000);

    return () => clearInterval(interval);
  }, [saveTimelineRecord, isToday, role]);

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

  const handleRefresh = () => {
    if (isToday && role === "elderly") {
      fetchAndSaveHealthData(false);
    }
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>건강 모니터</Text>
            <View style={styles.headerButtons}>
              {isToday && role === "elderly" && (
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
              )}
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

          <View style={styles.datePicker}>
            <Pressable onPress={() => changeDate(-1)} style={styles.dateArrow}>
              <Text style={styles.dateArrowText}>←</Text>
            </Pressable>

            <Text style={styles.dateText}>
              {new Date(selectedDate).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {isToday && " (오늘)"}
            </Text>

            <Pressable
              onPress={() => changeDate(1)}
              style={styles.dateArrow}
              disabled={isToday}
            >
              <Text style={[styles.dateArrowText, isToday && styles.dateArrowDisabled]}>
                →
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.mainContent}>
          {currentData ? (
            <View style={styles.mainHealthCard}>
              <Text style={styles.mainTitle}>
                {isToday ? "현재 건강 상태" : "당일 건강 상태"}
              </Text>

              <View style={styles.mainGrid}>
                <View style={styles.mainItem}>
                  <View style={styles.mainItemHeader}>
                    <Text style={styles.mainIcon}>❤️</Text>
                    <Text style={styles.mainLabel}>심박수</Text>
                  </View>
                  <Text style={styles.mainValue}>
                    {currentData.heartRate > 0 ? Math.round(currentData.heartRate) : "-"}
                  </Text>
                  <Text style={styles.mainUnit}>BPM</Text>
                </View>

                <View style={styles.mainItem}>
                  <View style={styles.mainItemHeader}>
                    <Text style={styles.mainIcon}>👣</Text>
                    <Text style={styles.mainLabel}>걸음 수</Text>
                  </View>
                  <Text style={styles.mainValue}>
                    {currentData.steps.toLocaleString()}
                  </Text>
                  <Text style={styles.mainUnit}>걸음</Text>
                </View>

                <View style={styles.mainItem}>
                  <View style={styles.mainItemHeader}>
                    <Text style={styles.mainIcon}>🔥</Text>
                    <Text style={styles.mainLabel}>칼로리</Text>
                  </View>
                  <Text style={styles.mainValue}>
                    {Math.round(currentData.calories)}
                  </Text>
                  <Text style={styles.mainUnit}>kcal</Text>
                </View>

                <View style={styles.mainItem}>
                  <View style={styles.mainItemHeader}>
                    <Text style={styles.mainIcon}>📏</Text>
                    <Text style={styles.mainLabel}>이동 거리</Text>
                  </View>
                  <Text style={styles.mainValue}>
                    {(currentData.distance / 1000).toFixed(1)}
                  </Text>
                  <Text style={styles.mainUnit}>km</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyMainCard}>
              <Text style={styles.emptyMainIcon}>📊</Text>
              <Text style={styles.emptyMainText}>
                {isToday
                  ? role === "guardian"
                    ? "피보호자의 건강 데이터가 아직 없습니다."
                    : "오늘의 건강 데이터가 없습니다."
                  : "해당 날짜의 건강 데이터가 없습니다."}
              </Text>
              {isToday && role === "elderly" && (
                <Pressable style={styles.emptyMainBtn} onPress={handleRefresh}>
                  <Text style={styles.emptyMainBtnText}>데이터 불러오기</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <View style={styles.timelineSection}>
          <Pressable
            style={styles.timelineHeader}
            onPress={() => setDrawerExpanded(!drawerExpanded)}
          >
            <View>
              <Text style={styles.timelineTitle}>시간별 기록</Text>
              <Text style={styles.timelineSubtitle}>
                {records.length > 0 ? `${records.length}개의 기록` : "기록 없음"}
              </Text>
            </View>
            <Text style={styles.expandIcon}>{drawerExpanded ? "▼" : "▶"}</Text>
          </Pressable>

          {drawerExpanded && (
            <View style={styles.timelineContent}>
              {records.length > 0 ? (
                records.map((item) => (
                  <View key={item.id} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordTime}>
                        {item.timestamp.split(" ")[1]}
                      </Text>
                    </View>

                    <View style={styles.recordGrid}>
                      <View style={styles.recordItem}>
                        <Text style={styles.recordIcon}>❤️</Text>
                        <View>
                          <Text style={styles.recordValue}>
                            {item.heart_rate > 0 ? Number(item.heart_rate).toFixed(0) : "-"}
                          </Text>
                          <Text style={styles.recordLabel}>심박수</Text>
                        </View>
                      </View>

                      <View style={styles.recordItem}>
                        <Text style={styles.recordIcon}>👣</Text>
                        <View>
                          <Text style={styles.recordValue}>
                            {Number(item.steps).toLocaleString()}
                          </Text>
                          <Text style={styles.recordLabel}>걸음</Text>
                        </View>
                      </View>

                      <View style={styles.recordItem}>
                        <Text style={styles.recordIcon}>🔥</Text>
                        <View>
                          <Text style={styles.recordValue}>
                            {Math.round(Number(item.calories))}
                          </Text>
                          <Text style={styles.recordLabel}>칼로리</Text>
                        </View>
                      </View>

                      <View style={styles.recordItem}>
                        <Text style={styles.recordIcon}>📏</Text>
                        <View>
                          <Text style={styles.recordValue}>
                            {(Number(item.distance) / 1000).toFixed(1)}
                          </Text>
                          <Text style={styles.recordLabel}>km</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.timelineEmpty}>
                  <Text style={styles.timelineEmptyText}>시간별 기록이 없습니다</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={loggingOut}
        role={role || "elderly"}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={() => {
          setLogoutModalVisible(false);
          setLogoutSuccessVisible(true);
          onSignOut();
        }}
      />

      <LogoutSuccessModal
        visible={logoutSuccessVisible}
        role={role || "elderly"}
        onClose={() => {
          setLogoutSuccessVisible(false);
          router.replace(`/sign-in?role=${role}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollView: { flex: 1 },
  header: {
    backgroundColor: "#1E88E5",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerButtons: { flexDirection: "row", gap: 8 },
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
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  dateArrow: { padding: 8 },
  dateArrowText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateArrowDisabled: { opacity: 0.3 },
  dateText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    minWidth: 200,
    textAlign: "center",
  },
  mainContent: {
    padding: 20,
    marginTop: -40,
  },
  mainHealthCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 24,
  },
  mainGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  mainItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  mainItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  mainIcon: { fontSize: 20 },
  mainLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  mainValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E88E5",
    marginBottom: 2,
  },
  mainUnit: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },
  emptyMainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyMainIcon: { fontSize: 64, marginBottom: 16 },
  emptyMainText: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 20,
    textAlign: "center",
  },
  emptyMainBtn: {
    backgroundColor: "#1E88E5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyMainBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  timelineSection: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  expandIcon: {
    fontSize: 18,
    color: "#64748B",
  },
  timelineContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  recordCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  recordHeader: {
    marginBottom: 12,
  },
  recordTime: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E88E5",
  },
  recordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  recordItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "48%",
  },
  recordIcon: { fontSize: 20 },
  recordValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  recordLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  timelineEmpty: {
    paddingVertical: 32,
    alignItems: "center",
  },
  timelineEmptyText: {
    fontSize: 14,
    color: "#94A3B8",
  },
});