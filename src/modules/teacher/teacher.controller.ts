import { Request, Response } from 'express'
import { teacherService } from './teacher.service.js'
import {
    teacherIdSchema,
    gradeAssignmentSchema,
    attendanceRecordSchema
} from './teacher.types.js'
import { validate } from '../../middleware/validation.js'
import { AuthRequest } from '../../middleware/auth.js'

/**
 * Controlador para los endpoints de profesores
 * Maneja las requests HTTP y responses para las operaciones docentes
 */
export const teacherController = {
    /**
     * Obtiene los cursos asignados a un profesor
     * GET /teachers/:id/courses
     */
    getTeacherCourses: [
        validate(teacherIdSchema, 'params'),
        async (req: Request, res: Response): Promise<void> => {
            try {
                const { id } = req.params

                // Verificar que el usuario autenticado tiene acceso a estos datos
                const authReq = req as AuthRequest
                if (authReq.user?.userId !== id) {
                    res.status(403).json({
                        success: false,
                        error: 'No tienes permisos para acceder a estos datos',
                    })
                    return
                }

                const courses = await teacherService.getTeacherCourses(id)

                res.json({
                    success: true,
                    data: courses,
                    count: courses.length,
                })
            } catch (error) {
                console.error('Error getting teacher courses:', error)

                if (error instanceof Error) {
                    res.status(400).json({
                        success: false,
                        error: error.message,
                    })
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor',
                    })
                }
            }
        }
    ],

    /**
     * Obtiene el dashboard del profesor
     * GET /teachers/:id/dashboard
     */
    getTeacherDashboard: [
        validate(teacherIdSchema, 'params'),
        async (req: Request, res: Response): Promise<void> => {
            try {
                const { id } = req.params

                // Verificar permisos de acceso
                const authReq = req as AuthRequest
                if (authReq.user?.userId !== id) {
                    res.status(403).json({
                        success: false,
                        error: 'No tienes permisos para acceder a este dashboard',
                    })
                    return
                }

                const dashboard = await teacherService.getTeacherDashboard(id)

                res.json({
                    success: true,
                    data: dashboard,
                })
            } catch (error) {
                console.error('Error getting teacher dashboard:', error)

                if (error instanceof Error) {
                    res.status(400).json({
                        success: false,
                        error: error.message,
                    })
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor',
                    })
                }
            }
        }
    ],

    /**
     * Registra una calificación para un estudiante
     * POST /teachers/:id/grades
     */
    recordGrade: [
        validate(teacherIdSchema, 'params'),
        validate(gradeAssignmentSchema),
        async (req: Request, res: Response): Promise<void> => {
            try {
                const { id } = req.params

                // Verificar que el profesor autenticado es quien realiza la acción
                const authReq = req as AuthRequest
                if (authReq.user?.userId !== id) {
                    res.status(403).json({
                        success: false,
                        error: 'No tienes permisos para realizar esta acción',
                    })
                    return
                }

                // Llamar al servicio con teacherId separado
                const grade = await teacherService.recordGrade(id, req.body)

                res.status(201).json({
                    success: true,
                    message: 'Calificación registrada exitosamente',
                    data: grade,
                })
            } catch (error) {
                console.error('Error recording grade:', error)

                if (error instanceof Error) {
                    const status = error.message.includes('no está asignado') ? 403 : 400
                    res.status(status).json({
                        success: false,
                        error: error.message,
                    })
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor',
                    })
                }
            }
        }
    ],

    /**
     * Registra la asistencia de un estudiante
     * POST /teachers/:id/attendance
     */
    recordAttendance: [
        validate(teacherIdSchema, 'params'),
        validate(attendanceRecordSchema),
        async (req: Request, res: Response): Promise<void> => {
            try {
                const { id } = req.params

                // Verificar permisos
                const authReq = req as AuthRequest
                if (authReq.user?.userId !== id) {
                    res.status(403).json({
                        success: false,
                        error: 'No tienes permisos para realizar esta acción',
                    })
                    return
                }

                // Llamar al servicio con teacherId separado
                const attendance = await teacherService.recordAttendance(id, req.body)

                res.status(201).json({
                    success: true,
                    message: 'Asistencia registrada exitosamente',
                    data: attendance,
                })
            } catch (error) {
                console.error('Error recording attendance:', error)

                if (error instanceof Error) {
                    const status = error.message.includes('no está asignado') ? 403 : 400
                    res.status(status).json({
                        success: false,
                        error: error.message,
                    })
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor',
                    })
                }
            }
        }
    ],

    /**
     * Obtiene las calificaciones de un curso
     * GET /teachers/:id/courses/:courseId/grades
     */
    getCourseGrades: [
        validate(teacherIdSchema, 'params'),
        async (req: Request, res: Response): Promise<void> => {
            try {
                const { id } = req.params
                const { courseId } = req.params

                // Verificar permisos
                const authReq = req as AuthRequest
                if (authReq.user?.userId !== id) {
                    res.status(403).json({
                        success: false,
                        error: 'No tienes permisos para acceder a estos datos',
                    })
                    return
                }

                const grades = await teacherService.getCourseGrades(courseId, id)

                res.json({
                    success: true,
                    data: grades,
                    count: grades.length,
                })
            } catch (error) {
                console.error('Error getting course grades:', error)

                if (error instanceof Error) {
                    const status = error.message.includes('no está asignado') ? 403 : 400
                    res.status(status).json({
                        success: false,
                        error: error.message,
                    })
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor',
                    })
                }
            }
        }
    ],

    /**
     * Obtiene la asistencia de un curso
     * GET /teachers/:id/courses/:courseId/attendance
     */
    getCourseAttendance: [
        validate(teacherIdSchema, 'params'),
        async (req: Request, res: Response): Promise<void> => {
            try {
                const { id } = req.params
                const { courseId } = req.params

                // Verificar permisos
                const authReq = req as AuthRequest
                if (authReq.user?.userId !== id) {
                    res.status(403).json({
                        success: false,
                        error: 'No tienes permisos para acceder a estos datos',
                    })
                    return
                }

                const attendance = await teacherService.getCourseAttendance(courseId, id)

                res.json({
                    success: true,
                    data: attendance,
                })
            } catch (error) {
                console.error('Error getting course attendance:', error)

                if (error instanceof Error) {
                    const status = error.message.includes('no está asignado') ? 403 : 400
                    res.status(status).json({
                        success: false,
                        error: error.message,
                    })
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor',
                    })
                }
            }
        }
    ],
}