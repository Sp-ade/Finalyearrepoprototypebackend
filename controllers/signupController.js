const authService = require('../services/authservice');
const activityService = require('../services/activityService');


exports.signup = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, studentId, department } = req.body;
    const user = await authService.signup({ email, password, firstName, lastName, role, studentId, department });
    res.status(201).json({
      message: 'Account created successfully. Please verify your email.',
      user
    });

    // Log the activity (async)
    activityService.logUserSignup(user.id, user.email).catch(err => console.error('Signup error:', err));

  } catch (err) {
    if (err.code === '23505' || err.statusCode === 409) {
      return res.status(409).json({ message: 'User with this email or ID already exists' });
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};
