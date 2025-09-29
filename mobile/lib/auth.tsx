import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

type SignInResult = { uid: string; name: string; role?: string; elderlyName?: string };

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  signUp: (
    name: string,
    email: string,
    password: string,
    role: "guardian" | "elderly",
    elderlyName?: string
  ) => Promise<void>;
  signIn: (
    email: string,
    password: string,
    expectedRole?: "guardian" | "elderly" // ✅ 추가
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

  const signUp = async (
    name: string,
    email: string,
    password: string,
    role: "guardian" | "elderly",
    elderlyName?: string
  ): Promise<void> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // 1) Firebase Auth 프로필 업데이트
    if (auth.currentUser && name) {
      await updateProfile(auth.currentUser, { displayName: name });
    }

    // 2) Firestore에 role 포함해서 저장
    await setDoc(
      doc(db, "users", cred.user.uid),
      {
        uid: cred.user.uid,
        name,
        email,
        role,
        elderlyName: role === "guardian" ? elderlyName || "" : null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 회원가입 후 자동 로그인 방지
    await auth.signOut();
  };

  const signIn = async (
    email: string,
    password: string,
    expectedRole?: "guardian" | "elderly" // ✅ role 검증
  ): Promise<SignInResult> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    let name = cred.user.displayName ?? "";
    let role: string | undefined;
    let elderlyName: string | undefined;

    // Firestore에서 사용자 데이터 가져오기
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) {
      const data = snap.data() as any;
      name = data.name || name;
      role = data.role;
      elderlyName = data.elderlyName;
    }

    // 🚨 로그인 페이지의 role과 Firestore에 저장된 role이 다르면 차단
    if (expectedRole && role !== expectedRole) {
      await auth.signOut();
      throw new Error(
        expectedRole === "guardian"
          ? "보호자 전용 계정이 아닙니다."
          : "피보호자 전용 계정이 아닙니다."
      );
    }

    return { uid: cred.user.uid, name: name || "사용자", role, elderlyName };
  };

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
