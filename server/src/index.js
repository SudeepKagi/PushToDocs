import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { redisConnection } from "./config/redis.js";
import healthRoute from "./routes/health.route.js";
import authRoute from "./routes/auth.route.js";
import { protect } from "./middleware/auth.middleware.js";
import githubRoute from "./routes/github.route.js";


const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);
app.use(express.json());
app.use("/health", healthRoute);
app.use("/auth", authRoute);
app.use("/api/github", githubRoute);


const PORT = process.env.PORT || 3000;

app.get("/test-protected", protect, (req, res) => {
    res.json({
        message: "Protected route working",
        user: req.user.username,
    });
});

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
