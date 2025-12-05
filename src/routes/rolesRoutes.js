// src/routes/rolesRoutes.js
import express from "express";
import { getRoles } from "../controllers/roleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getRoles);

export default router;
