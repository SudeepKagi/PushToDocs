import express from "express";
import { getGithubRepos } from "../controllers/github.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { activateRepository } from "../controllers/github.controller.js";


const router = express.Router();

router.get("/repos", protect, getGithubRepos);
router.post("/activate", protect, activateRepository);

export default router;
