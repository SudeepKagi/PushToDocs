import mongoose from "mongoose";

const activeRepoSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        repoId: {
            type: Number,
            required: true,
        },
        repoName: {
            type: String,
            required: true,
        },
        repoFullName: {
            type: String,
            required: true,
        },
        repoOwner: {
            type: String,
            required: true,
        },
        defaultBranch: {
            type: String,
            required: true,
        },
        webhookId: {
            type: Number,
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("ActiveRepo", activeRepoSchema);
