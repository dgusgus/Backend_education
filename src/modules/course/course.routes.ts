import { Router } from 'express'
import { courseController } from './course.controller.js'
import { authenticateToken } from '../../middleware/auth.js'
import { checkPermission } from '../../middleware/permission.js'
import { SYSTEM_PERMISSIONS } from '../permission/permission.types.js'

const router: Router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas de cursos - protegidas por permisos específicos
router.get('/', checkPermission('COURSE_READ'), courseController.getCourses)
router.get('/:id', checkPermission('COURSE_READ'), courseController.getCourseById)
router.post('/', checkPermission('COURSE_CREATE'), courseController.createCourse)
router.put('/:id', checkPermission('COURSE_UPDATE'), courseController.updateCourse)
router.delete('/:id', checkPermission('COURSE_DELETE'), courseController.deleteCourse)

// Rutas de inscripción de estudiantes
router.post('/:id/enroll', checkPermission('STUDENT_MANAGE'), courseController.enrollStudent)
router.post('/:id/unenroll', checkPermission('STUDENT_MANAGE'), courseController.unenrollStudent)

export { router as courseRoutes }