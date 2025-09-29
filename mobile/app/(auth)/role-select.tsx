import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { router } from "expo-router";

export default function RoleSelect() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>로그인 유형 선택</Text>

      <View style={styles.row}>
        
        {/* 피보호자 로그인 */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#2196F3" }]}
          onPress={() => router.push({ pathname: "/sign-in", params: { role: "elderly" } })}
        >
          <Text style={styles.emoji}>👴</Text>
          <Text style={styles.cardTitle}>피보호자 로그인</Text>
          <Text style={styles.desc}>자신의 건강 데이터를 기록합니다</Text>
        </TouchableOpacity>

        {/* 보호자 로그인 */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#4CAF50" }]}
          onPress={() => router.push({ pathname: "/sign-in", params: { role: "guardian" } })}
        >
          <Text style={styles.emoji}>👨‍👩‍👧</Text>
          <Text style={styles.cardTitle}>보호자 로그인</Text>
          <Text style={styles.desc}>피보호자의 건강 상태를 확인합니다</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 40 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  card: {
    flex: 1,
    marginHorizontal: 8,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  desc: { fontSize: 14, color: "#fff", textAlign: "center" },
});
