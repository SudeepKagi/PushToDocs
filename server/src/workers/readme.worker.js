import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import axios from "axios";
import { redisConnection } from "../config/redis.js";
import { generateReadmeWithGroq } from "../utils/groq.js";
import ActiveRepo from "../models/ActiveRepo.js";
import User from "../models/User.js";
import { decrypt } from "../utils/encryption.js";

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ Worker MongoDB Connected");

const worker = new Worker(
    "readme-generation",
    async (job) => {
        console.log("🧠 Processing README job...");
        console.log("📦 Job data:", job.data);

        const { repoId, repoFullName, branch, lastCommitMessage } = job.data;

        const activeRepo = await ActiveRepo.findOne({ repoId });
        if (!activeRepo) {
            throw new Error("Active repo not found");
        }

        const user = await User.findById(activeRepo.user);
        if (!user) {
            throw new Error("User not found");
        }

        const accessToken = decrypt(user.encryptedGithubToken);

        console.log(`✨ Generating README for ${repoFullName}`);

        const readmeContent = await generateReadmeWithGroq(
            repoFullName,
            lastCommitMessage
        );

        const encodedContent = Buffer.from(readmeContent).toString("base64");

        console.log("📤 Uploading README to GitHub...");

        // Check if README exists
        let sha = null;

        try {
            const existingFile = await axios.get(
                `https://api.github.com/repos/${repoFullName}/contents/README.md`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    params: { ref: branch },
                }
            );

            sha = existingFile.data.sha;
        } catch (err) {
            // File doesn't exist, that's fine
        }

        // Create or update README
        await axios.put(
            `https://api.github.com/repos/${repoFullName}/contents/README.md`,
            {
                message: "docs: auto generate README via PushToDoc",
                content: encodedContent,
                branch,
                sha: sha || undefined,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github+json",
                },
            }
        );

        console.log("✅ README committed to GitHub");
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
