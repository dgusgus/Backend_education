import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'
import { permissionService } from '../modules/permission/permission.service.js'
import { PermissionName } from '../modules/permission/permission.types.js'

// Middleware para verificar si usuario tiene un permiso específico
export const checkPermission = (requiredPermission: PermissionName) => {
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

      const hasPermission = await permissionService.userHasPermission(userId, requiredPermission)
      
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: `Access denied. Required permission: ${requiredPermission}`,
        })
        return
      }

      next()
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error checking user permissions',
      })
    }
  }
}

// Middleware para verificar si usuario tiene al menos uno de los permisos especificados
export const checkAnyPermission = (requiredPermissions: PermissionName[]) => {
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

      const hasAnyPermission = await permissionService.userHasAnyPermission(userId, requiredPermissions)
      
      if (!hasAnyPermission) {
        res.status(403).json({
          success: false,
          error: `Access denied. Required one of these permissions: ${requiredPermissions.join(', ')}`,
        })
        return
      }

      next()
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error checking user permissions',
      })
    }
  }
}