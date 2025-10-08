import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import messaging from "@react-native-firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

export default function TabLayout() {
  const { user, role } = useAuth();

  useEffect(() => {
    // ✅ 보호자만 FCM 등록
    if (!user || role !== "guardian") return;

    const setupFCM = async () => {
      try {
        // 🔹 1. 알림 권한 요청
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log("❌ 알림 권한이 거부되었습니다.");
          return;
        }

        // 🔹 2. 토큰 생성
        const token = await messaging().getToken();
        console.log("📲 보호자 FCM 토큰:", token);

        // 🔹 3. Firestore에 저장
        await updateDoc(doc(db, "users", user.uid), {
          fcmToken: token,
        });

        // 🔹 4. 토큰 갱신될 때 자동 업데이트
        messaging().onTokenRefresh(async (newToken) => {
          console.log("🔁 토큰 갱신됨:", newToken);
          await updateDoc(doc(db, "users", user.uid), { fcmToken: newToken });
        });
      } catch (err) {
        console.error("🔥 FCM 설정 오류:", err);
      }
    };

    setupFCM();
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1E88E5",
        tabBarInactiveTintColor: "#90A4AE",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="DetailScreen"
        options={{
          title: "상세 기록",
          tabBarLabel: "상세 기록",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="SummaryScreen"
        options={{
          title: "건강 요약",
          tabBarLabel: "건강 요약",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="GuardianMyPage"
        options={{
          title: "마이페이지",
          tabBarLabel: "마이페이지",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
