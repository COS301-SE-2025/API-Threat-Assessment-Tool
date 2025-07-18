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
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      profile: 'GET /api/auth/profile',
      users: 'GET /users',
      importApi: 'POST /api/import',
      listEndpoints: 'POST /api/endpoints',
      endpointDetails: 'POST /api/endpoints/details',
      addTags: 'POST /api/endpoints/tags/add',
      removeTags: 'POST /api/endpoints/tags/remove',
      replaceTags: 'POST /api/endpoints/tags/replace',
      listTags: 'GET /api/tags',
      addFlags: 'POST /api/endpoints/tags/add',
      removeFlags: 'POST /api/endpoints/tags/remove',
      replaceFlags: 'POST /api/endpoints/tags/replace',
      listFlags: 'GET /api/tags'
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

// Import API endpoint
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

// List API endpoints
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

// Add endpoint tags
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

// Remove endpoint tags
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

// Replace endpoint tags
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

// List all tags
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

// Add endpoint Flags
app.post('/api/endpoints/flags/add', async (req, res) => {
 
});

// Remove endpoint Flags
app.post('/api/endpoints/Flags/remove', async (req, res) => {
  
});

// Replace endpoint Flags
app.post('/api/endpoints/Flags/replace', async (req, res) => {
 
});

// List all Flags
app.get('/api/Flags', async (req, res) => {
  
});


// Get endpoint details
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