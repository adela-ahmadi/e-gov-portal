// src/routes/requestRoutes.js
import express from 'express'
import {
  createRequest as applyForService,
  getMyRequests
} from '../controllers/requestController.js'

import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Upload a new service request
router.post('/apply', authMiddleware, applyForService)

// Get a list of my requests
router.get('/my', authMiddleware, getMyRequests)

export default router
