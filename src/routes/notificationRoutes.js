// routes/notificationRoutes.js
import { Router } from "express";
import { getUserNotifications } from "../controllers/notificationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();
router.get("/", authMiddleware, getUserNotifications);
export default router;
