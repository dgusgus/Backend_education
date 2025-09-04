import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'
import { roleService } from '../modules/role/role.service.js'
import { RoleName } from '../modules/role/role.types.js'

// Middleware para verificar si usuario tiene un rol específico
export const checkRole = (requiredRole: RoleName) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        })
        return
      }

      const hasRole = await roleService.userHasRole(userId, requiredRole)
      
      if (!hasRole) {
        res.status(403).json({
          success: false,
          error: `Access denied. Required role: ${requiredRole}`,
        })
        return
      }

      next()
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error checking user roles',
      })
    }
  }
}

// Middleware para verificar si usuario tiene al menos uno de los roles especificados
export const checkAnyRole = (requiredRoles: RoleName[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        })
        return
      }

      const hasAnyRole = await roleService.userHasAnyRole(userId, requiredRoles)
      
      if (!hasAnyRole) {
        res.status(403).json({
          success: false,
          error: `Access denied. Required one of these roles: ${requiredRoles.join(', ')}`,
        })
        return
      }

      next()
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error checking user roles',
      })
    }
  }
}