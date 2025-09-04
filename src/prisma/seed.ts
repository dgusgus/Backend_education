import { PrismaClient } from '@prisma/client'
import { hash } from '../utils/hash.js'
import { SYSTEM_PERMISSIONS } from '../modules/permission/permission.types.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')
  
  // Crear permisos del sistema
  const permissions = await Promise.all([
    // Permisos de usuarios
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.USER_READ },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.USER_READ,
        description: 'Read user information',
      },
    }),
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.USER_CREATE },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.USER_CREATE,
        description: 'Create new users',
      },
    }),
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.USER_UPDATE },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.USER_UPDATE,
        description: 'Update user information',
      },
    }),
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.USER_DELETE },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.USER_DELETE,
        description: 'Delete users (soft delete)',
      },
    }),

    // Permisos de roles
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.ROLE_READ },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.ROLE_READ,
        description: 'Read role information',
      },
    }),
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.ROLE_MANAGE },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.ROLE_MANAGE,
        description: 'Manage roles and permissions',
      },
    }),

    // Permisos de cursos (para etapas futuras)
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.COURSE_READ },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.COURSE_READ,
        description: 'Read course information',
      },
    }),
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.COURSE_CREATE },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.COURSE_CREATE,
        description: 'Create new courses',
      },
    }),
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.COURSE_UPDATE },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.COURSE_UPDATE,
        description: 'Update course information',
      },
    }),
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.COURSE_DELETE },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.COURSE_DELETE,
        description: 'Delete courses',
      },
    }),

    // Permisos de estudiantes (para etapas futuras)
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.STUDENT_READ },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.STUDENT_READ,
        description: 'Read student information',
      },
    }),
    prisma.permission.upsert({
      where: { name: SYSTEM_PERMISSIONS.STUDENT_MANAGE },
      update: {},
      create: {
        name: SYSTEM_PERMISSIONS.STUDENT_MANAGE,
        description: 'Manage students',
      },
    }),
  ])

  console.log('✅ Permissions created:', permissions.map(p => p.name))

  // Crear roles por defecto
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator with full access',
      },
    }),
    prisma.role.upsert({
      where: { name: 'teacher' },
      update: {},
      create: {
        name: 'teacher',
        description: 'Teacher with limited administrative access',
      },
    }),
    prisma.role.upsert({
      where: { name: 'student' },
      update: {},
      create: {
        name: 'student',
        description: 'Student with basic access',
      },
    }),
  ])

  console.log('✅ Roles created:', roles.map(r => r.name))

  // Asignar permisos al rol admin (todos los permisos)
  const adminRole = roles.find(r => r.name === 'admin')!
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    })
  }
  console.log('✅ All permissions assigned to admin role')

  // Asignar permisos al rol teacher
  const teacherRole = roles.find(r => r.name === 'teacher')!
  const teacherPermissions = [
    SYSTEM_PERMISSIONS.USER_READ,
    SYSTEM_PERMISSIONS.COURSE_READ,
    SYSTEM_PERMISSIONS.COURSE_CREATE,
    SYSTEM_PERMISSIONS.COURSE_UPDATE,
    SYSTEM_PERMISSIONS.STUDENT_READ,
    SYSTEM_PERMISSIONS.STUDENT_MANAGE,
  ]

  for (const permName of teacherPermissions) {
    const permission = permissions.find(p => p.name === permName)!
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: teacherRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: teacherRole.id,
        permissionId: permission.id,
      },
    })
  }
  console.log('✅ Teacher permissions assigned')

  // Asignar permisos al rol student (solo lectura básica)
  const studentRole = roles.find(r => r.name === 'student')!
  const studentPermissions = [
    SYSTEM_PERMISSIONS.COURSE_READ,
  ]

  for (const permName of studentPermissions) {
    const permission = permissions.find(p => p.name === permName)!
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: studentRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: studentRole.id,
        permissionId: permission.id,
      },
    })
  }
  console.log('✅ Student permissions assigned')

  // Crear usuario admin por defecto
  const hashedPassword = await hash.make('admin123')
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@edu.com' },
    update: {},
    create: {
      email: 'admin@edu.com',
      password: hashedPassword,
      name: 'Administrador',
    },
  })
  
  console.log(`✅ Admin user created: ${adminUser.email}`)

  // Asignar rol admin al usuario administrador
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  })

  console.log('✅ Admin role assigned to admin user')

  // Crear usuario teacher de prueba
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@edu.com' },
    update: {},
    create: {
      email: 'teacher@edu.com',
      password: await hash.make('teacher123'),
      name: 'Profesor Demo',
    },
  })

  // Asignar rol teacher
  await prisma.userRole.create({
    data: {
      userId: teacherUser.id,
      roleId: teacherRole.id,
    },
  })

  console.log(`✅ Teacher user created: ${teacherUser.email}`)

  // Crear usuario student de prueba
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@edu.com' },
    update: {},
    create: {
      email: 'student@edu.com',
      password: await hash.make('student123'),
      name: 'Estudiante Demo',
    },
  })

  // Asignar rol student
  await prisma.userRole.create({
    data: {
      userId: studentUser.id,
      roleId: studentRole.id,
    },
  })

  console.log(`✅ Student user created: ${studentUser.email}`)
  
  console.log('📝 Default passwords: admin123, teacher123, student123')
  console.log('🎉 Seed completed!')


  // ... código existente de seed ...

  // Crear cursos de ejemplo
  const courses = await Promise.all([
    prisma.course.upsert({
      where: { code: 'MATH101' },
      update: {},
      create: {
        name: 'Matemáticas Básicas',
        description: 'Curso introductorio de matemáticas',
        code: 'MATH101',
        credits: 4,
        teachers: {
          create: {
            user: { connect: { id: teacherUser.id } },
          },
        },
      },
    }),
    prisma.course.upsert({
      where: { code: 'PHYS201' },
      update: {},
      create: {
        name: 'Física Avanzada',
        description: 'Curso avanzado de física teórica',
        code: 'PHYS201',
        credits: 5,
        teachers: {
          create: {
            user: { connect: { id: teacherUser.id } },
          },
        },
      },
    }),
  ])

  console.log('✅ Courses created:', courses.map(c => c.code))

  // Inscribir estudiante en cursos
  for (const course of courses) {
    await prisma.courseStudent.create({
      data: {
        courseId: course.id,
        userId: studentUser.id,
      },
    })
  }

  console.log('✅ Student enrolled in courses')

  // ... resto del código existente ...
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })