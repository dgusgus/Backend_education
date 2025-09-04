export interface Permission {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  createdAt: Date
  permission: Permission
}

// Permisos predefinidos del sistema
export const SYSTEM_PERMISSIONS = {
  // Permisos de usuarios
  USER_READ: 'USER_READ',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  
  // Permisos de roles
  ROLE_READ: 'ROLE_READ',
  ROLE_MANAGE: 'ROLE_MANAGE',
  
  // Permisos de cursos (para etapas futuras)
  COURSE_READ: 'COURSE_READ',
  COURSE_CREATE: 'COURSE_CREATE',
  COURSE_UPDATE: 'COURSE_UPDATE',
  COURSE_DELETE: 'COURSE_DELETE',
  
  // Permisos de estudiantes (para etapas futuras)
  STUDENT_READ: 'STUDENT_READ',
  STUDENT_MANAGE: 'STUDENT_MANAGE',
} as const

export type PermissionName = keyof typeof SYSTEM_PERMISSIONS