import { prisma } from '../../config/database.js'
import { 
  CreateCourseInput, 
  UpdateCourseInput,
  CourseResponse,
  TeacherResponse,
  StudentResponse
} from './course.types.js'

export const courseService = {
  // Obtener todos los cursos (con paginación)
  async getCourses(page: number = 1, limit: number = 10): Promise<{
    courses: CourseResponse[],
    total: number,
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        skip,
        take: limit,
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
                  email: true,
                },
              },
            },
          },
        },
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where: { active: true } })
    ])

    const totalPages = Math.ceil(total / limit)

    const formattedCourses = courses.map(course => ({
      id: course.id,
      name: course.name,
      description: course.description,
      code: course.code,
      credits: course.credits,
      active: course.active,
      teachers: course.teachers.map(ct => ({
        id: ct.user.id,
        name: ct.user.name,
        email: ct.user.email,
      })),
      students: course.students.map(cs => ({
        id: cs.user.id,
        name: cs.user.name,
        email: cs.user.email,
        enrolledAt: cs.createdAt,
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }))

    return {
      courses: formattedCourses,
      total,
      totalPages
    }
  },

  // Obtener curso por ID
  async getCourseById(id: string): Promise<CourseResponse> {
    const course = await prisma.course.findUnique({
      where: { id },
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
                email: true,
              },
            },
          },
        },
      },
    })

    if (!course) {
      throw new Error('Course not found')
    }

    return {
      id: course.id,
      name: course.name,
      description: course.description,
      code: course.code,
      credits: course.credits,
      active: course.active,
      teachers: course.teachers.map(ct => ({
        id: ct.user.id,
        name: ct.user.name,
        email: ct.user.email,
      })),
      students: course.students.map(cs => ({
        id: cs.user.id,
        name: cs.user.name,
        email: cs.user.email,
        enrolledAt: cs.createdAt,
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }
  },

  // Crear nuevo curso
  async createCourse(courseData: CreateCourseInput): Promise<CourseResponse> {
    // Verificar si el código del curso ya existe
    const existingCourse = await prisma.course.findUnique({
      where: { code: courseData.code },
    })

    if (existingCourse) {
      throw new Error('Course with this code already exists')
    }

    // Verificar que todos los profesores existan
    const teachers = await prisma.user.findMany({
      where: {
        id: { in: courseData.teacherIds },
        roles: {
          some: {
            role: {
              name: 'teacher',
            },
          },
        },
      },
    })

    if (teachers.length !== courseData.teacherIds.length) {
      throw new Error('One or more teachers not found or not actually teachers')
    }

    // Crear el curso con sus profesores
    const course = await prisma.course.create({
      data: {
        name: courseData.name,
        description: courseData.description,
        code: courseData.code,
        credits: courseData.credits,
        teachers: {
          create: courseData.teacherIds.map(teacherId => ({
            user: { connect: { id: teacherId } },
          })),
        },
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
                email: true,
              },
            },
          },
        },
      },
    })

    return {
      id: course.id,
      name: course.name,
      description: course.description,
      code: course.code,
      credits: course.credits,
      active: course.active,
      teachers: course.teachers.map(ct => ({
        id: ct.user.id,
        name: ct.user.name,
        email: ct.user.email,
      })),
      students: course.students.map(cs => ({
        id: cs.user.id,
        name: cs.user.name,
        email: cs.user.email,
        enrolledAt: cs.createdAt,
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }
  },

  // Actualizar curso
  async updateCourse(id: string, courseData: UpdateCourseInput): Promise<CourseResponse> {
    // Verificar si el curso existe
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      throw new Error('Course not found')
    }

    // Verificar si el nuevo código ya existe (si se está actualizando)
    if (courseData.code && courseData.code !== existingCourse.code) {
      const codeExists = await prisma.course.findUnique({
        where: { code: courseData.code },
      })

      if (codeExists) {
        throw new Error('Course code already in use by another course')
      }
    }

    // Verificar profesores si se están actualizando
    if (courseData.teacherIds) {
      const teachers = await prisma.user.findMany({
        where: {
          id: { in: courseData.teacherIds },
          roles: {
            some: {
              role: {
                name: 'teacher',
              },
            },
          },
        },
      })

      if (teachers.length !== courseData.teacherIds.length) {
        throw new Error('One or more teachers not found or not actually teachers')
      }
    }

    // Actualizar el curso
    const course = await prisma.course.update({
      where: { id },
      data: {
        name: courseData.name,
        description: courseData.description,
        code: courseData.code,
        credits: courseData.credits,
        active: courseData.active,
        ...(courseData.teacherIds && {
          teachers: {
            deleteMany: {}, // Eliminar todas las relaciones existentes
            create: courseData.teacherIds.map(teacherId => ({
              user: { connect: { id: teacherId } },
            })),
          },
        }),
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
                email: true,
              },
            },
          },
        },
      },
    })

    return {
      id: course.id,
      name: course.name,
      description: course.description,
      code: course.code,
      credits: course.credits,
      active: course.active,
      teachers: course.teachers.map(ct => ({
        id: ct.user.id,
        name: ct.user.name,
        email: ct.user.email,
      })),
      students: course.students.map(cs => ({
        id: cs.user.id,
        name: cs.user.name,
        email: cs.user.email,
        enrolledAt: cs.createdAt,
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }
  },

  // Eliminar curso (soft delete)
  async deleteCourse(id: string): Promise<CourseResponse> {
    // Verificar si el curso existe
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      throw new Error('Course not found')
    }

    // Marcar como inactive en lugar de eliminar físicamente
    const course = await prisma.course.update({
      where: { id },
      data: { active: false },
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
                email: true,
              },
            },
          },
        },
      },
    })

    return {
      id: course.id,
      name: course.name,
      description: course.description,
      code: course.code,
      credits: course.credits,
      active: course.active,
      teachers: course.teachers.map(ct => ({
        id: ct.user.id,
        name: ct.user.name,
        email: ct.user.email,
      })),
      students: course.students.map(cs => ({
        id: cs.user.id,
        name: cs.user.name,
        email: cs.user.email,
        enrolledAt: cs.createdAt,
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }
  },

  // Inscribir estudiante en curso
  async enrollStudent(courseId: string, studentId: string): Promise<CourseResponse> {
    // Verificar si el curso existe y está activo
    const course = await prisma.course.findUnique({
      where: { id: courseId, active: true },
    })

    if (!course) {
      throw new Error('Course not found or inactive')
    }

    // Verificar si el estudiante existe y es realmente un estudiante
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
      throw new Error('Student not found or not actually a student')
    }

    // Verificar si el estudiante ya está inscrito
    const existingEnrollment = await prisma.courseStudent.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: studentId,
        },
      },
    })

    if (existingEnrollment) {
      throw new Error('Student is already enrolled in this course')
    }

    // Inscribir estudiante
    await prisma.courseStudent.create({
      data: {
        courseId,
        userId: studentId,
      },
    })

    // Devolver el curso actualizado
    return this.getCourseById(courseId)
  },

  // Desinscribir estudiante de curso
  async unenrollStudent(courseId: string, studentId: string): Promise<CourseResponse> {
    // Verificar si la inscripción existe
    const enrollment = await prisma.courseStudent.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: studentId,
        },
      },
    })

    if (!enrollment) {
      throw new Error('Student is not enrolled in this course')
    }

    // Eliminar la inscripción
    await prisma.courseStudent.delete({
      where: {
        courseId_userId: {
          courseId,
          userId: studentId,
        },
      },
    })

    // Devolver el curso actualizado
    return this.getCourseById(courseId)
  },
}