import { prisma } from '../../config/database.js'
import {
    TeacherCourseAssignmentInput,
    GradeAssignmentInput,
    AttendanceRecordInput,
    TeacherCourseResponse,
    TeacherDashboardResponse,
    StudentGradeResponse,
    CourseAttendanceSummary
} from './teacher.types.js'

/**
 * Servicio para la gestión de profesores
 * Contiene toda la lógica de negocio relacionada con las operaciones docentes
 */
export const teacherService = {
    /**
     * Obtiene todos los cursos asignados a un profesor
     * @param teacherId ID del profesor
     * @returns Lista de cursos con información detallada
     */
    async getTeacherCourses(teacherId: string): Promise<TeacherCourseResponse[]> {
        // Verificar que el usuario existe y es un profesor
        const teacher = await prisma.user.findUnique({
            where: {
                id: teacherId,
                roles: {
                    some: {
                        role: {
                            name: 'teacher',
                        },
                    },
                },
            },
        })

        if (!teacher) {
            throw new Error('Profesor no encontrado o no tiene permisos de docente')
        }

        // Obtener cursos asignados al profesor con información de estudiantes
        const courses = await prisma.course.findMany({
            where: {
                teachers: {
                    some: {
                        userId: teacherId,
                    },
                },
                active: true,
            },
            include: {
                teachers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                students: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                grades: {
                    where: {
                        semester: '2024-1', // Semestre actual (debería ser dinámico)
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Formatear la respuesta para el cliente
        return courses.map(course => ({
            id: course.id,
            name: course.name,
            code: course.code,
            description: course.description,
            credits: course.credits,
            active: course.active,
            enrolledStudents: course.students.length,
            currentSemester: '2024-1', // Esto debería venir de configuración
        }))
    },

    /**
     * Obtiene el dashboard del profesor con información consolidada
     * @param teacherId ID del profesor
     * @returns Dashboard con métricas, actividades recientes y deadlines
     */
    async getTeacherDashboard(teacherId: string): Promise<TeacherDashboardResponse> {
        // Verificar que el usuario es un profesor
        const teacher = await prisma.user.findUnique({
            where: {
                id: teacherId,
                roles: {
                    some: {
                        role: {
                            name: 'teacher',
                        },
                    },
                },
            },
            include: {
                taughtCourses: {
                    include: {
                        course: {
                            include: {
                                students: true,
                                grades: true,
                            },
                        },
                    },
                },
            },
        })

        if (!teacher) {
            throw new Error('Profesor no encontrado')
        }

        // Calcular métricas del dashboard
        const totalCourses = teacher.taughtCourses.length
        const activeCourses = teacher.taughtCourses.filter(tc => tc.course.active).length

        // Obtener actividad reciente (últimas 10 actividades)
        const recentActivities = await this.getRecentActivities(teacherId)

        // Obtener deadlines próximos (próximos 7 días)
        const upcomingDeadlines = await this.getUpcomingDeadlines(teacherId)

        // Calcular métricas de desempeño
        const performanceMetrics = await this.calculatePerformanceMetrics(teacherId)

        return {
            teacher: {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                totalCourses,
                activeCourses,
            },
            recentActivity: recentActivities,
            upcomingDeadlines: upcomingDeadlines,
            performanceMetrics: performanceMetrics,
        }
    },

    /**
     * Registra una calificación para un estudiante
     * @param gradeData Datos de la calificación
     * @returns Calificación registrada
     */
    async recordGrade(teacherId: string, gradeData: Omit<GradeAssignmentInput, 'teacherId'>): Promise<any> {
        // Validar que el profesor tiene acceso al curso
        const courseAssignment = await prisma.courseTeacher.findFirst({
            where: {
                userId: teacherId,
                courseId: gradeData.courseId,
            },
        })

        if (!courseAssignment) {
            throw new Error('El profesor no está asignado a este curso')
        }

        // Validar que el estudiante está inscrito en el curso
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

        // Calcular la letra de calificación basada en el valor numérico
        const letterGrade = this.calculateLetterGrade(gradeData.value)

        // Registrar la calificación
        const grade = await prisma.grade.upsert({
            where: {
                studentId_courseId_semester: {
                    studentId: gradeData.studentId,
                    courseId: gradeData.courseId,
                    semester: gradeData.semester,
                },
            },
            update: {
                value: gradeData.value,
                letterGrade: letterGrade,
                comments: gradeData.comments,
            },
            create: {
                studentId: gradeData.studentId,
                courseId: gradeData.courseId,
                value: gradeData.value,
                letterGrade: letterGrade,
                semester: gradeData.semester,
                comments: gradeData.comments,
            },
            include: {
                course: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                student: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        })

        // Actualizar el GPA del estudiante
        await this.updateStudentGPA(gradeData.studentId)

        return grade
    },

    /**
     * Registra la asistencia de un estudiante
     * @param attendanceData Datos de asistencia
     * @returns Asistencia registrada
     */
    async recordAttendance(teacherId: string, attendanceData: Omit<AttendanceRecordInput, 'teacherId'>): Promise<any> {
        // Validar que el profesor tiene acceso al curso
        const courseAssignment = await prisma.courseTeacher.findFirst({
            where: {
                userId: teacherId,
                courseId: attendanceData.courseId,
            },
        })

        if (!courseAssignment) {
            throw new Error('El profesor no está asignado a este curso')
        }

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

        // Registrar la asistencia
        const attendance = await prisma.attendance.upsert({
            where: {
                studentId_courseId_date: {
                    studentId: attendanceData.studentId,
                    courseId: attendanceData.courseId,
                    date: new Date(attendanceData.date),
                },
            },
            update: {
                status: attendanceData.status,
                comments: attendanceData.comments,
            },
            create: {
                studentId: attendanceData.studentId,
                courseId: attendanceData.courseId,
                date: new Date(attendanceData.date),
                status: attendanceData.status,
                comments: attendanceData.comments,
            },
            include: {
                course: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                student: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return attendance
    },

    /**
     * Obtiene el resumen de calificaciones para un curso
     * @param courseId ID del curso
     * @param teacherId ID del profesor
     * @returns Resumen de calificaciones del curso
     */
    async getCourseGrades(courseId: string, teacherId: string): Promise<StudentGradeResponse[]> {
        // Validar que el profesor tiene acceso al curso
        const courseAssignment = await prisma.courseTeacher.findFirst({
            where: {
                userId: teacherId,
                courseId: courseId,
            },
        })

        if (!courseAssignment) {
            throw new Error('El profesor no está asignado a este curso')
        }

        // Obtener estudiantes del curso con sus calificaciones
        const courseWithGrades = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                students: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                grades: {
                    where: {
                        semester: '2024-1', // Semestre actual
                    },
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        })

        if (!courseWithGrades) {
            throw new Error('Curso no encontrado')
        }

        // Procesar y formatear los datos para la respuesta
        return courseWithGrades.students.map(student => {
            const studentGrades = courseWithGrades.grades.filter(grade => grade.studentId === student.userId)

            const grades = studentGrades.map(grade => ({
                courseId: courseWithGrades.id,
                courseName: courseWithGrades.name,
                value: grade.value,
                letterGrade: grade.letterGrade || this.calculateLetterGrade(grade.value),
                semester: grade.semester,
                date: grade.createdAt,
            }))

            const averageGrade = grades.length > 0
                ? grades.reduce((sum, grade) => sum + grade.value, 0) / grades.length
                : 0

            return {
                studentId: student.userId,
                studentName: student.user.name,
                studentEmail: student.user.email,
                grades: grades,
                averageGrade: averageGrade,
            }
        })
    },

    /**
     * Obtiene el resumen de asistencia para un curso
     * @param courseId ID del curso
     * @param teacherId ID del profesor
     * @returns Resumen de asistencia del curso
     */
    async getCourseAttendance(courseId: string, teacherId: string): Promise<CourseAttendanceSummary> {
        // Validar que el profesor tiene acceso al curso
        const courseAssignment = await prisma.courseTeacher.findFirst({
            where: {
                userId: teacherId,
                courseId: courseId,
            },
        })

        if (!courseAssignment) {
            throw new Error('El profesor no está asignado a este curso')
        }

        // Obtener datos del curso y asistencia
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                students: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                attendances: {
                    where: {
                        date: {
                            gte: new Date(new Date().getFullYear(), 0, 1), // Desde inicio del año
                        },
                    },
                },
            },
        })

        if (!course) {
            throw new Error('Curso no encontrado')
        }

        // Calcular métricas de asistencia
        const totalClasses = new Set(course.attendances.map(a => a.date.toDateString())).size
        const presentCount = course.attendances.filter(a => a.status === 'present').length
        const absentCount = course.attendances.filter(a => a.status === 'absent').length
        const lateCount = course.attendances.filter(a => a.status === 'late').length
        const attendanceRate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0

        // Calcular asistencia por estudiante
        const studentAttendance = course.students.map(student => {
            const studentAttendances = course.attendances.filter(a => a.studentId === student.userId)
            const studentPresent = studentAttendances.filter(a => a.status === 'present').length
            const studentRate = totalClasses > 0 ? (studentPresent / totalClasses) * 100 : 0
            const lastAttendance = studentAttendances.length > 0
                ? studentAttendances.reduce((latest, current) =>
                    current.date > latest.date ? current : latest
                ).date
                : null

            return {
                studentId: student.userId,
                studentName: student.user.name,
                attendanceRate: studentRate,
                lastAttendance: lastAttendance,
            }
        })

        return {
            courseId: course.id,
            courseName: course.name,
            totalClasses,
            presentCount,
            absentCount,
            lateCount,
            attendanceRate,
            students: studentAttendance,
        }
    },

    // ==================== HELPER METHODS ====================

    /**
     * Calcula la letra de calificación basada en el puntaje numérico
     * @param score Puntaje numérico (0-100)
     * @returns Letra de calificación (A-F)
     */
    calculateLetterGrade(score: number): string {
        if (score >= 90) return 'A'
        if (score >= 80) return 'B'
        if (score >= 70) return 'C'
        if (score >= 60) return 'D'
        return 'F'
    },

    /**
     * Actualiza el GPA acumulativo de un estudiante
     * @param studentId ID del estudiante
     */
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

    /**
     * Convierte calificación numérica a puntos (0-4 scale)
     * @param score Puntaje numérico (0-100)
     * @returns Puntos (0.0-4.0)
     */
    gradeToPoints(score: number): number {
        if (score >= 90) return 4.0
        if (score >= 80) return 3.0
        if (score >= 70) return 2.0
        if (score >= 60) return 1.0
        return 0.0
    },

    /**
     * Obtiene actividades recientes del profesor
     * @param teacherId ID del profesor
     * @returns Lista de actividades recientes
     */
    async getRecentActivities(teacherId: string): Promise<any[]> {
        // Implementación simplificada - en producción debería ser más compleja
        return [
            {
                type: 'grade' as const,
                description: 'Calificó el examen parcial',
                date: new Date(),
                course: 'Matemáticas Básicas',
            },
            {
                type: 'attendance' as const,
                description: 'Registró asistencia',
                date: new Date(Date.now() - 86400000), // Hace 1 día
                course: 'Física Avanzada',
            },
        ]
    },

    /**
     * Obtiene deadlines próximos para el profesor
     * @param teacherId ID del profesor
     * @returns Lista de deadlines próximos
     */
    async getUpcomingDeadlines(teacherId: string): Promise<any[]> {
        // Implementación simplificada
        return [
            {
                title: 'Entrega de proyectos finales',
                course: 'Matemáticas Básicas',
                dueDate: new Date(Date.now() + 604800000), // En 7 días
                type: 'assignment' as const,
            },
            {
                title: 'Examen parcial',
                course: 'Física Avanzada',
                dueDate: new Date(Date.now() + 259200000), // En 3 días
                type: 'exam' as const,
            },
        ]
    },

    /**
     * Calcula métricas de desempeño para el dashboard
     * @param teacherId ID del profesor
     * @returns Métricas de desempeño
     */
    async calculatePerformanceMetrics(teacherId: string): Promise<any> {
        // Implementación simplificada
        const courses = await prisma.course.findMany({
            where: {
                teachers: {
                    some: {
                        userId: teacherId,
                    },
                },
            },
            include: {
                grades: true,
                attendances: true,
                students: true,
            },
        })

        const totalStudents = courses.reduce((sum, course) => sum + course.students.length, 0)

        const allGrades = courses.flatMap(course => course.grades)
        const averageGrade = allGrades.length > 0
            ? allGrades.reduce((sum, grade) => sum + grade.value, 0) / allGrades.length
            : 0

        const allAttendances = courses.flatMap(course => course.attendances)
        const presentAttendances = allAttendances.filter(a => a.status === 'present').length
        const attendanceRate = allAttendances.length > 0
            ? (presentAttendances / allAttendances.length) * 100
            : 0

        return {
            averageGrade: Math.round(averageGrade * 10) / 10,
            attendanceRate: Math.round(attendanceRate * 10) / 10,
            totalStudents,
        }
    },
}