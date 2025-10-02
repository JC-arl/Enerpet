import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { collection, doc, getDocs, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

export default function GuardianMyPage() {
  const { user } = useAuth();
  const [elderlyList, setElderlyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(ref, async (snap) => {
      const data = snap.data();
      if (data?.elderlyUids?.length) {
        const results: any[] = [];
        for (const eid of data.elderlyUids) {
          const esnap = await getDocs(collection(db, "users"));
          const found = esnap.docs.find((d) => d.id === eid);
          if (found) results.push({ id: eid, ...found.data() });
        }
        setElderlyList(results);
      } else {
        setElderlyList([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  if (loading) {
    return <ActivityIndicator size="large" color="#42A5F5" />;
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#B3E5FC", "#E1F5FE"]} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.title}>보호자 마이페이지</Text>
      <Text style={styles.subtitle}>연결된 피보호자 목록</Text>

      <FlatList
        data={elderlyList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardName}>{item.name ?? "이름 없음"}</Text>
            <Text style={styles.cardEmail}>{item.email}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>연결된 피보호자가 없습니다.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#1565C0", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#42A5F5", marginBottom: 16 },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardName: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  cardEmail: { fontSize: 14, color: "#64748B", marginTop: 4 },
  empty: { textAlign: "center", marginTop: 20, color: "#999" },
});
