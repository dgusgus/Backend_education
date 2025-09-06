import { Router } from 'express'
import { permissionController } from './permission.controller.js'
import { authenticateToken } from '../../middleware/auth.js'
import { checkPermission } from '../../middleware/permission.js'
import { SYSTEM_PERMISSIONS } from '../permission/permission.types.js'

const router: Router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas de permisos - protegidas por permisos
router.get('/', checkPermission('ROLE_MANAGE'), permissionController.getPermissions)
router.get('/user/:userId', checkPermission('ROLE_READ'), permissionController.getUserPermissions)
router.post('/role/:roleId/assign', checkPermission('ROLE_MANAGE'), permissionController.assignPermissionToRole)
router.delete('/role/:roleId/remove/:permissionName', checkPermission('ROLE_MANAGE'), permissionController.removePermissionFromRole)

export { router as permissionRoutes }