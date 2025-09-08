import { Request, Response } from 'express'
import { gradeService } from './grade.service.js'
import { 
  createGradeSchema, 
  updateGradeSchema, 
  gradeIdSchema,
  studentGradesQuerySchema,
  courseGradesQuerySchema
} from './grade.types.js'
import { validate } from '../../middleware/validation.js'
import { AuthRequest } from '../../middleware/auth.js'

/**
 * Controlador para los endpoints del sistema de calificaciones
 * Maneja las requests HTTP y responses para las operaciones de calificaciones
 */
export const gradeController = {
  /**
   * Crea una nueva calificación
   * POST /grades
   */
  createGrade: [
    validate(createGradeSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const grade = await gradeService.createGrade(req.body)
        
        res.status(201).json({
          success: true,
          message: 'Calificación creada exitosamente',
          data: grade,
        })
      } catch (error) {
        console.error('Error creating grade:', error)
        
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
   * Actualiza una calificación existente
   * PUT /grades/:id
   */
  updateGrade: [
    validate(gradeIdSchema, 'params'),
    validate(updateGradeSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const grade = await gradeService.updateGrade(id, req.body)
        
        res.json({
          success: true,
          message: 'Calificación actualizada exitosamente',
          data: grade,
        })
      } catch (error) {
        console.error('Error updating grade:', error)
        
        if (error instanceof Error) {
          const status = error.message === 'Calificación no encontrada' ? 404 : 400
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
   * Elimina una calificación
   * DELETE /grades/:id
   */
  deleteGrade: [
    validate(gradeIdSchema, 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        await gradeService.deleteGrade(id)
        
        res.json({
          success: true,
          message: 'Calificación eliminada exitosamente',
        })
      } catch (error) {
        console.error('Error deleting grade:', error)
        
        if (error instanceof Error) {
          const status = error.message === 'Calificación no encontrada' ? 404 : 400
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
   * Obtiene el resumen de calificaciones de un estudiante
   * GET /grades/student/:studentId
   */
  getStudentGrades: [
    validate(studentGradesQuerySchema, 'query'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { studentId, semester, courseId } = req.query as any
        const summary = await gradeService.getStudentGradesSummary(studentId, semester, courseId)
        
        res.json({
          success: true,
          data: summary,
        })
      } catch (error) {
        console.error('Error getting student grades:', error)
        
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
   * Obtiene el resumen de calificaciones de un curso
   * GET /grades/course/:courseId
   */
  getCourseGrades: [
    validate(courseGradesQuerySchema, 'query'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { courseId, semester, assessmentType } = req.query as any
        const summary = await gradeService.getCourseGradesSummary(courseId, semester, assessmentType)
        
        res.json({
          success: true,
          data: summary,
        })
      } catch (error) {
        console.error('Error getting course grades:', error)
        
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
   * Genera el transcript académico de un estudiante
   * GET /grades/transcript/:studentId
   */
  generateTranscript: [
    validate(studentGradesQuerySchema.pick({ studentId: true }), 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { studentId } = req.params
        const transcript = await gradeService.generateTranscript(studentId)
        
        res.json({
          success: true,
          data: transcript,
        })
      } catch (error) {
        console.error('Error generating transcript:', error)
        
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
   * Calcula estadísticas de calificaciones
   * POST /grades/statistics
   */
  calculateStatistics: [
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { grades } = req.body
        
        if (!Array.isArray(grades)) {
          res.status(400).json({
            success: false,
            error: 'Se requiere un array de calificaciones',
          })
          return
        }

        const statistics = gradeService.calculateGradeStatistics(grades)
        
        res.json({
          success: true,
          data: statistics,
        })
      } catch (error) {
        console.error('Error calculating statistics:', error)
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
        })
      }
    }
  ],
}