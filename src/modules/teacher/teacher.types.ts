import { z } from 'zod'

/**
 * Esquemas de validación Zod para datos de entrada
 * Estos schemas aseguran que los datos recibidos cumplan con las reglas de validación
 */
export const teacherCourseAssignmentSchema = z.object({
  courseId: z.string().cuid('ID de curso inválido'),
  teacherId: z.string().cuid('ID de profesor inválido'),
})

export const gradeAssignmentSchema = z.object({
  studentId: z.string().cuid('ID de estudiante inválido'),
  courseId: z.string().cuid('ID de curso inválido'),
  value: z.number().min(0).max(100, 'La calificación debe estar entre 0 y 100'),
  semester: z.string().min(3, 'El semestre debe tener al menos 3 caracteres'),
  comments: z.string().optional(),
})

export const attendanceRecordSchema = z.object({
  studentId: z.string().cuid('ID de estudiante inválido'),
  courseId: z.string().cuid('ID de curso inválido'),
  date: z.string().datetime('Fecha inválida'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  comments: z.string().optional(),
})

export const teacherIdSchema = z.object({
  id: z.string().cuid('ID de profesor inválido'),
})

/**
 * Tipos TypeScript inferidos desde los schemas de Zod
 * Esto garantiza consistencia entre validación y tipos
 */
export type TeacherCourseAssignmentInput = z.infer<typeof teacherCourseAssignmentSchema>
export type GradeAssignmentInput = z.infer<typeof gradeAssignmentSchema>
export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>
export type TeacherIdParams = z.infer<typeof teacherIdSchema>

/**
 * Interfaces de respuesta para las APIs
 * Definen la estructura de datos que se retorna al cliente
 */
export interface TeacherCourseResponse {
  id: string
  name: string
  code: string
  description: string | null
  credits: number
  active: boolean
  enrolledStudents: number
  currentSemester: string
}

export interface TeacherDashboardResponse {
  teacher: {
    id: string
    name: string
    email: string
    totalCourses: number
    activeCourses: number
  }
  recentActivity: {
    type: 'grade' | 'attendance' | 'assignment'
    description: string
    date: Date
    course: string
  }[]
  upcomingDeadlines: {
    title: string
    course: string
    dueDate: Date
    type: 'assignment' | 'exam' | 'event'
  }[]
  performanceMetrics: {
    averageGrade: number
    attendanceRate: number
    totalStudents: number
  }
}

export interface StudentGradeResponse {
  studentId: string
  studentName: string
  studentEmail: string
  grades: {
    courseId: string
    courseName: string
    value: number
    letterGrade: string
    semester: string
    date: Date
  }[]
  averageGrade: number
}

export interface CourseAttendanceSummary {
  courseId: string
  courseName: string
  totalClasses: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number
  students: {
    studentId: string
    studentName: string
    attendanceRate: number
    lastAttendance: Date | null
  }[]
}