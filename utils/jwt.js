const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET

module.exports = {
  sign(payload, opts) {
    return jwt.sign(payload, secret, opts || { expiresIn: '1h' })
  },
  verify(token) {
    return jwt.verify(token, secret)
  }
}
