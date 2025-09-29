import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

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
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 총정리</Text>
      {summary && (
        <View style={styles.card}>
          <Text style={styles.text}>👣 총 걸음 수: {summary.totalSteps}</Text>
          <Text style={styles.text}>❤️ 평균 심박수: {summary.avgHeartRate}</Text>
          <Text style={styles.text}>🔥 총 칼로리: {summary.totalCalories}</Text>
          <Text style={styles.aiText}>💡 오늘은 목표 걸음을 달성했지만, 수면 시간이 2시간 부족했습니다.</Text>
        </View>
      )}

      {/* ✅ expo-router Link로 이동 */}
      <Link href="/guardian-home/DetailScreen" style={styles.link}>
        상세 기록 보기 →
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  card: { backgroundColor: "#4CAF50", padding: 16, borderRadius: 12, marginBottom: 20 },
  text: { fontSize: 16, color: "#fff", marginBottom: 4 },
  aiText: { fontSize: 15, color: "#fff", marginTop: 8, fontStyle: "italic" },
  link: { marginTop: 12, fontSize: 16, color: "#1976D2", fontWeight: "bold" },
});
