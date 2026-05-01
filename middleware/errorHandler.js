module.exports = function errorHandler(err, req, res, next) {
  console.error(err)
  if (res.headersSent) return next(err)

  // Handle Multer errors specifically
  // change file size limit in utils cloudinary
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File too large. Maximum size allowed is 8MB.',
      error: 'LIMIT_FILE_SIZE'
    })
  }

  const status = err.status || (err.name === 'UnauthorizedError' ? 401 : 500)
  res.status(status).json({ message: err.message || 'Internal Server Error' })
}
