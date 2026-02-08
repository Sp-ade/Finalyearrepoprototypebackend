# Cloudinary Quick Start Guide

## ✅ Setup Complete!

Your backend is now configured to handle file uploads with Cloudinary.

## 🚀 Quick Test

1. **Start your backend server:**
   ```bash
   npm start
   ```

2. **Open the test page:**
   - Open `test-upload.html` in your browser
   - Or navigate to: `file:///c:/Users/ademo/Documents/nilefinlayear/Backend/test-upload.html`

3. **Test uploads:**
   - Try uploading a profile picture
   - Try uploading a document
   - Try uploading multiple files

## 📋 What Was Set Up

### Files Created:
- ✅ `utils/cloudinary.js` - Cloudinary configuration
- ✅ `controllers/uploadController.js` - Upload handlers
- ✅ `routes/uploadRoutes.js` - Upload endpoints
- ✅ `test-upload.html` - Test page
- ✅ `CLOUDINARY_SETUP.md` - Full documentation

### Packages Installed:
- ✅ `cloudinary` - Cloudinary SDK
- ✅ `multer-storage-cloudinary` - Multer storage engine for Cloudinary

### Environment Variables:
- ✅ `CLOUDINARY_CLOUD_NAME=dl38emsoc`
- ✅ `CLOUDINARY_API_KEY=464371769992436`
- ✅ `CLOUDINARY_API_SECRET=M_-q7vbNIlM6LIbyQ1Q33R6yzws`

## 📡 Available Endpoints

| Endpoint | Method | Purpose | Field Name |
|----------|--------|---------|------------|
| `/api/upload/profile-picture` | POST | Upload profile picture | `profilePicture` |
| `/api/upload/document` | POST | Upload document | `document` |
| `/api/upload/multiple` | POST | Upload multiple files | `files` |
| `/api/upload/:publicId` | DELETE | Delete file | - |

## 💡 Frontend Usage Example

```javascript
// Upload profile picture
const uploadProfilePic = async (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  
  const response = await fetch('http://localhost:3000/api/upload/profile-picture', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Image URL:', data.data.url);
    console.log('Public ID:', data.data.publicId);
    // Save these to your database!
  }
};
```

## 🔐 Next Steps (Recommended)

1. **Add Authentication:**
   ```javascript
   // In routes/uploadRoutes.js
   const authMiddleware = require('../middleware/auth');
   
   router.post('/profile-picture', 
     authMiddleware,  // Add this
     uploads.profilePicture.single('profilePicture'), 
     uploadProfilePicture
   );
   ```

2. **Save to Database:**
   - Store the `url` and `publicId` in your database
   - Link files to user accounts
   - Track upload metadata

3. **Add File Size Limits:**
   ```javascript
   const uploads = {
     profilePicture: multer({ 
       storage: storageConfigs.profilePictures,
       limits: { fileSize: 5 * 1024 * 1024 } // 5MB
     })
   };
   ```

4. **Implement File Deletion:**
   - When users update their profile picture, delete the old one
   - Use the `deleteFile` function from `utils/cloudinary.js`

## 📚 Full Documentation

For complete documentation, see: `CLOUDINARY_SETUP.md`

## 🐛 Troubleshooting

**Server won't start?**
- Make sure all packages are installed: `npm install`
- Check that `.env` file exists with Cloudinary credentials

**Upload fails?**
- Verify backend is running on port 3000
- Check browser console for errors
- Ensure file type is allowed

**CORS errors?**
- Your backend already has CORS enabled for localhost:5173 and localhost:3000
- Add your frontend URL if different

## 🎉 You're All Set!

Your Cloudinary integration is ready to use. Start uploading files!
