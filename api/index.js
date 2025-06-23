// index.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please add SUPABASE_URL and SUPABASE_KEY to your .env file.');
  console.log('📋 Example .env file:');
  console.log('SUPABASE_URL=https://your-project.supabase.co');
  console.log('SUPABASE_KEY=your_anon_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 [${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip || 'unknown'}`);
  next();
});

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
        statusCode: 429
      });
    }
    
    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);
    next();
  };
};

// Validation helpers
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateSignupData = (data) => {
  const errors = [];
  const { email, password, firstName, lastName } = data;

  if (!email) errors.push({ field: 'email', message: 'Email is required' });
  else if (!validateEmail(email)) errors.push({ field: 'email', message: 'Invalid email format' });
  
  if (!password) errors.push({ field: 'password', message: 'Password is required' });
  else if (password.length < 8) errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  
  if (!firstName?.trim()) errors.push({ field: 'firstName', message: 'First name is required' });
  if (!lastName?.trim()) errors.push({ field: 'lastName', message: 'Last name is required' });

  return { isValid: errors.length === 0, errors };
};

// Response helpers
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = { success: true, message, timestamp: new Date().toISOString(), statusCode };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const sendError = (res, message, errors = null, statusCode = 500) => {
  const response = { success: false, message, timestamp: new Date().toISOString(), statusCode };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};

// ROOT ROUTE
app.get('/', (req, res) => {
  sendSuccess(res, 'AT-AT API is running!', {
    version: '1.0.0',
    endpoints: {
      health: 'GET /',
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      profile: 'GET /api/auth/profile',
      users: 'GET /users'
    }
  });
});

// USERS ROUTE (your existing one)
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, created_at');
    
    if (error) {
      console.error('Database error:', error);
      return sendError(res, 'Failed to fetch users', error.message, 500);
    }
    
    sendSuccess(res, 'Users retrieved successfully', { users: data });
  } catch (err) {
    console.error('Server error:', err);
    sendError(res, 'Internal server error', null, 500);
  }
});

// AUTH ROUTES
// Signup
app.post('/api/auth/signup', createRateLimit(5, 60 * 60 * 1000), async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;

    const validation = validateSignupData(req.body);
    if (!validation.isValid) {
      return sendError(res, 'Validation failed', validation.errors, 400);
    }

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
      console.error('Signup error:', error);
      if (error.message.includes('already registered')) {
        return sendError(res, 'User with this email already exists', null, 409);
      }
      return sendError(res, 'Registration failed', error.message, 400);
    }

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
      message: !data.user?.email_confirmed_at 
        ? 'Registration successful! Please check your email to confirm your account.'
        : 'Registration successful!'
    };

    sendSuccess(res, 'User registered successfully', responseData, 201);
  } catch (error) {
    console.error('Signup error:', error);
    sendError(res, 'Internal server error during signup', null, 500);
  }
});

// Login
app.post('/api/auth/login', createRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', null, 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      console.error('Login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        return sendError(res, 'Invalid email or password', null, 401);
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

    sendSuccess(res, 'Login successful', responseData);
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Internal server error during login', null, 500);
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      return sendError(res, 'Logout failed', error.message, 400);
    }
    sendSuccess(res, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 'Internal server error during logout', null, 500);
  }
});

// Get Profile
app.get('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authorization token required', null, 401);
    }

    const token = authHeader.substring(7);
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

    sendSuccess(res, 'Profile retrieved successfully', responseData);
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Internal server error while fetching profile', null, 500);
  }
});

// 404 handler
app.use('*', (req, res) => {
  sendError(res, 'Route not found', { path: req.originalUrl, method: req.method }, 404);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  sendError(res, 'Internal server error', null, 500);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('🚀 AT-AT API server running on port ' + PORT);
  console.log('📍 Health check: http://localhost:' + PORT);
  console.log('🔐 Auth endpoints: http://localhost:' + PORT + '/api/auth/*');
  console.log('👥 Users endpoint: http://localhost:' + PORT + '/users');
  console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.log('⚠️  Warning: Supabase not configured. Please check your .env file.');
  } else {
    console.log('✅ Supabase connected successfully');
  }
});