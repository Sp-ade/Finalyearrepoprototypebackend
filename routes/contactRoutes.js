const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');
const { globalContactLimiter, contactSuccessLimiter } = require('../middleware/contactRateLimiter');

/**
 * @route POST /api/contact
 * @desc Submit a contact form (complaints/suggestions)
 * @access Private (only logged in users can submit to ensure quality)
 */
router.post('/', 
  globalContactLimiter, // DDoS protection
  authenticate,         // Ensure user is logged in
  contactSuccessLimiter, // 10-minute cooldown on success
  contactController.submitContactForm
);

module.exports = router;
