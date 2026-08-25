import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./Configs/db.js";
import userRouter from "./Routes/userRoutes.js";
import resumeRouter from "./Routes/resumeRoutes.js";
import aiRouter from "./Routes/aiRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
await connectDB();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => res.send("Server is running..."));
app.use("/api/users", userRouter);
app.use("/api/resumes", resumeRouter);
app.use("/api/ai", aiRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
