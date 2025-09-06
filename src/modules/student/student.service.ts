import { prisma } from '../../config/database.js'
import { 
  StudentAcademicInput,
  GradeInput,
  AttendanceInput,
  StudentResponse,
  StudentAcademicResponse,
  EnrolledCourseResponse,
  GradeResponse,
  AttendanceResponse,
  AcademicSummaryResponse
} from './student.types.js'

export const studentService = {
  // Obtener todos los estudiantes con información académica
  async getStudents(page: number = 1, limit: number = 10): Promise<{
    students: StudentResponse[],
    total: number,
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    
    const [students, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        where: {
          roles: {
            some: {
              role: {
                name: 'student',
              },
            },
          },
          active: true,
        },
        include: {
          academic: true,
          enrolledCourses: {
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
            orderBy: { createdAt: 'desc' },
          },
          grades: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({
        where: {
          roles: {
            some: {
              role: {
                name: 'student',
              },
            },
          },
          active: true,
        },
      })
    ])

    const totalPages = Math.ceil(total / limit)

    const formattedStudents = students.map(student => ({
      id: student.id,
      email: student.email,
      name: student.name,
      active: student.active,
      academic: student.academic ? this.formatAcademicResponse(student.academic) : null,
      courses: student.enrolledCourses.map(enrollment => ({
        id: enrollment.course.id,
        name: enrollment.course.name,
        code: enrollment.course.code,
        credits: enrollment.course.credits,
        enrolledAt: enrollment.createdAt,
        grade: student.grades
          .filter((grade: any) => grade.courseId === enrollment.course.id)
          .map((grade: any) => this.formatGradeResponse(grade))[0] || null,
      })),
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    }))

    return {
      students: formattedStudents,
      total,
      totalPages
    }
  },

  // Obtener estudiante por ID con información completa
  async getStudentById(id: string): Promise<StudentResponse> {
    const student = await prisma.user.findUnique({
      where: { 
        id,
        roles: {
          some: {
            role: {
              name: 'student',
            },
          },
        },
      },
      include: {
        academic: true,
        enrolledCourses: {
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
          orderBy: { createdAt: 'desc' },
        },
        grades: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        attendances: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    })

    if (!student) {
      throw new Error('Student not found')
    }

    return {
      id: student.id,
      email: student.email,
      name: student.name,
      active: student.active,
      academic: student.academic ? this.formatAcademicResponse(student.academic) : null,
      courses: student.enrolledCourses.map(enrollment => ({
        id: enrollment.course.id,
        name: enrollment.course.name,
        code: enrollment.course.code,
        credits: enrollment.course.credits,
        enrolledAt: enrollment.createdAt,
        grade: student.grades
          .filter((grade: any) => grade.courseId === enrollment.course.id)
          .map((grade: any) => this.formatGradeResponse(grade))[0] || null,
      })),
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    }
  },

  // Crear o actualizar información académica del estudiante
  async updateStudentAcademic(studentId: string, academicData: StudentAcademicInput): Promise<StudentAcademicResponse> {
    // Verificar que el usuario es un estudiante
    const student = await prisma.user.findUnique({
      where: { 
        id: studentId,
        roles: {
          some: {
            role: {
              name: 'student',
            },
          },
        },
      },
    })

    if (!student) {
      throw new Error('Student not found')
    }

    const academic = await prisma.studentAcademic.upsert({
      where: { studentId },
      update: academicData,
      create: {
        studentId,
        ...academicData,
      },
    })

    return this.formatAcademicResponse(academic)
  },

  // Registrar calificación de estudiante
  async recordGrade(studentId: string, gradeData: GradeInput): Promise<GradeResponse> {
    // Verificar que el estudiante existe y está inscrito en el curso
    const enrollment = await prisma.courseStudent.findUnique({
      where: {
        courseId_userId: {
          courseId: gradeData.courseId,
          userId: studentId,
        },
      },
    })

    if (!enrollment) {
      throw new Error('Student is not enrolled in this course')
    }

    // Calcular letter grade basado en el valor
    const letterGrade = this.calculateLetterGrade(gradeData.value)

    const grade = await prisma.grade.upsert({
      where: {
        studentId_courseId_semester: {
          studentId,
          courseId: gradeData.courseId,
          semester: gradeData.semester,
        },
      },
      update: {
        value: gradeData.value,
        letterGrade,
        comments: gradeData.comments,
      },
      create: {
        studentId,
        courseId: gradeData.courseId,
        value: gradeData.value,
        letterGrade,
        semester: gradeData.semester,
        comments: gradeData.comments,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    // Actualizar GPA acumulativo del estudiante
    await this.updateStudentGPA(studentId)

    return this.formatGradeResponse(grade)
  },

  // Registrar asistencia de estudiante
  async recordAttendance(studentId: string, attendanceData: AttendanceInput): Promise<AttendanceResponse> {
    // Verificar que el estudiante existe y está inscrito en el curso
    const enrollment = await prisma.courseStudent.findUnique({
      where: {
        courseId_userId: {
          courseId: attendanceData.courseId,
          userId: studentId,
        },
      },
    })

    if (!enrollment) {
      throw new Error('Student is not enrolled in this course')
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_courseId_date: {
          studentId,
          courseId: attendanceData.courseId,
          date: new Date(attendanceData.date),
        },
      },
      update: {
        status: attendanceData.status,
        comments: attendanceData.comments,
      },
      create: {
        studentId,
        courseId: attendanceData.courseId,
        date: new Date(attendanceData.date),
        status: attendanceData.status,
        comments: attendanceData.comments,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return this.formatAttendanceResponse(attendance)
  },

  // Obtener resumen académico del estudiante
  async getAcademicSummary(studentId: string): Promise<AcademicSummaryResponse> {
    const student = await this.getStudentById(studentId)
    
    if (!student.academic) {
      throw new Error('Student academic information not found')
    }

    // Calcular tasa de asistencia
    const totalClasses = await prisma.attendance.count({
      where: { studentId },
    })

    const presentClasses = await prisma.attendance.count({
      where: { 
        studentId,
        status: 'present',
      },
    })

    const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0

    // Calcular GPA del semestre actual (simplificado)
    const currentSemesterGrades = await prisma.grade.findMany({
      where: {
        studentId,
        semester: student.academic.currentSemester.toString(),
      },
      include: {
        course: {
          select: {
            credits: true,
          },
        },
      },
    })

    let semesterGPA = 0
    if (currentSemesterGrades.length > 0) {
      const totalPoints = currentSemesterGrades.reduce((sum, grade) => {
        const gradePoints = this.gradeToPoints(grade.value)
        return sum + (gradePoints * grade.course.credits)
      }, 0)

      const totalCredits = currentSemesterGrades.reduce((sum, grade) => sum + grade.course.credits, 0)
      semesterGPA = totalPoints / totalCredits
    }

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      academic: student.academic,
      currentCourses: student.courses.filter(course => !course.grade),
      completedCourses: student.courses.filter(course => course.grade),
      attendanceRate,
      semesterGPA,
      cumulativeGPA: student.academic.cumulativeGPA,
    }
  },

  // Helper methods
  formatAcademicResponse(academic: any): StudentAcademicResponse {
    return {
      id: academic.id,
      enrollmentDate: academic.enrollmentDate,
      graduationDate: academic.graduationDate,
      currentSemester: academic.currentSemester,
      status: academic.status,
      cumulativeGPA: academic.cumulativeGPA,
      totalCredits: academic.totalCredits,
      createdAt: academic.createdAt,
      updatedAt: academic.updatedAt,
    }
  },

  formatGradeResponse(grade: any): GradeResponse {
    return {
      id: grade.id,
      value: grade.value,
      letterGrade: grade.letterGrade,
      semester: grade.semester,
      comments: grade.comments,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      course: {
        id: grade.course.id,
        name: grade.course.name,
        code: grade.course.code,
      },
    }
  },

  formatAttendanceResponse(attendance: any): AttendanceResponse {
    return {
      id: attendance.id,
      date: attendance.date,
      status: attendance.status,
      comments: attendance.comments,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
      course: {
        id: attendance.course.id,
        name: attendance.course.name,
        code: attendance.course.code,
      },
    }
  },

  calculateLetterGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  },

  gradeToPoints(score: number): number {
    if (score >= 90) return 4.0
    if (score >= 80) return 3.0
    if (score >= 70) return 2.0
    if (score >= 60) return 1.0
    return 0.0
  },

  async updateStudentGPA(studentId: string): Promise<void> {
    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            credits: true,
          },
        },
      },
    })

    if (grades.length === 0) return

    const totalPoints = grades.reduce((sum, grade) => {
      const gradePoints = this.gradeToPoints(grade.value)
      return sum + (gradePoints * grade.course.credits)
    }, 0)

    const totalCredits = grades.reduce((sum, grade) => sum + grade.course.credits, 0)
    const cumulativeGPA = totalPoints / totalCredits

    await prisma.studentAcademic.update({
      where: { studentId },
      data: {
        cumulativeGPA,
        totalCredits,
      },
    })
  },
}