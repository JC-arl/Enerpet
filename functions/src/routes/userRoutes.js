import express from "express";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const router = express.Router();

/**
 * 마이프로필 조회
 * GET /api/v1/users/:uid
 */
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "uid가 필요합니다.",
      });
    }

    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "해당 uid의 프로필을 찾을 수 없습니다.",
      });
    }
    const data = doc.data();

    // createdAt 변환
    let createdAt = null;
    if (data.createdAt && data.createdAt.toDate) {
      createdAt = data.createdAt.toDate().toISOString("ko-KR", {
        timeZone: "Asia/Seoul",
      });
    }

    return res.status(200).json({
      data: {
        ...data,
        createdAt,
      },
    });
  } catch (error) {
    console.error("프로필 조회 실패:", error);
    return res.status(500).json({
      success: false,
      message: "프로필 정보 조회 중 오류가 발생했습니다.",
      code: "PROFILE_GET_ERROR",
    });
  }
});

export default router;
