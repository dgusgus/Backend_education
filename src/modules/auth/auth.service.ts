import { prisma } from '../../config/database.js'
import { hash } from '../../utils/hash.js'
import { jwtUtils } from '../../utils/jwt.js'
import { 
  RegisterInput, 
  LoginInput, 
  AuthResponse,
  AuthUser 
} from './auth.types.js'

export const authService = {
  // Registrar nuevo usuario
  async register(userData: RegisterInput): Promise<AuthResponse> {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hashear la contraseña
    const hashedPassword = await hash.make(userData.password)

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    // Generar token JWT
    const token = jwtUtils.sign({
      userId: user.id,
      email: user.email,
    })

    return {
      user,
      token,
    }
  },

  // Login de usuario
  async login(credentials: LoginInput): Promise<AuthResponse> {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verificar contraseña
    const isValidPassword = await hash.compare(credentials.password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    // Verificar si el usuario está activo
    if (!user.active) {
      throw new Error('Account is deactivated')
    }

    // Generar token JWT
    const token = jwtUtils.sign({
      userId: user.id,
      email: user.email,
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    }
  },

  // Obtener perfil de usuario (para uso futuro)
  async getProfile(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  },
}