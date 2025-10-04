import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SignInResult = { uid: string; name: string; role?: string; elderlyName?: string };

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  role: "guardian" | "elderly" | null;
  elderlyId: string | null; // 선택된 피보호자 ID
  selectedElderlyId: string | null;
  setSelectedElderlyId: (id: string | null) => void;
  elderlyUids: string[]; // 연결된 피보호자 목록
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
    expectedRole?: "guardian" | "elderly"
  ) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [role, setRole] = useState<"guardian" | "elderly" | null>(null);
  const [selectedElderlyId, setSelectedElderlyId] = useState<string | null>(null);
  const [elderlyUids, setElderlyUids] = useState<string[]>([]);

  // 사용자 인증 상태 구독
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        // Firestore에서 role 가져오기
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || null);
        }
      } else {
        setRole(null);
        setSelectedElderlyId(null);
        setElderlyUids([]);
      }
      
      setInitializing(false);
    });
    return unsub;
  }, []);

  // guardian의 경우 elderlyUids 구독
  useEffect(() => {
    if (!user || role !== "guardian") {
      setElderlyUids([]);
      setSelectedElderlyId(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.data();
      const uids = data?.elderlyUids || [];
      setElderlyUids(uids);

      // 첫 로드시 자동 선택
      if (uids.length > 0 && !selectedElderlyId) {
        setSelectedElderlyId(uids[0]);
      }
      
      // 선택된 ID가 목록에 없으면 첫 번째로 재설정
      if (selectedElderlyId && !uids.includes(selectedElderlyId)) {
        setSelectedElderlyId(uids[0] || null);
      }
    });

    return unsub;
  }, [user?.uid, role, selectedElderlyId]);

  const signUp = async (
    name: string,
    email: string,
    password: string,
    role: "guardian" | "elderly",
    elderlyName?: string
  ): Promise<void> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    if (auth.currentUser && name) {
      await updateProfile(auth.currentUser, { displayName: name });
    }

    await setDoc(
      doc(db, "users", cred.user.uid),
      {
        uid: cred.user.uid,
        name,
        email,
        role,
        elderlyName: role === "guardian" ? elderlyName || "" : null,
        elderlyUids: role === "guardian" ? [] : null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    await auth.signOut();
  };

  const signIn = async (
    email: string,
    password: string,
    expectedRole?: "guardian" | "elderly"
  ): Promise<SignInResult> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    let name = cred.user.displayName ?? "";
    let role: string | undefined;
    let elderlyName: string | undefined;

    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) {
      const data = snap.data() as any;
      name = data.name || name;
      role = data.role;
      elderlyName = data.elderlyName;
    }

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
    setRole(null);
    setSelectedElderlyId(null);
    setElderlyUids([]);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ 
      user, 
      initializing, 
      role,
      elderlyId: selectedElderlyId, // DetailScreen/SummaryScreen에서 사용
      selectedElderlyId,
      setSelectedElderlyId,
      elderlyUids,
      signUp, 
      signIn, 
      signOut 
    }),
    [user, initializing, role, selectedElderlyId, elderlyUids]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}