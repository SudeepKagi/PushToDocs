import axios from "axios";

export const generateReadmeWithGroq = async (repoName, commitMessage) => {
    try {
        const prompt = `
You are an expert software documentation generator.

Generate a professional README.md for a GitHub repository.

Repository Name: ${repoName}
Recent Commit Message: ${commitMessage}

Include:
- Project title
- Description
- Features
- Installation
- Usage
- Tech Stack
- Contributing
- License

Make it clean and professional.
Return only markdown content.
`;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.7,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Groq API error:", error.response?.data || error.message);
        throw new Error("Groq generation failed");
    }
};
