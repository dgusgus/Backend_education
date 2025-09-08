import { Request, Response } from 'express'
import { attendanceService } from './attendance.service.js'
import { 
  createAttendanceSchema, 
  updateAttendanceSchema, 
  attendanceIdSchema,
  studentAttendanceQuerySchema,
  courseAttendanceQuerySchema,
  bulkAttendanceSchema
} from './attendance.types.js'
import { validate } from '../../middleware/validation.js'
import { AuthRequest } from '../../middleware/auth.js'

/**
 * Controlador para los endpoints del sistema de asistencias
 */
export const attendanceController = {
  /**
   * Crea un registro de asistencia individual
   * POST /attendance
   */
  createAttendance: [
    validate(createAttendanceSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const attendance = await attendanceService.createAttendance(req.body)
        
        res.status(201).json({
          success: true,
          message: 'Asistencia registrada exitosamente',
          data: attendance,
        })
      } catch (error) {
        console.error('Error creating attendance:', error)
        
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
   * Registra asistencias en lote
   * POST /attendance/bulk
   */
  createBulkAttendance: [
    validate(bulkAttendanceSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const results = await attendanceService.createBulkAttendance(req.body)
        
        res.status(201).json({
          success: true,
          message: `Asistencias registradas: ${results.length} exitosas`,
          data: results,
          count: results.length,
        })
      } catch (error) {
        console.error('Error creating bulk attendance:', error)
        
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
   * Actualiza un registro de asistencia
   * PUT /attendance/:id
   */
  updateAttendance: [
    validate(attendanceIdSchema, 'params'),
    validate(updateAttendanceSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const attendance = await attendanceService.updateAttendance(id, req.body)
        
        res.json({
          success: true,
          message: 'Asistencia actualizada exitosamente',
          data: attendance,
        })
      } catch (error) {
        console.error('Error updating attendance:', error)
        
        if (error instanceof Error) {
          const status = error.message === 'Asistencia no encontrada' ? 404 : 400
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
   * Elimina un registro de asistencia
   * DELETE /attendance/:id
   */
  deleteAttendance: [
    validate(attendanceIdSchema, 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        await attendanceService.deleteAttendance(id)
        
        res.json({
          success: true,
          message: 'Asistencia eliminada exitosamente',
        })
      } catch (error) {
        console.error('Error deleting attendance:', error)
        
        if (error instanceof Error) {
          const status = error.message === 'Asistencia no encontrada' ? 404 : 400
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
   * Obtiene el resumen de asistencias de un estudiante
   * GET /attendance/student
   */
  getStudentAttendance: [
    validate(studentAttendanceQuerySchema, 'query'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { studentId, courseId, startDate, endDate, semester } = req.query as any
        const summary = await attendanceService.getStudentAttendanceSummary(
          studentId, courseId, startDate, endDate, semester
        )
        
        res.json({
          success: true,
          data: summary,
        })
      } catch (error) {
        console.error('Error getting student attendance:', error)
        
        if (error instanceof Error) {
          const status = error.message === 'Estudiante no encontrado' ? 404 : 400
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
   * Obtiene el resumen de asistencias de un curso
   * GET /attendance/course
   */
  getCourseAttendance: [
    validate(courseAttendanceQuerySchema, 'query'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { courseId, date, startDate, endDate, semester } = req.query as any
        const summary = await attendanceService.getCourseAttendanceSummary(
          courseId, date, startDate, endDate, semester
        )
        
        res.json({
          success: true,
          data: summary,
        })
      } catch (error) {
        console.error('Error getting course attendance:', error)
        
        if (error instanceof Error) {
          const status = error.message === 'Curso no encontrado' ? 404 : 400
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
   * Obtiene estadísticas de asistencia
   * GET /attendance/statistics
   */
  getAttendanceStatistics: [
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { courseId, startDate, endDate, semester } = req.query as any
        const statistics = await attendanceService.getAttendanceStatistics(
          courseId, startDate, endDate, semester
        )
        
        res.json({
          success: true,
          data: statistics,
        })
      } catch (error) {
        console.error('Error getting attendance statistics:', error)
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
        })
      }
    }
  ],

  /**
   * Genera reporte completo de asistencias
   * GET /attendance/report
   */
  generateAttendanceReport: [
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { startDate, endDate, semester } = req.query as any
        
        if (!startDate || !endDate) {
          res.status(400).json({
            success: false,
            error: 'Se requieren startDate y endDate',
          })
          return
        }

        const report = await attendanceService.generateAttendanceReport(
          startDate, endDate, semester
        )
        
        res.json({
          success: true,
          data: report,
        })
      } catch (error) {
        console.error('Error generating attendance report:', error)
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
        })
      }
    }
  ],
}