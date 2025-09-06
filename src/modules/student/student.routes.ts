import { Router } from 'express'
import { studentController } from './student.controller.js'
import { authenticateToken } from '../../middleware/auth.js'
import { checkPermission } from '../../middleware/permission.js'
import { SYSTEM_PERMISSIONS } from '../permission/permission.types.js'

const router: Router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas de estudiantes - protegidas por permisos
router.get('/', checkPermission('STUDENT_READ'), studentController.getStudents)
router.get('/:id', checkPermission('STUDENT_READ'), studentController.getStudentById)
router.put('/:id/academic', checkPermission('STUDENT_MANAGE'), studentController.updateStudentAcademic)
router.post('/:id/grades', checkPermission('STUDENT_MANAGE'), studentController.recordGrade)
router.post('/:id/attendance', checkPermission('STUDENT_MANAGE'), studentController.recordAttendance)
router.get('/:id/summary', checkPermission('STUDENT_READ'), studentController.getAcademicSummary)

export { router as studentRoutes }