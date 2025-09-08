import { z } from 'zod'

/**
 * Esquemas de validación Zod para el sistema de calificaciones
 * Garantizan la integridad de los datos de calificaciones
 */
export const createGradeSchema = z.object({
  studentId: z.string().cuid('ID de estudiante inválido'),
  courseId: z.string().cuid('ID de curso inválido'),
  value: z.number()
    .min(0, 'La calificación no puede ser menor a 0')
    .max(100, 'La calificación no puede ser mayor a 100'),
  assessmentType: z.enum(['exam', 'quiz', 'assignment', 'project', 'participation']),
  assessmentName: z.string().min(1, 'El nombre de la evaluación es requerido'),
  maxScore: z.number().min(1, 'El puntaje máximo debe ser al menos 1').default(100),
  weight: z.number().min(0.1).max(1).default(0.1),
  semester: z.string().min(3, 'El semestre debe tener al menos 3 caracteres'),
  comments: z.string().optional(),
  gradedDate: z.string().datetime('Fecha de calificación inválida').optional(),
})

export const updateGradeSchema = z.object({
  value: z.number()
    .min(0, 'La calificación no puede ser menor a 0')
    .max(100, 'La calificación no puede ser mayor a 100')
    .optional(),
  assessmentType: z.enum(['exam', 'quiz', 'assignment', 'project', 'participation']).optional(),
  assessmentName: z.string().min(1, 'El nombre de la evaluación es requerido').optional(),
  maxScore: z.number().min(1, 'El puntaje máximo debe ser al menos 1').optional(),
  weight: z.number().min(0.1).max(1).optional(),
  comments: z.string().optional(),
  gradedDate: z.string().datetime('Fecha de calificación inválida').optional(),
})

export const gradeIdSchema = z.object({
  id: z.string().cuid('ID de calificación inválido'),
})

export const studentGradesQuerySchema = z.object({
  studentId: z.string().cuid('ID de estudiante inválido'),
  semester: z.string().optional(),
  courseId: z.string().cuid('ID de curso inválido').optional(),
})

export const courseGradesQuerySchema = z.object({
  courseId: z.string().cuid('ID de curso inválido'),
  semester: z.string().optional(),
  assessmentType: z.enum(['exam', 'quiz', 'assignment', 'project', 'participation']).optional(),
})

/**
 * Tipos TypeScript para el sistema de calificaciones
 */
export type CreateGradeInput = z.infer<typeof createGradeSchema>
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>
export type GradeIdParams = z.infer<typeof gradeIdSchema>
export type StudentGradesQuery = z.infer<typeof studentGradesQuerySchema>
export type CourseGradesQuery = z.infer<typeof courseGradesQuerySchema>

/**
 * Interfaces de respuesta para las APIs de calificaciones
 */
export interface GradeResponse {
  id: string
  studentId: string
  courseId: string
  value: number
  percentage: number
  letterGrade: string
  assessmentType: string
  assessmentName: string
  maxScore: number
  weight: number
  semester: string
  comments: string | null
  gradedDate: Date
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
    credits: number
  }
}

export interface StudentGradesSummary {
  student: {
    id: string
    name: string
    email: string
  }
  semester: string
  courses: {
    courseId: string
    courseName: string
    courseCode: string
    credits: number
    grades: GradeResponse[]
    averageGrade: number
    weightedAverage: number
    totalWeight: number
  }[]
  overallAverage: number
  overallWeightedAverage: number
  totalCredits: number
  gpa: number
}

export interface CourseGradesSummary {
  course: {
    id: string
    name: string
    code: string
    credits: number
  }
  semester: string
  students: {
    studentId: string
    studentName: string
    studentEmail: string
    grades: GradeResponse[]
    averageGrade: number
    weightedAverage: number
    finalGrade: number
    letterGrade: string
  }[]
  classAverage: number
  gradeDistribution: {
    letterGrade: string
    count: number
    percentage: number
  }[]
  assessmentSummary: {
    assessmentType: string
    count: number
    averageScore: number
  }[]
}

export interface GradeStatistics {
  mean: number
  median: number
  mode: number
  standardDeviation: number
  min: number
  max: number
  quartiles: {
    q1: number
    q2: number
    q3: number
  }
  passingRate: number
  gradeDistribution: Record<string, number>
}

export interface Transcript {
  student: {
    id: string
    name: string
    email: string
    studentId: string
  }
  semesters: {
    semester: string
    courses: {
      courseId: string
      courseName: string
      courseCode: string
      credits: number
      finalGrade: number
      letterGrade: string
      status: 'passed' | 'failed' | 'in-progress'
    }[]
    semesterGPA: number
    totalCredits: number
    earnedCredits: number
  }[]
  cumulativeGPA: number
  totalCredits: number
  earnedCredits: number
  completionRate: number
}