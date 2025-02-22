// models/Applicant.js

import mongoose from "mongoose";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_secret_key"; // Must be 32 bytes for AES-256
const IV = "1234567890123456"; // 16-byte initialization vector

// Encryption function
const encrypt = (text) => {
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), IV);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
};

// Decryption function
const decrypt = (text) => {
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), IV);
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};

const applicantSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Will be encrypted
    email: { type: String, required: true, unique: true }, // Will be encrypted
    education: {
        degree: { type: String, required: true },
        branch: { type: String, required: true },
        institution: { type: String, required: true },
        year: { type: Number, required: true }
    },
    experience: {
        job_title: { type: String, required: true },
        company: { type: String, required: true },
        start_date: { type: String, required: true },
        end_date: { type: String, required: true }
    },
    skills: [{ type: String, required: true }],
    summary: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Middleware to encrypt `name` & `email` before saving
applicantSchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.name = encrypt(this.name);
    }
    if (this.isModified("email")) {
        this.email = encrypt(this.email);
    }
    next();
});

// Method to decrypt `name` & `email` when retrieving
applicantSchema.methods.getDecryptedData = function () {
    return {
        name: decrypt(this.name),
        email: decrypt(this.email),
        education: this.education,
        experience: this.experience,
        skills: this.skills,
        summary: this.summary
    };
};

export default mongoose.model("Applicant", applicantSchema);
