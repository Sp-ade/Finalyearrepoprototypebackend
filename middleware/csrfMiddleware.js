const crypto = require('crypto');

/**
 * Generate a random CSRF token
 */
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Set the CSRF token in a cookie
 */
const setCsrfTokenCookie = (res, token) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('csrf_token', token, {
        httpOnly: true,
        secure: isProd,           // HTTP ok on localhost, HTTPS required in production
        sameSite: isProd ? 'none' : 'lax', // 'none' needed for cross-domain on Render
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
};

/**
 * Middleware to verify the CSRF token
 */
const verifyCsrfToken = (req, res, next) => {
    // 1. Skip CSRF check for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // 2. MOBILE-PROOF / CROSS-DOMAIN FIX: 
    // If the Authorization header is present, the request is safe from CSRF 
    // because third-party sites cannot set custom headers for cross-domain requests.
    if (req.headers.authorization) {
        return next();
    }

    // 3. Fallback to Double Submit Cookie check
    const cookieToken = req.cookies.csrf_token;
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        console.warn(`[CSRF Warning] Blocked attempt from ${req.ip}. Method: ${req.method}, URL: ${req.originalUrl}`);
        return res.status(403).json({
            success: false,
            message: 'Security token mismatch. Action prohibited.'
        });
    }

    next();
};

module.exports = {
    generateToken,
    setCsrfTokenCookie,
    verifyCsrfToken
};
