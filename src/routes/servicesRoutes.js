import express from "express";
import {
  getServices,
  getServicesByDept,
} from "../controllers/servicesController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const { department } = req.query;
  if (department) {
    return getServicesByDept(req, res);
  }
  return getServices(req, res);
});

export default router;
