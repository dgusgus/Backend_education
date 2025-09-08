import { z } from 'zod'

/**
 * Esquemas de validación Zod para el sistema de asistencias
 */
export const createAttendanceSchema = z.object({
  studentId: z.string().cuid('ID de estudiante inválido'),
  courseId: z.string().cuid('ID de curso inválido'),
  date: z.string().datetime('Fecha inválida'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  comments: z.string().optional(),
})

export const updateAttendanceSchema = z.object({
  status: z.enum(['present', 'absent', 'late', 'excused']).optional(),
  comments: z.string().optional(),
})

export const attendanceIdSchema = z.object({
  id: z.string().cuid('ID de asistencia inválido'),
})

export const studentAttendanceQuerySchema = z.object({
  studentId: z.string().cuid('ID de estudiante inválido'),
  courseId: z.string().cuid('ID de curso inválido').optional(),
  startDate: z.string().datetime('Fecha de inicio inválida').optional(),
  endDate: z.string().datetime('Fecha de fin inválida').optional(),
  semester: z.string().optional(),
})

export const courseAttendanceQuerySchema = z.object({
  courseId: z.string().cuid('ID de curso inválido'),
  date: z.string().datetime('Fecha inválida').optional(),
  startDate: z.string().datetime('Fecha de inicio inválida').optional(),
  endDate: z.string().datetime('Fecha de fin inválida').optional(),
  semester: z.string().optional(),
})

export const bulkAttendanceSchema = z.object({
  courseId: z.string().cuid('ID de curso inválido'),
  date: z.string().datetime('Fecha inválida'),
  attendances: z.array(z.object({
    studentId: z.string().cuid('ID de estudiante inválido'),
    status: z.enum(['present', 'absent', 'late', 'excused']),
    comments: z.string().optional(),
  })),
})

/**
 * Tipos TypeScript para el sistema de asistencias
 */
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>
export type AttendanceIdParams = z.infer<typeof attendanceIdSchema>
export type StudentAttendanceQuery = z.infer<typeof studentAttendanceQuerySchema>
export type CourseAttendanceQuery = z.infer<typeof courseAttendanceQuerySchema>
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>

/**
 * Interfaces de respuesta para las APIs de asistencias
 */
export interface AttendanceResponse {
  id: string
  studentId: string
  courseId: string
  date: Date
  status: string
  comments: string | null
  createdAt: Date
  updatedAt: Date
  student: {
    id: string
    name: string
    email: string
  }
  course: {
    id: string
    name: string
    code: string
  }
}

export interface StudentAttendanceSummary {
  student: {
    id: string
    name: string
    email: string
  }
  course?: {
    id: string
    name: string
    code: string
  }
  period: {
    startDate: Date
    endDate: Date
    semester?: string
  }
  totalClasses: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
  attendanceRecords: AttendanceResponse[]
  trends: {
    weekly: {
      week: string
      attendanceRate: number
    }[]
    monthly: {
      month: string
      attendanceRate: number
    }[]
  }
}

export interface CourseAttendanceSummary {
  course: {
    id: string
    name: string
    code: string
  }
  date?: Date
  period: {
    startDate: Date
    endDate: Date
    semester?: string
  }
  totalStudents: number
  present: number
  absent: number
  late: number
  excused: number
  overallAttendanceRate: number
  students: {
    studentId: string
    studentName: string
    status: string
    comments?: string
    attendanceRate?: number
  }[]
  dailySummary?: {
    date: Date
    present: number
    absent: number
    late: number
    excused: number
    attendanceRate: number
  }[]
}

export interface AttendanceStatistics {
  totalRecords: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  overallAttendanceRate: number
  averageDailyAttendance: number
  peakAbsenceDays: {
    date: Date
    absenceCount: number
    absenceRate: number
  }[]
  studentPerformance: {
    studentId: string
    studentName: string
    attendanceRate: number
    totalAbsences: number
    trend: 'improving' | 'declining' | 'stable'
  }[]
}

export interface AttendanceReport {
  generatedAt: Date
  period: {
    startDate: Date
    endDate: Date
    semester?: string
  }
  summary: {
    totalClasses: number
    totalStudents: number
    overallAttendanceRate: number
    present: number
    absent: number
    late: number
    excused: number
  }
  courseReports: {
    courseId: string
    courseName: string
    attendanceRate: number
    totalStudents: number
  }[]
  studentReports: {
    studentId: string
    studentName: string
    overallAttendanceRate: number
    courses: {
      courseId: string
      courseName: string
      attendanceRate: number
    }[]
  }[]
  alerts: {
    type: 'low_attendance' | 'frequent_absence' | 'pattern_detected'
    studentId?: string
    courseId?: string
    message: string
    severity: 'low' | 'medium' | 'high'
  }[]
}