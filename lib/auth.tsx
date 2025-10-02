import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";

type SignInResult = { uid: string; name: string; role?: string };

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  signUp: (
    name: string,
    email: string,
    password: string,
    role: "guardian" | "elderly"
  ) => Promise<void>;
  signIn: (
    email: string,
    password: string,
    expectedRole?: "guardian" | "elderly"
  ) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  // ✅ 회원가입
  const signUp = async (
    name: string,
    email: string,
    password: string,
    role: "guardian" | "elderly"
  ): Promise<void> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Firebase Auth displayName 업데이트
    if (auth.currentUser && name) {
      await updateProfile(auth.currentUser, { displayName: name });
    }

    // Firestore에 계정 기본 정보 저장
    await setDoc(
      doc(db, "users", cred.user.uid),
      {
        uid: cred.user.uid,
        name,
        email,
        role,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 자동 로그인 방지 → 회원가입 후 바로 로그인 안 되게끔
    await auth.signOut();
  };

  // ✅ 로그인
  const signIn = async (
    email: string,
    password: string,
    expectedRole?: "guardian" | "elderly"
  ): Promise<SignInResult> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    let name = cred.user.displayName ?? "";
    let role: string | undefined;

    // Firestore에서 사용자 데이터 가져오기
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) {
      const data = snap.data() as any;
      name = data.name || name;
      role = data.role;
    }

    // 🚨 role 검증
    if (expectedRole && role !== expectedRole) {
      await auth.signOut();
      throw new Error(
        expectedRole === "guardian"
          ? "보호자 전용 계정이 아닙니다."
          : "피보호자 전용 계정이 아닙니다."
      );
    }

    return { uid: cred.user.uid, name: name || "사용자", role };
  };

  // ✅ 로그아웃
  const signOut = async (): Promise<void> => {
    await auth.signOut();
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, signUp, signIn, signOut }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
