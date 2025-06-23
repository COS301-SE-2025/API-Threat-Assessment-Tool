// index.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase config. Add SUPABASE_URL and SUPABASE_KEY to your .env');
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
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 [${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Rate limiter
const rateLimitMap = new Map();
const createRateLimit = (maxRequests, windowMs) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const log = rateLimitMap.get(ip) || [];
    const fresh = log.filter(t => now - t < windowMs);
    if (fresh.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Try again later',
        statusCode: 429
      });
    }
    fresh.push(now);
    rateLimitMap.set(ip, fresh);
    next();
  };
};

// Validators
const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateSignupData = data => {
  const { email, password, firstName, lastName } = data;
  const errors = [];
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
  const payload = { success: true, message, timestamp: new Date().toISOString(), statusCode };
  if (data) payload.data = data;
  res.status(statusCode).json(payload);
};
const sendError = (res, message, errors = null, statusCode = 500) => {
  const payload = { success: false, message, timestamp: new Date().toISOString(), statusCode };
  if (errors) payload.errors = errors;
  res.status(statusCode).json(payload);
};

// Routes
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

app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, created_at, email_confirmed');
    if (error) return sendError(res, 'Fetch failed', error.message, 500);
    sendSuccess(res, 'Users loaded', { users: data });
  } catch (err) {
    sendError(res, 'Internal error', err.message, 500);
  }
});

// Signup
app.post('/api/auth/signup', createRateLimit(5, 60 * 60 * 1000), async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;
    const validation = validateSignupData(req.body);
    if (!validation.isValid) return sendError(res, 'Validation failed', validation.errors, 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      email: email.trim().toLowerCase(),
      username: username?.trim(),
      first_name: firstName?.trim(),
      last_name: lastName?.trim(),
      password: hashedPassword,
      email_confirmed: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();
    if (error) return sendError(res, 'Insert failed', error.message, 400);

    sendSuccess(res, 'User registered', {
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
        firstName: data.first_name,
        lastName: data.last_name,
        emailConfirmed: data.email_confirmed,
        createdAt: data.created_at
      }
    }, 201);
  } catch (err) {
    sendError(res, 'Signup failed', err.message, 500);
  }
});

// Login
app.post('/api/auth/login', createRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 'Missing credentials', null, 400);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !data) return sendError(res, 'Invalid email or password', null, 401);
    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) return sendError(res, 'Invalid email or password', null, 401);

const token = jwt.sign({ id: data.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

sendSuccess(res, 'Login successful', {
  user: {
    id: data.id,
    email: data.email,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    emailConfirmed: data.email_confirmed,
    createdAt: data.created_at
  },
  token
});

  } catch (err) {
    sendError(res, 'Login error', err.message, 500);
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return sendError(res, 'Logout failed', error.message, 400);
    sendSuccess(res, 'Logged out');
  } catch (err) {
    sendError(res, 'Logout error', err.message, 500);
  }
});


// Profile
app.get('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return sendError(res, 'Missing or invalid Authorization header', null, 401);

    const token = authHeader.split(' ')[1];
    if (!process.env.JWT_SECRET)
      return sendError(res, 'Server misconfigured: JWT secret missing', null, 500);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return sendError(res, 'Invalid or expired token', err.message, 401);
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !data)
      return sendError(res, 'User not found', error?.message || null, 404);

    sendSuccess(res, 'Profile retrieved', {
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
        firstName: data.first_name,
        lastName: data.last_name,
        emailConfirmed: data.email_confirmed,
        createdAt: data.created_at
      }
    });
  } catch (err) {
    sendError(res, 'Profile error', err.message, 500);
  }
});


// 404 handler
app.use('*', (req, res) => {
  sendError(res, 'Route not found', { path: req.originalUrl, method: req.method }, 404);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  sendError(res, 'Unhandled error', err.message, 500);
});

// Run server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
