import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="summary" options={{ title: "총정리" }} />
      <Tabs.Screen name="detail" options={{ title: "상세 기록" }} />
    </Tabs>
  );
}
