import { Router } from 'express'
import { gradeController } from './grade.controller.js'
import { authenticateToken } from '../../middleware/auth.js'
import { checkPermission } from '../../middleware/permission.js'
import { SYSTEM_PERMISSIONS } from '../permission/permission.types.js'

/**
 * Router para las rutas del sistema de calificaciones
 * Define los endpoints disponibles y sus permisos requeridos
 */
const router: Router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas de calificaciones - protegidas por permisos específicos
router.post('/', 
  checkPermission('GRADE_MANAGE'), 
  gradeController.createGrade
)

router.put('/:id', 
  checkPermission('GRADE_MANAGE'), 
  gradeController.updateGrade
)

router.delete('/:id', 
  checkPermission('GRADE_MANAGE'), 
  gradeController.deleteGrade
)

router.get('/student', 
  checkPermission('GRADE_READ'), 
  gradeController.getStudentGrades
)

router.get('/course', 
  checkPermission('GRADE_READ'), 
  gradeController.getCourseGrades
)

router.get('/transcript/:studentId', 
  checkPermission('GRADE_READ'), 
  gradeController.generateTranscript
)

router.post('/statistics', 
  checkPermission('GRADE_READ'), 
  gradeController.calculateStatistics
)

export { router as gradeRoutes }