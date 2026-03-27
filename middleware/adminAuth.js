const verifyAdmin = (req, res, next) => {
    // SECURE: Use role from verified JWT (populated by authenticate middleware)
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required. This action is restricted to administrators only.'
        });
    }

    next();
};

module.exports = { verifyAdmin };
