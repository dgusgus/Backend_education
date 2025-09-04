export interface Role {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserRole {
  id: string
  userId: string
  roleId: string
  createdAt: Date
  role: Role
}

export type RoleName = 'admin' | 'teacher' | 'student'