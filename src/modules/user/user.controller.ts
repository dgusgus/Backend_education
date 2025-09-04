import { Request, Response } from 'express'
import { userService } from './user.service.js'
import { 
  createUserSchema, 
  updateUserSchema, 
  userIdSchema,
  userRoleSchema
} from './user.types.js'
import { validate } from '../../middleware/validation.js'

export const userController = {
  // Obtener todos los usuarios
  getUsers: [
    async (req: Request, res: Response): Promise<void> => {
      try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10

        if (page < 1 || limit < 1) {
          res.status(400).json({
            success: false,
            error: 'Page and limit must be positive numbers',
          })
          return
        }

        const { users, total, totalPages } = await userService.getUsers(page, limit)

        res.json({
          success: true,
          data: users,
          count: users.length,
          total,
          pagination: {
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        })
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({
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

  // Obtener usuario por ID
  getUserById: [
    validate(userIdSchema, 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const user = await userService.getUserById(id)

        res.json({
          success: true,
          data: user,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'User not found' ? 404 : 500
          res.status(status).json({
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

  // Crear nuevo usuario
  createUser: [
    validate(createUserSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = await userService.createUser(req.body)

        res.status(201).json({
          success: true,
          message: 'User created successfully',
          data: user,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message.includes('already exists') ? 409 : 500
          res.status(status).json({
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

  // Actualizar usuario
  updateUser: [
    validate(userIdSchema, 'params'),
    validate(updateUserSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const user = await userService.updateUser(id, req.body)

        res.json({
          success: true,
          message: 'User updated successfully',
          data: user,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'User not found' ? 404 : 
                         error.message.includes('already in use') ? 409 : 500
          res.status(status).json({
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

  // Eliminar usuario
  deleteUser: [
    validate(userIdSchema, 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const user = await userService.deleteUser(id)

        res.json({
          success: true,
          message: 'User deleted successfully',
          data: user,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'User not found' ? 404 : 500
          res.status(status).json({
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


  // Asignar rol a usuario
  assignRole: [
    validate(userIdSchema, 'params'),
    validate(userRoleSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const { roleName } = req.body
        const user = await userService.assignRoleToUser(id, roleName)

        res.json({
          success: true,
          message: `Role ${roleName} assigned successfully`,
          data: user,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 
                         error.message.includes('already has') ? 409 : 500
          res.status(status).json({
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

  // Remover rol de usuario
  removeRole: [
    validate(userIdSchema, 'params'),
    validate(userRoleSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const { roleName } = req.body
        const user = await userService.removeRoleFromUser(id, roleName)

        res.json({
          success: true,
          message: `Role ${roleName} removed successfully`,
          data: user,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 
                         error.message.includes('does not have') ? 409 : 500
          res.status(status).json({
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

  // Obtener roles de usuario
  getUserRoles: [
    validate(userIdSchema, 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const roles = await userService.getUserRoles(id)

        res.json({
          success: true,
          data: roles,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'User not found' ? 404 : 500
          res.status(status).json({
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
}