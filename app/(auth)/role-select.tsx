import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  useWindowDimensions,
  StatusBar,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function RoleSelect() {
  const { width: W, height: H } = useWindowDimensions();

  const scale = (size: number) => (W / 375) * size;
  const vscale = (size: number) => (H / 812) * size;

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="dark-content" translucent={Platform.OS !== "web"} />
      
      {/* 배경 그라디언트 */}
      <LinearGradient
        colors={["#B3E5FC", "#E1F5FE", "#F5FAFE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.greeting}>안녕하세요!</Text>
          <Text style={styles.question}>누구의 건강을 관리하시나요?</Text>
        </View>

        {/* 카드 영역 */}
        <View style={styles.cardContainer}>
          
          {/* 피보호자 카드 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: "/sign-in", params: { role: "elderly" } })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#66BB6A", "#81C784"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardTop}>
                <View style={styles.emojiBox}>
                  <Text style={styles.cardEmoji}>👴</Text>
                </View>
                <View style={styles.arrowBox}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </View>
              
              <Text style={styles.roleTitle}>본인 (피보호자)</Text>
              <Text style={styles.roleDesc}>
                내 건강 데이터를 직접 기록하고{"\n"}스마트워치와 연동해요
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 보호자 카드 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: "/sign-in", params: { role: "guardian" } })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#42A5F5", "#64B5F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardTop}>
                <View style={styles.emojiBox}>
                  <Text style={styles.cardEmoji}>👨‍👩‍👧</Text>
                </View>
                <View style={styles.arrowBox}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </View>
              
              <Text style={styles.roleTitle}>가족 (보호자)</Text>
              <Text style={styles.roleDesc}>
                부모님이나 가족의 건강을{"\n"}확인하고 관리해요
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 하단 */}
        <View style={styles.footer}>
          <Text style={styles.hint}>
            선택 후 언제든 변경 가능합니다
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#F5FAFE",
  },
  container: { 
    flex: 1, 
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 28,
    marginBottom: 48,
  },
  greeting: {
    fontSize: 18,
    color: "#29B6F6",
    fontWeight: "600",
    marginBottom: 8,
  },
  question: {
    fontSize: 26,
    fontWeight: "800",
    color: "#01579B",
    lineHeight: 34,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
    maxHeight: 500,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardGradient: {
    padding: 24,
    minHeight: 180,
    justifyContent: "space-between",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  emojiBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 32,
  },
  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  roleDesc: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  hint: {
    fontSize: 13,
    color: "#4FC3F7",
    textAlign: "center",
    fontWeight: "500",
  },
});