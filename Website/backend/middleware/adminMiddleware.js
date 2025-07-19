import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import adminEmails from "../config/adminEmails.js";

dotenv.config();

const adminMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (!adminEmails.includes(decoded.email)) {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }
        next();
    } catch (err) {
        console.error("Admin auth error:", err.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};

export default adminMiddleware;
