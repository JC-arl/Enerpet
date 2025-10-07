import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Pressable,
  Animated,
  View,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  NativeModules,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import LogoutSuccessModal from "@/components/LogoutSuccessModal";

import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, limit, getDocs, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useGame } from "@/lib/GameContext";
import { detectAnomaly } from "@/lib/anomaly";

const { HealthModule } = NativeModules;

export default function HomeScreen() {
  const { level, exp, maxExp, setLevel, setExp, setMaxExp } = useGame();
  const { width: W, height: H } = useWindowDimensions();

  const { user, role, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutSuccessVisible, setLogoutSuccessVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [hearts, setHearts] = useState<any[]>([]);
  const heartId = useRef(0);

  const treeScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const [upgradable, setUpgradable] = useState(false);

  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [steps, setSteps] = useState<number | null>(null);

  const guidelineW = 375;
  const guidelineH = 812;
  const scale = (size: number) => (W / guidelineW) * size;
  const vscale = (size: number) => (H / guidelineH) * size;
  const mscale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

  const bubbleMessages = ["행복해!", "즐거워!", "좋아!", "기분 최고!"];
  const [bubbleMessage, setBubbleMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadName = async () => {
      if (!user) {
        mounted && setDisplayName("");
        return;
      }
      let name = user.displayName ?? "";
      if (!name) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          name = (snap.exists() && (snap.data() as any)?.name) || "";
        } catch { }
      }
      mounted && setDisplayName(name || "사용자");
    };
    loadName();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const fetchAndSaveHealthData = async () => {
    if (role !== "elderly") return;

    try {
      setIsRefreshing(true);

      if (!HealthModule)
        throw new Error("Health Connect 모듈을 찾을 수 없습니다.");

      const targetUid = user?.uid;
      if (!targetUid) {
        console.warn("uid가 아직 로드되지 않았습니다.");
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

      // 🔹 (1) 이상 탐지 실행
      const { isAnomaly, type } = detectAnomaly(payload.heartRate, payload.steps);

      // 🔹 (2) 이상치 발생 시 health_alerts 컬렉션에 추가
      if (isAnomaly) {
        await addDoc(collection(db, "health_alerts"), {
          uid: targetUid,
          timestamp: serverTimestamp(),
          heart_rate: payload.heartRate,
          steps: payload.steps,
          anomaly_type: type,
        });
        console.log("🚨 이상 감지됨:", type);
      }

      // 🔹 (3) 평소처럼 healthData 저장 or 업데이트
      if (existing.empty) {
        await addDoc(collection(db, "healthData"), {
          uid: targetUid,
          ...payload,
        });
        console.log("헬스 데이터 저장 완료");
      } else {
        const docId = existing.docs[0].id;
        await updateDoc(doc(db, "healthData", docId), payload);
        console.log("헬스 데이터 업데이트 완료");
      }
    } catch (err) {
      console.error("건강 데이터 처리 오류:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAndSaveHealthData();
  };

  const confirmLogout = async () => {
    await onSignOut();
    setLogoutModalVisible(false);
  };

  useEffect(() => {
    if (feedModalVisible) {
      const timer = setTimeout(() => setFeedModalVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedModalVisible]);

  const characterTopPx = useMemo(() => {
    const ratio = level === 1 ? 0.38 : level === 2 ? 0.36 : 0.33;
    return Math.round(H * ratio);
  }, [H, level]);

  const characterSize = useMemo(() => {
    const baseSize = level === 1 ? 120 : level === 2 ? 160 : 200;
    return Math.min(baseSize, W * 0.5);
  }, [W, level]);

  const glowSize = Math.max(characterSize * 1.2, 140);

  const getHealthStatus = () => {
    if (heartRate === null || steps === null) return "happy";
    if (heartRate < 50 || heartRate > 120) return "sad";
    if (steps < 100) return "sad";
    return "happy";
  };

  const healthStatus = getHealthStatus();

  const getPetEmoji = () => {
    if (level === 1) return healthStatus === "happy" ? "🐕" : "😥";
    if (level === 2) return healthStatus === "happy" ? "🐩" : "😰";
    return healthStatus === "happy" ? "🐕‍🦺" : "😞";
  };

  const handleCharacterClick = () => {
    if (level === 3) return;

    setExp((prev) => {
      const newExp = prev + 250;
      if (newExp >= maxExp) {
        setUpgradable(true);
        return maxExp;
      }
      return newExp;
    });

    const randomMsg = bubbleMessages[Math.floor(Math.random() * bubbleMessages.length)];
    setBubbleMessage(randomMsg);

    Animated.sequence([
      Animated.timing(treeScale, {
        toValue: 1.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(treeScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFeedModalVisible(true);
      setTimeout(() => {
        setFeedModalVisible(false);
        setBubbleMessage(null);
      }, 1500);
    });

    const count = 10;
    const newHearts = Array.from({ length: count }).map(() => {
      const id = heartId.current++;
      const anim = new Animated.Value(0);
      const x = (Math.random() - 0.5) * W * 0.8;
      const y = Math.random() * -Math.max(160, vscale(220)) - vscale(80);
      const scaleH = 0.5 + Math.random() * 1.2;
      const rotate = Math.random() * 60 - 30;
      return { id, anim, x, y, scale: scaleH, rotate };
    });

    setHearts((prev) => [...prev, ...newHearts]);
    newHearts.forEach((h) => {
      Animated.timing(h.anim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setHearts((prev) => prev.filter((hh) => hh.id !== h.id));
      });
    });
  };

  const handleUpgrade = () => {
    if (!upgradable) return;
    Animated.parallel([
      Animated.sequence([
        Animated.timing(treeScale, {
          toValue: 1.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(treeScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (level === 1) {
      setLevel(2);
      setMaxExp(1000);
    } else if (level === 2) {
      setLevel(3);
    }
    setUpgradable(false);
  };

  const handleReset = () => {
    setLevel(1);
    setExp(0);
    setMaxExp(500);
    setUpgradable(false);
  };

  const getProgress = () => {
    if (level === 1) return exp / 500;
    if (level === 2) return (exp - 500) / 500;
    if (level === 3) return 1;
    return 0;
  };

  const getLevelName = () => {
    if (level === 1) return "강아지";
    if (level === 2) return "청년 강아지";
    return "어른 강아지";
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#C8E6C9", "#E8F5E9", "#F1F8E9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.leftGroup}>
            <ThemedText style={styles.welcomeText}>안녕하세요!</ThemedText>
            {displayName ? (
              <View style={styles.nameRow}>
                <ThemedText style={styles.nameText}>{displayName}님</ThemedText>
                <HelloWave />
              </View>
            ) : null}
          </View>
          <View style={styles.rightGroup}>
            {role === "elderly" && (
              <Pressable
                onPress={handleRefresh}
                disabled={isRefreshing}
                style={({ pressed }) => [
                  styles.refreshBtn,
                  pressed && styles.refreshBtnPressed,
                  isRefreshing && { opacity: 0.6 },
                ]}
              >
                <ThemedText style={styles.refreshText}>
                  {isRefreshing ? "⏳" : "🔄"}
                </ThemedText>
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
              <ThemedText style={styles.logoutText}>
                {loggingOut ? "로그아웃 중..." : "로그아웃"}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.levelBadge}>
          <ThemedText style={styles.levelText}>{getLevelName()}</ThemedText>
        </View>

        <View style={[styles.centerBox, { top: characterTopPx }]}>
          <Animated.View
            style={[
              styles.glow,
              {
                width: glowSize,
                height: glowSize,
                borderRadius: glowSize / 2,
                opacity: glowOpacity,
                transform: [{ scale: treeScale }],
              },
            ]}
          />

          <Pressable
            onPress={handleCharacterClick}
            disabled={level === 3}
            style={styles.characterContainer}
          >
            <Animated.View
              style={[
                styles.characterCircle,
                {
                  width: characterSize,
                  height: characterSize,
                  borderRadius: characterSize / 2,
                  transform: [{ scale: treeScale }],
                },
              ]}
            >
              <ThemedText style={[styles.petEmoji, { fontSize: characterSize * 0.5, lineHeight: characterSize * 0.6 }]}>
                {getPetEmoji()}
              </ThemedText>
            </Animated.View>
          </Pressable>

          {feedModalVisible && bubbleMessage && (
            <View style={styles.speechWrapper}>
              <View style={styles.speechBubble}>
                <ThemedText style={styles.speechText}>
                  {bubbleMessage}
                </ThemedText>
                <View style={styles.speechArrow} />
              </View>
            </View>
          )}

          {hearts.map((h) => (
            <Animated.Text
              key={h.id}
              style={[
                styles.heart,
                {
                  opacity: h.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                  transform: [
                    {
                      translateY: h.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, h.y],
                      }),
                    },
                    {
                      translateX: h.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, h.x],
                      }),
                    },
                    {
                      scale: h.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, h.scale],
                      }),
                    },
                    {
                      rotate: h.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", `${h.rotate}deg`],
                      }),
                    },
                  ],
                },
              ]}
            >
              ❤️
            </Animated.Text>
          ))}

          <View style={styles.expBarBox}>
            <View style={styles.expBarBg}>
              <LinearGradient
                colors={["#66BB6A", "#81C784"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.expBarFill, { width: `${getProgress() * 100}%` }]}
              />
            </View>
            <ThemedText style={styles.expText}>
              {exp} / {maxExp} EXP
            </ThemedText>
          </View>

          {upgradable && (
            <Pressable style={styles.upgradeBtn} onPress={handleUpgrade}>
              <LinearGradient
                colors={["#66BB6A", "#4CAF50"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeBtnGradient}
              >
                <ThemedText style={styles.upgradeText}>✨ 업그레이드!</ThemedText>
              </LinearGradient>
            </Pressable>
          )}

          {level === 3 && (
            <Pressable style={styles.resetBtn} onPress={handleReset}>
              <ThemedText style={styles.resetText}>강아지로 돌아가기</ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            {level === 3 ? "강아지가 다 자랐어요!" : "강아지를 터치해서 경험치를 얻어보세요!"}
          </ThemedText>
        </View>
      </SafeAreaView>

      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={loggingOut}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await onSignOut();
          setLogoutSuccessVisible(true);
        }}
      />

      <LogoutSuccessModal
        visible={logoutSuccessVisible}
        onClose={() => {
          setLogoutSuccessVisible(false);
          router.replace("/sign-in?role=elderly");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    paddingTop: 48,
  },
  leftGroup: {
    gap: 4,
  },
  rightGroup: {
    flexDirection: "row",
    gap: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2E7D32",
  },

  refreshBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#66BB6A",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshBtnPressed: {
    backgroundColor: "#4CAF50",
  },
  refreshText: {
    fontSize: 18,
  },

  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#66BB6A",
  },
  logoutBtnPressed: {
    backgroundColor: "#4CAF50",
  },
  logoutText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },

  levelBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
  },

  centerBox: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  glow: {
    position: "absolute",
    backgroundColor: "rgba(102, 187, 106, 0.3)",
    zIndex: -1,
  },

  characterContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  characterCircle: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  petEmoji: {
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },

  expBarBox: {
    marginTop: 32,
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  expBarBg: {
    width: "100%",
    maxWidth: 300,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#C8E6C9",
  },
  expBarFill: {
    height: "100%",
    borderRadius: 8,
  },
  expText: {
    marginTop: 8,
    fontWeight: "700",
    color: "#2E7D32",
    fontSize: 14,
  },

  upgradeBtn: {
    marginTop: 24,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeBtnGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  upgradeText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 18,
  },

  resetBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#FF7043",
  },
  resetText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },

  heart: {
    position: "absolute",
    fontSize: 28,
    top: -30,
  },

  speechWrapper: {
    position: "absolute",
    bottom: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  speechBubble: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#C8E6C9",
    maxWidth: 200,
  },
  speechText: {
    color: "#2E7D32",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  speechArrow: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#C8E6C9",
    transform: [{ rotate: "45deg" }],
  },

  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#66BB6A",
    fontWeight: "600",
  },
});