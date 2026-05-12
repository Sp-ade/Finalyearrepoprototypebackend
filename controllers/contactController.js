const emailService = require('../services/emailService');

/**
 * Handle contact form submission
 */
const submitContactForm = async (req, res) => {
  try {
    const { message } = req.body;
    
    // Validate message
    if (!message || message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Message must be at least 5 characters long.'
      });
    }

    // Get user info if they are logged in, otherwise use 'Anonymous'
    // This assumes the 'authenticate' middleware is used before this controller
    const fromName = req.user ? `${req.user.first_name} ${req.user.last_name}` : 'Anonymous User';
    const fromEmail = req.user ? req.user.email : 'No email provided';

    await emailService.sendContactEmail({
      fromName,
      fromEmail,
      message: message.trim()
    });

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Error in submitContactForm:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message. Please try again later.'
    });
  }
};

module.exports = {
  submitContactForm
};
