// index.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const net = require('net');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { OAuth2Client } = require('google-auth-library');
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

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Engine config
const ENGINE_HOST = '127.0.0.1';
const ENGINE_PORT = process.env.ENGINE_PORT || 9011;
const ENGINE_SCRIPT = 'main.py'; // Script name in backend folder

// Engine process management
let engineProcess = null;
let engineStarting = false;

// File upload setup
const upload = multer({
  dest: 'uploads/',  // Fixed: was 'uploaads/' 
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.json', '.yaml', '.yml'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON and YAML files are allowed'), false);
    }
  }
});

// Middleware
app.use(cors({
  origin: true, // Allow all origins for testing
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

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Missing or invalid Authorization header', null, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!process.env.JWT_SECRET) {
    return sendError(res, 'Server misconfigured: JWT secret missing', null, 500);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', err.message, 401);
  }
};

// Check if engine is running
const isEngineRunning = () => {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(2000); // 2 second timeout for check
    
    client.on('connect', () => {
      client.destroy();
      resolve(true);
    });
    
    client.on('error', () => {
      resolve(false);
    });
    
    client.on('timeout', () => {
      client.destroy();
      resolve(false);
    });
    
    client.connect(ENGINE_PORT, ENGINE_HOST);
  });
};

// Start the Python engine
const startEngine = () => {
  return new Promise((resolve, reject) => {
    if (engineProcess || engineStarting) {
      console.log('🔄 Engine already starting or running');
      return resolve();
    }
    
    engineStarting = true;
    console.log('🚀 Starting Python engine...');
    console.log(`🔍 Working directory: ${path.join(process.cwd(), '../backend')}`);
    
    engineProcess = spawn('python', ['-u', 'main.py'], {  // Add -u flag for unbuffered output
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(process.cwd(), '../backend'),
      shell: true
    });
    
    console.log(`🔍 Spawned process with PID: ${engineProcess.pid}`);
    
    engineProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`🐍 Engine stdout: ${output.trim()}`);
      
      // Check if engine is ready
      if (output.includes('Listening on')) {
        engineStarting = false;
        console.log('✅ Engine started successfully');
        resolve();
      }
    });
    
    engineProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`❌ Engine stderr: ${error.trim()}`);
    });
    
    engineProcess.on('spawn', () => {
      console.log('✅ Process spawned successfully');
    });
    
    engineProcess.on('close', (code) => {
      console.log(`🔌 Engine process exited with code ${code}`);
      engineProcess = null;
      engineStarting = false;
    });
    
    engineProcess.on('error', (err) => {
      console.error(`❌ Failed to start engine: ${err.message}`);
      engineStarting = false;
      reject(err);
    });
    
    // Timeout if engine doesn't start within 30 seconds
    setTimeout(() => {
      if (engineStarting) {
        console.log('⏰ Engine startup timeout - killing process');
        if (engineProcess) {
          engineProcess.kill();
        }
        engineStarting = false;
        reject(new Error('Engine startup timeout'));
      }
    }, 30000);
  });
};

// Ensure engine is running before sending request
const ensureEngineRunning = async () => {
  const running = await isEngineRunning();
  if (!running) {
    console.log('⚡ Engine not running, starting it...');
    await startEngine();
    
    // Wait a bit more for engine to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};

// Engine communication helper
const sendToEngine = async (request) => {
  // Ensure engine is running first
  await ensureEngineRunning();
  
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let responseData = '';
    const startTime = Date.now();

    console.log(`🔍 Setting socket timeout to 120 seconds`);
    client.setTimeout(120000); // 2 minutes

    client.on('connect', () => {
      console.log(`🔗 Connected to engine at ${ENGINE_HOST}:${ENGINE_PORT}`);
      client.write(JSON.stringify(request));
      console.log(`📤 Sent to engine: ${request.command}`);
    });

    client.on('data', (data) => {
      responseData += data.toString();
      console.log(`📨 Received data chunk: ${data.toString().length} bytes`);
    });

    client.on('close', () => {
      const elapsed = Date.now() - startTime;
      console.log(`🔌 Connection to engine closed after ${elapsed}ms`);
      console.log(`📦 Raw response data: [${responseData}]`);
      try {
        const response = JSON.parse(responseData);
        console.log(`📥 Engine response code: ${response.code}`);
        
        // Check if engine returned an error code
        if (response.code !== 200 && response.code !== '200') {
          const errorMessage = response.data || 'Unknown engine error';
          return reject(new Error(errorMessage));
        }
        
        resolve(response);
      } catch (err) {
        console.error(`❌ Failed to parse response: ${err.message}`);
        reject(new Error('Failed to parse engine response'));
      }
    });

    client.on('error', (err) => {
      const elapsed = Date.now() - startTime;
      console.error(`❌ Engine connection error after ${elapsed}ms:`, err.message);
      reject(new Error(`Engine connection failed: ${err.message}`));
    });

    client.on('timeout', () => {
      const elapsed = Date.now() - startTime;
      console.error(`⏰ Engine connection timeout after ${elapsed}ms`);
      client.destroy();
      reject(new Error('Engine request timeout'));
    });

    client.connect(ENGINE_PORT, ENGINE_HOST);
  });
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
      connection_test: 'GET /api/connection/test',
      // Auth endpoints
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      google_login: 'POST /api/auth/google',
      logout: 'POST /api/auth/logout',
      profile: 'GET /api/auth/profile',
      // Dashboard endpoints
      dashboard_overview: 'GET /api/dashboard/overview',
      dashboard_metrics: 'GET /api/dashboard/metrics',
      dashboard_alerts: 'GET /api/dashboard/alerts',
      // API management endpoints
      apis_get_all: 'GET /api/apis',
      apis_create: 'POST /api/apis',
      apis_details: 'GET /api/apis/:id',
      apis_update: 'PUT /api/apis/:id',
      apis_delete: 'DELETE /api/apis/:id',
      apis_key_validate: 'POST /api/apis/key/validate',
      apis_key_set: 'POST /api/apis/key/set',
      apis_import_file: 'POST /api/apis/import/file',
      apis_import_url: 'POST /api/apis/import/url',
      // Endpoint management
      endpoints_list: 'POST /api/endpoints',
      endpoints_details: 'POST /api/endpoints/details',
      endpoints_tags_add: 'POST /api/endpoints/tags/add',
      endpoints_tags_remove: 'POST /api/endpoints/tags/remove',
      endpoints_tags_replace: 'POST /api/endpoints/tags/replace',
      endpoints_flags_add: 'POST /api/endpoints/flags/add',
      endpoints_flags_remove: 'POST /api/endpoints/flags/remove',
      tags_list: 'GET /api/tags',
      // Scan management
      scan_create: 'POST /api/scans',
      scan_start: 'POST /api/scans/start',
      scan_progress: 'GET /api/scans/:id/progress',
      scan_stop: 'POST /api/scans/:id/stop',
      scan_results: 'GET /api/scans/:id/results',
      scan_list: 'GET /api/scans',
      // Template management
      templates_list: 'GET /api/templates',
      templates_details: 'GET /api/templates/:id',
      templates_use: 'POST /api/templates/:id/use',
      // User management
      user_profile_update: 'PUT /api/users/profile',
      user_settings_get: 'GET /api/users/settings',
      user_settings_update: 'PUT /api/users/settings',
      // Reports
      reports_list: 'GET /api/reports',
      reports_details: 'GET /api/reports/:id',
      reports_download: 'GET /api/reports/:id/download'
    }
  });
});

// Connection test endpoint
app.get('/api/connection/test', async (req, res) => {
  try {
    const engineRequest = {
      command: "connection.test",
      data: {}
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Connection test successful', engineResponse.data);
    } else {
      sendError(res, 'Connection test failed', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Connection test error:', err.message);
    sendError(res, 'Connection test failed', err.message, 500);
  }
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

// ==================== AUTH ROUTES ====================

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
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) return sendError(res, 'Missing credentials', null, 400);

    let query = supabase.from('users').select('*');
    
    const identifier = email ? email.trim().toLowerCase() : username.trim().toLowerCase();
    if (email) {
      query = query.eq('email', identifier);
    } else if (username) {
      query = query.ilike('username', identifier); // Use ilike for case-insensitive matching
    } else {
      return sendError(res, 'Must provide either username or email', null, 400);
    }

    console.log('Querying with identifier:', identifier);
    const { data, error, status } = await query;

    if (error) {
      console.error('Supabase error:', { message: error.message, code: error.code, status });
      return sendError(res, 'Database error', error.message, 500);
    }

    if (!data || data.length === 0) {
      console.log('No user found for identifier:', identifier);
      return sendError(res, 'Invalid credentials', null, 401);
    }

    if (data.length > 1) {
      console.warn('Multiple users found for:', identifier);
      return sendError(res, 'Multiple users found, contact support', null, 400);
    }

    const user = data[0];
    console.log('User found:', { email: user.email, username: user.username, hasPassword: !!user.password });
    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      console.log('Password mismatch - Input:', password, 'Hashed:', user.password.substring(0, 10) + '...');
      return sendError(res, 'Invalid credentials', null, 401);
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    sendSuccess(res, 'Login successful', {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        emailConfirmed: user.email_confirmed,
        createdAt: user.created_at
      },
      token
    });

  } catch (err) {
    console.error('Unexpected error:', err.message);
    sendError(res, 'Login error', err.message, 500);
  }
});

// Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, 'Missing Google token', null, 400);

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, given_name, family_name } = payload;

    // Check if user exists
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      return sendError(res, 'Database error', error.message, 500);
    }

    // Create user if not exists
    if (!user) {
      const newUser = {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        username: email.split('@')[0], // Use email prefix as username
        first_name: given_name || name,
        last_name: family_name || '',
        google_id: googleId,
        email_confirmed: true,
        created_at: new Date().toISOString()
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (createError) return sendError(res, 'Failed to create user', createError.message, 500);
      user = createdUser;
    }

    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    sendSuccess(res, 'Google login successful', {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        emailConfirmed: user.email_confirmed,
        createdAt: user.created_at
      },
      token: jwtToken
    });

  } catch (err) {
    console.error('Google auth error:', err.message);
    sendError(res, 'Google authentication failed', err.message, 500);
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
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
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

// ==================== DASHBOARD ROUTES ====================

// Dashboard Overview
app.get('/api/dashboard/overview', authenticateToken, async (req, res) => {
  try {
    const engineRequest = {
      command: "dashboard.overview",
      data: {}
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Dashboard overview retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve dashboard overview';
      sendError(res, 'Dashboard overview failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Dashboard overview error:', err.message);
    sendError(res, 'Dashboard overview failed', err.message, 500);
  }
});

// Dashboard Metrics
app.get('/api/dashboard/metrics', authenticateToken, async (req, res) => {
  try {
    const engineRequest = {
      command: "dashboard.metrics",
      data: {}
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Dashboard metrics retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve dashboard metrics';
      sendError(res, 'Dashboard metrics failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Dashboard metrics error:', err.message);
    sendError(res, 'Dashboard metrics failed', err.message, 500);
  }
});

// Dashboard Alerts
app.get('/api/dashboard/alerts', authenticateToken, async (req, res) => {
  try {
    const engineRequest = {
      command: "dashboard.alerts",
      data: {}
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Dashboard alerts retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve dashboard alerts';
      sendError(res, 'Dashboard alerts failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Dashboard alerts error:', err.message);
    sendError(res, 'Dashboard alerts failed', err.message, 500);
  }
});

// ==================== API MANAGEMENT ROUTES ====================

// Get All APIs
app.get('/api/apis', authenticateToken, async (req, res) => {
  try {
    const engineRequest = {
      command: "apis.get_all",
      data: {
        user_id: req.user.id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'APIs retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve APIs';
      sendError(res, 'Get APIs failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get APIs error:', err.message);
    sendError(res, 'Get APIs failed', err.message, 500);
  }
});

// Create API
app.post('/api/apis', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name?.trim()) {
      return sendError(res, 'API name is required', null, 400);
    }

    if (!req.file) {
      return sendError(res, 'API specification file is required', null, 400);
    }

    const fileName = req.file.originalname;
    const tempPath = req.file.path;
    
    // Create Files directory if it doesn't exist
    const filesDir = path.join(__dirname, 'Files');
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }
    
    // Move file to Files directory with original name
    const finalPath = path.join(filesDir, fileName);
    fs.renameSync(tempPath, finalPath);

    const engineRequest = {
      command: "apis.create",
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        file: fileName
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    // Clean up file after processing
    try {
      fs.unlinkSync(finalPath);
    } catch (cleanupErr) {
      console.warn(`⚠️ Failed to cleanup file: ${cleanupErr.message}`);
    }

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'API created successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to create API';
      sendError(res, 'Create API failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.warn(`⚠️ Failed to cleanup temp file: ${cleanupErr.message}`);
      }
    }
    
    console.error('Create API error:', err.message);
    sendError(res, 'Create API failed', err.message, 500);
  }
});

// Get API Details
app.get('/api/apis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const engineRequest = {
      command: "apis.details",
      data: {
        api_id: id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'API details retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve API details';
      sendError(res, 'Get API details failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get API details error:', err.message);
    sendError(res, 'Get API details failed', err.message, 500);
  }
});

// Update API
app.put('/api/apis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return sendError(res, 'API name is required', null, 400);
    }

    const engineRequest = {
      command: "apis.update",
      data: {
        api_id: id,
        name: name.trim(),
        description: description?.trim() || ''
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'API updated successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to update API';
      sendError(res, 'Update API failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Update API error:', err.message);
    sendError(res, 'Update API failed', err.message, 500);
  }
});

// Delete API
app.delete('/api/apis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const engineRequest = {
      command: "apis.delete",
      data: {
        api_id: id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'API deleted successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to delete API';
      sendError(res, 'Delete API failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Delete API error:', err.message);
    sendError(res, 'Delete API failed', err.message, 500);
  }
});

// Validate API Key
app.post('/api/apis/key/validate', authenticateToken, async (req, res) => {
  try {
    const { api_key } = req.body;

    if (!api_key?.trim()) {
      return sendError(res, 'API key is required', null, 400);
    }

    const engineRequest = {
      command: "apis.key.validate",
      data: {
        api_key: api_key.trim()
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'API key validated successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'API key validation failed';
      sendError(res, 'API key validation failed', errorMsg, engineResponse.code || 400);
    }
  } catch (err) {
    console.error('API key validation error:', err.message);
    sendError(res, 'API key validation failed', err.message, 500);
  }
});

// Set API Key
app.post('/api/apis/key/set', authenticateToken, async (req, res) => {
  try {
    const { api_key } = req.body;

    if (!api_key?.trim()) {
      return sendError(res, 'API key is required', null, 400);
    }

    const engineRequest = {
      command: "apis.key.set",
      data: {
        api_key: api_key.trim()
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'API key set successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to set API key';
      sendError(res, 'Set API key failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Set API key error:', err.message);
    sendError(res, 'Set API key failed', err.message, 500);
  }
});

// Import API from File (existing endpoint, kept for backward compatibility)
app.post('/api/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', null, 400);
    }

    const fileName = req.file.originalname;
    const tempPath = req.file.path;
    
    // Create Files directory if it doesn't exist
    const filesDir = path.join(__dirname, 'Files');
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }
    
    // Move file to Files directory with original name
    const finalPath = path.join(filesDir, fileName);
    fs.renameSync(tempPath, finalPath);
    
    console.log(`📁 File saved to: ${finalPath}`);

    // Send request to engine
    const engineRequest = {
      command: "apis.import_file",
      data: {
        file: fileName
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    // Clean up file after processing
    try {
      fs.unlinkSync(finalPath);
      console.log(`🗑️ Cleaned up file: ${finalPath}`);
    } catch (cleanupErr) {
      console.warn(`⚠️ Failed to cleanup file: ${cleanupErr.message}`);
    }

    // Check engine response
    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'API imported successfully', {
        api_id: engineResponse.data?.client_id || 'global',
        filename: fileName
      });
    } else {
      const errorMsg = engineResponse.data || 'Engine processing failed';
      sendError(res, 'Import failed', errorMsg, engineResponse.code || 500);
    }

  } catch (err) {
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.warn(`⚠️ Failed to cleanup temp file: ${cleanupErr.message}`);
      }
    }
    
    console.error('Import error:', err.message);
    sendError(res, 'Import failed', err.message, 500);
  }
});

// Import API from File (new standardized endpoint)
app.post('/api/apis/import/file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', null, 400);
    }

    const fileName = req.file.originalname;
    const tempPath = req.file.path;
    
    // Create Files directory if it doesn't exist
    const filesDir = path.join(__dirname, 'Files');
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }
    
    // Move file to Files directory with original name
    const finalPath = path.join(filesDir, fileName);
    fs.renameSync(tempPath, finalPath);

    const engineRequest = {
      command: "apis.import_file",
      data: {
        file: fileName
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    // Clean up file after processing
    try {
      fs.unlinkSync(finalPath);
    } catch (cleanupErr) {
      console.warn(`⚠️ Failed to cleanup file: ${cleanupErr.message}`);
    }

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'API imported from file successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to import API from file';
      sendError(res, 'Import API from file failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.warn(`⚠️ Failed to cleanup temp file: ${cleanupErr.message}`);
      }
    }
    
    console.error('Import API from file error:', err.message);
    sendError(res, 'Import API from file failed', err.message, 500);
  }
});

// Import API from URL
app.post('/api/apis/import/url', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url?.trim()) {
      return sendError(res, 'URL is required', null, 400);
    }

    // Basic URL validation
    try {
      new URL(url.trim());
    } catch (urlErr) {
      return sendError(res, 'Invalid URL format', null, 400);
    }

    const engineRequest = {
      command: "apis.import_url",
      data: {
        url: url.trim()
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'API imported from URL successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to import API from URL';
      sendError(res, 'Import API from URL failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Import API from URL error:', err.message);
    sendError(res, 'Import API from URL failed', err.message, 500);
  }
});

// ==================== ENDPOINT MANAGEMENT ROUTES ====================

// List API endpoints (existing endpoint)
app.post('/api/endpoints', async (req, res) => {
  try {
    const { api_id } = req.body;
    
    // Send request to engine - for demo, always use empty data since Python uses global API
    const engineRequest = {
      command: "endpoints.list",
      data: {}  // Empty data for demo - Python backend uses global API
    };

    const engineResponse = await sendToEngine(engineRequest);

    // Check engine response
    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Endpoints retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve endpoints';
      sendError(res, 'Endpoints retrieval failed', errorMsg, engineResponse.code || 500);
    }

  } catch (err) {
    console.error('Endpoints error:', err.message);
    sendError(res, 'Endpoints retrieval failed', err.message, 500);
  }
});

// Get endpoint details (existing endpoint)
app.post('/api/endpoints/details', async (req, res) => {
  try {
    const { endpoint_id, path, method } = req.body;
    
    if (!endpoint_id) {
      return sendError(res, 'Missing endpoint_id', null, 400);
    }

    // Send request to engine with parameters Python expects
    const engineRequest = {
      command: "endpoints.details",
      data: {
        id: endpoint_id,        // Python expects "id"
        path: path,             // Python expects "path"  
        method: method          // Python expects "method"
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    // Check engine response
    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Endpoint details retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve endpoint details';
      sendError(res, 'Endpoint details retrieval failed', errorMsg, engineResponse.code || 500);
    }

  } catch (err) {
    console.error('Endpoint details error:', err.message);
    sendError(res, 'Endpoint details retrieval failed', err.message, 500);
  }
});

// Add endpoint tags (existing endpoint)
app.post('/api/endpoints/tags/add', async (req, res) => {
  try {
    const { endpoint_id, path, method, tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return sendError(res, 'Missing tags (must be array)', null, 400);
    }

    if (!path || !method) {
      return sendError(res, 'Missing path or method', null, 400);
    }

    // Send request to engine with parameters Python expects
    const engineRequest = {
      command: "endpoints.tags.add",
      data: {
        path: path,
        method: method,
        tags: tags
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    // Check engine response
    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Tags added successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to add tags';
      sendError(res, 'Add tags failed', errorMsg, engineResponse.code || 500);
    }

  } catch (err) {
    console.error('Add tags error:', err.message);
    sendError(res, 'Add tags failed', err.message, 500);
  }
});

// Remove endpoint tags (existing endpoint)
app.post('/api/endpoints/tags/remove', async (req, res) => {
  try {
    const { endpoint_id, path, method, tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return sendError(res, 'Missing tags (must be array)', null, 400);
    }

    if (!path || !method) {
      return sendError(res, 'Missing path or method', null, 400);
    }

    // Send request to engine with parameters Python expects
    const engineRequest = {
      command: "endpoints.tags.remove",
      data: {
        path: path,
        method: method,
        tags: tags
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    // Check engine response
    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Tags removed successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to remove tags';
      sendError(res, 'Remove tags failed', errorMsg, engineResponse.code || 500);
    }

  } catch (err) {
    console.error('Remove tags error:', err.message);
    sendError(res, 'Remove tags failed', err.message, 500);
  }
});

// Replace endpoint tags (existing endpoint)
app.post('/api/endpoints/tags/replace', async (req, res) => {
  try {
    const { endpoint_id, path, method, tags } = req.body;
    
    if (!Array.isArray(tags)) {
      return sendError(res, 'Missing tags (must be array)', null, 400);
    }

    if (!path || !method) {
      return sendError(res, 'Missing path or method', null, 400);
    }

    // Send request to engine with parameters Python expects
    const engineRequest = {
      command: "endpoints.tags.replace",
      data: {
        path: path,
        method: method,
        tags: tags
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    // Check engine response
    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Tags replaced successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to replace tags';
      sendError(res, 'Replace tags failed', errorMsg, engineResponse.code || 500);
    }

  } catch (err) {
    console.error('Replace tags error:', err.message);
    sendError(res, 'Replace tags failed', err.message, 500);
  }
});

// Add endpoint flags
app.post('/api/endpoints/flags/add', authenticateToken, async (req, res) => {
  try {
    const { endpoint_id, path, method, flags } = req.body;
    
    if (!flags || typeof flags !== 'string') {
      return sendError(res, 'Missing flags (must be string)', null, 400);
    }

    if (!path || !method) {
      return sendError(res, 'Missing path or method', null, 400);
    }

    // Validate flag value against allowed flags
    const allowedFlags = [
      'BOLA', 'BKEN_AUTH', 'BOPLA', 'URC', 'BFLA', 
      'UABF', 'SSRF', 'SEC_MISC', 'IIM', 'UCAPI'
    ];
    
    if (!allowedFlags.includes(flags)) {
      return sendError(res, `Invalid flag. Allowed flags: ${allowedFlags.join(', ')}`, null, 400);
    }

    const engineRequest = {
      command: "endpoints.flags.add",
      data: {
        path: path,
        method: method,
        tags: flags  // Note: Engine expects 'tags' field for flags
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Flags added successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to add flags';
      sendError(res, 'Add flags failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Add flags error:', err.message);
    sendError(res, 'Add flags failed', err.message, 500);
  }
});

// Remove endpoint flags
app.post('/api/endpoints/flags/remove', authenticateToken, async (req, res) => {
  try {
    const { endpoint_id, path, method, flags } = req.body;
    
    if (!flags || typeof flags !== 'string') {
      return sendError(res, 'Missing flags (must be string)', null, 400);
    }

    if (!path || !method) {
      return sendError(res, 'Missing path or method', null, 400);
    }

    const engineRequest = {
      command: "endpoints.flags.remove",
      data: {
        path: path,
        method: method,
        flags: flags
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Flags removed successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to remove flags';
      sendError(res, 'Remove flags failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Remove flags error:', err.message);
    sendError(res, 'Remove flags failed', err.message, 500);
  }
});

// List all tags (existing endpoint)
app.get('/api/tags', async (req, res) => {
  try {
    // Send request to engine
    const engineRequest = {
      command: "tags.list",
      data: {}
    };

    const engineResponse = await sendToEngine(engineRequest);

    // Check engine response
    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Tags retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve tags';
      sendError(res, 'Tags retrieval failed', errorMsg, engineResponse.code || 500);
    }

  } catch (err) {
    console.error('List tags error:', err.message);
    sendError(res, 'List tags failed', err.message, 500);
  }
});

// ==================== SCAN MANAGEMENT ROUTES ====================

// Create Scan
app.post('/api/scans', authenticateToken, async (req, res) => {
  try {
    const { client_id, scan_profile = 'OWASP_API_10' } = req.body;

    if (!client_id?.trim()) {
      return sendError(res, 'Client ID is required', null, 400);
    }

    const engineRequest = {
      command: "scan.create",
      data: {
        client_id: client_id.trim(),
        scan_profile: scan_profile
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Scan created successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to create scan';
      sendError(res, 'Create scan failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Create scan error:', err.message);
    sendError(res, 'Create scan failed', err.message, 500);
  }
});

// Start Scan
app.post('/api/scans/start', authenticateToken, async (req, res) => {
  try {
    const { api_name, scan_profile = 'OWASP_API_10' } = req.body;

    if (!api_name?.trim()) {
      return sendError(res, 'API name is required', null, 400);
    }

    const engineRequest = {
      command: "scan.start",
      data: {
        api_name: api_name.trim(),
        scan_profile: scan_profile
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Scan started successfully', engineResponse.data);
    } else if (engineResponse.code === 503) {
      sendError(res, 'Scan in progress', engineResponse.data, 503);
    } else {
      const errorMsg = engineResponse.data || 'Failed to start scan';
      sendError(res, 'Start scan failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Start scan error:', err.message);
    sendError(res, 'Start scan failed', err.message, 500);
  }
});

// Check Scan Progress
app.get('/api/scans/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const engineRequest = {
      command: "scan.progress",
      data: {
        scan_id: id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Scan progress retrieved successfully', engineResponse.data);
    } else if (engineResponse.code === 404) {
      sendError(res, 'Scan not found', engineResponse.data, 404);
    } else {
      const errorMsg = engineResponse.data || 'Failed to get scan progress';
      sendError(res, 'Get scan progress failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get scan progress error:', err.message);
    sendError(res, 'Get scan progress failed', err.message, 500);
  }
});

// Stop Scan
app.post('/api/scans/:id/stop', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const engineRequest = {
      command: "scan.stop",
      data: {
        scan_id: id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Scan stopped successfully', engineResponse.data);
    } else if (engineResponse.code === 404) {
      sendError(res, 'Scan not found', engineResponse.data, 404);
    } else {
      const errorMsg = engineResponse.data || 'Failed to stop scan';
      sendError(res, 'Stop scan failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Stop scan error:', err.message);
    sendError(res, 'Stop scan failed', err.message, 500);
  }
});

// Get Scan Results
app.get('/api/scans/:id/results', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const engineRequest = {
      command: "scan.results",
      data: {
        scan_id: id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Scan results retrieved successfully', engineResponse.data);
    } else if (engineResponse.code === 404) {
      sendError(res, 'Scan not found', engineResponse.data, 404);
    } else {
      const errorMsg = engineResponse.data || 'Failed to get scan results';
      sendError(res, 'Get scan results failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get scan results error:', err.message);
    sendError(res, 'Get scan results failed', err.message, 500);
  }
});

// List All Scans
app.get('/api/scans', authenticateToken, async (req, res) => {
  try {
    const engineRequest = {
      command: "scan.list",
      data: {}
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Scans retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve scans';
      sendError(res, 'Get scans failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get scans error:', err.message);
    sendError(res, 'Get scans failed', err.message, 500);
  }
});

// ==================== TEMPLATE MANAGEMENT ROUTES ====================

// List All Templates
app.get('/api/templates', authenticateToken, async (req, res) => {
  try {
    const engineRequest = {
      command: "templates.list",
      data: {}
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Templates retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve templates';
      sendError(res, 'Get templates failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get templates error:', err.message);
    sendError(res, 'Get templates failed', err.message, 500);
  }
});

// Get Template Details
app.get('/api/templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const engineRequest = {
      command: "templates.details",
      data: {
        template_id: id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Template details retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve template details';
      sendError(res, 'Get template details failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get template details error:', err.message);
    sendError(res, 'Get template details failed', err.message, 500);
  }
});

// Use Template
app.post('/api/templates/:id/use', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { api_id } = req.body;

    if (!api_id?.trim()) {
      return sendError(res, 'API ID is required', null, 400);
    }

    const engineRequest = {
      command: "templates.use",
      data: {
        template_id: id,
        api_id: api_id.trim()
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Template used successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to use template';
      sendError(res, 'Use template failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Use template error:', err.message);
    sendError(res, 'Use template failed', err.message, 500);
  }
});

// ==================== USER MANAGEMENT ROUTES ====================

// Update User Profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username?.trim() && !email?.trim()) {
      return sendError(res, 'At least one field (username or email) is required', null, 400);
    }

    const updateData = {};
    if (username?.trim()) updateData.username = username.trim();
    if (email?.trim()) {
      if (!validateEmail(email.trim())) {
        return sendError(res, 'Invalid email format', null, 400);
      }
      updateData.email = email.trim().toLowerCase();
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return sendError(res, 'Failed to update profile', error.message, 500);
    }

    sendSuccess(res, 'Profile updated successfully', {
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
    console.error('Update profile error:', err.message);
    sendError(res, 'Update profile failed', err.message, 500);
  }
});

// Get User Settings
app.get('/api/users/settings', authenticateToken, async (req, res) => {
  try {
    const engineRequest = {
      command: "user.settings.get",
      data: {}
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'User settings retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve user settings';
      sendError(res, 'Get user settings failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get user settings error:', err.message);
    sendError(res, 'Get user settings failed', err.message, 500);
  }
});

// Update User Settings
app.put('/api/users/settings', authenticateToken, async (req, res) => {
  try {
    const { notifications } = req.body;

    const engineRequest = {
      command: "user.settings.update",
      data: {
        notifications: notifications
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'User settings updated successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to update user settings';
      sendError(res, 'Update user settings failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Update user settings error:', err.message);
    sendError(res, 'Update user settings failed', err.message, 500);
  }
});

// ==================== REPORT MANAGEMENT ROUTES ====================

// List All Reports
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const engineRequest = {
      command: "reports.list",
      data: {}
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Reports retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve reports';
      sendError(res, 'Get reports failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get reports error:', err.message);
    sendError(res, 'Get reports failed', err.message, 500);
  }
});

// Get Report Details
app.get('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const engineRequest = {
      command: "reports.details",
      data: {
        report_id: id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Report details retrieved successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to retrieve report details';
      sendError(res, 'Get report details failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Get report details error:', err.message);
    sendError(res, 'Get report details failed', err.message, 500);
  }
});

// Download Report
app.get('/api/reports/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { report_type = 'technical' } = req.query;

    // Validate report type
    if (!['technical', 'executive'].includes(report_type)) {
      return sendError(res, 'Invalid report type. Must be "technical" or "executive"', null, 400);
    }

    const engineRequest = {
      command: "reports.download",
      data: {
        report_id: id,
        report_type: report_type
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (engineResponse.code === 200 || engineResponse.code === '200') {
      sendSuccess(res, 'Report downloaded successfully', engineResponse.data);
    } else {
      const errorMsg = engineResponse.data || 'Failed to download report';
      sendError(res, 'Download report failed', errorMsg, engineResponse.code || 500);
    }
  } catch (err) {
    console.error('Download report error:', err.message);
    sendError(res, 'Download report failed', err.message, 500);
  }
});

// ==================== ERROR HANDLERS ====================

app.use('*', (req, res) => {
  sendError(res, 'Route not found', { path: req.originalUrl, method: req.method }, 404);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  sendError(res, 'Unhandled error', err.message, 500);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('🛑 Shutting down gracefully...');
  
  if (engineProcess) {
    console.log('🔌 Terminating engine process...');
    engineProcess.kill('SIGTERM');
    
    // Force kill if doesn't shut down in 5 seconds
    setTimeout(() => {
      if (engineProcess) {
        console.log('💀 Force killing engine process...');
        engineProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Export the app for testing, start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`⚡ Engine will auto-start when needed`);
  });
}

module.exports = app;