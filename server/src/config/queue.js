import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const readmeQueue = new Queue("readme-generation", {
    connection: redisConnection,
});
