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

module.exports = authenticate;
