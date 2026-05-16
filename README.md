# Backend - Nile Final Year Project

Backend API server for the Nile Final Year project management system.

## Prerequisites

- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## Installation

1. **Clone the repository** (if not already done)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   
   Make sure PostgreSQL is installed and running on your system.
   
   Create a new database:
   ```sql
   CREATE DATABASE nilefinalyear;
   ```

4. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   copy .env.example .env
   ```
   
   Update `.env` with your PostgreSQL credentials:
   ```
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/nilefinalyear
   ```

5. **Initialize the database**
   
   Run the migration script to create tables and seed initial data:
   ```bash
   npm run migrate
   ```
   
   You should see:
   ```
   Tables ensured
   Seeded user test@example.com
   ```

## Running the Application

### Development Mode
```bash
npm start
```

The server will start at `http://localhost:3000`

## 🔐 Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret key for JWT signing | `super-secret-key` |
| `BACKEND_URL` | Base URL of the backend (for verification links) | `http://localhost:3000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name for file uploads | `your_cloud_name` |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP credentials for notifications | `test@nileuniversity.edu.ng` |

## 📡 API Endpoints

### 🔑 Authentication (`/api/auth`)
- `POST /login` - User login (Returns JWT)
- `POST /signup` - User registration
- `POST /logout` - Invalidate session
- `GET /me` - Get current user profile
- `POST /forgot-password` - Trigger password reset email
- `POST /reset-password` - Complete password reset

### 📁 Projects (`/api/projects`)
- `GET /` - List all projects (Search & Filter)
- `GET /:id` - Get project details
- `POST /` - Create a new project (Student Leaders)
- `PUT /:id` - Update project details
- `DELETE /:id` - Remove a project
- `PATCH /:id/reassign-supervisor` - (Admin/Lead) Change supervisor

### 🛠️ Admin (`/api/admin`)
*All routes require Admin role.*
- `GET /users` - List and manage all users
- `GET /analytics/dashboard` - Get system-wide statistics
- `GET /logs` - View activity logs (Audit trail)
- `POST /database/backup` - Create a manual DB backup
- `POST /storage/cleanup` - Purge orphaned files from Cloudinary

### ✉️ Other
- `/api/contact` - Submit feedback or complaints
- `/api/notifications` - Manage user alerts
- `/api/submissions` - Project artifact uploads & grading

## Database Schema

### Users Table
```sql
CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'supervisor', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT email_from_nile CHECK (email LIKE '%@nileuniversity.edu.ng')
)
```

**Key Constraints:**
- Email must be from `@nileuniversity.edu.ng` domain
- Role must be one of: `student`, `supervisor`, or `admin`
- Email must be unique

## 📂 Project Structure

```text
Backend/
├── controllers/       # Business logic handlers
├── middleware/        # Auth, Validation, & Security (Helmet, Rate Limit)
├── repositories/      # SQL queries and Database interactions
├── routes/            # API Route definitions
├── services/          # External service integrations (Email, Cloudinary)
├── utils/             # Helpers (Templates, Backups, File Parsers)
├── Database.js       # PostgreSQL connection pool configuration
├── index.js          # Express app initialization
└── scripts/           # DB Migrations and maintenance scripts
```

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify PostgreSQL is running:
   ```bash
   # Windows
   pg_ctl status
   ```

2. Check your credentials in `.env` file

3. Ensure the database exists:
   ```sql
   \l  -- List all databases in psql
   ```

4. Test connection manually:
   ```bash
   psql -U postgres -d nilefinalyear
   ```

### Port Already in Use

If port 3000 is already in use, change the `PORT` in `.env`:
```
PORT=3001
```

## License

