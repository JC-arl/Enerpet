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
import { LinearGradient } from "expo-linear-gradient";

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
  const bottomPad = isLandscape ? vscale(20) : vscale(40);
  const buttonMin = mscale(isTablet ? 200 : 160);
  const buttonMax = mscale(isTablet ? 480 : 380);
  const buttonWidth = Math.max(
    Math.min(W - horizontalPad * 2, buttonMax),
    buttonMin
  );

  const btnPaddingV = Math.max(16, vscale(isTablet ? 20 : 16));
  const btnRadius = mscale(isTablet ? 30 : 25);
  const fontSize = Math.round(mscale(isTablet ? 24 : 22));
  const letterSpacing = mscale(1.5);

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="dark-content" translucent={Platform.OS !== "web"} />

      {/* 파란색 그라디언트 배경 */}
      <LinearGradient
        colors={["#81D4FA", "#B3E5FC", "#E1F5FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 배경 장식 원들 */}
      <View style={[styles.decorCircle, { top: 100, left: 30, width: 120, height: 120, backgroundColor: "#4FC3F7", opacity: 0.18 }]} />
      <View style={[styles.decorCircle, { top: 200, right: 40, width: 90, height: 90, backgroundColor: "#29B6F6", opacity: 0.15 }]} />
      <View style={[styles.decorCircle, { bottom: 150, left: 50, width: 80, height: 80, backgroundColor: "#03A9F4", opacity: 0.12 }]} />

      <SafeAreaView style={styles.container}>
        {/* 로고 + 텍스트 영역 (중앙 정렬) */}
        <View style={styles.centerContent}>
          {/* 로고 배경 원 (부드러운 강조) */}
          <View style={styles.logoBackground}>
            <Image
              source={require("../assets/images/healthpet_logo.png")}
              style={{
                width: W * 0.45,
                height: W * 0.45,
                resizeMode: "contain",
              }}
            />
          </View>
          
          {/* 메인 타이틀 */}
          <Text style={styles.mainTitle}>헬스펫</Text>
          
          {/* 영문 타이틀 */}
          <Text style={styles.engTitle}>HealthPet AI</Text>
          
          {/* 서브 텍스트 */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>손목 위의 건강 지킴이</Text>
          </View>
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                width: buttonWidth,
                borderRadius: btnRadius,
              },
            ]}
            onPress={() => router.push("/role-select")}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LinearGradient
              colors={["#29B6F6", "#039BE5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.buttonGradient,
                {
                  borderRadius: btnRadius,
                  paddingVertical: btnPaddingV,
                },
              ]}
            >
              <Text
                style={[styles.startText, { fontSize, letterSpacing }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.9}
              >
                시작하기
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 하단 안내 텍스트 */}
          <Text style={styles.footerText}>
            건강한 하루를 함께해요
          </Text>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: bottomPad }} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    flex: 1, 
    backgroundColor: "#E1F5FE" 
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
  },
  decorCircle: {
    position: "absolute",
    borderRadius: 1000,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 1000,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#29B6F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#0277BD",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  engTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0288D1",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitleContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#01579B",
    fontWeight: "600",
    textAlign: "center",
  },
  buttonContainer: {
    alignItems: "center",
    width: "100%",
    paddingBottom: 20,
  },
  startButton: {
    alignItems: "center",
    shadowColor: "#0288D1",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  startText: {
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  footerText: {
    fontSize: 13,
    color: "#0288D1",
    marginTop: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});