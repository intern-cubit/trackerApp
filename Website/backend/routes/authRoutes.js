// backend/routes/authRoutes.js
import { Router } from "express";
import { signup, login, forgotPassword, resetPassword, checkAuth } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/check-auth", authMiddleware, checkAuth);
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;