require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const projectsRoutes = require('./routes/projects')
const uploadRoutes = require('./routes/uploadRoutes')
const artifactRoutes = require('./routes/artifactRoutes')
const requestRoutes = require('./routes/requests')
const adminRoutes = require('./routes/admin')
const submissionRoutes = require('./routes/submissionRoutes')
const supervisorRoutes = require('./routes/supervisorRoutes')
const errorHandler = require('./middleware/errorHandler')
const db = require('./Database')
const dropTables = require('./scripts/drop-tables')

const PORT = process.env.PORT || 3000
const app = express()
const cookieParser = require('cookie-parser')
const helmet = require('helmet')

app.use(helmet())
app.use(express.json())
app.use(cookieParser())
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
app.use('/api/projects', artifactRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/supervisors', supervisorRoutes)

// Real-time notifications SSE Mount
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes)

console.log('Routes registered:')

// Error handler must be last
app.use(errorHandler)
// Startup sequence
const startServer = async () => {
    try {
        // Optional: Only reset if RESET_DB=true is in .env 
        // to avoid wiping data on every single restart
        if (process.env.RESET_DB === 'true') {
            await dropTables();
            console.log('✅ Database dropped and Cloudinary cleared');
        }

        const initializeDatabase = require('./initialize-database');
        await initializeDatabase();
        const createAdmin = require('./create-admin');
        await createAdmin();

        // One-time migration for leader assign link between students and supervisors
        if (process.env.ASSIGN_SCRIPT === 'true') {
            const migrateLeaderAssignments = require('./scripts/migrateLeaderAssignments');
            await migrateLeaderAssignments();
        }

        console.log('✅ Database initialized and ready');

        app.listen(PORT, () => console.log(`Backend listening at http://localhost:${PORT}`));
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
