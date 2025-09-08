import { prisma } from '../../config/database.js'
import { 
  CreateGradeInput,
  UpdateGradeInput,
  GradeResponse,
  StudentGradesSummary,
  CourseGradesSummary,
  GradeStatistics,
  Transcript
} from './grade.types.js'

/**
 * Servicio para la gestión del sistema de calificaciones
 */
export const gradeService = {
  /**
   * Crea una nueva calificación para un estudiante
   */
  async createGrade(gradeData: CreateGradeInput): Promise<GradeResponse> {
    // Validar que el estudiante existe y está inscrito en el curso
    const enrollment = await prisma.courseStudent.findUnique({
      where: {
        courseId_userId: {
          courseId: gradeData.courseId,
          userId: gradeData.studentId,
        },
      },
    })

    if (!enrollment) {
      throw new Error('El estudiante no está inscrito en este curso')
    }

    // Calcular porcentaje y letra de calificación
    const percentage = (gradeData.value / gradeData.maxScore) * 100
    const letterGrade = this.calculateLetterGrade(percentage)

    // Crear la calificación
    const grade = await prisma.grade.create({
      data: {
        studentId: gradeData.studentId,
        courseId: gradeData.courseId,
        value: gradeData.value,
        assessmentType: gradeData.assessmentType,
        assessmentName: gradeData.assessmentName,
        maxScore: gradeData.maxScore,
        weight: gradeData.weight,
        semester: gradeData.semester,
        comments: gradeData.comments,
        letterGrade: letterGrade,
        gradedDate: gradeData.gradedDate ? new Date(gradeData.gradedDate) : new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
          },
        },
      },
    })

    // Actualizar el GPA del estudiante
    await this.updateStudentGPA(gradeData.studentId)

    return {
      id: grade.id,
      studentId: grade.studentId,
      courseId: grade.courseId,
      value: grade.value,
      percentage: Math.round(percentage * 100) / 100,
      letterGrade: grade.letterGrade || '',
      assessmentType: grade.assessmentType,
      assessmentName: grade.assessmentName,
      maxScore: grade.maxScore,
      weight: grade.weight,
      semester: grade.semester,
      comments: grade.comments,
      gradedDate: grade.gradedDate,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      student: grade.student,
      course: grade.course,
    }
  },

  /**
   * Actualiza una calificación existente
   */
  async updateGrade(gradeId: string, gradeData: UpdateGradeInput): Promise<GradeResponse> {
    // Obtener la calificación existente
    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId },
    })

    if (!existingGrade) {
      throw new Error('Calificación no encontrada')
    }

    // Calcular nuevos valores
    const maxScore = gradeData.maxScore ?? existingGrade.maxScore
    const value = gradeData.value ?? existingGrade.value
    const percentage = (value / maxScore) * 100
    const letterGrade = this.calculateLetterGrade(percentage)

    // Actualizar la calificación
    const grade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        value: gradeData.value,
        assessmentType: gradeData.assessmentType,
        assessmentName: gradeData.assessmentName,
        maxScore: gradeData.maxScore,
        weight: gradeData.weight,
        comments: gradeData.comments,
        letterGrade: letterGrade,
        gradedDate: gradeData.gradedDate ? new Date(gradeData.gradedDate) : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
          },
        },
      },
    })

    // Actualizar el GPA del estudiante
    await this.updateStudentGPA(grade.studentId)

    return {
      id: grade.id,
      studentId: grade.studentId,
      courseId: grade.courseId,
      value: grade.value,
      percentage: Math.round(percentage * 100) / 100,
      letterGrade: grade.letterGrade || '',
      assessmentType: grade.assessmentType,
      assessmentName: grade.assessmentName,
      maxScore: grade.maxScore,
      weight: grade.weight,
      semester: grade.semester,
      comments: grade.comments,
      gradedDate: grade.gradedDate,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      student: grade.student,
      course: grade.course,
    }
  },

  /**
   * Obtiene el resumen de calificaciones de un estudiante
   */
  async getStudentGradesSummary(
    studentId: string, 
    semester?: string, 
    courseId?: string
  ): Promise<StudentGradesSummary> {
    // Verificar que el estudiante existe
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        academic: true,
      },
    })

    if (!student) {
      throw new Error('Estudiante no encontrado')
    }

    // Obtener todos los cursos del estudiante
    const enrolledCourses = await prisma.courseStudent.findMany({
      where: {
        userId: studentId,
        ...(courseId && { courseId }),
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
          },
        },
      },
    })

    // Obtener todas las calificaciones del estudiante
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        ...(semester && { semester }),
        ...(courseId && { courseId }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
          },
        },
      },
      orderBy: {
        gradedDate: 'desc' as const,
      },
    })

    // Procesar calificaciones por curso
    const coursesSummary = enrolledCourses.map(enrollment => {
      const courseGrades = grades.filter(grade => grade.courseId === enrollment.courseId)
      const course = enrollment.course

      // Calcular promedio del curso
      const averageGrade = courseGrades.length > 0
        ? courseGrades.reduce((sum, grade) => sum + grade.value, 0) / courseGrades.length
        : 0

      // Calcular promedio ponderado
      const weightedAverage = courseGrades.length > 0
        ? courseGrades.reduce((sum, grade) => sum + (grade.value * (grade.weight || 0.1)), 0) /
          courseGrades.reduce((sum, grade) => sum + (grade.weight || 0.1), 0)
        : 0

      const totalWeight = courseGrades.reduce((sum, grade) => sum + (grade.weight || 0.1), 0)

      return {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        credits: course.credits,
        grades: courseGrades.map(grade => ({
          id: grade.id,
          studentId: grade.studentId,
          courseId: grade.courseId,
          value: grade.value,
          percentage: Math.round((grade.value / (grade.maxScore || 100)) * 10000) / 100,
          letterGrade: grade.letterGrade || this.calculateLetterGrade((grade.value / (grade.maxScore || 100)) * 100),
          assessmentType: grade.assessmentType,
          assessmentName: grade.assessmentName,
          maxScore: grade.maxScore || 100,
          weight: grade.weight || 0.1,
          semester: grade.semester,
          comments: grade.comments,
          gradedDate: grade.gradedDate,
          createdAt: grade.createdAt,
          updatedAt: grade.updatedAt,
          student: grade.student,
          course: grade.course,
        })),
        averageGrade: Math.round(averageGrade * 100) / 100,
        weightedAverage: Math.round(weightedAverage * 100) / 100,
        totalWeight: Math.round(totalWeight * 100) / 100,
      }
    })

    // Calcular promedios generales
    const allGrades = coursesSummary.flatMap(course => 
      course.grades.map(grade => ({
        value: grade.value,
        weight: grade.weight || 0.1,
        credits: course.credits,
      }))
    )

    const overallAverage = allGrades.length > 0
      ? allGrades.reduce((sum, grade) => sum + grade.value, 0) / allGrades.length
      : 0

    const overallWeightedAverage = allGrades.length > 0
      ? allGrades.reduce((sum, grade) => sum + (grade.value * grade.weight), 0) /
        allGrades.reduce((sum, grade) => sum + grade.weight, 0)
      : 0

    const totalCredits = coursesSummary.reduce((sum, course) => sum + course.credits, 0)

    // Calcular GPA
    const gpa = this.calculateGPA(coursesSummary)

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      semester: semester || 'Todos',
      courses: coursesSummary,
      overallAverage: Math.round(overallAverage * 100) / 100,
      overallWeightedAverage: Math.round(overallWeightedAverage * 100) / 100,
      totalCredits,
      gpa: Math.round(gpa * 100) / 100,
    }
  },

  /**
   * Obtiene el resumen de calificaciones de un curso
   */
  async getCourseGradesSummary(
    courseId: string,
    semester?: string,
    assessmentType?: string
  ): Promise<CourseGradesSummary> {
    // Verificar que el curso existe
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        code: true,
        credits: true,
      },
    })

    if (!course) {
      throw new Error('Curso no encontrado')
    }

    // Obtener todos los estudiantes del curso
    const enrolledStudents = await prisma.courseStudent.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Obtener todas las calificaciones del curso
    const grades = await prisma.grade.findMany({
      where: {
        courseId,
        ...(semester && { semester }),
        ...(assessmentType && { assessmentType }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
                course: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
          },
        },
      },
      orderBy: {
        gradedDate: 'desc' as const,
      },
    })

 
    const studentsSummary = enrolledStudents.map(enrollment => {
      const studentGrades = grades.filter(grade => grade.studentId === enrollment.userId)
      
      // Calcular promedio del estudiante
      const averageGrade = studentGrades.length > 0
        ? studentGrades.reduce((sum, grade) => sum + grade.value, 0) / studentGrades.length
        : 0

      // Calcular promedio ponderado
      const weightedAverage = studentGrades.length > 0
        ? studentGrades.reduce((sum, grade) => sum + (grade.value * (grade.weight || 0.1)), 0) /
          studentGrades.reduce((sum, grade) => sum + (grade.weight || 0.1), 0)
        : 0

      const finalGrade = weightedAverage
      const letterGrade = this.calculateLetterGrade(finalGrade)

      return {
        studentId: enrollment.userId,
        studentName: enrollment.user.name,
        studentEmail: enrollment.user.email,
        grades: studentGrades.map(grade => ({
          id: grade.id,
          studentId: grade.studentId,
          courseId: grade.courseId,
          value: grade.value,
          percentage: Math.round((grade.value / (grade.maxScore || 100)) * 10000) / 100,
          letterGrade: grade.letterGrade || this.calculateLetterGrade((grade.value / (grade.maxScore || 100)) * 100),
          assessmentType: grade.assessmentType,
          assessmentName: grade.assessmentName,
          maxScore: grade.maxScore || 100,
          weight: grade.weight || 0.1,
          semester: grade.semester,
          comments: grade.comments,
          gradedDate: grade.gradedDate,
          createdAt: grade.createdAt,
          updatedAt: grade.updatedAt,
          student: grade.student,
          course: grade.course,
        })),
        averageGrade: Math.round(averageGrade * 100) / 100,
        weightedAverage: Math.round(weightedAverage * 100) / 100,
        finalGrade: Math.round(finalGrade * 100) / 100,
        letterGrade,
      }
    })

    // Calcular promedio de la clase
    const allGrades = studentsSummary.flatMap(student => 
      student.grades.map(grade => grade.value)
    )

    const classAverage = allGrades.length > 0
      ? allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length
      : 0

    // Calcular distribución de calificaciones
    const gradeDistribution = this.calculateGradeDistribution(studentsSummary)

    // Resumen por tipo de evaluación
    const assessmentSummary = this.calculateAssessmentSummary(grades)

    return {
      course,
      semester: semester || 'Todos',
      students: studentsSummary,
      classAverage: Math.round(classAverage * 100) / 100,
      gradeDistribution,
      assessmentSummary,
    }
  },

  // ==================== HELPER METHODS ====================
  calculatePercentile(data: number[], percentile: number): number {
    const index = (percentile / 100) * (data.length - 1)
    const lowerIndex = Math.floor(index)
    const upperIndex = Math.ceil(index)

    if (lowerIndex === upperIndex) {
      return data[lowerIndex]
    }

    const lowerValue = data[lowerIndex]
    const upperValue = data[upperIndex]
    const fraction = index - lowerIndex

    return lowerValue + fraction * (upperValue - lowerValue)
  },


  /**
   * Calcula la letra de calificación basada en el porcentaje
   */
  calculateLetterGrade(percentage: number): string {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  },

  /**
   * Calcula el GPA basado en las calificaciones por letra
   */
  calculateGPA(courses: any[]): number {
    const gradePoints: Record<string, number> = {
      'A': 4.0,
      'B': 3.0,
      'C': 2.0,
      'D': 1.0,
      'F': 0.0,
    }

    const totalPoints = courses.reduce((sum, course) => {
      const letterGrade = this.calculateLetterGrade(course.weightedAverage)
      return sum + (gradePoints[letterGrade] * course.credits)
    }, 0)

    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)

    return totalCredits > 0 ? totalPoints / totalCredits : 0
  },

  /**
   * Actualiza el GPA de un estudiante en la base de datos
   */
  async updateStudentGPA(studentId: string): Promise<void> {
    try {
      const summary = await this.getStudentGradesSummary(studentId)
      
      await prisma.studentAcademic.upsert({
        where: { studentId },
        update: {
          cumulativeGPA: summary.gpa,
          totalCredits: summary.totalCredits,
        },
        create: {
          studentId,
          cumulativeGPA: summary.gpa,
          totalCredits: summary.totalCredits,
          enrollmentDate: new Date(),
          currentSemester: 1,
          status: 'active',
        },
      })
    } catch (error) {
      console.error('Error updating student GPA:', error)
      // No lanzar error para no interrumpir operaciones principales
    }
  },

  /**
   * Calcula la distribución de calificaciones
   */
  calculateGradeDistribution(students: any[]): any[] {
    const distribution: Record<string, number> = {}

    students.forEach(student => {
      const letter = student.letterGrade
      distribution[letter] = (distribution[letter] || 0) + 1
    })

    return Object.entries(distribution).map(([letterGrade, count]) => ({
      letterGrade,
      count,
      percentage: Math.round((count / students.length) * 10000) / 100,
    }))
  },

  /**
   * Calcula el resumen por tipo de evaluación
   */
  calculateAssessmentSummary(grades: any[]): any[] {
    const summary: Record<string, { count: number; total: number }> = {}

    grades.forEach(grade => {
      if (!summary[grade.assessmentType]) {
        summary[grade.assessmentType] = { count: 0, total: 0 }
      }
      summary[grade.assessmentType].count++
      summary[grade.assessmentType].total += grade.value
    })

    return Object.entries(summary).map(([assessmentType, data]) => ({
      assessmentType,
      count: data.count,
      averageScore: Math.round((data.total / data.count) * 100) / 100,
    }))
  },

  /**
   * Genera el transcript académico de un estudiante (versión simplificada)
   */
  async generateTranscript(studentId: string): Promise<Transcript> {
    const summary = await this.getStudentGradesSummary(studentId)
    
    return {
      student: {
        id: summary.student.id,
        name: summary.student.name,
        email: summary.student.email,
        studentId: summary.student.id,
      },
      semesters: [{
        semester: summary.semester,
        courses: summary.courses.map(course => ({
          courseId: course.courseId,
          courseName: course.courseName,
          courseCode: course.courseCode,
          credits: course.credits,
          finalGrade: course.weightedAverage,
          letterGrade: this.calculateLetterGrade(course.weightedAverage),
          status: course.weightedAverage >= 60 ? 'passed' : 'failed',
        })),
        semesterGPA: summary.gpa,
        totalCredits: summary.totalCredits,
        earnedCredits: summary.courses
          .filter(course => course.weightedAverage >= 60)
          .reduce((sum, course) => sum + course.credits, 0),
      }],
      cumulativeGPA: summary.gpa,
      totalCredits: summary.totalCredits,
      earnedCredits: summary.courses
        .filter(course => course.weightedAverage >= 60)
        .reduce((sum, course) => sum + course.credits, 0),
      completionRate: summary.totalCredits > 0 
        ? (summary.courses
            .filter(course => course.weightedAverage >= 60)
            .reduce((sum, course) => sum + course.credits, 0) / summary.totalCredits) * 100
        : 0,
    }
  },

  
  /**
   * Elimina una calificación
   * @param gradeId ID de la calificación
   */
  async deleteGrade(gradeId: string): Promise<void> {
    // Obtener la calificación para obtener el studentId
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
    })

    if (!grade) {
      throw new Error('Calificación no encontrada')
    }

    // Eliminar la calificación
    await prisma.grade.delete({
      where: { id: gradeId },
    })

    // Actualizar el GPA del estudiante
    await this.updateStudentGPA(grade.studentId)
  },
  
  /**
   * Calcula estadísticas detalladas de calificaciones
   * @param grades Array de valores numéricos de calificaciones
   * @returns Estadísticas completas
   */
  calculateGradeStatistics(grades: number[]): GradeStatistics {
    if (grades.length === 0) {
      return {
        mean: 0,
        median: 0,
        mode: 0,
        standardDeviation: 0,
        min: 0,
        max: 0,
        quartiles: { q1: 0, q2: 0, q3: 0 },
        passingRate: 0,
        gradeDistribution: {},
      }
    }

    // Ordenar calificaciones
    const sortedGrades = [...grades].sort((a, b) => a - b)
    const n = sortedGrades.length

    // Calcular media
    const mean = sortedGrades.reduce((sum, grade) => sum + grade, 0) / n

    // Calcular mediana
    const median = n % 2 === 0
      ? (sortedGrades[n / 2 - 1] + sortedGrades[n / 2]) / 2
      : sortedGrades[Math.floor(n / 2)]

    // Calcular moda
    const frequencyMap = sortedGrades.reduce((map, grade) => {
      map.set(grade, (map.get(grade) || 0) + 1)
      return map
    }, new Map<number, number>())

    let mode = sortedGrades[0]
    let maxFrequency = 0

    frequencyMap.forEach((frequency, grade) => {
      if (frequency > maxFrequency) {
        maxFrequency = frequency
        mode = grade
      }
    })

    // Calcular desviación estándar
    const variance = sortedGrades.reduce((sum, grade) => sum + Math.pow(grade - mean, 2), 0) / n
    const standardDeviation = Math.sqrt(variance)

    // Calcular cuartiles
    const q1 = this.calculatePercentile(sortedGrades, 25)
    const q2 = this.calculatePercentile(sortedGrades, 50)
    const q3 = this.calculatePercentile(sortedGrades, 75)

    // Calcular tasa de aprobación (asumiendo que 60 es aprobatorio)
    const passingCount = sortedGrades.filter(grade => grade >= 60).length
    const passingRate = (passingCount / n) * 100

    // Distribución de calificaciones por letra
    const gradeDistribution = sortedGrades.reduce((dist, grade) => {
      const letter = this.calculateLetterGrade(grade)
      dist[letter] = (dist[letter] || 0) + 1
      return dist
    }, {} as Record<string, number>)

    return {
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      mode: Math.round(mode * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      min: sortedGrades[0],
      max: sortedGrades[n - 1],
      quartiles: {
        q1: Math.round(q1 * 100) / 100,
        q2: Math.round(q2 * 100) / 100,
        q3: Math.round(q3 * 100) / 100,
      },
      passingRate: Math.round(passingRate * 100) / 100,
      gradeDistribution,
    }
  },
}