import axios from "axios";
import User from "../models/User.js";
import { encrypt } from "../utils/encryption.js";
import { generateToken } from "../utils/jwt.js";

// 1️⃣ Redirect to GitHub
export const githubLogin = (req, res) => {
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,user`;

    res.redirect(redirectUrl);
};

// 2️⃣ GitHub Callback
export const githubCallback = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ message: "No code provided" });
        }

        // Exchange code for access token
        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            },
            {
                headers: { Accept: "application/json" },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Fetch GitHub user profile
        const userResponse = await axios.get("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const githubUser = userResponse.data;

        // Encrypt GitHub token
        const encryptedToken = encrypt(accessToken);

        // Check if user exists
        let user = await User.findOne({ githubId: githubUser.id });

        if (user) {
            user.encryptedGithubToken = encryptedToken;
            await user.save();
        } else {
            user = await User.create({
                githubId: githubUser.id,
                username: githubUser.login,
                avatar: githubUser.avatar_url,
                encryptedGithubToken: encryptedToken,
            });
        }

        // Generate JWT
        const jwtToken = generateToken(user._id);

        // Redirect to frontend with token
        res.redirect(
            `${process.env.FRONTEND_URL}/auth-success?token=${jwtToken}`
        );
    } catch (error) {
        console.error("OAuth Error:", error.message);
        res.status(500).json({ message: "OAuth failed" });
    }
};
