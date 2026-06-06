const rateLimit = require('express-rate-limit');

/**
 * Build a limiter that returns a STRUCTURED 429 ({ success, message, retryAfter })
 * instead of express-rate-limit's plain-string body — so the client can show a
 * real "try again in N seconds" countdown rather than a misleading generic error.
 */
function make({ windowMs, max, message, skipSuccessfulRequests = true, skipFailedRequests = false }) {
  return rateLimit({
    windowMs,
    max,
    skipSuccessfulRequests,
    skipFailedRequests,
    standardHeaders: true, // RateLimit-* + Retry-After headers
    legacyHeaders: false,
    handler: (req, res) => {
      const resetTime = req.rateLimit && req.rateLimit.resetTime;
      const retryAfter = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : Math.ceil(windowMs / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ success: false, code: 'rate_limited', message, retryAfter });
    },
  });
}

// Login: 5 attempts / 15 min (successful logins don't count).
const loginLimiter = make({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many login attempts. Please try again later.' });

// Password reset: 3 / hour.
const passwordResetLimiter = make({ windowMs: 60 * 60 * 1000, max: 3, message: 'Too many password reset requests. Please try again later.' });

// Register: 5 / hour (count all attempts).
const registerLimiter = make({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many registration attempts. Please try again later.', skipSuccessfulRequests: false });

// Verify email: 5 / hour.
const verifyEmailLimiter = make({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many verification attempts. Please try again later.' });

// Resend verification: 5 / hour.
const resendVerificationLimiter = make({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many resend requests. Please try again later.' });

// Token refresh: 10 / hour.
const refreshTokenLimiter = make({ windowMs: 60 * 60 * 1000, max: 10, message: 'Rate limit exceeded. Please try again later.' });

module.exports = {
  loginLimiter,
  passwordResetLimiter,
  registerLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
  refreshTokenLimiter,
};
