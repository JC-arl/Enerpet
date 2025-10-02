import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // 👈 모든 탭에서 헤더 숨김
      }}
    >
      <Tabs.Screen 
        name="summary" 
        options={{ 
          title: "총정리",
          tabBarLabel: "총정리", // 하단 탭바에만 표시
        }} 
      />
      <Tabs.Screen 
        name="detail" 
        options={{ 
          title: "상세 기록",
          tabBarLabel: "상세 기록", // 하단 탭바에만 표시
        }} 
      />
    </Tabs>
  );
}