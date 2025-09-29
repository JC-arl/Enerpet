// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth";
import { GameProvider } from "@/lib/GameContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <GameProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="start" />
          <Stack.Screen name="(auth)/sign-in" />
          <Stack.Screen name="elderly-home" />
          <Stack.Screen name="guardian-home" />
        </Stack>
      </GameProvider>
    </AuthProvider>
  );
}
