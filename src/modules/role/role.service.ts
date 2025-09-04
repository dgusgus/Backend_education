import { prisma } from '../../config/database.js'
import { Role, UserRole, RoleName } from './role.types.js'

export const roleService = {
  // Obtener todos los roles
  async getRoles(): Promise<Role[]> {
    return prisma.role.findMany({
      orderBy: { name: 'asc' },
    })
  },

  // Obtener rol por nombre
  async getRoleByName(name: string): Promise<Role | null> {
    return prisma.role.findUnique({
      where: { name },
    })
  },

  // Obtener roles de un usuario
  async getUserRoles(userId: string): Promise<UserRole[]> {
    return prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })
  },

  // Verificar si usuario tiene un rol específico
  async userHasRole(userId: string, roleName: RoleName): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: { name: roleName },
      },
      include: { role: true },
    })

    return !!userRole
  },

  // Verificar si usuario tiene al menos uno de los roles especificados
  async userHasAnyRole(userId: string, roleNames: RoleName[]): Promise<boolean> {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        role: { name: { in: roleNames } },
      },
      include: { role: true },
    })

    return userRoles.length > 0
  },

  // Asignar rol a usuario
  async assignRoleToUser(userId: string, roleName: RoleName): Promise<UserRole> {
    const role = await this.getRoleByName(roleName)
    if (!role) {
      throw new Error(`Role ${roleName} not found`)
    }

    return prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
      include: { role: true },
    })
  },

  // Remover rol de usuario
  async removeRoleFromUser(userId: string, roleName: RoleName): Promise<void> {
    const role = await this.getRoleByName(roleName)
    if (!role) {
      throw new Error(`Role ${roleName} not found`)
    }

    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    })
  },
}