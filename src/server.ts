import { app } from './app.js'
import { env, validateEnv } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'

// Función principal para iniciar el servidor
async function startServer() {
  try {
    // 1. Validar variables de entorno
    validateEnv()
    
    // 2. Conectar a la base de datos
    await connectDatabase()
    
    // 3. Iniciar servidor HTTP
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`)
      console.log(`📊 Health check: http://localhost:${env.PORT}/health`)
      
      if (env.NODE_ENV === 'development') {
        console.log(`🎨 Prisma Studio: http://localhost:5555`)
      }
    })

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)
      
      server.close(async () => {
        await disconnectDatabase()
        console.log('👋 Server closed')
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
    
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Iniciar aplicación
startServer()