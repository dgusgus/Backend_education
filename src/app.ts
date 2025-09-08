import express, { Express } from 'express'
import cors from 'cors'
import { prisma } from './config/database.js'
//? fase 2
import { authenticateToken, AuthRequest } from './middleware/auth.js'
//? fase 3
import { authRoutes } from './modules/auth/auth.routes.js'
//? fase 4 User crud
import { userRoutes } from './modules/user/user.routes.js'
//? fase 7 Course CRUD
import { courseRoutes } from './modules/course/course.routes.js'
//? fase 8 Role & Permission
import { roleRoutes } from './modules/role/role.routes.js'
import { permissionRoutes } from './modules/permission/permission.routes.js'
//? fase 9 student
import { studentRoutes } from './modules/student/student.routes.js'
//? fase 10 Teacher Module
import { teacherRoutes } from './modules/teacher/teacher.routes.js'
//? fase 11 Grade Module
import { gradeRoutes } from './modules/grade/grade.routes.js'
//? fase 12 Attendance Module
import { attendanceRoutes } from './modules/attendance/attendance.routes.js'



// Crear aplicación Express
export const app: Express = express()

// Middlewares globales
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware para logs básicos en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend Professional API - Unidad Educativa',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
  })
})
// solo para testing
import { jwtUtils } from '../src/utils/jwt.js'
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Token hardcodeado para testing (usar el ID del usuario admin creado en seed)
    const testPayload = {
      userId: 'cmf1ui06a0000oe7cxqbxjtny', // Reemplazar con ID real
      email: 'admin@edu.com',
    }
    const token = jwtUtils.sign(testPayload)
    res.json({
      token: token,
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
})

//? fase 2
// Ruta protegida de ejemplo (para testing)
app.get('/private', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    message: '🔐 Access granted to protected route',
    user: req.user,
    timestamp: new Date().toISOString(),
  })
})

//? fase 3
app.use('/auth', authRoutes)
//? fase 4 User CRUD
app.use('/users', userRoutes)
//? fase 7 Course CRUD
app.use('/courses', courseRoutes)
//? fase 8 Role & Permission
app.use('/roles', roleRoutes)
app.use('/permissions', permissionRoutes)
//? fase 9 Student
app.use('/students', studentRoutes)
//? fase 10 Teacher Module
app.use('/teachers', teacherRoutes)
//? fase 11 Grade Module
app.use('/grades', gradeRoutes)
//? fase 12 Attendance Module
app.use('/attendance', attendanceRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  })
})

// Error handler global
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error)
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  })
})