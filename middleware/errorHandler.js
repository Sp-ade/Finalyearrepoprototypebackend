module.exports = function errorHandler(err, req, res, next) {
  console.error(err)
  if (res.headersSent) return next(err)
  const status = err.status || (err.name === 'UnauthorizedError' ? 401 : 500)
  res.status(status).json({ message: err.message || 'Internal Server Error' })
}
