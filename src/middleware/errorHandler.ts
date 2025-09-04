// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'

export interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Error interno del servidor'

  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  })

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
}