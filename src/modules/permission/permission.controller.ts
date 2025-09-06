import { Request, Response } from 'express'
import { permissionService } from './permission.service.js'
import { PermissionName } from './permission.types.js'

export const permissionController = {
  // Obtener todos los permisos
  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await permissionService.getPermissions()
      
      res.json({
        success: true,
        data: permissions,
        count: permissions.length,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error fetching permissions',
      })
    }
  },

  // Obtener permisos de un usuario
  async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const userPermissions = await permissionService.getUserPermissions(userId)
      
      res.json({
        success: true,
        data: userPermissions,
        count: userPermissions.length,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error fetching user permissions',
      })
    }
  },

  // Asignar permiso a rol
  async assignPermissionToRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params
      const { permissionName } = req.body
      
      const rolePermission = await permissionService.assignPermissionToRole(
        roleId, 
        permissionName as PermissionName
      )
      
      res.status(201).json({
        success: true,
        message: 'Permission assigned successfully',
        data: rolePermission,
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
          error: 'Error assigning permission',
        })
      }
    }
  },

  // Remover permiso de rol
  async removePermissionFromRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId, permissionName } = req.params
      
      await permissionService.removePermissionFromRole(roleId, permissionName as PermissionName)
      
      res.json({
        success: true,
        message: 'Permission removed successfully',
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
          error: 'Error removing permission',
        })
      }
    }
  },
}