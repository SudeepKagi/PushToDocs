import dotenv from "dotenv";
dotenv.config();

import IORedis from "ioredis";

export const redisConnection = new IORedis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,

    maxRetriesPerRequest: null,   // 🔥 REQUIRED FOR BULLMQ
    enableReadyCheck: false,      // recommended for BullMQ
});

redisConnection.on("connect", () => {
    console.log("✅ Redis Connected");
});

redisConnection.on("error", (err) => {
    console.error("❌ Redis Error:", err.message);
});
