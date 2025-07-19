// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Simple rate limiting
const rateLimitMap = new Map();
const createRateLimit = (maxRequests, windowMs) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }
    
    const requests = rateLimitMap.get(ip);
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        statusCode: 429,
        timestamp: new Date().toISOString()
      });
    }
    
    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);
    next();
  };
};

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateSignupData = (data) => {
  const errors = [];
  const { email, password, firstName, lastName } = data;

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validateEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }

  if (!firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  if (!lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLoginData = (data) => {
  const errors = [];
  const { email, password } = data;

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validateEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Response helper functions
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    statusCode
  };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const sendError = (res, message, errors = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    statusCode
  };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};

// Auth Controllers
const signup = async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;

    // Validate input data
    const validation = validateSignupData(req.body);
    if (!validation.isValid) {
      return sendError(res, 'Validation failed', validation.errors, 400);
    }

    // Use Supabase Auth built-in signup
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          username: username?.trim() || null,
          first_name: firstName?.trim() || null,
          last_name: lastName?.trim() || null,
          full_name: firstName && lastName ? `${firstName.trim()} ${lastName.trim()}` : null
        }
      }
    });

    if (error) {
      console.error('Supabase Auth signup error:', error);
      
      if (error.message.includes('already registered')) {
        return sendError(res, 'User with this email already exists', null, 409);
      }
      
      return sendError(res, 'Registration failed', error.message, 400);
    }

    // Check if user needs email confirmation
    const needsConfirmation = !data.user?.email_confirmed_at;
    
    const responseData = {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        username: data.user?.user_metadata?.username,
        firstName: data.user?.user_metadata?.first_name,
        lastName: data.user?.user_metadata?.last_name,
        emailConfirmed: !!data.user?.email_confirmed_at,
        createdAt: data.user?.created_at
      },
      session: data.session,
      message: needsConfirmation 
        ? 'Registration successful! Please check your email to confirm your account.'
        : 'Registration successful!'
    };

    return sendSuccess(res, 'User registered successfully', responseData, 201);

  } catch (error) {
    console.error('Signup error:', error);
    return sendError(res, 'Internal server error during signup', null, 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input data
    const validation = validateLoginData(req.body);
    if (!validation.isValid) {
      return sendError(res, 'Validation failed', validation.errors, 400);
    }

    // Use Supabase Auth built-in login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      console.error('Supabase Auth login error:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        return sendError(res, 'Invalid email or password', null, 401);
      }
      
      if (error.message.includes('Email not confirmed')) {
        return sendError(res, 'Please confirm your email address before logging in', null, 403);
      }
      
      return sendError(res, 'Login failed', error.message, 400);
    }

    const responseData = {
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username,
        firstName: data.user.user_metadata?.first_name,
        lastName: data.user.user_metadata?.last_name,
        fullName: data.user.user_metadata?.full_name,
        emailConfirmed: !!data.user.email_confirmed_at,
        lastSignIn: data.user.last_sign_in_at,
        createdAt: data.user.created_at
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        expiresIn: data.session.expires_in,
        tokenType: data.session.token_type
      }
    };

    return sendSuccess(res, 'Login successful', responseData);

  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Internal server error during login', null, 500);
  }
};

const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase Auth logout error:', error);
      return sendError(res, 'Logout failed', error.message, 400);
    }

    return sendSuccess(res, 'Logout successful');

  } catch (error) {
    console.error('Logout error:', error);
    return sendError(res, 'Internal server error during logout', null, 500);
  }
};

const getProfile = async (req, res) => {
  try {
    // Get user from the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authorization token required', null, 401);
    }

    const token = authHeader.substring(7);
    
    // Get user from Supabase using the token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return sendError(res, 'Invalid or expired token', null, 401);
    }

    const responseData = {
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username,
        firstName: data.user.user_metadata?.first_name,
        lastName: data.user.user_metadata?.last_name,
        fullName: data.user.user_metadata?.full_name,
        emailConfirmed: !!data.user.email_confirmed_at,
        lastSignIn: data.user.last_sign_in_at,
        createdAt: data.user.created_at
      }
    };

    return sendSuccess(res, 'Profile retrieved successfully', responseData);

  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 'Internal server error while fetching profile', null, 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, firstName, lastName } = req.body;
    
    // Get user from the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authorization token required', null, 401);
    }

    // Update user metadata in Supabase Auth
    const { data, error } = await supabase.auth.updateUser({
      data: {
        username: username?.trim() || null,
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        full_name: firstName && lastName ? `${firstName.trim()} ${lastName.trim()}` : null
      }
    });

    if (error) {
      console.error('Profile update error:', error);
      return sendError(res, 'Failed to update profile', error.message, 400);
    }

    const responseData = {
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username,
        firstName: data.user.user_metadata?.first_name,
        lastName: data.user.user_metadata?.last_name,
        fullName: data.user.user_metadata?.full_name,
        emailConfirmed: !!data.user.email_confirmed_at,
        lastSignIn: data.user.last_sign_in_at,
        createdAt: data.user.created_at
      }
    };

    return sendSuccess(res, 'Profile updated successfully', responseData);

  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 'Internal server error while updating profile', null, 500);
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return sendError(res, 'Valid email address is required', null, 400);
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
    });

    if (error) {
      console.error('Password reset request error:', error);
      return sendError(res, 'Failed to send password reset email', error.message, 400);
    }

    return sendSuccess(res, 'Password reset email sent successfully');

  } catch (error) {
    console.error('Password reset error:', error);
    return sendError(res, 'Internal server error during password reset', null, 500);
  }
};

// Apply rate limiting to routes
const signupRateLimit = createRateLimit(5, 60 * 60 * 1000); // 5 requests per hour
const loginRateLimit = createRateLimit(10, 15 * 60 * 1000); // 10 requests per 15 minutes
const passwordResetRateLimit = createRateLimit(3, 60 * 60 * 1000); // 3 requests per hour

// Define routes
router.post('/signup', signupRateLimit, signup);
router.post('/login', loginRateLimit, login);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/reset-password', passwordResetRateLimit, requestPasswordReset);

// Health check for auth routes
router.get('/health', (req, res) => {
  return sendSuccess(res, 'Auth service is healthy', {
    service: 'authentication',
    supabaseConnected: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;