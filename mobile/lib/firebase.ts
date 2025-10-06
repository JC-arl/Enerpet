// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAKMs8W78aMrxG07O44yHdCKMIPumNcn4",
  authDomain: "enerpet-96add.firebaseapp.com",
  projectId: "enerpet-96add",
  storageBucket: "enerpet-96add.appspot.com",
  messagingSenderId: "274794555440",
  appId: "1:274794555440:web:089f6c4ba6814dfbf6e5f5",
};

// ✅ 이미 초기화된 앱이 있으면 재사용
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Auth 중복 방지
let auth;
try {
  auth = getAuth(app);
} catch (e) {
  // 아직 auth가 없으면 initializeAuth로 생성
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

const db = getFirestore(app);

export { auth, db };
