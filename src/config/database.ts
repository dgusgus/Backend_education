import { PrismaClient } from '@prisma/client'

// Singleton pattern para Prisma Client
// Evita múltiples instancias en desarrollo (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Función para conectar a la base de datos
export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

// Función para desconectar de la base de datos
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('💤 Database disconnected')
  } catch (error) {
    console.error('❌ Error disconnecting database:', error)
  }
}