import { Router } from 'express'
import { authController } from './auth.controller.js'
import { authenticateToken } from '../../middleware/auth.js'

const router: Router = Router()

// Rutas públicas (con validación integrada en el controlador)
router.post('/register', ...authController.register)
router.post('/login', ...authController.login)

// Rutas protegidas
router.get('/profile', authenticateToken, authController.getProfile)

export { router as authRoutes }