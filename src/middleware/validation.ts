import { Request, Response, NextFunction } from 'express'
import { ZodError, ZodType } from 'zod'

export const validate = (schema: ZodType, check: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req[check])
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        })
      } else {
        next(error)
      }
    }
  }
}