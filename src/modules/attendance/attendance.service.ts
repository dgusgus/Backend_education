import { prisma } from '../../config/database.js'
import { 
  CreateAttendanceInput,
  UpdateAttendanceInput,
  AttendanceResponse,
  StudentAttendanceSummary,
  CourseAttendanceSummary,
  AttendanceStatistics,
  AttendanceReport,
  BulkAttendanceInput
} from './attendance.types.js'

/**
 * Servicio para la gestión del sistema de asistencias
 */
export const attendanceService = {
  /**
   * Registra una asistencia individual
   */
  async createAttendance(attendanceData: CreateAttendanceInput): Promise<AttendanceResponse> {
    // Validar que el estudiante está inscrito en el curso
    const enrollment = await prisma.courseStudent.findUnique({
      where: {
        courseId_userId: {
          courseId: attendanceData.courseId,
          userId: attendanceData.studentId,
        },
      },
    })

    if (!enrollment) {
      throw new Error('El estudiante no está inscrito en este curso')
    }

    // Crear el registro de asistencia
    const attendance = await prisma.attendance.create({
      data: {
        studentId: attendanceData.studentId,
        courseId: attendanceData.courseId,
        date: new Date(attendanceData.date),
        status: attendanceData.status,
        comments: attendanceData.comments,
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
          },
        },
      },
    })

    return attendance
  },

  /**
   * Registra asistencias en lote para una clase completa
   */
  async createBulkAttendance(bulkData: BulkAttendanceInput): Promise<AttendanceResponse[]> {
    const results: AttendanceResponse[] = []

    for (const attendanceData of bulkData.attendances) {
      try {
        // Validar que cada estudiante está inscrito en el curso
        const enrollment = await prisma.courseStudent.findUnique({
          where: {
            courseId_userId: {
              courseId: bulkData.courseId,
              userId: attendanceData.studentId,
            },
          },
        })

        if (!enrollment) {
          console.warn(`Estudiante ${attendanceData.studentId} no está inscrito en el curso ${bulkData.courseId}`)
          continue
        }

        // Crear registro de asistencia
        const attendance = await prisma.attendance.upsert({
          where: {
            studentId_courseId_date: {
              studentId: attendanceData.studentId,
              courseId: bulkData.courseId,
              date: new Date(bulkData.date),
            },
          },
          update: {
            status: attendanceData.status,
            comments: attendanceData.comments,
          },
          create: {
            studentId: attendanceData.studentId,
            courseId: bulkData.courseId,
            date: new Date(bulkData.date),
            status: attendanceData.status,
            comments: attendanceData.comments,
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
              },
            },
          },
        })

        results.push(attendance)
      } catch (error) {
        console.error('Error creating attendance for student:', attendanceData.studentId, error)
      }
    }

    return results
  },

  /**
   * Actualiza una asistencia existente
   */
  async updateAttendance(attendanceId: string, attendanceData: UpdateAttendanceInput): Promise<AttendanceResponse> {
    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: attendanceData.status,
        comments: attendanceData.comments,
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
          },
        },
      },
    })

    return attendance
  },

  /**
   * Elimina un registro de asistencia
   */
  async deleteAttendance(attendanceId: string): Promise<void> {
    await prisma.attendance.delete({
      where: { id: attendanceId },
    })
  },

  /**
   * Obtiene el resumen de asistencias de un estudiante
   */
  async getStudentAttendanceSummary(
    studentId: string,
    courseId?: string,
    startDate?: string,
    endDate?: string,
    semester?: string
  ): Promise<StudentAttendanceSummary> {
    // Verificar que el estudiante existe
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!student) {
      throw new Error('Estudiante no encontrado')
    }

    // Construir filtros de fecha
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    // Obtener registros de asistencia
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId,
        ...(courseId && { courseId }),
        ...(startDate || endDate ? { date: dateFilter } : {}),
        ...(semester && { semester }),
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
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Calcular estadísticas
    const totalClasses = attendanceRecords.length
    const present = attendanceRecords.filter(a => a.status === 'present').length
    const absent = attendanceRecords.filter(a => a.status === 'absent').length
    const late = attendanceRecords.filter(a => a.status === 'late').length
    const excused = attendanceRecords.filter(a => a.status === 'excused').length
    const attendanceRate = totalClasses > 0 ? (present / totalClasses) * 100 : 0

    // Calcular tendencias (simplificado)
    const trends = this.calculateAttendanceTrends(attendanceRecords)

    return {
      student,
      ...(courseId && attendanceRecords.length > 0 ? {
        course: attendanceRecords[0].course
      } : {}),
      period: {
        startDate: startDate ? new Date(startDate) : new Date(0),
        endDate: endDate ? new Date(endDate) : new Date(),
        semester,
      },
      totalClasses,
      present,
      absent,
      late,
      excused,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      attendanceRecords,
      trends,
    }
  },

  /**
   * Obtiene el resumen de asistencias de un curso
   */
  async getCourseAttendanceSummary(
    courseId: string,
    date?: string,
    startDate?: string,
    endDate?: string,
    semester?: string
  ): Promise<CourseAttendanceSummary> {
    // Verificar que el curso existe
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        code: true,
      },
    })

    if (!course) {
      throw new Error('Curso no encontrado')
    }

    // Obtener estudiantes inscritos en el curso
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

    // Construir filtros
    const dateFilter: any = {}
    if (date) {
      dateFilter.equals = new Date(date)
    } else if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
    }

    // Obtener registros de asistencia
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId,
        ...(date || startDate || endDate ? { date: dateFilter } : {}),
        ...(semester && { semester }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Calcular estadísticas generales
    const totalStudents = enrolledStudents.length
    const present = attendanceRecords.filter(a => a.status === 'present').length
    const absent = attendanceRecords.filter(a => a.status === 'absent').length
    const late = attendanceRecords.filter(a => a.status === 'late').length
    const excused = attendanceRecords.filter(a => a.status === 'excused').length
    const overallAttendanceRate = totalStudents > 0 ? (present / totalStudents) * 100 : 0

    // Preparar datos de estudiantes
    const students = enrolledStudents.map(enrollment => {
      const studentAttendances = attendanceRecords.filter(a => a.studentId === enrollment.userId)
      const studentPresent = studentAttendances.filter(a => a.status === 'present').length
      const attendanceRate = studentAttendances.length > 0 ? (studentPresent / studentAttendances.length) * 100 : 0

      const latestAttendance = studentAttendances.length > 0 
        ? studentAttendances[0] 
        : null

      return {
        studentId: enrollment.userId,
        studentName: enrollment.user.name,
        status: latestAttendance?.status || 'absent',
        comments: latestAttendance?.comments || undefined,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      }
    })

    // Calcular resumen diario si hay rango de fechas
    let dailySummary = undefined
    if (startDate && endDate) {
      dailySummary = this.calculateDailySummary(attendanceRecords, new Date(startDate), new Date(endDate))
    }

    return {
      course,
      ...(date ? { date: new Date(date) } : {}),
      period: {
        startDate: startDate ? new Date(startDate) : new Date(0),
        endDate: endDate ? new Date(endDate) : new Date(),
        semester,
      },
      totalStudents,
      present,
      absent,
      late,
      excused,
      overallAttendanceRate: Math.round(overallAttendanceRate * 100) / 100,
      students,
      dailySummary,
    }
  },

  /**
   * Genera reportes estadísticos de asistencia
   */
  async getAttendanceStatistics(
    courseId?: string,
    startDate?: string,
    endDate?: string,
    semester?: string
  ): Promise<AttendanceStatistics> {
    // Construir filtros
    const whereClause: any = {}
    if (courseId) whereClause.courseId = courseId
    if (semester) whereClause.semester = semester

    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) whereClause.date.gte = new Date(startDate)
      if (endDate) whereClause.date.lte = new Date(endDate)
    }

    // Obtener todos los registros de asistencia
    const allAttendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calcular estadísticas básicas
    const totalRecords = allAttendances.length
    const presentCount = allAttendances.filter(a => a.status === 'present').length
    const absentCount = allAttendances.filter(a => a.status === 'absent').length
    const lateCount = allAttendances.filter(a => a.status === 'late').length
    const excusedCount = allAttendances.filter(a => a.status === 'excused').length
    const overallAttendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0

    // Calcular promedio diario de asistencia
    const dailyAttendance = this.calculateDailyAttendanceRate(allAttendances)
    const averageDailyAttendance = dailyAttendance.length > 0 
      ? dailyAttendance.reduce((sum, day) => sum + day.attendanceRate, 0) / dailyAttendance.length 
      : 0

    // Encontrar días con mayor ausentismo
    const peakAbsenceDays = this.findPeakAbsenceDays(allAttendances)

    // Analizar desempeño de estudiantes
    const studentPerformance = this.analyzeStudentPerformance(allAttendances)

    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      overallAttendanceRate: Math.round(overallAttendanceRate * 100) / 100,
      averageDailyAttendance: Math.round(averageDailyAttendance * 100) / 100,
      peakAbsenceDays,
      studentPerformance,
    }
  },

  /**
   * Genera un reporte completo de asistencias
   */
  async generateAttendanceReport(
    startDate: string,
    endDate: string,
    semester?: string
  ): Promise<AttendanceReport> {
    // Obtener estadísticas generales
    const statistics = await this.getAttendanceStatistics(undefined, startDate, endDate, semester)

    // Obtener todos los cursos
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
      },
    })

    // Obtener todos los estudiantes
    const students = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'student',
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    })

    // Generar reportes por curso
    const courseReports = await Promise.all(
      courses.map(async course => {
        const courseStats = await this.getAttendanceStatistics(course.id, startDate, endDate, semester)
        return {
          courseId: course.id,
          courseName: course.name,
          attendanceRate: courseStats.overallAttendanceRate,
          totalStudents: await prisma.courseStudent.count({
            where: { courseId: course.id },
          }),
        }
      })
    )

    // Generar reportes por estudiante
    const studentReports = await Promise.all(
      students.map(async student => {
        const studentSummary = await this.getStudentAttendanceSummary(
          student.id,
          undefined,
          startDate,
          endDate,
          semester
        )

        // Obtener cursos del estudiante
        const studentCourses = await prisma.courseStudent.findMany({
          where: { userId: student.id },
          include: {
            course: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        const courseAttendance = await Promise.all(
          studentCourses.map(async enrollment => {
            const courseSummary = await this.getStudentAttendanceSummary(
              student.id,
              enrollment.courseId,
              startDate,
              endDate,
              semester
            )
            return {
              courseId: enrollment.courseId,
              courseName: enrollment.course.name,
              attendanceRate: courseSummary.attendanceRate,
            }
          })
        )

        return {
          studentId: student.id,
          studentName: student.name,
          overallAttendanceRate: studentSummary.attendanceRate,
          courses: courseAttendance,
        }
      })
    )

    // Generar alertas
    const alerts = this.generateAttendanceAlerts(studentReports, courseReports)

    return {
      generatedAt: new Date(),
      period: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        semester,
      },
      summary: {
        totalClasses: statistics.totalRecords,
        totalStudents: students.length,
        overallAttendanceRate: statistics.overallAttendanceRate,
        present: statistics.presentCount,
        absent: statistics.absentCount,
        late: statistics.lateCount,
        excused: statistics.excusedCount,
      },
      courseReports,
      studentReports,
      alerts,
    }
  },

  // ==================== HELPER METHODS ====================

  /**
   * Calcula tendencias de asistencia
   */
  calculateAttendanceTrends(attendanceRecords: any[]): any {
    // Implementación simplificada - agrupar por semana
    const weeklyTrends: { [key: string]: { present: number; total: number } } = {}

    attendanceRecords.forEach(record => {
      const week = this.getWeekNumber(record.date)
      const weekKey = `Semana ${week}`

      if (!weeklyTrends[weekKey]) {
        weeklyTrends[weekKey] = { present: 0, total: 0 }
      }

      weeklyTrends[weekKey].total++
      if (record.status === 'present') {
        weeklyTrends[weekKey].present++
      }
    })

    return {
      weekly: Object.entries(weeklyTrends).map(([week, data]) => ({
        week,
        attendanceRate: Math.round((data.present / data.total) * 10000) / 100,
      })),
      monthly: [], // Implementar similarmente para meses
    }
  },

  /**
   * Calcula resumen diario de asistencias
   */
  calculateDailySummary(attendanceRecords: any[], startDate: Date, endDate: Date): any[] {
    const dailySummary: { [key: string]: { present: number; absent: number; late: number; excused: number } } = {}

    // Inicializar todos los días en el rango
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      dailySummary[dateKey] = { present: 0, absent: 0, late: 0, excused: 0 }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Contar asistencias por día
    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0]
      if (dailySummary[dateKey]) {
        dailySummary[dateKey][record.status as 'present' | 'absent' | 'late' | 'excused']++
      }
    })

    // Convertir a array con tasas de asistencia
    return Object.entries(dailySummary).map(([date, counts]) => {
      const total = counts.present + counts.absent + counts.late + counts.excused
      return {
        date: new Date(date),
        present: counts.present,
        absent: counts.absent,
        late: counts.late,
        excused: counts.excused,
        attendanceRate: total > 0 ? Math.round((counts.present / total) * 10000) / 100 : 0,
      }
    })
  },

  /**
   * Calcula tasa de asistencia diaria
   */
  calculateDailyAttendanceRate(attendanceRecords: any[]): any[] {
    const dailyRates: { [key: string]: { present: number; total: number } } = {}

    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0]
      if (!dailyRates[dateKey]) {
        dailyRates[dateKey] = { present: 0, total: 0 }
      }
      dailyRates[dateKey].total++
      if (record.status === 'present') {
        dailyRates[dateKey].present++
      }
    })

    return Object.entries(dailyRates).map(([date, data]) => ({
      date: new Date(date),
      attendanceRate: Math.round((data.present / data.total) * 10000) / 100,
    }))
  },

  /**
   * Encuentra días con mayor ausentismo
   */
  findPeakAbsenceDays(attendanceRecords: any[]): any[] {
    const dailyAbsences: { [key: string]: number } = {}

    attendanceRecords.forEach(record => {
      if (record.status === 'absent') {
        const dateKey = record.date.toISOString().split('T')[0]
        dailyAbsences[dateKey] = (dailyAbsences[dateKey] || 0) + 1
      }
    })

    return Object.entries(dailyAbsences)
      .map(([date, absenceCount]) => {
        const totalRecords = attendanceRecords.filter(r => 
          r.date.toISOString().split('T')[0] === date
        ).length
        return {
          date: new Date(date),
          absenceCount,
          absenceRate: Math.round((absenceCount / totalRecords) * 10000) / 100,
        }
      })
      .sort((a, b) => b.absenceCount - a.absenceCount)
      .slice(0, 5) // Top 5 días con mayor ausentismo
  },

  /**
   * Analiza el desempeño de estudiantes
   */
  analyzeStudentPerformance(attendanceRecords: any[]): any[] {
    const studentPerformance: { [key: string]: { present: number; total: number; records: any[] } } = {}

    // Agrupar registros por estudiante
    attendanceRecords.forEach(record => {
      if (!studentPerformance[record.studentId]) {
        studentPerformance[record.studentId] = { present: 0, total: 0, records: [] }
      }
      studentPerformance[record.studentId].total++
      studentPerformance[record.studentId].records.push(record)
      if (record.status === 'present') {
        studentPerformance[record.studentId].present++
      }
    })

    // Calcular tendencias
    return Object.entries(studentPerformance).map(([studentId, data]) => {
      const attendanceRate = Math.round((data.present / data.total) * 10000) / 100
      
      // Análisis simple de tendencia (últimas 2 semanas vs primeras 2 semanas)
      const recentRecords = data.records
        .filter(r => r.date > new Date(Date.now() - 14 * 86400000))
        .slice(0, 10)
      const olderRecords = data.records
        .filter(r => r.date <= new Date(Date.now() - 14 * 86400000))
        .slice(-10)

      const recentRate = recentRecords.length > 0 
        ? recentRecords.filter(r => r.status === 'present').length / recentRecords.length 
        : 0
      const olderRate = olderRecords.length > 0 
        ? olderRecords.filter(r => r.status === 'present').length / olderRecords.length 
        : 0

      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      if (recentRate > olderRate + 0.1) trend = 'improving'
      else if (recentRate < olderRate - 0.1) trend = 'declining'

      return {
        studentId,
        studentName: data.records[0]?.student?.name || 'Estudiante',
        attendanceRate,
        totalAbsences: data.total - data.present,
        trend,
      }
    })
  },

  /**
   * Genera alertas basadas en el análisis de asistencia
   */
  generateAttendanceAlerts(studentReports: any[], courseReports: any[]): any[] {
    const alerts: any[] = []

    // Alertas para estudiantes con baja asistencia
    studentReports.forEach(student => {
      if (student.overallAttendanceRate < 70) {
        alerts.push({
          type: 'low_attendance' as const,
          studentId: student.studentId,
          message: `${student.studentName} tiene baja asistencia (${student.overallAttendanceRate}%)`,
          severity: student.overallAttendanceRate < 50 ? 'high' : 'medium',
        })
      }
    })

    // Alertas para cursos con baja asistencia
    courseReports.forEach(course => {
      if (course.attendanceRate < 75) {
        alerts.push({
          type: 'low_attendance' as const,
          courseId: course.courseId,
          message: `Curso ${course.courseName} tiene baja asistencia (${course.attendanceRate}%)`,
          severity: course.attendanceRate < 60 ? 'high' : 'medium',
        })
      }
    })

    // Alertas por patrones de ausencia (simplificado)
    const frequentAbsences = studentReports.filter(s => s.overallAttendanceRate < 60)
    if (frequentAbsences.length > 5) {
      alerts.push({
        type: 'pattern_detected' as const,
        message: `Se detectaron ${frequentAbsences.length} estudiantes con alta tasa de ausentismo`,
        severity: 'medium' as const,
      })
    }

    return alerts
  },

  /**
   * Obtiene el número de semana del año
   */
  getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  },
}