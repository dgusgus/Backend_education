import 'dotenv/config'

// Configuración centralizada de variables de entorno
export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'edu-backend-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
} as const

// Validación de variables requeridas
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'] as const

export function validateEnv() {
  const missingVars = requiredEnvVars.filter(
    (key) => !process.env[key] || process.env[key]!.trim() === ''
  )

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.error('\n💡 Check your .env file or environment configuration')
    process.exit(1)
  }

  console.log(`✅ Environment: ${env.NODE_ENV}`)
  console.log(`✅ Port: ${env.PORT}`)
}