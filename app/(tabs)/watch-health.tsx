// app/(watch)/HealthData.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

type HealthRecord = {
  id: string;
  timestamp: string;
  heartRate: number;
  steps: number;
};

export default function HealthData() {
  // 더미 데이터 (실제 연결 전까지 사용)
  const [records, setRecords] = useState<HealthRecord[]>([]);

  useEffect(() => {
    // 🚧 더미 데이터 생성
    const dummy = [
      { id: "1", timestamp: "09:00", heartRate: 72, steps: 120 },
      { id: "2", timestamp: "12:00", heartRate: 80, steps: 340 },
      { id: "3", timestamp: "15:00", heartRate: 76, steps: 780 },
      { id: "4", timestamp: "18:00", heartRate: 85, steps: 1100 },
    ];
    setRecords(dummy);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 건강 데이터</Text>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.time}>🕒 {item.timestamp}</Text>
            <Text style={styles.heart}>❤️ {item.heartRate} bpm</Text>
            <Text style={styles.steps}>👣 {item.steps} 걸음</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#F4F9FF" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  time: { fontSize: 14, color: "#333" },
  heart: { fontSize: 16, color: "#E53935", fontWeight: "600" },
  steps: { fontSize: 16, color: "#4CAF50", fontWeight: "600" },
});
