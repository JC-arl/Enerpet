import express from "express";
import admin from "firebase-admin";

export default (db) => {
  const router = express.Router();

  // 경험치 추가 + 레벨업 처리 API
  router.post("/:userId/pets/:petId/exp", async (req, res) => {
    try {
      const { userId, petId } = req.params;
      const { amount } = req.body;

      if (!amount || typeof amount !== "number") {
        return res.status(400).json({ message: "amount 값이 필요합니다." });
      }

      const petRef = db
        .collection("users")
        .doc(userId)
        .collection("pets")
        .doc(petId);
      const doc = await petRef.get();
      if (!doc.exists)
        return res.status(404).json({ message: "펫을 찾을 수 없습니다." });

      let { exp = 0, level = 1 } = doc.data();
      exp += amount;

      let leveledUp = false;
      if (level === 1 && exp >= 500) {
        exp -= 500;
        level = 2;
        leveledUp = true;
      }
      if (level === 2 && exp >= 1000) {
        exp -= 1000;
        level = 3;
        leveledUp = true;
      }

      const updatedAt = admin.firestore.FieldValue.serverTimestamp();

      await petRef.update({ exp, level, updatedAt });

      // 업데이트된 데이터 다시 읽기
      const updatedDoc = await petRef.get();
      const data = updatedDoc.data();

      res.json({
        petId,
        ...data, // exp, leve, updatedAt 포함
        updatedAt: data.updatedAt?.toDate().toISOString(),
        leveledUp,
        message: leveledUp ? "레벨업 성공!" : "경험치가 추가되었습니다.",
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
