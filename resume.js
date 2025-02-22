// routes/resume.js

import express from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import pdfParse from "pdf-parse";
import crypto from "crypto";
import Applicant from "../models/Applicant.js";

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// Function to encrypt sensitive data
const encrypt = (text) => {
    const cipher = crypto.createCipher("aes-256-cbc", process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
};

// Middleware for JWT verification
const authenticateJWT = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        jwt.verify(token, SECRET_KEY);
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid Token" });
    }
};

router.post("/", authenticateJWT, async (req, res) => {
    const { url } = req.body;

    try {
        const pdfBuffer = await axios.get(url, { responseType: "arraybuffer" });
        const textData = await pdfParse(pdfBuffer.data);

        if (!textData.text) {
            return res.status(500).json({ error: "No text found in PDF" });
        }

        // Send extracted text to Google Gemini for structured data
        const llmResponse = await axios.post(
            "https://api.google.com/v1/gemini", 
            { prompt: `Extract structured data from this resume: ${textData.text}` },
            { headers: { "Authorization": `Bearer ${process.env.GEMINI_API_KEY}` } }
        );

        const extractedData = llmResponse.data; 

        const newApplicant = new Applicant({
            name: encrypt(extractedData.name),
            email: encrypt(extractedData.email),
            education: extractedData.education,
            experience: extractedData.experience,
            skills: extractedData.skills,
            summary: extractedData.summary
        });

        await newApplicant.save();
        return res.status(200).json({ message: "Resume processed successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error processing resume" });
    }
});

export default router;
