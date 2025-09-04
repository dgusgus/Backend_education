import { Request, Response, NextFunction } from 'express'
import { jwtUtils } from '../utils/jwt.js'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = jwtUtils.extractToken(authHeader)
    const decoded = jwtUtils.verify(token)

    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Invalid token',
    })
  }
}