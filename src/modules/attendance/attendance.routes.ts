import { Router } from 'express'
import { attendanceController } from './attendance.controller.js'
import { authenticateToken } from '../../middleware/auth.js'
import { checkPermission } from '../../middleware/permission.js'
import { SYSTEM_PERMISSIONS } from '../permission/permission.types.js'

/**
 * Router para las rutas del sistema de asistencias
 */
const router: Router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas de asistencias - protegidas por permisos específicos
router.post('/', 
  checkPermission('ATTENDANCE_MANAGE'), 
  attendanceController.createAttendance
)

router.post('/bulk', 
  checkPermission('ATTENDANCE_MANAGE'), 
  attendanceController.createBulkAttendance
)

router.put('/:id', 
  checkPermission('ATTENDANCE_MANAGE'), 
  attendanceController.updateAttendance
)

router.delete('/:id', 
  checkPermission('ATTENDANCE_MANAGE'), 
  attendanceController.deleteAttendance
)

router.get('/student', 
  checkPermission('ATTENDANCE_READ'), 
  attendanceController.getStudentAttendance
)

router.get('/course', 
  checkPermission('ATTENDANCE_READ'), 
  attendanceController.getCourseAttendance
)

router.get('/statistics', 
  checkPermission('ATTENDANCE_READ'), 
  attendanceController.getAttendanceStatistics
)

router.get('/report', 
  checkPermission('ATTENDANCE_READ'), 
  attendanceController.generateAttendanceReport
)

export { router as attendanceRoutes }