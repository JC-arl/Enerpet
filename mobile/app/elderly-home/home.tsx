// app/(tabs)/home.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Pressable,
  Animated,
  View,
  ImageBackground,
  useWindowDimensions,
} from "react-native";

import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import LogoutSuccessModal from "@/components/LogoutSuccessModal";

import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useGame } from "@/lib/GameContext";

export default function HomeScreen() {
  const { level, exp, maxExp, setLevel, setExp, setMaxExp } = useGame();

  const { width: W, height: H } = useWindowDimensions();

  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutSuccessVisible, setLogoutSuccessVisible] = useState(false);

  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [hearts, setHearts] = useState<any[]>([]);
  const heartId = useRef(0);

  const treeScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const [upgradable, setUpgradable] = useState(false);

  // ✅ 건강 데이터 상태 (임시)
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [steps, setSteps] = useState<number | null>(null);

  // ----------------------
  // 유틸 함수
  // ----------------------
  const guidelineW = 375;
  const guidelineH = 812;
  const scale = (size: number) => (W / guidelineW) * size;
  const vscale = (size: number) => (H / guidelineH) * size;
  const mscale = (size: number, factor = 0.5) =>
    size + (scale(size) - size) * factor;

  // 사용자 이름 불러오기
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

  // 로그아웃 처리
  // onSignOut 수정
  const onSignOut = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await signOut();
      await AsyncStorage.removeItem("authToken");
      console.log("로그아웃 완료");
    } catch (e) {
      console.warn("로그아웃 실패:", e);
    } finally {
      setLoggingOut(false);
    }
  };

  const confirmLogout = async () => {
    await onSignOut();
    setLogoutModalVisible(false);
  };

  // feedModal 자동 닫기
  useEffect(() => {
    if (feedModalVisible) {
      const timer = setTimeout(() => setFeedModalVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedModalVisible]);

  // ----------------------
  // 캐릭터 위치와 크기
  // ----------------------
  const characterTopPx = useMemo(() => {
    const ratio = level === 1 ? 0.45 : level === 2 ? 0.4 : 0.29;
    return Math.round(H * ratio);
  }, [H, level]);

  const characterSize = useMemo(() => {
    const max = 420;
    const ratio = level === 1 ? 0.42 : level === 2 ? 0.52 : 0.7;
    return Math.min(W * ratio, max);
  }, [W, level]);

  const glowSize = Math.max(characterSize * 1.1, 140);

  // ----------------------
  // 건강 상태 판별
  // ----------------------
  const getHealthStatus = () => {
    if (heartRate === null || steps === null) return "happy";
    if (heartRate < 50 || heartRate > 120) return "sad";
    if (steps < 100) return "sad";
    return "happy";
  };

  const healthStatus = getHealthStatus();

  // ----------------------
  // 캐릭터 이미지 선택 (레벨 × 표정)
  // ----------------------
  const characterImage =
    level === 1
      ? healthStatus === "happy"
        ? require("@/assets/images/baby-tree-happy.png")
        : require("@/assets/images/baby-tree-sad.png")
      : level === 2
        ? healthStatus === "happy"
          ? require("@/assets/images/teenager-tree-happy.png")
          : require("@/assets/images/teenager-tree-sad.png")
        : healthStatus === "happy"
          ? require("@/assets/images/adult-tree-happy.png")
          : require("@/assets/images/adult-tree-sad.png");

  // ----------------------
  // 캐릭터 클릭 시
  // ----------------------
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

    const bounce = [
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
    ];
    Animated.sequence([...bounce, ...bounce, ...bounce]).start(() =>
      setFeedModalVisible(true)
    );

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

  // ----------------------
  // 업그레이드
  // ----------------------
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

  // 경험치 계산
  const getProgress = () => {
    if (level === 1) return exp / 500;
    if (level === 2) return (exp - 500) / 500;
    if (level === 3) return 1;
    return 0;
  };

  // ----------------------
  // 렌더링
  // ----------------------
  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require("@/assets/images/basicscreen.png")}
        style={[styles.bg, { position: "relative" }]}
        resizeMode="cover"
      >
        {/* 상단 */}
        <View style={[styles.topRow, { padding: mscale(25) }]}>
          <View style={[styles.leftGroup, { gap: mscale(8) }]}>
            <ThemedText type="title" style={{ fontSize: mscale(20) }}>
              Welcome!
            </ThemedText>
            {displayName ? (
              <ThemedText
                type="title"
                style={[styles.nick, { fontSize: mscale(20) }]}
              >
                {displayName}
              </ThemedText>
            ) : null}
            <HelloWave />
          </View>
          <Pressable
            onPress={() => setLogoutModalVisible(true)}
            disabled={loggingOut}
            style={({ pressed }) => [
              styles.logoutBtn,
              {
                paddingVertical: vscale(8),
                paddingHorizontal: mscale(14),
                borderRadius: mscale(10),
              },
              pressed && styles.logoutBtnPressed,
              loggingOut && { opacity: 0.6 },
            ]}
          >
            <ThemedText style={[styles.logoutText, { fontSize: mscale(14) }]}>
              {loggingOut ? "로그아웃 중…" : "로그아웃"}
            </ThemedText>
          </Pressable>
        </View>

        {/* 캐릭터 + UI */}
        <View style={[styles.centerBox, { top: characterTopPx, width: "100%" }]}>
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
          <Pressable onPress={handleCharacterClick} disabled={level === 3}>
            <Animated.Image
              source={characterImage}
              style={[
                styles.character,
                {
                  width: characterSize,
                  height: characterSize,
                  transform: [{ scale: treeScale }],
                },
              ]}
              resizeMode="contain"
            />
          </Pressable>

          {/* 캐릭터 말풍선 */}
          {feedModalVisible && (
            <View style={styles.speechWrapper}>
              <View
                style={[
                  styles.speechBubble,
                  { maxWidth: Math.min(W * 0.6, 260) },
                ]}
              >
                <ThemedText style={[styles.speechText, { fontSize: mscale(13) }]}>
                  🍎 냠냠 맛있다! 🌳
                </ThemedText>
                <View style={styles.speechArrow} />
              </View>
            </View>
          )}

          {/* 하트 애니메이션 */}
          {hearts.map((h) => (
            <Animated.Text
              key={h.id}
              style={[
                styles.heart,
                { fontSize: mscale(28) },
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

          {/* 경험치 + 업그레이드 */}
          <View style={styles.expBarBox}>
            <View
              style={[
                styles.expBarBg,
                {
                  width: Math.min(W * 0.86, 560),
                  height: Math.max(14, vscale(18)),
                  borderRadius: mscale(10),
                },
              ]}
            >
              <View
                style={[
                  styles.expBarFill,
                  { width: `${getProgress() * 100}%` },
                ]}
              />
            </View>
            <ThemedText style={[styles.expText, { fontSize: mscale(14) }]}>
              {exp} / {maxExp} EXP
            </ThemedText>
          </View>

          {upgradable && (
            <Pressable
              style={[
                styles.upgradeBtn,
                {
                  marginTop: vscale(20),
                  paddingVertical: vscale(10),
                  paddingHorizontal: mscale(20),
                  borderRadius: mscale(10),
                },
              ]}
              onPress={handleUpgrade}
            >
              <ThemedText style={[styles.upgradeText, { fontSize: mscale(16) }]}>
                업그레이드!
              </ThemedText>
            </Pressable>
          )}

          {level === 3 && (
            <Pressable
              style={[
                styles.resetBtn,
                {
                  marginTop: vscale(12),
                  paddingVertical: vscale(8),
                  paddingHorizontal: mscale(18),
                  borderRadius: mscale(10),
                },
              ]}
              onPress={handleReset}
            >
              <ThemedText style={[styles.resetText, { fontSize: mscale(14) }]}>
                아가로 돌아가기
              </ThemedText>
            </Pressable>
          )}
        </View>
      </ImageBackground>

      {/* ✅ 로그아웃 확인 모달 */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={loggingOut}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await onSignOut();
          setLogoutSuccessVisible(true); // 완료 모달 열기
        }}
      />

      {/* ✅ 로그아웃 완료 모달 */}
      <LogoutSuccessModal
        visible={logoutSuccessVisible}
        onClose={() => {
          setLogoutSuccessVisible(false);
          router.replace("/sign-in?role=elderly"); // ✅ 확인 누르면 로그인 화면 이동
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bg: { flex: 1, width: "100%", height: "100%" },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: { flexDirection: "row", alignItems: "center" },
  nick: {},

  // ✅ 로그아웃 버튼 색상 (노인용 - 파란 계열)
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#1976D2",   // 진한 파란색 테두리
    backgroundColor: "#2196F3", // 기본 파란색 배경
  },
  logoutBtnPressed: {
    backgroundColor: "#1976D2", // 눌렀을 때 진한 파란색
    borderColor: "#0D47A1",     // 더 진한 남색 테두리
  },
  logoutText: {
    color: "#FFF", // 텍스트 흰색
    fontWeight: "600",
  },

  centerBox: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  character: {},
  glow: {
    position: "absolute",
    backgroundColor: "rgba(255, 215, 0, 0.5)",
    zIndex: -1,
  },

  expBarBox: { marginTop: 20, alignItems: "center" },
  expBarBg: { backgroundColor: "#EEE", overflow: "hidden" },
  expBarFill: { height: "100%", backgroundColor: "#FFC107" },
  expText: { marginTop: 6, fontWeight: "600", color: "#333" },

  // ✅ 업그레이드 버튼 (초록)
  upgradeBtn: { backgroundColor: "#4CAF50" },
  upgradeText: { color: "#FFF", fontWeight: "700" },

  // ✅ 리셋 버튼 (빨강)
  resetBtn: { backgroundColor: "#E53935" },
  resetText: { color: "#FFF", fontWeight: "700" },

  heart: { position: "absolute", color: "red", top: -30 },

  speechWrapper: {
    position: "absolute",
    bottom: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  speechBubble: {
    backgroundColor: "#FFF",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  speechText: { color: "#333", textAlign: "center" },
  speechArrow: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: "#FFF",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#DDD",
    transform: [{ rotate: "45deg" }],
  },
});
