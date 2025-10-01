// app/(tabs)/watch-home.tsx
import React, { useState, useRef, useMemo } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  ImageBackground,
  useWindowDimensions,
  Text,
  ScrollView,
  Alert,
} from "react-native";

export default function WatchHome() {
  const { width: W } = useWindowDimensions();

  // 상태값
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [hearts, setHearts] = useState<any[]>([]);
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [upgradable, setUpgradable] = useState(false);
  const heartId = useRef(0);
  const bubbleId = useRef(0);

  // 말풍선 문구
  const bubbleMessages = ["행복해!", "즐거워!", "좋아!", "기분 최고!"];

  // 애니메이션 값
  const treeScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // 캐릭터 이미지
  const characterImage =
    level === 1
      ? require("../assets/baby-tree.png")
      : level === 2
        ? require("../assets/teenager-tree.png")
        : require("../assets/adult-tree.png");

  // 캐릭터 크기
  const characterSize = useMemo(() => {
    const max = 240;
    const ratio = level === 1 ? 0.6 : level === 2 ? 0.7 : 0.7;
    return Math.min(W * ratio, max);
  }, [W, level]);

  // 경험치 퍼센트 계산
  const getProgress = () => {
    if (level === 1) return exp / 500;
    if (level === 2) return (exp - 500) / 500;
    if (level === 3) return 1;
    return 0;
  };

  // 캐릭터 클릭 시 (경험치 증가 + 하트 + 말풍선)
  const handleCharacterClick = () => {
    if (level === 3) return;

    setExp((prev) => {
      let limit = level === 1 ? 500 : level === 2 ? 1000 : 0;
      const newExp = Math.min(prev + 250, limit);
      if ((level === 1 && newExp >= 500) || (level === 2 && newExp >= 1000)) {
        setUpgradable(true);
      }
      return newExp;
    });

    // 트리 클릭 애니메이션
    Animated.sequence([
      Animated.timing(treeScale, { toValue: 1.2, duration: 120, useNativeDriver: true }),
      Animated.spring(treeScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    // ❤️ 하트 생성
    const count = 5;
    const newHearts = Array.from({ length: count }).map(() => {
      const id = heartId.current++;
      const anim = new Animated.Value(0);
      const x = (Math.random() - 0.5) * W * 0.6;
      const y = Math.random() * -150 - 50;
      const scaleH = 0.5 + Math.random() * 1.2;
      const rotate = Math.random() * 60 - 30;
      return { id, anim, x, y, scale: scaleH, rotate };
    });
    setHearts((prev) => [...prev, ...newHearts]);
    newHearts.forEach((h) => {
      Animated.timing(h.anim, { toValue: 1, duration: 1500, useNativeDriver: true }).start(() => {
        setHearts((prev) => prev.filter((hh) => hh.id !== h.id));
      });
    });

    // 💬 말풍선 생성
    const msg = bubbleMessages[Math.floor(Math.random() * bubbleMessages.length)];
    const id = bubbleId.current++;
    const anim = new Animated.Value(0);
    const x = (Math.random() - 0.5) * W * 0.4; // 좌우로 살짝 랜덤
    const y = Math.random() * -120 - 60; // 위로 떠오름
    const newBubble = { id, anim, x, y, msg };
    setBubbles((prev) => [...prev, newBubble]);

    Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }).start(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    });
  };

  const handleUpgrade = () => {
    if (!upgradable) return;

    Animated.parallel([
      Animated.sequence([
        Animated.timing(treeScale, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.spring(treeScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    if (level === 1 && exp >= 500) setLevel(2);
    else if (level === 2 && exp >= 1000) setLevel(3);

    setUpgradable(false);
  };

  const handleReset = () => {
    setLevel(1);
    setExp(0);
    setUpgradable(false);
  };

  return (
    <View style={styles.screen}>
      <ImageBackground source={require("../assets/basicscreen.png")} style={styles.bg} resizeMode="cover">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerBox}>
            <View style={{ alignItems: "center" }}>
              <Pressable onPress={handleCharacterClick} disabled={level === 3}>
                <Animated.Image
                  source={characterImage}
                  style={{ width: characterSize, height: characterSize, transform: [{ scale: treeScale }] }}
                  resizeMode="contain"
                />
              </Pressable>

              {/* ❤️ 하트 */}
              <View style={styles.heartContainer}>
                {hearts.map((h) => (
                  <Animated.Text
                    key={h.id}
                    style={[
                      styles.heart,
                      {
                        opacity: h.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                        transform: [
                          { translateY: h.anim.interpolate({ inputRange: [0, 1], outputRange: [0, h.y] }) },
                          { translateX: h.anim.interpolate({ inputRange: [0, 1], outputRange: [0, h.x] }) },
                          { scale: h.anim.interpolate({ inputRange: [0, 1], outputRange: [1, h.scale] }) },
                          { rotate: h.anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${h.rotate}deg`] }) },
                        ],
                      },
                    ]}
                  >
                    ❤️
                  </Animated.Text>
                ))}
              </View>

              {/* 💬 말풍선 */}
              <View style={styles.bubbleContainer}>
                {bubbles.map((b) => (
                  <Animated.View
                    key={b.id}
                    style={[
                      styles.bubble,
                      {
                        opacity: b.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                        transform: [
                          { translateY: b.anim.interpolate({ inputRange: [0, 1], outputRange: [0, b.y] }) },
                          { translateX: b.anim.interpolate({ inputRange: [0, 1], outputRange: [0, b.x] }) },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.bubbleText}>{b.msg}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>

            <View style={styles.expBar}>
              <View style={[styles.expFill, { width: `${getProgress() * 100}%` }]} />
            </View>

            {upgradable && (
              <Pressable style={styles.upgradeBtn} onPress={handleUpgrade}>
                <Text style={styles.upgradeText}>업그레이드!</Text>
              </Pressable>
            )}

            {level === 3 && (
              <Pressable style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetText}>아가로 돌아가기</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bg: { flex: 1, width: "100%", height: "100%" },
  scrollContent: { flexGrow: 1 },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  heartContainer: { position: "absolute", bottom: 0, alignItems: "center", justifyContent: "flex-end", width: "100%" },
  heart: { position: "absolute", color: "red", fontSize: 24 },
  bubbleContainer: { position: "absolute", bottom: 70, alignItems: "center", justifyContent: "flex-end", width: "100%" },
  bubble: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bubbleText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  expBar: { marginTop: -5, width: "70%", height: 10, backgroundColor: "#eee", borderRadius: 6, overflow: "hidden" },
  expFill: { height: "100%", backgroundColor: "#4CAF50" },
  upgradeBtn: { marginTop: 12, backgroundColor: "#FFD54F", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  upgradeText: { color: "#333", fontWeight: "700" },
  resetBtn: { marginTop: 12, backgroundColor: "#E53935", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  resetText: { color: "#FFF", fontWeight: "700" },
});
