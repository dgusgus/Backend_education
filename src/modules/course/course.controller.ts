import { Request, Response } from 'express'
import { courseService } from './course.service.js'
import { 
  createCourseSchema, 
  updateCourseSchema, 
  courseIdSchema,
  enrollStudentSchema
} from './course.types.js'
import { validate } from '../../middleware/validation.js'

export const courseController = {
  // Obtener todos los cursos
  getCourses: [
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

        const { courses, total, totalPages } = await courseService.getCourses(page, limit)

        res.json({
          success: true,
          data: courses,
          count: courses.length,
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

  // Obtener curso por ID
  getCourseById: [
    validate(courseIdSchema, 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const course = await courseService.getCourseById(id)

        res.json({
          success: true,
          data: course,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'Course not found' ? 404 : 500
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

  // Crear nuevo curso
  createCourse: [
    validate(createCourseSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const course = await courseService.createCourse(req.body)

        res.status(201).json({
          success: true,
          message: 'Course created successfully',
          data: course,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message.includes('already exists') ? 409 : 500
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

  // Actualizar curso
  updateCourse: [
    validate(courseIdSchema, 'params'),
    validate(updateCourseSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const course = await courseService.updateCourse(id, req.body)

        res.json({
          success: true,
          message: 'Course updated successfully',
          data: course,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'Course not found' ? 404 : 
                         error.message.includes('already in use') ? 409 : 500
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

  // Eliminar curso
  deleteCourse: [
    validate(courseIdSchema, 'params'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const course = await courseService.deleteCourse(id)

        res.json({
          success: true,
          message: 'Course deleted successfully',
          data: course,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message === 'Course not found' ? 404 : 500
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

  // Inscribir estudiante en curso
  enrollStudent: [
    validate(courseIdSchema, 'params'),
    validate(enrollStudentSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const { studentId } = req.body
        const course = await courseService.enrollStudent(id, studentId)

        res.json({
          success: true,
          message: 'Student enrolled successfully',
          data: course,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 
                         error.message.includes('already enrolled') ? 409 : 500
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

  // Desinscribir estudiante de curso
  unenrollStudent: [
    validate(courseIdSchema, 'params'),
    validate(enrollStudentSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params
        const { studentId } = req.body
        const course = await courseService.unenrollStudent(id, studentId)

        res.json({
          success: true,
          message: 'Student unenrolled successfully',
          data: course,
        })
      } catch (error) {
        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 
                         error.message.includes('not enrolled') ? 409 : 500
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