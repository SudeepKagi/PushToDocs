import axios from "axios";
import { decrypt } from "../utils/encryption.js";
import ActiveRepo from "../models/ActiveRepo.js";


// Get authenticated user's repositories
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
        console.error("Activate repo error:", error.response?.data || error.message);
        res.status(500).json({ message: "Activation failed" });
    }
};

