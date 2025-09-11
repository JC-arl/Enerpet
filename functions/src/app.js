import express from "express";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(express.json());

// 사용자 API
app.use("/api/v1/users", userRoutes);

export default app;