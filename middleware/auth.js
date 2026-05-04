const jwt = require('../utils/jwt');

const authenticate = async (req, res, next) => {
    // Check for token in Authorization header first, then query param, then fallback to cookies
    const token = req.headers.authorization?.split(' ')[1] || req.query.token || req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }

    try {
        const decoded = jwt.verify(token);
        req.user = decoded;

        // Double-Lock: Check database status on every request to ensure verification hasn't been bypassed
        const userRepository = require('../repositories/userRepository');
        const user = await userRepository.findById(decoded.sub);
        
        if (!user || user.is_verified !== true) {
            return res.status(403).json({
                success: false,
                message: 'Account not verified. Please verify your email.'
            });
        }

        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(401).json({
            success: false,
            message: 'Session expired or invalid token. Please log in again.'
        });
    }
};

/**
 * Optional authentication: decodes user if present, but continues if not.
 */
const optionalAuthenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token || req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token);
            req.user = decoded;
        } catch (err) {
            // Ignore invalid token for optional authentication
            console.error('Optional JWT Verification Error:', err.message);
        }
    }

    next();
};

const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Admin access required'
        });
    }
    next();
};

module.exports = {
    authenticate,
    optionalAuthenticate,
    isAdmin
};
