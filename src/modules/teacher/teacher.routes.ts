import { Router } from 'express'
import { teacherController } from './teacher.controller.js'
import { authenticateToken } from '../../middleware/auth.js'
import { checkPermission } from '../../middleware/permission.js'
import { SYSTEM_PERMISSIONS } from '../permission/permission.types.js'

/**
 * Router para las rutas de profesores
 * Define los endpoints disponibles y sus permisos requeridos
 */
const router: Router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas de profesores - protegidas por permisos específicos
router.get('/:id/courses', 
  checkPermission('COURSE_READ'), 
  teacherController.getTeacherCourses
)

router.get('/:id/dashboard', 
  checkPermission('TEACHER_DASHBOARD_ACCESS'), 
  teacherController.getTeacherDashboard
)

router.post('/:id/grades', 
  checkPermission('STUDENT_MANAGE'), 
  teacherController.recordGrade
)

router.post('/:id/attendance', 
  checkPermission('STUDENT_MANAGE'), 
  teacherController.recordAttendance
)

router.get('/:id/courses/:courseId/grades', 
  checkPermission('COURSE_READ'), 
  teacherController.getCourseGrades
)

router.get('/:id/courses/:courseId/attendance', 
  checkPermission('COURSE_READ'), 
  teacherController.getCourseAttendance
)

export { router as teacherRoutes }