import express from "express";
import userRoutes from "./routes/userRoutes.js";
import petRoutes from "./routes/petRoutes.js";
import admin from "firebase-admin"; 

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

// 사용자 API
app.use("/api/v1/users", userRoutes);

// 펫 API
app.use("/api/v1/users", petRoutes(db));

export default app;