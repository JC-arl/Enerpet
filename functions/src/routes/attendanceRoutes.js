import express from "express";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const router = express.Router();

/**
 * 출석체크
 * POST /api/v1/attendance/:uid/checkin
 */
router.post("/:uid/checkin", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "uid가 필요합니다.",
        code: "MISSING_UID"
      });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const userRef = db.collection("users").doc(uid);
    const attendanceRef = userRef.collection("attendance").doc(today);

    // 오늘 이미 출석했는지 확인
    const existing = await attendanceRef.get();
    if (existing.exists) {
      return res.status(400).json({
        success: false,
        message: "오늘은 이미 출석체크를 완료했습니다.",
        code: "ALREADY_CHECKED_IN"
      });
    }

    // 유저 문서 확인 (없으면 생성)
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({
        points: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 출석 기록 추가
    await attendanceRef.set({
      date: today,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const userDocAfter = await userRef.get();
    const userData = userDocAfter.data();
    const newPoints = (userData?.points || 0) + 100;

    await userRef.update({
      points: newPoints,
    });

    return res.status(200).json({
      success: true,
      message: "출석체크 완료!",
      data: {
        date: today,
        reward: 100,
        totalPoints: newPoints,
      },
    });
  } catch (error) {
    console.error("출석체크 실패:", error);
    return res.status(500).json({
      success: false,
      message: "출석체크 중 오류가 발생했습니다.",
      code: "ATTENDANCE_CHECKIN_ERROR",
    });
  }
});

export default router;
