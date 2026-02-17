import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";

const worker = new Worker(
    "readme-generation",
    async (job) => {
        console.log("🧠 Processing README job...");
        console.log("📦 Job data:", job.data);

        const { repoFullName } = job.data;

        // Placeholder logic for now
        console.log(`✨ Generating README for ${repoFullName}`);

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("✅ README generation completed");
    },
    {
        connection: redisConnection,
    }
);

worker.on("completed", (job) => {
    console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log("🚀 README Worker started...");
