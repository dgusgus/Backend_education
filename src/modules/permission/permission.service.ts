import { prisma } from '../../config/database.js'
import { Permission, RolePermission, PermissionName, SYSTEM_PERMISSIONS } from './permission.types.js'

export const permissionService = {
  // Obtener todos los permisos
  async getPermissions(): Promise<Permission[]> {
    return prisma.permission.findMany({
      orderBy: { name: 'asc' },
    })
  },

  // Obtener permiso por nombre
  async getPermissionByName(name: string): Promise<Permission | null> {
    return prisma.permission.findUnique({
      where: { name },
    })
  },

  // Obtener permisos de un rol
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    })
  },

  // Verificar si rol tiene un permiso específico
  async roleHasPermission(roleId: string, permissionName: PermissionName): Promise<boolean> {
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId,
        permission: { name: permissionName },
      },
      include: { permission: true },
    })

    return !!rolePermission
  },

  // Verificar si usuario tiene un permiso específico
  async userHasPermission(userId: string, permissionName: PermissionName): Promise<boolean> {
    const userPermission = await prisma.rolePermission.findFirst({
      where: {
        role: {
          users: {
            some: { userId }
          }
        },
        permission: { name: permissionName },
      },
      include: { permission: true },
    })

    return !!userPermission
  },

  // Verificar si usuario tiene al menos uno de los permisos especificados
  async userHasAnyPermission(userId: string, permissionNames: PermissionName[]): Promise<boolean> {
    const userPermissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          users: {
            some: { userId }
          }
        },
        permission: { name: { in: permissionNames } },
      },
      include: { permission: true },
    })

    return userPermissions.length > 0
  },

  // Asignar permiso a rol
  async assignPermissionToRole(roleId: string, permissionName: PermissionName): Promise<RolePermission> {
    const permission = await this.getPermissionByName(permissionName)
    if (!permission) {
      throw new Error(`Permission ${permissionName} not found`)
    }

    return prisma.rolePermission.create({
      data: {
        roleId,
        permissionId: permission.id,
      },
      include: { permission: true },
    })
  },

  // Remover permiso de rol
  async removePermissionFromRole(roleId: string, permissionName: PermissionName): Promise<void> {
    const permission = await this.getPermissionByName(permissionName)
    if (!permission) {
      throw new Error(`Permission ${permissionName} not found`)
    }

    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: permission.id,
      },
    })
  },

  // Obtener todos los permisos de un usuario
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          users: {
            some: { userId }
          }
        },
      },
      include: { permission: true },
      distinct: ['permissionId'],
    })

    return rolePermissions.map(rp => rp.permission)
  },
}