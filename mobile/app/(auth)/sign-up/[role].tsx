import React from "react";
import { useLocalSearchParams } from "expo-router";
import SignUpForm from "../../../components/(auth)/SignUpForm";

export default function SignUpByRole() {
  const { role } = useLocalSearchParams<{ role: string }>();

  // 기본값 elderly
  const validRole = role === "guardian" ? "guardian" : "elderly";

  return <SignUpForm role={validRole} />;
}
