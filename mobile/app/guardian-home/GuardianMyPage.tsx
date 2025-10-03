import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { LinearGradient } from "expo-linear-gradient";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ElderlyUser = {
  id: string;
  name?: string;
  email: string;
  health?: {
    heartRate: number;
    steps: number;
    calories: number;
    distance: number;
  } | null;
};

export default function GuardianMyPage() {
  const { user } = useAuth();
  const [elderlyList, setElderlyList] = useState<ElderlyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [inputEmail, setInputEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ✅ 오늘 날짜
  const today = new Date().toISOString().split("T")[0];

  // ✅ 연결된 elderly 구독 + healthData 같이 가져오기
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(ref, async (snap) => {
      const data = snap.data();
      if (data?.elderlyUids?.length) {
        const results: ElderlyUser[] = [];
        for (const eid of data.elderlyUids) {
          const esnap = await getDoc(doc(db, "users", eid));
          if (esnap.exists()) {
            const elderlyData = esnap.data();

            // 🔥 오늘 healthData 가져오기
            const q = query(
              collection(db, "healthData"),
              where("uid", "==", eid),
              where("date", "==", today),
              limit(1)
            );
            const hsnap = await getDocs(q);
            let health = null;
            if (!hsnap.empty) {
              health = hsnap.docs[0].data() as ElderlyUser["health"];
            }

            results.push({
              id: eid,
              ...elderlyData,
              health,
            });
          }
        }
        setElderlyList(results);
      } else {
        setElderlyList([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  const handleSearch = async () => {
    if (!inputEmail.trim()) return;

    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", inputEmail.trim()),
        where("role", "==", "elderly"),
        limit(1)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setSearchResult(null);
        setSearchError("검색된 사용자가 없습니다.");
        return;
      }

      const elderlyDoc = snap.docs[0];
      setSearchResult({ id: elderlyDoc.id, ...elderlyDoc.data() });
      setSearchError(null);
    } catch (err) {
      console.error("검색 오류:", err);
      setSearchResult(null);
      setSearchError("검색 중 문제가 발생했습니다.");
    }
  };

  // ✅ elderly 연결
  const handleAddElderly = async (elderlyId: string) => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        elderlyUids: arrayUnion(elderlyId),
      });

      Alert.alert("성공", "피보호자가 연결되었습니다.");
      setSearchResult(null);
      setInputEmail("");
    } catch (err) {
      console.error("피보호자 등록 오류:", err);
      Alert.alert("오류", "등록 중 문제가 발생했습니다.");
    }
  };

  // ✅ 이미 연결된 사용자인지 확인
  const isAlreadyConnected = (elderlyId: string) => {
    return elderlyList.some((e) => e.id === elderlyId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#E3F2FD", "#BBDEFB"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.container}>
        <Text style={styles.title}>보호자 마이페이지</Text>

        {/* 검색 섹션 */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>피보호자 검색</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
              placeholderTextColor="#90A4AE"
              value={inputEmail}
              onChangeText={setInputEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Pressable
              style={styles.searchBtn}
              onPress={handleSearch}
              android_ripple={{ color: "#0D47A1" }}
            >
              <Text style={styles.searchBtnText}>검색</Text>
            </Pressable>
          </View>

          {/* 검색 결과 */}
          {searchError && (
            <View style={styles.searchResultCard}>
              <Text style={{ color: "#D32F2F", fontWeight: "600" }}>
                {searchError}
              </Text>
            </View>
          )}

          {searchResult && (
            <View style={styles.searchResultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {searchResult.name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>
                    {searchResult.name ?? "이름 없음"}
                  </Text>
                  <Text style={styles.resultEmail}>{searchResult.email}</Text>
                </View>
              </View>

              {isAlreadyConnected(searchResult.id) ? (
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>✓ 이미 연결된 사용자</Text>
                </View>
              ) : (
                <Pressable
                  style={styles.connectBtn}
                  onPress={() => handleAddElderly(searchResult.id)}
                  android_ripple={{ color: "#0D47A1" }}
                >
                  <Text style={styles.connectBtnText}>연결하기</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* 연결된 피보호자 목록 */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            연결된 피보호자 ({elderlyList.length})
          </Text>

          <FlatList
            data={elderlyList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.elderlyCard}>
                <View style={styles.cardContent}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {item.name?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>
                      {item.name ?? "이름 없음"}
                    </Text>
                    <Text style={styles.cardEmail}>{item.email}</Text>

                    {/* 🔥 오늘 건강 데이터 표시 */}
                    {item.health ? (
                      <View style={styles.healthRow}>
                        <Text style={styles.healthText}>❤️ {item.health.heartRate ?? "-"} bpm</Text>
                        <Text style={styles.healthText}>👣 {item.health.steps ?? 0} 걸음</Text>
                        <Text style={styles.healthText}>🔥 {item.health.calories ?? 0} kcal</Text>
                        <Text style={styles.healthText}>📏 {item.health.distance ?? 0} m</Text>
                      </View>
                    ) : (
                      <Text style={styles.noHealthText}>오늘 건강 데이터 없음</Text>
                    )}
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>연결됨</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>아직 연결된 피보호자가 없습니다</Text>
                <Text style={styles.emptySubText}>
                  위에서 이메일로 검색하여 연결하세요
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
  },
  container: { flex: 1, padding: 20, paddingTop: 48 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0D47A1",
    marginBottom: 24,
    marginTop: 8,
  },

  // 검색 섹션
  searchSection: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1565C0",
    marginBottom: 12,
  },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: "#64B5F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    fontSize: 16,
    color: "#263238",
  },
  searchBtn: {
    backgroundColor: "#1E88E5",
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  searchBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  // 검색 결과 카드
  searchResultCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#42A5F5",
  },
  resultHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#64B5F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 18, fontWeight: "700", color: "#1565C0", marginBottom: 4 },
  resultEmail: { fontSize: 14, color: "#546E7A" },
  connectedBadge: {
    backgroundColor: "#E8F5E9",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  connectedText: { color: "#2E7D32", fontWeight: "700", fontSize: 14 },
  connectBtn: {
    backgroundColor: "#1E88E5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  connectBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  // 리스트 섹션
  listSection: { flex: 1 },
  elderlyCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#42A5F5",
  },
  cardContent: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: "700", color: "#263238", marginBottom: 4 },
  cardEmail: { fontSize: 14, color: "#546E7A" },
  healthRow: { marginTop: 8 },
  healthText: { fontSize: 13, color: "#37474F", marginBottom: 2 },
  noHealthText: { fontSize: 13, color: "#999", marginTop: 4 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  statusText: { fontSize: 13, fontWeight: "600", color: "#1565C0" },

  // Empty state
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, color: "#78909C", fontWeight: "600", marginBottom: 8 },
  emptySubText: { fontSize: 14, color: "#90A4AE" },
});