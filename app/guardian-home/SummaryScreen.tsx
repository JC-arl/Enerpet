import { Link } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type HealthRecord = {
  id: number;
  timestamp: string;
  heart_rate: number;
  steps: number;
  calories: number;
};

export default function SummaryScreen() {
  const [records, setRecords] = useState<HealthRecord[]>([]);

  useEffect(() => {
    fetch("http://10.0.2.2:4000/api/elderly/uuid-1234/health-data?date=2025-09-27")
      .then((res) => res.json())
      .then((data) => setRecords(data.records))
      .catch(() => {
        setRecords([
          { id: 1, timestamp: "2025-09-27 08:00", heart_rate: 85, steps: 1200, calories: 100 },
          { id: 2, timestamp: "2025-09-27 12:00", heart_rate: 90, steps: 3000, calories: 200 },
          { id: 3, timestamp: "2025-09-27 18:00", heart_rate: 95, steps: 5000, calories: 350 },
        ]);
      });
  }, []);

  const summary = useMemo(() => {
    if (records.length === 0) return null;
    const totalSteps = records.reduce((sum, r) => sum + r.steps, 0);
    const totalCalories = records.reduce((sum, r) => sum + r.calories, 0);
    const avgHeartRate = Math.round(
      records.reduce((sum, r) => sum + r.heart_rate, 0) / records.length
    );
    return { totalSteps, totalCalories, avgHeartRate };
  }, [records]);

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>건강 요약</Text>
        <Text style={styles.headerDate}>2025년 9월 27일</Text>
      </View>

      {/* 메인 통계 카드 */}
      {summary && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>👣</Text>
            </View>
            <Text style={styles.statValue}>{summary.totalSteps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>총 걸음 수</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>❤️</Text>
            </View>
            <Text style={styles.statValue}>{summary.avgHeartRate}</Text>
            <Text style={styles.statLabel}>평균 심박수</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔥</Text>
            </View>
            <Text style={styles.statValue}>{summary.totalCalories.toLocaleString()}</Text>
            <Text style={styles.statLabel}>총 칼로리</Text>
          </View>
        </View>
      )}

      {/* AI 인사이트 */}
      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <Text style={styles.insightIcon}>💡</Text>
          <Text style={styles.insightTitle}>AI 건강 인사이트</Text>
        </View>
        <Text style={styles.insightText}>
          오늘은 목표 걸음을 달성했지만, 수면 시간이 2시간 부족했습니다.
        </Text>
      </View>

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
  header: {
    backgroundColor: "#1E88E5",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 15,
    color: "#E3F2FD",
    fontWeight: "500",
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