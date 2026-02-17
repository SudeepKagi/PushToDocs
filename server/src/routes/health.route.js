import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date(),
        uptime: process.uptime(),
    });
});

export default router;
