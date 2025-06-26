// middleware/rateLimitMiddleware.js
const { ApiResponse } = require('../utils/apiResponse');

/**
 * Simple in-memory rate limiting implementation
 * In production, use Redis or a dedicated rate limiting service
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Check if request should be rate limited
   * @param {string} key - Unique identifier (IP address, user ID, etc.)
   * @param {number} maxRequests - Maximum number of requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} Rate limit result
   */
  checkLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const userRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, validRequests);

    if (validRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = oldestRequest + windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(resetTime),
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      resetTime: null,
      retryAfter: 0
    };
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
      
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  /**
   * Clear all rate limit data
   */
  clear() {
    this.requests.clear();
  }

  /**
   * Destroy the rate limiter and cleanup intervals
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Create global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Create rate limiting middleware
 * @param {number} maxRequests - Maximum number of requests
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} message - Custom error message
 * @returns {Function} Express middleware function
 */
const createRateLimit = (maxRequests, windowMs, message = 'Too many requests') => {
  return (req, res, next) => {
    try {
      // Use IP address as the key (you might want to use user ID for authenticated routes)
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      
      const result = rateLimiter.checkLimit(key, maxRequests, windowMs);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Window': Math.ceil(windowMs / 1000)
      });

      if (!result.allowed) {
        res.set({
          'X-RateLimit-Reset': result.resetTime.toISOString(),
          'Retry-After': result.retryAfter
        });

        return ApiResponse.rateLimitExceeded(res, `${message}. Try again in ${result.retryAfter} seconds.`);
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting on error to avoid blocking legitimate requests
      next();
    }
  };
};

/**
 * Rate limiting configurations for different endpoints
 */
const rateLimitMiddleware = {
  // Strict rate limiting for signup (5 attempts per hour)
  signup: createRateLimit(5, 60 * 60 * 1000, 'Too many signup attempts'),
  
  // Moderate rate limiting for login (10 attempts per 15 minutes)
  login: createRateLimit(10, 15 * 60 * 1000, 'Too many login attempts'),
  
  // Lenient rate limiting for password reset (3 attempts per hour)
  passwordReset: createRateLimit(3, 60 * 60 * 1000, 'Too many password reset requests'),
  
  // General API rate limiting (100 requests per minute)
  general: createRateLimit(100, 60 * 1000, 'API rate limit exceeded'),
  
  // Strict rate limiting for sensitive operations (20 per hour)
  sensitive: createRateLimit(20, 60 * 60 * 1000, 'Rate limit exceeded for sensitive operation')
};

/**
 * Enhanced rate limiting for authenticated users
 * Uses user ID instead of IP address for more accurate tracking
 */
const createAuthenticatedRateLimit = (maxRequests, windowMs, message = 'Too many requests') => {
  return (req, res, next) => {
    try {
      // Use user ID if authenticated, fallback to IP
      const key = req.user?.id || req.ip || req.connection.remoteAddress || 'unknown';
      
      const result = rateLimiter.checkLimit(`auth:${key}`, maxRequests, windowMs);

      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Window': Math.ceil(windowMs / 1000)
      });

      if (!result.allowed) {
        res.set({
          'X-RateLimit-Reset': result.resetTime.toISOString(),
          'Retry-After': result.retryAfter
        });

        return ApiResponse.rateLimitExceeded(res, `${message}. Try again in ${result.retryAfter} seconds.`);
      }

      next();
    } catch (error) {
      console.error('Authenticated rate limiting error:', error);
      next();
    }
  };
};

/**
 * Rate limiting for authenticated endpoints
 */
const authenticatedRateLimits = {
  // Profile updates (10 per hour)
  profileUpdate: createAuthenticatedRateLimit(10, 60 * 60 * 1000, 'Too many profile update attempts'),
  
  // API operations (1000 per hour for authenticated users)
  apiOperations: createAuthenticatedRateLimit(1000, 60 * 60 * 1000, 'API operation rate limit exceeded'),
  
  // File uploads (50 per hour)
  fileUpload: createAuthenticatedRateLimit(50, 60 * 60 * 1000, 'File upload rate limit exceeded')
};

module.exports = {
  rateLimitMiddleware,
  authenticatedRateLimits,
  createRateLimit,
  createAuthenticatedRateLimit,
  rateLimiter // Export for testing purposes
};