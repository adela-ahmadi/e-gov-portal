// src/routes/departmentsRoutes.js
import express from "express";
import { getDepartments } from "../controllers/departmentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getDepartments);

export default router;
