// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔑 Firebase 콘솔에서 설정 복사
const firebaseConfig = {
  apiKey: "AIzaSyCAKMs8W78aMrxG07O44yHdCKMIPumNcn4",
  authDomain: "enerpet-96add.firebaseapp.com",
  projectId: "enerpet-96add",
  storageBucket: "enerpet-96add.appspot.com",   // ✅ 오타 수정됨
  messagingSenderId: "274794555440",
  appId: "1:274794555440:web:089f6c4ba6814dfbf6e5f5",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
