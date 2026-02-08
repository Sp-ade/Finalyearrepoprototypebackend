# Cloudinary File Upload Setup

## Overview
This backend is configured to use Cloudinary for file storage. Files are uploaded directly to Cloudinary's cloud storage, and you receive URLs that can be stored in your database.

## Configuration

### Environment Variables
The following variables are set in `.env`:
```
CLOUDINARY_CLOUD_NAME=dl38emsoc
CLOUDINARY_API_KEY=464371769992436
CLOUDINARY_API_SECRET=M_-q7vbNIlM6LIbyQ1Q33R6yzws
```

### File Structure
```
Backend/
├── utils/
│   └── cloudinary.js          # Cloudinary configuration and storage setup
├── controllers/
│   └── uploadController.js    # Upload handlers
└── routes/
    └── uploadRoutes.js        # Upload endpoints
```

## Available Endpoints

### 1. Upload Profile Picture
**POST** `/api/upload/profile-picture`

- **Content-Type**: `multipart/form-data`
- **Field name**: `profilePicture`
- **Allowed formats**: jpg, jpeg, png, gif, webp
- **Storage folder**: `profile_pictures/`

**Example using fetch:**
```javascript
const formData = new FormData();
formData.append('profilePicture', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/upload/profile-picture', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.data.url); // Cloudinary URL
```

### 2. Upload Document
**POST** `/api/upload/document`

- **Content-Type**: `multipart/form-data`
- **Field name**: `document`
- **Allowed formats**: pdf, doc, docx, txt
- **Storage folder**: `documents/`

**Example:**
```javascript
const formData = new FormData();
formData.append('document', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/upload/document', {
  method: 'POST',
  body: formData
});
```

### 3. Upload Multiple Files
**POST** `/api/upload/multiple`

- **Content-Type**: `multipart/form-data`
- **Field name**: `files`
- **Max files**: 10
- **Allowed formats**: jpg, jpeg, png, gif, pdf, doc, docx
- **Storage folder**: `uploads/`

**Example:**
```javascript
const formData = new FormData();
for (let file of fileInput.files) {
  formData.append('files', file);
}

const response = await fetch('http://localhost:3000/api/upload/multiple', {
  method: 'POST',
  body: formData
});
```

### 4. Delete File
**DELETE** `/api/upload/:publicId`

- **URL Parameter**: `publicId` - The Cloudinary public ID of the file

**Example:**
```javascript
const publicId = 'profile_pictures/abc123'; // URL encode if needed
const response = await fetch(`http://localhost:3000/api/upload/${encodeURIComponent(publicId)}`, {
  method: 'DELETE'
});
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dl38emsoc/image/upload/v1234567890/profile_pictures/abc123.jpg",
    "publicId": "profile_pictures/abc123",
    "originalName": "photo.jpg",
    "size": 123456,
    "format": "jpg"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information"
}
```

## Frontend Integration Examples

### React Example (with useState)
```javascript
import { useState } from 'react';

function ProfilePictureUpload() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await fetch('http://localhost:3000/api/upload/profile-picture', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setImageUrl(data.data.url);
        // TODO: Save data.data.url and data.data.publicId to your database
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} accept="image/*" />
      {uploading && <p>Uploading...</p>}
      {imageUrl && <img src={imageUrl} alt="Profile" />}
    </div>
  );
}
```

### Axios Example
```javascript
import axios from 'axios';

const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);

  try {
    const response = await axios.post(
      'http://localhost:3000/api/upload/profile-picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
```

## Database Integration

After uploading, you should save the file information to your database. Here's an example:

```javascript
// In your controller, after successful upload:
const fileData = {
  url: req.file.path,
  publicId: req.file.filename,
  originalName: req.file.originalname,
  size: req.file.size,
  format: req.file.format
};

// Save to database (example with PostgreSQL)
await db.query(
  'UPDATE users SET profile_picture_url = $1, profile_picture_public_id = $2 WHERE id = $3',
  [fileData.url, fileData.publicId, userId]
);
```

## Adding Custom Upload Types

To add a new upload type, modify `utils/cloudinary.js`:

```javascript
// Add to storageConfigs
const storageConfigs = {
  // ... existing configs
  
  // New custom type
  assignments: createCloudinaryStorage('assignments', ['pdf', 'doc', 'docx', 'zip'])
};

// Add to uploads
const uploads = {
  // ... existing uploads
  
  assignment: multer({ storage: storageConfigs.assignments })
};
```

Then create a route in `routes/uploadRoutes.js`:
```javascript
router.post('/assignment', uploads.assignment.single('assignment'), uploadAssignment);
```

## File Size Limits

To set file size limits, modify the multer configuration:

```javascript
const uploads = {
  profilePicture: multer({ 
    storage: storageConfigs.profilePictures,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  })
};
```

## Security Considerations

1. **Authentication**: Add authentication middleware to protect upload endpoints
2. **File validation**: Validate file types on the server side
3. **Rate limiting**: Implement rate limiting to prevent abuse
4. **File size limits**: Set appropriate file size limits

Example with authentication:
```javascript
const authMiddleware = require('../middleware/auth');

router.post('/profile-picture', 
  authMiddleware, // Add this
  uploads.profilePicture.single('profilePicture'), 
  uploadProfilePicture
);
```

## Testing

Test the upload endpoint using Postman or curl:

```bash
curl -X POST http://localhost:3000/api/upload/profile-picture \
  -F "profilePicture=@/path/to/image.jpg"
```

## Troubleshooting

### Common Issues

1. **"No file uploaded" error**
   - Check that the form field name matches the route configuration
   - Ensure Content-Type is multipart/form-data

2. **Cloudinary authentication error**
   - Verify .env variables are correct
   - Check that dotenv is loaded before cloudinary config

3. **File not appearing in Cloudinary**
   - Check your Cloudinary dashboard
   - Verify the folder name in the storage configuration

## Next Steps

1. Add authentication to protect upload endpoints
2. Create database tables to store file metadata
3. Implement file deletion when users update their files
4. Add image transformation options (resize, crop, etc.)
5. Set up webhooks for upload notifications
