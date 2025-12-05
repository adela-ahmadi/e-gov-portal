// src/routes/userRoutes.js

import express from 'express'
import { fetchUsers, fetchUser } from '../controllers/userController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', authMiddleware, fetchUsers)

router.get('/:id', authMiddleware, fetchUser)

export default router
