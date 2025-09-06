import { z } from 'zod'

// Esquemas de validación Zod
export const studentAcademicSchema = z.object({
  enrollmentDate: z.string().datetime(),
  graduationDate: z.string().datetime().optional(),
  currentSemester: z.number().int().min(1).max(20),
  status: z.enum(['active', 'graduated', 'inactive', 'suspended']),
  cumulativeGPA: z.number().min(0).max(10).optional(),
  totalCredits: z.number().int().min(0).optional(),
})

export const gradeSchema = z.object({
  courseId: z.string().cuid(),
  value: z.number().min(0).max(100),
  letterGrade: z.enum(['A', 'B', 'C', 'D', 'F']).optional(),
  semester: z.string().min(3, 'Semester must be at least 3 characters'),
  comments: z.string().optional(),
})

export const attendanceSchema = z.object({
  courseId: z.string().cuid(),
  date: z.string().datetime(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  comments: z.string().optional(),
})

// CORRECCIÓN: Cambiar studentIdParams por studentIdSchema
export const studentIdSchema = z.object({
  id: z.string().cuid('Invalid student ID format'),
})

export const semesterSchema = z.object({
  semester: z.string().min(3, 'Semester must be at least 3 characters'),
})

// Tipos TypeScript
export type StudentAcademicInput = z.infer<typeof studentAcademicSchema>
export type GradeInput = z.infer<typeof gradeSchema>
export type AttendanceInput = z.infer<typeof attendanceSchema>

// CORRECCIÓN: Cambiar StudentIdParams por studentIdSchema
export type StudentIdParams = z.infer<typeof studentIdSchema>
export type SemesterParams = z.infer<typeof semesterSchema>

// Tipos de respuesta
export interface StudentResponse {
  id: string
  email: string
  name: string
  active: boolean
  academic: StudentAcademicResponse | null
  courses: EnrolledCourseResponse[]
  createdAt: Date
  updatedAt: Date
}

export interface StudentAcademicResponse {
  id: string
  enrollmentDate: Date
  graduationDate: Date | null
  currentSemester: number
  status: string
  cumulativeGPA: number
  totalCredits: number
  createdAt: Date
  updatedAt: Date
}

export interface EnrolledCourseResponse {
  id: string
  name: string
  code: string
  credits: number
  enrolledAt: Date
  grade: GradeResponse | null
}

export interface GradeResponse {
  id: string
  value: number
  letterGrade: string | null
  semester: string
  comments: string | null
  createdAt: Date
  updatedAt: Date
  course: {
    id: string
    name: string
    code: string
  }
}

export interface AttendanceResponse {
  id: string
  date: Date
  status: string
  comments: string | null
  createdAt: Date
  updatedAt: Date
  course: {
    id: string
    name: string
    code: string
  }
}

export interface AcademicSummaryResponse {
  student: {
    id: string
    name: string
    email: string
  }
  academic: StudentAcademicResponse
  currentCourses: EnrolledCourseResponse[]
  completedCourses: EnrolledCourseResponse[]
  attendanceRate: number
  semesterGPA: number
  cumulativeGPA: number
}