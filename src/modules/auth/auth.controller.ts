import { Request, Response } from 'express'
import { authService } from './auth.service.js'
import { registerSchema, loginSchema } from './auth.types.js'
import { AuthRequest } from '../../middleware/auth.js'
import { validate } from '../../middleware/validation.js'

export const authController = {
  // Registrar nuevo usuario
  register: [
    validate(registerSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        // Crear usuario y generar token
        const result = await authService.register(req.body)

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: result,
        })
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({
            success: false,
            error: error.message,
          })
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }
    }
  ],

  // Login de usuario
  login: [
    validate(loginSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        // Autenticar usuario y generar token
        const result = await authService.login(req.body)

        res.json({
          success: true,
          message: 'Login successful',
          data: result,
        })
      } catch (error) {
        if (error instanceof Error) {
          res.status(401).json({
            success: false,
            error: error.message,
          })
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }
    }
  ],

  // Obtener perfil de usuario (protegido)
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      // El middleware de autenticación añade user al request
      const userId = req.user?.userId
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        })
        return
      }

      const user = await authService.getProfile(userId)

      res.json({
        success: true,
        data: user,
      })
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({
          success: false,
          error: error.message,
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        })
      }
    }
  },
}