import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";

type HealthData = {
  heartRate: number;
  steps: number;
  calories: number;
  distance: number;
};

export default function SummaryScreen() {
  const { user, role, elderlyId } = useAuth();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [avgHeartRate, setAvgHeartRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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

  // 최신 건강 데이터 (걸음 수, 칼로리, 거리)
  useEffect(() => {
    const targetUid = role === "guardian" ? elderlyId : user?.uid;
    if (!targetUid) return;

    setLoading(true);

    const q = query(
      collection(db, "healthData"),
      where("uid", "==", targetUid),
      where("date", "==", selectedDate),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();

        setHealthData({
          heartRate: Math.round(docData.heartRate || 0),
          steps: docData.steps || 0,
          calories: docData.calories || 0,
          distance: docData.distance || 0,
        });
      } else {
        setHealthData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate, role, elderlyId, user]);

  // 시간별 기록에서 평균 심박수 계산
  useEffect(() => {
    const targetUid = role === "guardian" ? elderlyId : user?.uid;
    if (!targetUid) return;

    const q = query(
      collection(db, "healthTimeline"),
      where("uid", "==", targetUid),
      where("date", "==", selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const records = snapshot.docs.map((doc) => doc.data());
        const validHeartRates = records
          .map((r) => r.heartRate || 0)
          .filter((hr) => hr > 0);

        if (validHeartRates.length > 0) {
          const avg = validHeartRates.reduce((sum, hr) => sum + hr, 0) / validHeartRates.length;
          setAvgHeartRate(Math.round(avg));
        } else {
          setAvgHeartRate(0);
        }
      } else {
        setAvgHeartRate(0);
      }
    });

    return () => unsubscribe();
  }, [selectedDate, role, elderlyId, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isToday ? "오늘의 요약" : "건강 요약"}
        </Text>

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
            <Text
              style={[styles.dateArrowText, isToday && styles.dateArrowDisabled]}
            >
              →
            </Text>
          </Pressable>
        </View>
      </View>

      {healthData ? (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>👣</Text>
              </View>
              <Text style={styles.statValue}>
                {healthData.steps.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>걸음 수</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>❤️</Text>
              </View>
              <Text style={styles.statValue}>
                {avgHeartRate > 0 ? avgHeartRate : "-"}
              </Text>
              <Text style={styles.statLabel}>평균 심박수</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🔥</Text>
              </View>
              <Text style={styles.statValue}>
                {Math.round(healthData.calories)}
              </Text>
              <Text style={styles.statLabel}>칼로리</Text>
            </View>
          </View>

          <View style={styles.extraInfoCard}>
            <View style={styles.extraInfoRow}>
              <Text style={styles.extraInfoIcon}>📏</Text>
              <View style={styles.extraInfoContent}>
                <Text style={styles.extraInfoLabel}>이동 거리</Text>
                <Text style={styles.extraInfoValue}>
                  {(healthData.distance / 1000).toFixed(2)} km
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>💡</Text>
              <Text style={styles.insightTitle}>건강 인사이트</Text>
            </View>
            <Text style={styles.insightText}>
              {healthData.steps >= 8000
                ? `훌륭해요! ${isToday ? "오늘" : "이날"} 목표 걸음 수를 달성했습니다. 꾸준히 유지하세요!`
                : healthData.steps >= 5000
                ? `좋아요! ${isToday ? "오늘" : "이날"} ${healthData.steps.toLocaleString()}걸음을 걸으셨네요. 조금만 더 걸으면 목표 달성입니다!`
                : `${isToday ? "오늘" : "이날"}은 목표 걸음 수에 조금 못 미쳤어요. 가벼운 산책을 추천드립니다.`}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>
            {isToday
              ? role === "guardian"
                ? "피보호자의 건강 데이터가 아직 없습니다."
                : "오늘의 건강 데이터가 아직 없습니다."
              : "해당 날짜의 건강 데이터가 없습니다."}
          </Text>
          <Text style={styles.emptySubtext}>
            {isToday && role === "elderly" && "상세 기록 페이지에서 데이터를 불러올 수 있습니다."}
            {isToday && role === "guardian" && "피보호자가 앱을 사용하면 데이터가 수집됩니다."}
          </Text>
        </View>
      )}

      <Link href="/guardian-home/DetailScreen" asChild>
        <Pressable
          style={({ pressed }) => [
            styles.detailButton,
            pressed && styles.detailButtonPressed,
          ]}
        >
          <Text style={styles.detailButtonText}>상세 기록 보기</Text>
          <Text style={styles.detailButtonArrow}>→</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
  },
  header: {
    backgroundColor: "#1E88E5",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  dateArrow: {
    padding: 8,
  },
  dateArrowText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateArrowDisabled: {
    opacity: 0.3,
  },
  dateText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    minWidth: 200,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  iconText: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E88E5",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  extraInfoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  extraInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  extraInfoIcon: {
    fontSize: 28,
  },
  extraInfoContent: {
    flex: 1,
  },
  extraInfoLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  extraInfoValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E88E5",
  },
  insightCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#1E88E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  insightText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: "#1E293B",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  detailButton: {
    backgroundColor: "#1E88E5",
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  detailButtonPressed: {
    backgroundColor: "#1976D2",
    transform: [{ scale: 0.98 }],
  },
  detailButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  detailButtonArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});