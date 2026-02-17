// 🔥 Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

// Core imports
import express from "express";
import cors from "cors";

// Config imports (these use process.env, so dotenv must be loaded before)
import { connectDB } from "./config/db.js";
import { redisConnection } from "./config/redis.js";

// Routes
import healthRoute from "./routes/health.route.js";

const app = express();

// --------------------
// Middleware
// --------------------
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());

// --------------------
// Routes
// --------------------
app.use("/health", healthRoute);

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 3000;

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
