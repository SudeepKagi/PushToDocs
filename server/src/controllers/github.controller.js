import axios from "axios";
import { decrypt } from "../utils/encryption.js";

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
