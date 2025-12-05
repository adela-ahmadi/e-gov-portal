// src/routes/reportRoutes.js
import express from "express";
import { getReports } from "../controllers/reportController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getReports);

export default router;
