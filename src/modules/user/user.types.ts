import { z } from 'zod'

// Esquemas de validación Zod
export const createUserSchema = z.object({
  email: z.email({ message: "Formato de correo inválido" }),
  password: z.string().min(6, 'Password mus t be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export const updateUserSchema = z.object({
  email: z.email('Invalid email format').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  active: z.boolean().optional(),
}) 

export const userIdSchema = z.object({
  id: z.cuid2({ message: "Formato de ID inválido" }),
})

export const userRoleSchema = z.object({
  roleName: z.enum(['admin', 'teacher', 'student'], { 
    message: 'El rol debe ser uno de: admin, teacher, student' 
  })
})

// Tipos TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserIdParams = z.infer<typeof userIdSchema>
export type UserRoleInput = z.infer<typeof userRoleSchema>

// Tipos de respuesta
export interface UserResponse {
  id: string
  email: string
  name: string
  active: boolean
  roles: string[]
  createdAt: Date
  updatedAt: Date
}

export interface UsersListResponse {
  success: boolean
  data: UserResponse[]
  count: number
  pagination?: {
    page: number
    limit: number
    totalPages: number
  }
}