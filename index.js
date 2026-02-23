require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const signupRoutes = require('./routes/signup')
const projectsRoutes = require('./routes/projects')
const uploadRoutes = require('./routes/uploadRoutes')
const artifactRoutes = require('./routes/artifactRoutes')
const requestRoutes = require('./routes/requests')
const adminRoutes = require('./routes/admin')
const submissionRoutes = require('./routes/submissionRoutes')
const errorHandler = require('./middleware/errorHandler')
const db = require('./Database')

const PORT = process.env.PORT || 3000
const app = express()

app.use(express.json())
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://finalyearrepoprototypefrontend.onrender.com'
    ],
    credentials: true
}))

// Debug: Log all incoming requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
})

app.use('/api', authRoutes)
app.use('/api', signupRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/projects', artifactRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/submissions', submissionRoutes)

console.log('Routes registered:')

// Error handler must be last
app.use(errorHandler)

const initializeDatabase = require('./initialize-database')

// Initialize database on startup
initializeDatabase()
    .then(() => console.log('✅ Database ready'))
    .catch((err) => console.error('❌ DB init error:', err))

app.listen(PORT, () => console.log(`Backend listening at http://localhost:${PORT}`))
