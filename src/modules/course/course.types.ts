import { z } from 'zod'

// Esquemas de validación Zod
export const createCourseSchema = z.object({
  name: z.string().min(3, 'Course name must be at least 3 characters'),
  description: z.string().optional(),
  code: z.string().min(2, 'Course code must be at least 2 characters'),
  credits: z.number().int().min(1).max(10).default(1),
  teacherIds: z.array(z.string().cuid()).min(1, 'At least one teacher is required'),
})

export const updateCourseSchema = z.object({
  name: z.string().min(3, 'Course name must be at least 3 characters').optional(),
  description: z.string().optional(),
  code: z.string().min(2, 'Course code must be at least 2 characters').optional(),
  credits: z.number().int().min(1).max(10).optional(),
  teacherIds: z.array(z.string().cuid()).optional(),
  active: z.boolean().optional(),
})

// CORRECIÓN: Cambiar courseIdParams a courseIdSchema
export const courseIdSchema = z.object({
  id: z.string().cuid('Invalid course ID format'),
})

export const enrollStudentSchema = z.object({
  studentId: z.string().cuid('Invalid student ID format'),
})

// Tipos TypeScript
export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>
// CORRECIÓN: Cambiar courseIdParams a courseIdSchema
export type CourseIdParams = z.infer<typeof courseIdSchema>
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>

// Tipos de respuesta
export interface TeacherResponse {
  id: string
  name: string
  email: string
}

export interface StudentResponse {
  id: string
  name: string
  email: string
  enrolledAt: Date
}

export interface CourseResponse {
  id: string
  name: string
  description: string | null
  code: string
  credits: number
  active: boolean
  teachers: TeacherResponse[]
  students: StudentResponse[]
  createdAt: Date
  updatedAt: Date
}

export interface CoursesListResponse {
  success: boolean
  data: CourseResponse[]
  count: number
  pagination?: {
    page: number
    limit: number
    totalPages: number
  }
}