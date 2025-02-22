// routes/search.js

import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Applicant from "../models/Applicant.js";

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// Function to decrypt encrypted fields
const decrypt = (text) => {
    const decipher = crypto.createDecipher("aes-256-cbc", process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
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
    const { name } = req.body;

    try {
        const applicants = await Applicant.find();
        const results = applicants.filter(applicant =>
            decrypt(applicant.name).toLowerCase().includes(name.toLowerCase())
        );

        if (results.length === 0) {
            return res.status(404).json({ error: "No records found" });
        }

        return res.status(200).json(results);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error searching database" });
    }
});

export default router;
