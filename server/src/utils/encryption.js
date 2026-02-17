import crypto from "crypto";

const algorithm = "aes-256-gcm";
const secretKey = crypto
    .createHash("sha256")
    .update(process.env.JWT_SECRET)
    .digest();

export const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
};

export const decrypt = (encryptedText) => {
    const buffer = Buffer.from(encryptedText, "base64");

    const iv = buffer.slice(0, 16);
    const authTag = buffer.slice(16, 32);
    const encrypted = buffer.slice(32);

    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
};
