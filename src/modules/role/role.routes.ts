import { Router } from 'express'
import { roleController } from './role.controller.js'
import { authenticateToken } from '../../middleware/auth.js'
import { checkPermission } from '../../middleware/permission.js'
import { SYSTEM_PERMISSIONS } from '../permission/permission.types.js'

const router: Router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas de roles - protegidas por permisos
router.get('/', checkPermission('ROLE_READ'), roleController.getRoles)
router.get('/user/:userId', checkPermission('ROLE_READ'), roleController.getUserRoles)
router.post('/user/:userId/assign', checkPermission('ROLE_MANAGE'), roleController.assignRoleToUser)
router.delete('/user/:userId/remove/:roleName', checkPermission('ROLE_MANAGE'), roleController.removeRoleFromUser)

export { router as roleRoutes }