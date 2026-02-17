import express from "express";
import { getGithubRepos } from "../controllers/github.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/repos", protect, getGithubRepos);

export default router;
