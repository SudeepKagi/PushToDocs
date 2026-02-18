import "dotenv/config";
import { readmeQueue } from "./config/queue.js";

async function clear() {
    try {
        console.log("🧹 Clearing queue...");

        await readmeQueue.drain();              // removes waiting & delayed jobs
        await readmeQueue.clean(0, 1000, "completed");
        await readmeQueue.clean(0, 1000, "failed");

        console.log("✅ Queue cleared successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error clearing queue:", err);
        process.exit(1);
    }
}

clear();
