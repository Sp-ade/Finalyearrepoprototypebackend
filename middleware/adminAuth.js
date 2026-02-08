const verifyAdmin = (req, res, next) => {
    // For now, we'll check the role from request headers or body
    // In a production system, this would come from JWT token verification
    const userRole = req.headers['x-user-role'] || req.body.role;

    if (userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required. This action is restricted to administrators only.'
        });
    }

    next();
};

module.exports = { verifyAdmin };
