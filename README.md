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

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/nilefinalyeardb` |
| `PORT` | Server port | `3000` |
| `SEED_EMAIL` | Demo user email for database seeding | `test@nileuniversity.edu.ng` |
| `SEED_PASSWORD` | Demo user password for database seeding | `password123` |
| `SEED_FIRST_NAME` | Demo user first name | `Test` |
| `SEED_LAST_NAME` | Demo user last name | `User` |
| `SEED_ROLE` | Demo user role (student/supervisor/admin) | `student` |

## API Endpoints

### Authentication
- `POST /api/login` - User login
  - Body: `{ "email": "string", "password": "string" }`
  - Returns: `{ "user": { "id": number, "email": string, "firstName": string, "lastName": string, "role": string }, "token": "string" }`

### Projects (Dummy Data)
- `GET /api/dummy-projects` - Get dummy project data

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

## Project Structure

```
Backend/
├── controllers/       # Request handlers
├── middleware/        # Express middleware
├── repositories/      # Database queries
├── routes/           # API routes
├── services/         # Business logic
├── utils/            # Utility functions
├── Database.js       # PostgreSQL connection pool
├── index.js          # Application entry point
└── init-db.js        # Database initialization script
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

ISC
