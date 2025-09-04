import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'edu-backend-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JwtPayload {
  userId: string
  email: string
}

export const jwtUtils = {
  // Generar un token JWT
  sign: (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions)
  },

  // Verificar y decodificar un token JWT
  verify: (token: string): JwtPayload => {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  },

  // Extraer token del header Authorization
  extractToken: (authHeader: string | undefined): string => {
    if (!authHeader) {
      throw new Error('Authorization header is required')
    }

    const [bearer, token] = authHeader.split(' ')

    if (bearer !== 'Bearer' || !token) {
      throw new Error('Invalid authorization format. Use: Bearer <token>')
    }

    return token
  },
}