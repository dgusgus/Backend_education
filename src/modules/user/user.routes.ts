import { Router } from 'express'
import { userController } from './user.controller.js'
import { authenticateToken } from '../../middleware/auth.js'
//? fase 5
import { checkRole } from '../../middleware/role.js'
//? fase 6
import { checkPermission } from '../../middleware/permission.js'
import { SYSTEM_PERMISSIONS } from '../permission/permission.types.js'

const router: Router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

//? Rutas de usuarios - solo accesibles por admin fase 5
// Rutas de usuarios - protegidas por permisos específicos
router.get('/', checkPermission('USER_READ'), userController.getUsers)
router.get('/:id', checkPermission('USER_READ'), userController.getUserById)
router.post('/', checkPermission('USER_CREATE'), userController.createUser)
router.put('/:id', checkPermission('USER_UPDATE'), userController.updateUser)
router.delete('/:id', checkPermission('USER_DELETE'), userController.deleteUser)

// Rutas de gestión de roles
router.post('/:id/roles', checkPermission('ROLE_MANAGE'), userController.assignRole)
router.delete('/:id/roles', checkPermission('ROLE_MANAGE'), userController.removeRole)
router.get('/:id/roles', checkPermission('USER_READ'), userController.getUserRoles)

export { router as userRoutes }