const jwt = require('../utils/jwt');

const authenticate = (req, res, next) => {
    // Check for token in cookies first, then fallback to Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required. Please log in.' 
        });
    }

    try {
        const decoded = jwt.verify(token);
        req.user = decoded;
        
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
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
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
