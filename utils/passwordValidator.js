/**
 * Password Validator - Enforces strong password policy
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*()_+−=[]{};':"\\|,.<>\/?)
 */

const validatePassword = (password) => {
    const errors = []

    if (!password) {
        errors.push('Password is required')
        return errors
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter (A-Z)')
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter (a-z)')
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number (0-9)')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%...)')
    }

    return errors
}

const isPasswordStrong = (password) => {
    return validatePassword(password).length === 0
}

module.exports = {
    validatePassword,
    isPasswordStrong
}
