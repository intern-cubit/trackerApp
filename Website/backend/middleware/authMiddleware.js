import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Auth header:", authHeader);
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Invalid Token" });
        }
    }
    return res.status(401).json({ message: "No Token Provided" });
};

export default authMiddleware;
