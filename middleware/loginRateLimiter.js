const rateLimit = require('express-rate-limit');

/**
 * Rate limiter specifically for the login endpoint.
 * 
 * Policy:
 * - windowMs: 15 minutes
 * - max: 6 failed attempts
 * - skipSuccessfulRequests: true (a correct login resets the counter for the IP)
 * - standardHeaders: true (RateLimit-* headers)
 * - legacyHeaders: false (X-RateLimit-* headers)
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // 6 attempts
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

module.exports = loginRateLimiter;
