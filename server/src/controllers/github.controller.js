import axios from "axios";
import crypto from "crypto";
import { decrypt } from "../utils/encryption.js";
import ActiveRepo from "../models/ActiveRepo.js";
import { readmeQueue } from "../config/queue.js";


// ===============================
// 🔹 Get Authenticated User Repos
// ===============================
export const getGithubRepos = async (req, res) => {
    try {
        const encryptedToken = req.user.encryptedGithubToken;
        const accessToken = decrypt(encryptedToken);

        const response = await axios.get(
            "https://api.github.com/user/repos",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    per_page: 100,
                    sort: "updated",
                },
            }
        );

        const repos = response.data.map((repo) => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            private: repo.private,
            default_branch: repo.default_branch,
            owner: repo.owner.login,
        }));

        res.json({ repos });
    } catch (error) {
        console.error("Fetch repos error:", error.message);
        res.status(500).json({ message: "Failed to fetch repositories" });
    }
};


// ===============================
// 🔹 Activate Repository
// ===============================
export const activateRepository = async (req, res) => {
    try {
        const {
            repoId,
            repoName,
            repoFullName,
            repoOwner,
            defaultBranch,
        } = req.body;

        if (!repoId || !repoFullName || !repoOwner) {
            return res.status(400).json({ message: "Missing repo data" });
        }

        const encryptedToken = req.user.encryptedGithubToken;
        const accessToken = decrypt(encryptedToken);

        // Create GitHub webhook
        const webhookResponse = await axios.post(
            `https://api.github.com/repos/${repoFullName}/hooks`,
            {
                name: "web",
                active: true,
                events: ["push"],
                config: {
                    url: `${process.env.BACKEND_URL}/api/github/webhook`,
                    content_type: "json",
                    secret: process.env.GITHUB_WEBHOOK_SECRET,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github+json",
                },
            }
        );

        const webhookId = webhookResponse.data.id;

        const activeRepo = await ActiveRepo.create({
            user: req.user._id,
            repoId,
            repoName,
            repoFullName,
            repoOwner,
            defaultBranch,
            webhookId,
        });

        res.json({ message: "Repository activated", activeRepo });
    } catch (error) {
        console.error(
            "Activate repo error:",
            error.response?.data || error.message
        );
        res.status(500).json({ message: "Activation failed" });
    }
};


// ===============================
// 🔹 Webhook Handler
// ===============================
export const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-hub-signature-256"];

        if (!signature) {
            return res.status(403).json({ message: "No signature provided" });
        }

        const hmac = crypto.createHmac(
            "sha256",
            process.env.GITHUB_WEBHOOK_SECRET
        );

        const digest =
            "sha256=" + hmac.update(req.rawBody).digest("hex");

        if (signature !== digest) {
            return res.status(403).json({ message: "Invalid signature" });
        }

        const { repository, head_commit } = req.body;

        if (!repository) {
            return res.status(200).json({ message: "No repository data" });
        }

        const commitMessage = head_commit?.message || "";
        const commitAuthor = head_commit?.author?.name || "";

        console.log("📩 Incoming commit:", commitMessage);

        // 🚨 STRICT recursion guard
        if (
            commitMessage.startsWith("docs: auto generate README via PushToDoc")
        ) {
            console.log("🛑 Ignoring PushToDoc auto-commit");
            return res.status(200).json({ message: "Ignored auto commit" });
        }

        const activeRepo = await ActiveRepo.findOne({
            repoId: repository.id,
            active: true,
        });

        if (!activeRepo) {
            return res.status(200).json({ message: "Repo not activated" });
        }

        console.log("🚀 Push event received for:", repository.full_name);

        await readmeQueue.add("generate-readme", {
            repoId: repository.id,
            repoFullName: repository.full_name,
            branch: repository.default_branch,
            lastCommitMessage: commitMessage,
        });

        console.log("📦 README generation job added to queue");

        res.status(200).json({ message: "Webhook received and queued" });
    } catch (error) {
        console.error("Webhook error:", error.message);
        res.status(500).json({ message: "Webhook processing failed" });
    }
};
