import { prisma } from '../../config/database.js'
import { hash } from '../../utils/hash.js'
import { 
  CreateUserInput, 
  UpdateUserInput, 
  UserResponse 
} from './user.types.js'
import { roleService } from '../role/role.service.js'
import { RoleName } from '../role/role.types.js'

export const userService = {
  // Obtener todos los usuarios (con paginación y roles)
  async getUsers(page: number = 1, limit: number = 10): Promise<{
    users: UserResponse[],
    total: number,
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { active: true } })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      users: users.map(user => ({
        ...user,
        roles: user.roles.map(userRole => userRole.role.name),
      })),
      total,
      totalPages
    }
  },

  // Obtener usuario por ID (con roles)
  async getUserById(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      ...user,
      roles: user.roles.map(userRole => userRole.role.name),
    }
  },

  // Crear nuevo usuario con rol por defecto (student)
  async createUser(userData: CreateUserInput): Promise<UserResponse> {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hashear la contraseña
    const hashedPassword = await hash.make(userData.password)

    // Crear el usuario con rol de estudiante por defecto
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        roles: {
          create: {
            role: {
              connect: {
                name: 'student' // Rol por defecto
              }
            }
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    return {
      ...user,
      roles: user.roles.map(userRole => userRole.role.name),
    }
  },

  // Actualizar usuario
  async updateUser(id: string, userData: UpdateUserInput): Promise<UserResponse> {
    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // Verificar si el nuevo email ya existe (si se está actualizando)
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (emailExists) {
        throw new Error('Email already in use by another user')
      }
    }

    // Actualizar el usuario
    const user = await prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    return {
      ...user,
      roles: user.roles.map(userRole => userRole.role.name),
    }
  },

  // Eliminar usuario (soft delete)
  async deleteUser(id: string): Promise<UserResponse> {
    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // Marcar como inactive en lugar de eliminar físicamente
    const user = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    return {
      ...user,
      roles: user.roles.map(userRole => userRole.role.name),
    }
  },

  // Asignar rol a usuario
  async assignRoleToUser(userId: string, roleName: RoleName): Promise<UserResponse> {
    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verificar si el rol existe
    const role = await roleService.getRoleByName(roleName)
    if (!role) {
      throw new Error(`Role ${roleName} not found`)
    }

    // Verificar si el usuario ya tiene el rol
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    })

    if (existingUserRole) {
      throw new Error(`User already has the role: ${roleName}`)
    }

    // Asignar el rol al usuario
    await prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    })

    // Devolver el usuario actualizado
    return this.getUserById(userId)
  },

  // Remover rol de usuario
  async removeRoleFromUser(userId: string, roleName: RoleName): Promise<UserResponse> {
    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verificar si el rol existe
    const role = await roleService.getRoleByName(roleName)
    if (!role) {
      throw new Error(`Role ${roleName} not found`)
    }

    // Verificar si el usuario tiene el rol
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    })

    if (!existingUserRole) {
      throw new Error(`User does not have the role: ${roleName}`)
    }

    // Remover el rol del usuario
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    })

    // Devolver el usuario actualizado
    return this.getUserById(userId)
  },

  // Obtener roles de un usuario
  async getUserRoles(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user.roles.map(userRole => userRole.role.name)
  },

  // Verificar si usuario tiene un rol específico
  async userHasRole(userId: string, roleName: RoleName): Promise<boolean> {
    const roles = await this.getUserRoles(userId)
    return roles.includes(roleName)
  },
}