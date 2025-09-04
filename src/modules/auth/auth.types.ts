import { z } from 'zod'

// Esquemas de validación Zod
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Tipos TypeScript inferidos de los esquemas
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// Tipos de respuesta
export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    createdAt: Date
  }
  token: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  createdAt: Date
}