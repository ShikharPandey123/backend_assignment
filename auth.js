// routes/auth.js

import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";
const VALID_CREDENTIALS = { username: "naval.ravikant", password: "05111974" };

router.post("/", (req, res) => {
    const { username, password } = req.body;
    
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
        return res.status(200).json({ JWT: token });
    }
    
    return res.status(401).json({ error: "Invalid credentials" });
});

export default router;
