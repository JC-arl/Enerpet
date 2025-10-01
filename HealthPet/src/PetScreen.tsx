// app/(tabs)/watch-home.tsx
import React, { useState, useRef, useMemo, useEffect, useCallback  } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  ImageBackground,
  useWindowDimensions,
  Text,
  NativeModules,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import firestore from "@react-native-firebase/firestore";

const { HealthModule } = NativeModules;

interface HealthData {
  steps: number;
  heartRate: number;
  calories: number;
  distance: number;
  activeCalories: number;
}

export default function WatchHome() {
  const { width: W } = useWindowDimensions();

  // 상태값
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [hearts, setHearts] = useState<any[]>([]);
  const [upgradable, setUpgradable] = useState(false);
  const heartId = useRef(0);

  // 헬스 데이터
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    heartRate: 0,
    calories: 0,
    distance: 0,
    activeCalories: 0,
  });

  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // 권한 요청 함수
  const requestHealthPermissions = async (): Promise<boolean> => {
    try {
      if (!HealthModule) {
        setError("Health Connect 모듈을 사용할 수 없습니다.");
        return false;
      }

      // 먼저 현재 권한 상태 확인
      const hasPermissions = await HealthModule.checkPermissions();
      if (hasPermissions) {
        setHasPermissions(true);
        return true;
      }

      // 권한 요청
      const granted = await HealthModule.requestPermissions();
      setHasPermissions(granted);
      
      if (!granted) {
        setError("건강 데이터 접근 권한이 필요합니다.");
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("권한 요청 오류:", err);
      setError("권한 요청 중 오류가 발생했습니다: " + err.message);
      return false;
    }
  };

  // 헬스 데이터 가져오기
  const fetchHealthData = async () => {
    try {
      if (!HealthModule) {
        throw new Error("Health Connect 모듈을 사용할 수 없습니다.");
      }

      const data = await HealthModule.getTodayHealthData();
      
      const newHealthData: HealthData = {
        steps: data.steps ?? 0,
        heartRate: data.heartRate ?? 0,
        calories: data.calories ?? 0,
        distance: data.distance ?? 0,
        activeCalories: data.activeCalories ?? 0,
      };

      setHealthData(newHealthData);
      setError(null);

      return newHealthData;
    } catch (err: any) {
      console.error("헬스 데이터 가져오기 오류:", err);
      throw new Error("건강 데이터를 가져올 수 없습니다: " + err.message);
    }
  };

  // Firestore에 데이터 저장
  const saveToFirestore = async (data: HealthData) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      // 오늘 데이터가 이미 있는지 확인
      const existingData = await firestore()
        .collection("healthData")
        .where("date", "==", today)
        .limit(1)
        .get();

      if (existingData.empty) {
        // 새 데이터 추가
        await firestore().collection("healthData").add({
          ...data,
          date: today,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
        console.log("헬스 데이터가 Firestore에 저장되었습니다.");
      } else {
        // 기존 데이터 업데이트
        const docId = existingData.docs[0].id;
        await firestore().collection("healthData").doc(docId).update({
          ...data,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
        console.log("헬스 데이터가 Firestore에 업데이트되었습니다.");
      }
    } catch (err: any) {
      console.error("Firestore 저장 오류:", err);
      // Firestore 저장 실패는 UI에 표시하지 않음 (백그라운드 작업)
    }
  };

  // 데이터 초기화 및 새로고침 - 이 함수만 useCallback으로 감싸기
  const initializeHealthData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      setError(null);

      // 권한 요청
      const hasPermission = await requestHealthPermissions();
      if (!hasPermission) {
        return;
      }

      // 헬스 데이터 가져오기
      const data = await fetchHealthData();
      
      // Firestore에 저장
      await saveToFirestore(data);

    } catch (err: any) {
      console.error("데이터 초기화 오류:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []); // 빈 dependency array


 // 초기 데이터 로딩 - 이제 dependency 경고가 사라짐
  useEffect(() => {
    initializeHealthData(true);
  }, [initializeHealthData]);


  // 권한 재요청 함수
  const handlePermissionRequest = () => {
    Alert.alert(
      "권한 필요",
      "건강 데이터를 읽기 위해 Health Connect 권한이 필요합니다. 설정으로 이동하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "권한 요청", 
          onPress: () => initializeHealthData(false)
        },
      ]
    );
  };

  // 새로고침 함수
  const handleRefresh = () => {
    if (hasPermissions) {
      initializeHealthData(false);
    } else {
      handlePermissionRequest();
    }
  };

  // 캐릭터 클릭 시 (경험치 증가)
  const handleCharacterClick = () => {
    if (level === 3) return;

    setExp((prev) => {
      let limit = 0;
      if (level === 1) limit = 500;
      else if (level === 2) limit = 1000;

      const newExp = Math.min(prev + 250, limit);

      if ((level === 1 && newExp >= 500) || (level === 2 && newExp >= 1000)) {
        setUpgradable(true);
      }
      return newExp;
    });

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
    ]).start();

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
          toValue: 1.3,
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

    if (level === 1 && exp >= 500) {
      setLevel(2);
    } else if (level === 2 && exp >= 1000) {
      setLevel(3);
    }

    setUpgradable(false);
  };

  const handleReset = () => {
    Alert.alert(
      "리셋 확인",
      "정말로 아기 나무로 돌아가시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "확인", 
          onPress: () => {
            setLevel(1);
            setExp(0);
            setUpgradable(false);
          }
        },
      ]
    );
  };

  // 로딩 화면
  if (isLoading) {
    return (
      <View style={styles.screen}>
        <ImageBackground
          source={require("../assets/basicscreen.png")}
          style={styles.bg}
          resizeMode="cover"
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>건강 데이터를 불러오는 중...</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require("../assets/basicscreen.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerBox}>
            <View style={{ alignItems: "center" }}>
              <Pressable onPress={handleCharacterClick} disabled={level === 3}>
                <Animated.Image
                  source={characterImage}
                  style={{
                    width: characterSize,
                    height: characterSize,
                    transform: [{ scale: treeScale }],
                  }}
                  resizeMode="contain"
                />
              </Pressable>

              <View style={styles.heartContainer}>
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
              </View>
            </View>

            <View style={styles.expBar}>
              <View
                style={[
                  styles.expFill,
                  { width: `${getProgress() * 100}%` },
                ]}
              />
            </View>

            {/* 건강 데이터 표시 */}
            <View style={styles.healthDataContainer}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable 
                    style={styles.retryButton} 
                    onPress={hasPermissions ? handleRefresh : handlePermissionRequest}
                  >
                    <Text style={styles.retryButtonText}>
                      {hasPermissions ? "다시 시도" : "권한 요청"}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.healthDataHeader}>
                    <Text style={styles.healthDataTitle}>오늘의 건강 데이터</Text>
                    <Pressable 
                      style={styles.refreshButton} 
                      onPress={handleRefresh}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <ActivityIndicator size="small" color="#4CAF50" />
                      ) : (
                        <Text style={styles.refreshButtonText}>🔄</Text>
                      )}
                    </Pressable>
                  </View>
                  
                  <View style={styles.healthDataGrid}>
                    <View style={styles.healthDataItem}>
                      <Text style={styles.healthDataValue}>{healthData.steps.toLocaleString()}</Text>
                      <Text style={styles.healthDataLabel}>걸음 수</Text>
                    </View>
                    
                    <View style={styles.healthDataItem}>
                      <Text style={styles.healthDataValue}>
                        {healthData.heartRate > 0 ? healthData.heartRate.toFixed(1) : '-'}
                      </Text>
                      <Text style={styles.healthDataLabel}>심박수 (bpm)</Text>
                    </View>
                    
                    <View style={styles.healthDataItem}>
                      <Text style={styles.healthDataValue}>
                        {healthData.calories.toFixed(0)}
                      </Text>
                      <Text style={styles.healthDataLabel}>칼로리 (kcal)</Text>
                    </View>
                    
                    <View style={styles.healthDataItem}>
                      <Text style={styles.healthDataValue}>
                        {(healthData.distance / 1000).toFixed(1)}
                      </Text>
                      <Text style={styles.healthDataLabel}>거리 (km)</Text>
                    </View>
                  </View>
                </>
              )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heartContainer: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
  },
  heart: {
    position: "absolute",
    color: "red",
    fontSize: 24,
  },
  expBar: {
    marginTop: -5,
    width: "70%",
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 6,
    overflow: "hidden",
  },
  expFill: { height: "100%", backgroundColor: "#4CAF50" },
  healthDataContainer: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 16,
  },
  healthDataHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  healthDataTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  refreshButtonText: {
    fontSize: 16,
  },
  healthDataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  healthDataItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
  },
  healthDataValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  healthDataLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#E53935",
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  upgradeBtn: {
    marginTop: 12,
    backgroundColor: "#FFD54F",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeText: { color: "#333", fontWeight: "700" },
  resetBtn: {
    marginTop: 12,
    backgroundColor: "#E53935",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetText: { color: "#FFF", fontWeight: "700" },
});
