import { Request, Response } from 'express'
import { studentService } from './student.service.js'
import { 
  studentAcademicSchema, 
  gradeSchema, 
  attendanceSchema,
  studentIdSchema,
  semesterSchema
} from './student.types.js'
import { validate } from '../../middleware/validation.js'

export const studentController = {
  // Obtener todos los estudiantes
  getStudents: [
    async (req: Request, res: Response): Promise<void> => {
      try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10

        if (page < 1 || limit < 1) {
          res.status(400).json({
            success: false,
            error: 'Page and limit must be positive numbers',
          })
          return
        }

        const { students, total, totalPages } = await studentService.getStudents(page, limit)

        res.json({
          success: true,
          data: students,
          count: students.length,
          total,
          pagination: {
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        })
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({
            success: false,
            error: error.message,
          })
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }
    }
  ],

  // Obtener estudiante por ID
  getStudentById: [
    validate(studentIdSchema, 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const student = await studentService.getStudentById(id)

        res.json({
          success: true,
          data: student,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'Student not found' ? 404 : 500
          res.status(status).json({
            success: false,
            error: error.message,
          })
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }
    }
  ],

  // Actualizar información académica del estudiante
  updateStudentAcademic: [
    validate(studentIdSchema, 'params'),
    validate(studentAcademicSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const academic = await studentService.updateStudentAcademic(id, req.body)

        res.json({
          success: true,
          message: 'Student academic information updated successfully',
          data: academic,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'Student not found' ? 404 : 500
          res.status(status).json({
            success: false,
            error: error.message,
          })
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }
    }
  ],

  // Registrar calificación
  recordGrade: [
    validate(studentIdSchema, 'params'),
    validate(gradeSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const grade = await studentService.recordGrade(id, req.body)

        res.status(201).json({
          success: true,
          message: 'Grade recorded successfully',
          data: grade,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message.includes('not enrolled') ? 404 : 500
          res.status(status).json({
            success: false,
            error: error.message,
          })
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }
    }
  ],

  // Registrar asistencia
  recordAttendance: [
    validate(studentIdSchema, 'params'),
    validate(attendanceSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const attendance = await studentService.recordAttendance(id, req.body)

        res.status(201).json({
          success: true,
          message: 'Attendance recorded successfully',
          data: attendance,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message.includes('not enrolled') ? 404 : 500
          res.status(status).json({
            success: false,
            error: error.message,
          })
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }
    }
  ],

  // Obtener resumen académico
  getAcademicSummary: [
    validate(studentIdSchema, 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const summary = await studentService.getAcademicSummary(id)

        res.json({
          success: true,
          data: summary,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'Student not found' ? 404 : 500
          res.status(status).json({
            success: false,
            error: error.message,
          })
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }
    }
  ],
}