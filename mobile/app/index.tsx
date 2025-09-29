import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";

export default function Start() {
  const { width: W, height: H } = useWindowDimensions();

  // 반응형 스케일 함수
  const guidelineW = 375;
  const guidelineH = 812;

  const scale = (size: number) => (W / guidelineW) * size;
  const vscale = (size: number) => (H / guidelineH) * size;
  const mscale = (size: number, factor = 0.5) =>
    size + (scale(size) - size) * factor;

  const isLandscape = W > H;
  const minDim = Math.min(W, H);
  const isTablet = Math.max(W, H) >= 768 || minDim >= 600;

  // 버튼 반응형 계산
  const horizontalPad = mscale(24);
  const bottomPad = isLandscape ? vscale(16) : vscale(32);
  const buttonMin = mscale(isTablet ? 180 : 140);
  const buttonMax = mscale(isTablet ? 460 : 360);
  const buttonWidth = Math.max(
    Math.min(W - horizontalPad * 2, buttonMax),
    buttonMin
  );

  const btnPaddingV = Math.max(12, vscale(isTablet ? 18 : 14));
  const btnRadius = mscale(isTablet ? 32 : 28);
  const fontSize = Math.round(mscale(isTablet ? 22 : 20));
  const letterSpacing = mscale(1);

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="dark-content" translucent={Platform.OS !== "web"} />

      <SafeAreaView style={styles.container}>
        {/* 로고 이미지 중앙 */}
        <Image
          source={require("../assets/images/healthpet-logo.png")} // 경로는 프로젝트에 맞게 조정
          style={{
            width: W * 0.9, // 화면의 60% 크기
            height: W * 0.9 * 0.6,
            resizeMode: "contain",
            marginBottom: 40,
          }}
        />

        {/* START 버튼 (반응형) */}
        <TouchableOpacity
          style={[
            styles.startButton,
            {
              width: buttonWidth,
              paddingVertical: btnPaddingV,
              borderRadius: btnRadius,
              marginBottom: bottomPad,
            },
          ]}
          onPress={() => router.push("/role-select")}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={[styles.startText, { fontSize, letterSpacing }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.9}
          >
            START
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#FFD93D",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  startText: {
    fontWeight: "bold",
    color: "#fff",
  },
});
