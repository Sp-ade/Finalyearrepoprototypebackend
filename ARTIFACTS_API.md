# Project Artifacts API Documentation

## Overview

The backend now supports storing project artifacts (files) in PostgreSQL database while files are stored in Cloudinary. The frontend currently uses JSON for project data but can upload/retrieve files from the database.

## Database Schema

### Tables Created

1. **Supervisors** - Stores supervisor information
2. **Projects** - Stores project metadata
3. **Project_Artifacts** - Stores file references with Cloudinary URLs
4. **Tags** - Stores unique tags
5. **Project_Tags** - Junction table for project-tag relationships

### Project_Artifacts Table Structure

```sql
CREATE TABLE Project_Artifacts (
    project_id INT REFERENCES Projects(project_id) ON DELETE CASCADE,
    artifact_id SERIAL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,  -- Cloudinary URL
    file_type VARCHAR(50),
    uploaded_by INT REFERENCES Supervisors(user_id), 
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (project_id, artifact_id)
);
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/projects
```

### 1. Upload Project Artifact

**Endpoint:** `POST /api/projects/:projectId/artifacts`

**Description:** Upload a file to Cloudinary and save reference in database

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- URL Parameter: `projectId` (integer)
- Body: 
  - `artifact` (file) - The file to upload
  - `uploadedBy` (integer, optional) - User ID of uploader

**Example:**
```javascript
const formData = new FormData();
formData.append('artifact', file);
formData.append('uploadedBy', 1); // Optional

const response = await fetch('http://localhost:3000/api/projects/1/artifacts', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "artifact": {
    "project_id": 1,
    "artifact_id": 1,
    "file_name": "document.pdf",
    "file_path": "https://res.cloudinary.com/.../document.pdf",
    "file_type": "pdf",
    "uploaded_by": 1,
    "uploaded_at": "2026-01-23T16:00:00.000Z",
    "is_public": false,
    "cloudinaryPublicId": "documents/abc123"
  }
}
```

---

### 2. Get All Project Artifacts

**Endpoint:** `GET /api/projects/:projectId/artifacts`

**Description:** Retrieve all artifacts for a specific project

**Request:**
- Method: GET
- URL Parameter: `projectId` (integer)

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/projects/1/artifacts');
const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "artifacts": [
    {
      "project_id": 1,
      "artifact_id": 1,
      "file_name": "document.pdf",
      "file_path": "https://res.cloudinary.com/.../document.pdf",
      "file_type": "pdf",
      "uploaded_by": 1,
      "uploader_name": "John Doe",
      "uploaded_at": "2026-01-23T16:00:00.000Z",
      "is_public": false
    }
  ]
}
```

---

### 3. Get Specific Artifact

**Endpoint:** `GET /api/projects/:projectId/artifacts/:artifactId`

**Description:** Retrieve a specific artifact

**Request:**
- Method: GET
- URL Parameters: 
  - `projectId` (integer)
  - `artifactId` (integer)

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/projects/1/artifacts/1');
const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "artifact": {
    "project_id": 1,
    "artifact_id": 1,
    "file_name": "document.pdf",
    "file_path": "https://res.cloudinary.com/.../document.pdf",
    "file_type": "pdf",
    "uploaded_by": 1,
    "uploaded_at": "2026-01-23T16:00:00.000Z",
    "is_public": false
  }
}
```

---

### 4. Delete Artifact

**Endpoint:** `DELETE /api/projects/:projectId/artifacts/:artifactId`

**Description:** Delete artifact from database and Cloudinary

**Request:**
- Method: DELETE
- URL Parameters: 
  - `projectId` (integer)
  - `artifactId` (integer)
- Body (JSON):
  - `cloudinaryPublicId` (string, optional) - For Cloudinary deletion

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/projects/1/artifacts/1', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cloudinaryPublicId: 'documents/abc123'
  })
});

const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "message": "Artifact deleted successfully"
}
```

---

### 5. Update Artifact Visibility

**Endpoint:** `PATCH /api/projects/:projectId/artifacts/:artifactId/visibility`

**Description:** Toggle artifact public/private status

**Request:**
- Method: PATCH
- URL Parameters: 
  - `projectId` (integer)
  - `artifactId` (integer)
- Body (JSON):
  - `isPublic` (boolean)

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/projects/1/artifacts/1/visibility', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    isPublic: true
  })
});

const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "artifact": {
    "project_id": 1,
    "artifact_id": 1,
    "file_name": "document.pdf",
    "file_path": "https://res.cloudinary.com/.../document.pdf",
    "is_public": true,
    ...
  }
}
```

---

## Current Implementation Status

### ✅ Backend (Complete)
- Database tables created in PostgreSQL
- Repository layer for database operations
- Service layer for business logic
- Controller layer for request handling
- Routes registered in Express app
- Cloudinary integration for file storage

### 📝 Frontend (Hybrid Approach)
- **Project Data**: Still using `Projects.json`
- **File Uploads**: Can use backend API endpoints
- **File Display**: StaffProjectView shows attachments from JSON

### 🔄 Migration Path

To fully integrate with the database:

1. **Keep using JSON for now** (as requested)
2. **Use artifact API for file uploads** when creating projects
3. **Later**: Migrate project data from JSON to PostgreSQL
4. **Later**: Update frontend to fetch from `/api/projects` instead of JSON

---

## Example: Uploading File When Creating Project

```javascript
// In ProjectCreate.jsx
const handleSubmit = async () => {
  try {
    // Step 1: Create project in JSON (current approach)
    const projectData = { /* ... */ };
    const projectRes = await fetch('http://localhost:3000/api/dummy-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });
    const project = await projectRes.json();
    
    // Step 2: Upload file to database (if file exists)
    if (file && project.id) {
      const formData = new FormData();
      formData.append('artifact', file);
      
      await fetch(`http://localhost:3000/api/projects/${project.id}/artifacts`, {
        method: 'POST',
        body: formData
      });
    }
    
    navigate('/staffbrowse');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Example: Fetching Artifacts for Display

```javascript
// In StaffProjectView.jsx
const [artifacts, setArtifacts] = useState([]);

useEffect(() => {
  const fetchArtifacts = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${id}/artifacts`);
      const data = await response.json();
      if (data.success) {
        setArtifacts(data.artifacts);
      }
    } catch (error) {
      console.error('Error fetching artifacts:', error);
    }
  };
  
  if (id) {
    fetchArtifacts();
  }
}, [id]);

// Display artifacts
{artifacts.map(artifact => (
  <Box key={artifact.artifact_id}>
    <a href={artifact.file_path} target="_blank">
      {artifact.file_name}
    </a>
  </Box>
))}
```

---

## Files Created

### Backend
- `repositories/artifactRepository.js` - Database operations
- `services/artifactService.js` - Business logic
- `controllers/artifactController.js` - Request handlers
- `routes/artifactRoutes.js` - API routes
- `create-project-tables.js` - Migration script (for reference)

### Documentation
- `ARTIFACTS_API.md` - This file

---

## Testing

### Test File Upload
```bash
curl -X POST http://localhost:3000/api/projects/1/artifacts \
  -F "artifact=@/path/to/file.pdf" \
  -F "uploadedBy=1"
```

### Test Get Artifacts
```bash
curl http://localhost:3000/api/projects/1/artifacts
```

### Test Delete Artifact
```bash
curl -X DELETE http://localhost:3000/api/projects/1/artifacts/1 \
  -H "Content-Type: application/json" \
  -d '{"cloudinaryPublicId":"documents/abc123"}'
```

---

## Next Steps

1. ✅ Backend infrastructure complete
2. 📝 Frontend still uses JSON (as requested)
3. 🔜 Optionally update ProjectCreate to use artifact API
4. 🔜 Optionally update StaffProjectView to fetch from database
5. 🔜 Later: Full migration from JSON to PostgreSQL
