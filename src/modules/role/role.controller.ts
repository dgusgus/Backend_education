import { Request, Response } from 'express'
import { roleService } from './role.service.js'
import { RoleName } from './role.types.js'

export const roleController = {
  // Obtener todos los roles
  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await roleService.getRoles()
      
      res.json({
        success: true,
        data: roles,
        count: roles.length,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error fetching roles',
      })
    }
  },

  // Obtener roles de un usuario
  async getUserRoles(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const userRoles = await roleService.getUserRoles(userId)
      
      res.json({
        success: true,
        data: userRoles,
        count: userRoles.length,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error fetching user roles',
      })
    }
  },

  // Asignar rol a usuario
  async assignRoleToUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const { roleName } = req.body
      
      const userRole = await roleService.assignRoleToUser(userId, roleName as RoleName)
      
      res.status(201).json({
        success: true,
        message: 'Role assigned successfully',
        data: userRole,
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
          error: 'Error assigning role',
        })
      }
    }
  },

  // Remover rol de usuario
  async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roleName } = req.params
      
      await roleService.removeRoleFromUser(userId, roleName as RoleName)
      
      res.json({
        success: true,
        message: 'Role removed successfully',
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
          error: 'Error removing role',
        })
      }
    }
  },
}