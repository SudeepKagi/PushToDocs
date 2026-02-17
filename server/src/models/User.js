import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        githubId: {
            type: String,
            required: true,
            unique: true,
        },
        username: {
            type: String,
            required: true,
        },
        avatar: {
            type: String,
        },
        encryptedGithubToken: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
