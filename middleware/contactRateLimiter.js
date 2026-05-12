const rateLimit = require('express-rate-limit');

/**
 * General rate limiter to prevent DDoS attacks on the contact endpoint.
 */
const globalContactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for successful contact form submissions.
 * Prevents spamming emails.
 */
const contactSuccessLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1, // Only 1 successful message every 10 minutes
  skipFailedRequests: true, // If the email fails, don't count the attempt
  message: {
    success: false,
    error: 'You have already sent a message. Please wait 10 minutes before sending another one.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalContactLimiter,
  contactSuccessLimiter
};
