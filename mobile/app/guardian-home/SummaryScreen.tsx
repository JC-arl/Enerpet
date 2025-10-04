import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

type AvgHealthData = {
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
  const [avgData, setAvgData] = useState<AvgHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  // 날짜 변경 함수
  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const newDate = current.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    
    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };

  // Firestore 실시간 구독 - 날짜별 평균 계산
  useEffect(() => {
    const targetUid = role === "guardian" ? elderlyId : user?.uid;
    if (!targetUid) return;

    setLoading(true);

    const q = query(
      collection(db, "healthData"),
      where("uid", "==", targetUid),
      where("date", "==", selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const allData = snapshot.docs.map(doc => doc.data());
        
        // 평균값 계산
        const count = allData.length;
        const avg: AvgHealthData = {
          heartRate: Math.round(
            allData.reduce((sum, d) => sum + (d.heartRate || 0), 0) / count
          ),
          steps: allData.reduce((sum, d) => sum + (d.steps || 0), 0),
          calories: allData.reduce((sum, d) => sum + (d.calories || 0), 0),
          distance: allData.reduce((sum, d) => sum + (d.distance || 0), 0),
        };
        
        setAvgData(avg);
      } else {
        setAvgData(null);
      }
      setLoading(false);
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
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isToday ? "오늘의 요약" : "건강 요약"}
        </Text>
        
        {/* 날짜 선택기 */}
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

      {/* 메인 통계 카드 */}
      {avgData ? (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>👣</Text>
              </View>
              <Text style={styles.statValue}>{avgData.steps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>총 걸음 수</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>❤️</Text>
              </View>
              <Text style={styles.statValue}>{avgData.heartRate}</Text>
              <Text style={styles.statLabel}>평균 심박수</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🔥</Text>
              </View>
              <Text style={styles.statValue}>{avgData.calories.toFixed(0)}</Text>
              <Text style={styles.statLabel}>총 칼로리</Text>
            </View>
          </View>

          {/* 추가 정보 카드 */}
          <View style={styles.extraInfoCard}>
            <View style={styles.extraInfoRow}>
              <Text style={styles.extraInfoIcon}>📏</Text>
              <View style={styles.extraInfoContent}>
                <Text style={styles.extraInfoLabel}>총 이동 거리</Text>
                <Text style={styles.extraInfoValue}>
                  {(avgData.distance / 1000).toFixed(2)} km
                </Text>
              </View>
            </View>
          </View>

          {/* AI 인사이트 */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>💡</Text>
              <Text style={styles.insightTitle}>AI 건강 인사이트</Text>
            </View>
            <Text style={styles.insightText}>
              {avgData.steps >= 8000 
                ? `훌륭해요! ${isToday ? "오늘" : "이날"} 목표 걸음 수를 달성했습니다. 꾸준히 유지하세요!`
                : `${isToday ? "오늘" : "이날"}은 목표 걸음 수에 조금 못 미쳤어요. 가벼운 산책을 추천드립니다.`}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>
            {isToday 
              ? "오늘의 건강 데이터가 아직 없습니다." 
              : "해당 날짜의 건강 데이터가 없습니다."}
          </Text>
          <Text style={styles.emptySubtext}>
            {isToday && "상세 기록 페이지에서 데이터를 불러올 수 있습니다."}
          </Text>
        </View>
      )}

      {/* 상세 보기 버튼 */}
      <Link href="/guardian-home/DetailScreen" asChild>
        <Pressable 
          style={({ pressed }) => [
            styles.detailButton,
            pressed && styles.detailButtonPressed
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