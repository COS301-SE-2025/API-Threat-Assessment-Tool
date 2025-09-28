// index.js - Enhanced with user profile and preferences endpoints + Commands.MD compliance + Google OAuth
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
const supabaseCfg = require('./config/supabase');         // uses your existing file
const app = express();
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Missing Supabase config. Add SUPABASE_URL and SUPABASE_KEY to your .env');

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
const ENGINE_SCRIPT = 'main.py';

// Engine process management
let engineProcess = null;
let engineStarting = false;

// File upload setup
const upload = multer({
  dest: 'uploads/',
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
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🔥 [${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
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

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.',
        statusCode: 401
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        statusCode: 500
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        statusCode: 401
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, first_name, last_name, email_confirmed, created_at')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        statusCode: 404
      });
    }

    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      statusCode: 500
    });
  }
};

// Input validation functions
const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return { isValid: false, error: 'User ID is required and must be a non-empty string' };
  }
  if (userId.trim().length > 100) {
    return { isValid: false, error: 'User ID must be less than 100 characters' };
  }
  return { isValid: true };
};

const validateApiId = (apiId, required = true) => {
  if (!apiId) {
    return required ? 
      { isValid: false, error: 'API ID is required' } : 
      { isValid: true };
  }
  if (typeof apiId !== 'string' || apiId.trim().length === 0) {
    return { isValid: false, error: 'API ID must be a non-empty string' };
  }
  if (apiId.trim().length > 100) {
    return { isValid: false, error: 'API ID must be less than 100 characters' };
  }
  return { isValid: true };
};

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

const validateProfileUpdate = data => {
  const { firstName, lastName, username } = data;
  const errors = [];
  
  if (firstName !== undefined) {
    if (!firstName || !firstName.trim()) {
      errors.push({ field: 'firstName', message: 'First name cannot be empty' });
    } else if (firstName.trim().length < 2) {
      errors.push({ field: 'firstName', message: 'First name must be at least 2 characters' });
    }
  }
  
  if (lastName !== undefined) {
    if (!lastName || !lastName.trim()) {
      errors.push({ field: 'lastName', message: 'Last name cannot be empty' });
    } else if (lastName.trim().length < 2) {
      errors.push({ field: 'lastName', message: 'Last name must be at least 2 characters' });
    }
  }
  
  if (username !== undefined) {
    if (!username || !username.trim()) {
      errors.push({ field: 'username', message: 'Username cannot be empty' });
    } else if (username.trim().length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

const validatePasswordUpdate = data => {
  const { currentPassword, newPassword, confirmPassword } = data;
  const errors = [];
  
  if (!currentPassword) {
    errors.push({ field: 'currentPassword', message: 'Current password is required' });
  }
  
  if (!newPassword) {
    errors.push({ field: 'newPassword', message: 'New password is required' });
  } else if (newPassword.length < 8) {
    errors.push({ field: 'newPassword', message: 'New password must be at least 8 characters' });
  }
  
  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Password confirmation does not match' });
  }
  
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push({ field: 'newPassword', message: 'New password must be different from current password' });
  }
  
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

// Forget Password
// --- Minimal mailer for dev: logs the link ( ---
let _tx = null, _label = 'none';
function bool(v){ return /^(1|true|yes)$/i.test(String(v||'')); }
function int(v, d){ const n = parseInt(v,10); return Number.isFinite(n) ? n : d; }
const GMAIL_USER = 'at.at.noreply@gmail.com';
const FROM_ADDR  = `AT-AT <${GMAIL_USER}>`;

async function makeGmailTransport() {
  const oAuth2 = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  );
  oAuth2.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

  const { token: accessToken } = await oAuth2.getAccessToken();

  const tx = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken
    }
  });

  await tx.verify();
  return tx;
}

async function sendResetEmail(to, resetUrl, ttlMins = 60) {
  const tx = await makeGmailTransport();
  const info = await tx.sendMail({
    from: FROM_ADDR,
    to,
    subject: 'AT-AT: Reset your password',
    text: `Reset your password (expires in ${ttlMins} minutes): ${resetUrl}`,
    html: `<p>Reset link (expires in ${ttlMins} minutes): <a href="${resetUrl}">${resetUrl}</a></p>`
  });
  console.log('[MAIL] sent', { accepted: info.accepted, response: info.response });
}
module.exports = { sendResetEmail };


  // 3) Dev fallback (unchanged)
  
const RESET_TTL_MS = 60 * 60 * 1000;   // 60 min
const pwdResetStore = new Map();       // tokenHash -> { userId, exp }

function newToken() {
  return crypto.randomBytes(32).toString('hex'); // opaque token
}
function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function saveResetToken(userId, token) {
  const h = sha256Hex(token);
  const exp = Date.now() + RESET_TTL_MS;
  pwdResetStore.set(h, { userId, exp });
  return exp;
}
function consumeResetToken(token) {
  const h = sha256Hex(token);
  const rec = pwdResetStore.get(h);
  if (!rec) return null;
  if (Date.now() > rec.exp) { pwdResetStore.delete(h); return null; }
  pwdResetStore.delete(h); // one-time use
  return rec;
}
// Optional background cleanup
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of pwdResetStore.entries()) if (v.exp <= now) pwdResetStore.delete(k);
  }, 60 * 1000);
}
// -----------------------------------------------------
// Engine management functions
const isEngineRunning = () => {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(2000);
    
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

const startEngine = () => {
  return new Promise((resolve, reject) => {
    if (engineProcess || engineStarting) {
      console.log('🔄 Engine already starting or running');
      return resolve();
    }
    
    engineStarting = true;
    console.log('🚀 Starting Python engine...');
    console.log(`📍 Working directory: ${path.join(process.cwd(), '../backend')}`);
    
    engineProcess = spawn('python', ['-u', 'main.py'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(process.cwd(), '../backend'),
      shell: true
    });
    
    console.log(`📊 Spawned process with PID: ${engineProcess.pid}`);
    
    engineProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`🐍 Engine stdout: ${output.trim()}`);
      
      if (output.includes('Listening on')) {
        engineStarting = false;
        console.log('✅ Engine started successfully');
        resolve();
      }
    });
    
    engineProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`⚠️ Engine stderr: ${error.trim()}`);
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
      console.error(`⚠️ Failed to start engine: ${err.message}`);
      engineStarting = false;
      reject(err);
    });
    
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

const ensureEngineRunning = async () => {
  const running = await isEngineRunning();
  if (!running) {
    console.log('⚡ Engine not running, starting it...');
    await startEngine();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};

// const sendToEngine = async (request) => {
//   await ensureEngineRunning();
  
//   return new Promise((resolve, reject) => {
//     const client = new net.Socket();
//     let responseData = '';
//     const startTime = Date.now();

//     console.log(`📊 Setting socket timeout to 120 seconds`);
//     client.setTimeout(120000);

//     client.on('connect', () => {
//       console.log(`🔗 Connected to engine at ${ENGINE_HOST}:${ENGINE_PORT}`);
//       client.write(JSON.stringify(request));
//       console.log(`📤 Sent to engine: ${request.command}`);
//     });

//     client.on('data', (data) => {
//       responseData += data.toString();
//       console.log(`📨 Received data chunk: ${data.toString().length} bytes`);
//     });

//     client.on('close', () => {
//       const elapsed = Date.now() - startTime;
//       console.log(`🔌 Connection to engine closed after ${elapsed}ms`);
//       console.log(`📦 Raw response data: [${responseData}]`);
//       try {
//         const response = JSON.parse(responseData);
//         console.log(`🔥 Engine response code: ${response.code}`);
        
//         if (response.code !== 200 && response.code !== '200') {
//           const errorMessage = response.data || 'Unknown engine error';
//           return reject(new Error(errorMessage));
//         }
        
//         resolve(response);
//       } catch (err) {
//         console.error(`⚠ Failed to parse response: ${err.message}`);
//         reject(new Error('Failed to parse engine response'));
//       }
//     });

//     client.on('error', (err) => {
//       const elapsed = Date.now() - startTime;
//       console.error(`⚠ Engine connection error after ${elapsed}ms:`, err.message);
//       reject(new Error(`Engine connection failed: ${err.message}`));
//     });

//     client.on('timeout', () => {
//       const elapsed = Date.now() - startTime;
//       console.error(`⏰ Engine connection timeout after ${elapsed}ms`);
//       client.destroy();
//       reject(new Error('Engine request timeout'));
//     });

//     client.connect(ENGINE_PORT, ENGINE_HOST);
//   });
// };


const sendToEngine = async (request, timeout = 30000) => {
  // ensureEngineRunning() should be defined elsewhere in your project
  // to start the Python backend if it's not already running.
  // await ensureEngineRunning();

  const ENGINE_PORT = 9011;
  const ENGINE_HOST = '127.0.0.1';

  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const chunks = [];
    const startTime = Date.now();

    console.log(`📊 Setting socket timeout to 120 seconds`);
    client.setTimeout(120000);

    // Event handler for when the connection is successfully established.
    client.on('connect', () => {
      const elapsed = Date.now() - startTime;
      console.log(`[CLIENT] Connected to engine at ${ENGINE_HOST}:${ENGINE_PORT} in ${elapsed}ms.`);
      
      const payload = JSON.stringify(request);

      // Use client.end() to send the data and immediately signal completion.
      client.end(payload);
      console.log(`[CLIENT] Sent command: ${request.command}`);
    });

    // Event handler for receiving data from the server.
    client.on('data', (chunk) => {
      chunks.push(chunk);
    });

    // Event handler for when the server closes the connection.
    client.on('close', () => {
      const elapsed = Date.now() - startTime;
      console.log(`[CLIENT] Connection closed by server after ${elapsed}ms.`);

      const responseData = Buffer.concat(chunks).toString();
      
      if (!responseData) {
        console.error('[CLIENT] No response data received before connection close.');
        return reject(new Error('Engine closed connection without a response.'));
      }

      try {
        const response = JSON.parse(responseData);
        
        // **FIX:** Resolve with the entire response object, not just the data part.
        // This makes the 'code' property available to the calling function.
        console.log(`[CLIENT] Successfully received and parsed response for command: ${request.command}`);
        resolve(response); 
      } catch (err) {
        console.error(`⚠️ Failed to parse response: ${err.message}`);
        reject(new Error('Failed to parse engine response'));
      }
    });

    // Event handler for any connection errors.
    client.on('error', (err) => {
      const elapsed = Date.now() - startTime;
      console.error(`⚠️ Engine connection error after ${elapsed}ms:`, err.message);
      reject(new Error(`Engine connection failed: ${err.message}`));
    });

    // Event handler for timeouts.
    client.on('timeout', () => {
      const elapsed = Date.now() - startTime;
      console.error(`[CLIENT] Connection timed out after ${elapsed}ms.`);
      client.destroy(new Error('Request Timeout'));
      reject(new Error('Engine request timed out.'));
    });

    // Initiate the connection.
    client.connect(ENGINE_PORT, ENGINE_HOST);
  });
};




// Routes
app.get('/', (req, res) => {
  sendSuccess(res, 'AT-AT API is running!', {
    version: '2.0.0',
    endpoints: {
      health: 'GET /',
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      googleLogin: 'POST /api/auth/google-login', // NEW: Google OAuth endpoint
      logout: 'POST /api/auth/logout',
      profile: 'GET /api/auth/profile',
      // User management
      updateProfile: 'PUT /api/user/update',
      updatePassword: 'PUT /api/user/password',
      getUserPreferences: 'GET /api/user/preferences',
      updatePreferences: 'PUT /api/user/preferences',
      // Engine commands from Commands.MD
      authRegister: 'POST /api/auth/register',
      authCheckLogin: 'POST /api/auth/check-login',
      authGoogle: 'POST /api/auth/google',
      // Forget password
      forgotPassword: 'POST /api/auth/forgot-password',
      resetPassword: 'POST /api/auth/reset-password',
      dashboardOverview: 'GET /api/dashboard/overview',
      dashboardMetrics: 'GET /api/dashboard/metrics',
      dashboardAlerts: 'GET /api/dashboard/alerts',
      getAllApis: 'GET /api/apis',
      createApi: 'POST /api/apis/create',
      getApiDetails: 'GET /api/apis/details',
      updateApi: 'PUT /api/apis/update',
      deleteApi: 'DELETE /api/apis/delete',
      validateApiKey: 'POST /api/apis/key/validate',
      setApiKey: 'POST /api/apis/key/set',
      importApiFromFile: 'POST /api/apis/import/file',
      importApiFromUrl: 'POST /api/apis/import/url',
      listEndpoints: 'POST /api/endpoints/list',
      endpointDetails: 'POST /api/endpoints/details',
      addEndpointTags: 'POST /api/endpoints/tags/add',
      removeEndpointTags: 'POST /api/endpoints/tags/remove',
      replaceEndpointTags: 'POST /api/endpoints/tags/replace',
      addEndpointFlags: 'POST /api/endpoints/flags/add',
      removeEndpointFlags: 'POST /api/endpoints/flags/remove',
      listTags: 'GET /api/tags',
      createScan: 'POST /api/scan/create',
      startScan: 'POST /api/scan/start',
      statusScan: 'POST /api/scan/status',
      detailsScan: 'POST /api/scan/details',
      scanProgress: 'GET /api/scan/progress',
      stopScan: 'POST /api/scan/stop',
      scanResults: 'GET /api/scan/results',
      getSchedule: 'GET /api/scans/schedule',
      saveSchedule: 'POST /api/scans/schedule',
      deleteSchedule: 'DELETE /api/scans/schedule',
      listScans: 'GET /api/scan/list',
      listTemplates: 'GET /api/templates/list',
      getTemplateDetails: 'GET /api/templates/details',
      useTemplate: 'POST /api/templates/use',
      getUserProfile: 'GET /api/user/profile/get',
      updateUserProfile: 'PUT /api/user/profile/update',
      getUserSettings: 'GET /api/user/settings/get',
      updateUserSettings: 'PUT /api/user/settings/update',
      listReports: 'GET /api/reports/list',
      getReportDetails: 'GET /api/reports/details',
      downloadReport: 'POST /api/reports/download',
      deleteShare: 'DELETE /api/apis/share',
      leaveShare: 'DELETE /api/apis/leave-share',
      getShare: 'GET /api/apis/shares',
      postShare: 'POST /api/apis/share',
      connectionTest: 'GET /api/connection/test'
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

// ==========================================================
// EXISTING USER MANAGEMENT ENDPOINTS
// ==========================================================

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    sendSuccess(res, 'Profile retrieved successfully', { 
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        emailConfirmed: req.user.email_confirmed,
        createdAt: req.user.created_at
      }
    });
  } catch (err) {
    sendError(res, 'Profile error', err.message, 500);
  }
});

app.put('/api/user/update', authenticateToken, async (req, res) => {
  try {
    const validation = validateProfileUpdate(req.body);
    if (!validation.isValid) {
      return sendError(res, 'Validation failed', validation.errors, 400);
    }

    const { firstName, lastName, username } = req.body;
    const updateData = {};
    const changedFields = [];

    if (firstName !== undefined) {
      updateData.first_name = firstName.trim();
      changedFields.push('firstName');
    }
    if (lastName !== undefined) {
      updateData.last_name = lastName.trim();
      changedFields.push('lastName');
    }
    if (username !== undefined) {
      updateData.username = username.trim();
      changedFields.push('username');
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.userId)
      .select('id, email, username, first_name, last_name, email_confirmed, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return sendError(res, 'Username already exists', null, 409);
      }
      console.error('Profile update error:', error);
      return sendError(res, 'Database error', error.message, 500);
    }

    if (!data) {
      return sendError(res, 'User not found or update failed', null, 404);
    }

    try {
      await supabase
        .from('user_activity_log')
        .insert([{
          user_id: req.userId,
          action: 'profile_updated',
          description: `User updated profile fields: ${changedFields.join(', ')}`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          metadata: { changedFields, newValues: updateData }
        }]);
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
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
    console.error('Update profile error:', err);
    sendError(res, 'Failed to update profile', err.message, 500);
  }
});

app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const validation = validatePasswordUpdate(req.body);
    if (!validation.isValid) {
      return sendError(res, 'Validation failed', validation.errors, 400);
    }

    const { currentPassword, newPassword } = req.body;

    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.userId)
      .single();

    if (fetchError || !userData) {
      return sendError(res, 'User not found', null, 404);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isCurrentPasswordValid) {
      try {
        await supabase
          .from('user_activity_log')
          .insert([{
            user_id: req.userId,
            action: 'password_change_failed',
            description: 'Failed password change attempt - incorrect current password',
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
          }]);
      } catch (logError) {
        console.warn('Failed to log activity:', logError);
      }
      
      return sendError(res, 'Current password is incorrect', null, 400);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return sendError(res, 'Password update failed', updateError.message, 500);
    }

    try {
      await supabase
        .from('user_activity_log')
        .insert([{
          user_id: req.userId,
          action: 'password_changed',
          description: 'User successfully changed their password',
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        }]);
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    sendSuccess(res, 'Password updated successfully');

  } catch (err) {
    console.error('Update password error:', err);
    sendError(res, 'Failed to update password', err.message, 500);
  }
});

app.get('/api/user/preferences', authenticateToken, async (req, res) => {
  try {
    const { data: prefsData, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    let preferences;
    if (prefsError && prefsError.code === 'PGRST116') {
      const defaultPrefs = {
        user_id: req.userId,
        notification_scan_completed: true,
        notification_critical_findings: true,
        notification_weekly_report: false,
        notification_product_updates: true,
        notification_email_digest: true,
        notification_sms_alerts: false,
        security_two_factor_auth: false,
        security_session_timeout: 30,
        security_login_notifications: true,
        pref_theme: 'auto',
        pref_default_scan_profile: 'owasp',
        pref_auto_save_reports: true,
        pref_email_frequency: 'weekly'
      };

      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert([defaultPrefs])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default preferences:', insertError);
        preferences = {
          notifications: {
            scanCompleted: true,
            criticalFindings: true,
            weeklyReport: false,
            productUpdates: true,
            emailDigest: true,
            smsAlerts: false,
          },
          security: {
            twoFactorAuth: false,
            sessionTimeout: '30',
            loginNotifications: true,
          },
          preferences: {
            theme: 'auto',
            defaultScanProfile: 'owasp',
            autoSaveReports: true,
            emailFrequency: 'weekly',
          },
        };
      } else {
        const prefsData = newPrefs;
      }
    }

    if (prefsData) {
      preferences = {
        notifications: {
          scanCompleted: prefsData.notification_scan_completed,
          criticalFindings: prefsData.notification_critical_findings,
          weeklyReport: prefsData.notification_weekly_report,
          productUpdates: prefsData.notification_product_updates,
          emailDigest: prefsData.notification_email_digest,
          smsAlerts: prefsData.notification_sms_alerts,
        },
        security: {
          twoFactorAuth: prefsData.security_two_factor_auth,
          sessionTimeout: String(prefsData.security_session_timeout),
          loginNotifications: prefsData.security_login_notifications,
        },
        preferences: {
          theme: prefsData.pref_theme,
          defaultScanProfile: prefsData.pref_default_scan_profile,
          autoSaveReports: prefsData.pref_auto_save_reports,
          emailFrequency: prefsData.pref_email_frequency,
        },
      };
    }

    sendSuccess(res, 'Preferences retrieved successfully', { preferences });
  } catch (err) {
    console.error('Get preferences error:', err);
    sendError(res, 'Failed to retrieve preferences', err.message, 500);
  }
});

app.put('/api/user/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return sendError(res, 'Invalid preferences data', null, 400);
    }

    const updateData = {};
    
    if (preferences.notifications) {
      Object.assign(updateData, {
        notification_scan_completed: preferences.notifications.scanCompleted,
        notification_critical_findings: preferences.notifications.criticalFindings,
        notification_weekly_report: preferences.notifications.weeklyReport,
        notification_product_updates: preferences.notifications.productUpdates,
        notification_email_digest: preferences.notifications.emailDigest,
        notification_sms_alerts: preferences.notifications.smsAlerts,
      });
    }

    if (preferences.security) {
      Object.assign(updateData, {
        security_two_factor_auth: preferences.security.twoFactorAuth,
        security_session_timeout: parseInt(preferences.security.sessionTimeout, 10) || 30,
        security_login_notifications: preferences.security.loginNotifications,
      });
    }

    if (preferences.preferences) {
      Object.assign(updateData, {
        pref_theme: preferences.preferences.theme,
        pref_default_scan_profile: preferences.preferences.defaultScanProfile,
        pref_auto_save_reports: preferences.preferences.autoSaveReports,
        pref_email_frequency: preferences.preferences.emailFrequency,
      });
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        { user_id: req.userId, ...updateData },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Preferences update error:', error);
      return sendError(res, 'Failed to update preferences', error.message, 500);
    }

    try {
      await supabase
        .from('user_activity_log')
        .insert([{
          user_id: req.userId,
          action: 'preferences_updated',
          description: 'User updated their preferences',
          metadata: { sections: Object.keys(preferences) }
        }]);
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }
    
    sendSuccess(res, 'Preferences updated successfully');
  } catch (err) {
    console.error('Update preferences error:', err);
    sendError(res, 'Failed to update preferences', err.message, 500);
  }
});

app.get('/api/user/extended-profile', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profile_extended')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return sendError(res, 'Database error', error.message, 500);
    }

    const profile = data || {
      phone: '',
      company: '',
      position: '',
      timezone: 'UTC+02:00',
      avatar_url: '',
      bio: '',
      website_url: '',
      location: ''
    };

    sendSuccess(res, 'Extended profile retrieved successfully', { profile });
  } catch (err) {
    console.error('Get extended profile error:', err);
    sendError(res, 'Failed to retrieve extended profile', err.message, 500);
  }
});

app.put('/api/user/extended-profile', authenticateToken, async (req, res) => {
  try {
    const { phone, company, position, timezone, bio, website_url, location } = req.body;

    const validationErrors = [];
    
    if (phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(phone.trim())) {
      validationErrors.push({ field: 'phone', message: 'Invalid phone number format' });
    }
    
    if (website_url && !/^https?:\/\/.+/.test(website_url.trim())) {
      validationErrors.push({ field: 'website_url', message: 'Website URL must start with http:// or https://' });
    }
    
    if (bio && bio.length > 500) {
      validationErrors.push({ field: 'bio', message: 'Bio must be less than 500 characters' });
    }

    if (validationErrors.length > 0) {
      return sendError(res, 'Validation failed', validationErrors, 400);
    }

    const updateData = {
      user_id: req.userId,
      phone: phone ? phone.trim() : null,
      company: company ? company.trim() : null,
      position: position ? position.trim() : null,
      timezone: timezone || 'UTC+02:00',
      bio: bio ? bio.trim() : null,
      website_url: website_url ? website_url.trim() : null,
      location: location ? location.trim() : null,
    };

    const { data, error } = await supabase
      .from('user_profile_extended')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Extended profile update error:', error);
      return sendError(res, 'Failed to update extended profile', error.message, 500);
    }

    try {
      await supabase
        .from('user_activity_log')
        .insert([{
          user_id: req.userId,
          action: 'extended_profile_updated',
          description: 'User updated their extended profile',
          metadata: { fields: Object.keys(updateData) }
        }]);
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    sendSuccess(res, 'Extended profile updated successfully', { profile: data });
  } catch (err) {
    console.error('Update extended profile error:', err);
    sendError(res, 'Failed to update extended profile', err.message, 500);
  }
});

// ==========================================================
// EXISTING AUTHENTICATION ROUTES
// ==========================================================

app.post('/api/auth/signup', createRateLimit(100, 60 * 60 * 1000), async (req, res) => {
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

app.post('/api/auth/login', createRateLimit(200, 15 * 60 * 1000), async (req, res) =>{
  try {
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) return sendError(res, 'Missing credentials', null, 400);

    let query = supabase.from('users').select('*');
    
    const identifier = email ? email.trim().toLowerCase() : username.trim().toLowerCase();
    if (email) {
      query = query.eq('email', identifier);
    } else if (username) {
      query = query.ilike('username', identifier);
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

// ==========================================================
// NEW: GOOGLE OAUTH LOGIN ENDPOINT
// ==========================================================

app.post('/api/auth/google-login', createRateLimit(200, 15 * 60 * 1000), async (req, res) =>  {
  try {
    const {
      email,
      firstName,
      lastName,
      name,
      profilePicture,
      googleId,
      provider = 'google'
    } = req.body;

    console.log('🔍 Google OAuth attempt:', { email, googleId: googleId?.substring(0, 10) + '...' });

    // Validate required fields
    if (!email || !googleId) {
      return sendError(res, 'Missing required Google user data', null, 400);
    }

    // Validate email format
    if (!validateEmail(email)) {
      return sendError(res, 'Invalid email format', null, 400);
    }

    // Check if user exists by email
    const { data: existingUsers, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase());

    if (searchError) {
      console.error('❌ User search error:', searchError);
      return sendError(res, 'Database error during user lookup', searchError.message, 500);
    }

    let user;

    if (existingUsers && existingUsers.length > 0) {
      // User exists - update Google info and last login
      user = existingUsers[0];
      
      console.log('👤 Updating existing user:', user.email);

      const updateData = {
        google_id: googleId,
        auth_provider: provider,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update profile picture if provided and not already set
      if (profilePicture && !user.profile_picture) {
        updateData.profile_picture = profilePicture;
      }

      // Update names if they weren't set before
      if (!user.first_name && firstName) {
        updateData.first_name = firstName.trim();
      }
      if (!user.last_name && lastName) {
        updateData.last_name = lastName.trim();
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('❌ User update error:', updateError);
        return sendError(res, 'Failed to update user', updateError.message, 500);
      }

      user = updatedUser;

    } else {
      // Create new user from Google data
      console.log('✨ Creating new user from Google data');
      
      // Generate a unique username from email
      let baseUsername = email.split('@')[0].toLowerCase();
      let username = baseUsername;
      
      // Check if username already exists and make it unique
      const { data: existingUsernames } = await supabase
        .from('users')
        .select('username')
        .ilike('username', `${baseUsername}%`);

      if (existingUsernames && existingUsernames.length > 0) {
        username = `${baseUsername}_${Date.now()}`;
      }

      const userData = {
        id: crypto.randomUUID(),
        email: email.trim().toLowerCase(),
        first_name: firstName ? firstName.trim() : '',
        last_name: lastName ? lastName.trim() : '',
        username: username,
        profile_picture: profilePicture || '',
        google_id: googleId,
        auth_provider: provider,
        email_confirmed: true, // Google emails are verified
        password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10), // Random secure password
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(), // Added this field
        last_login: new Date().toISOString()
      };

      console.log('📝 Inserting user data:', { ...userData, password: '[HIDDEN]' });

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([userData])
        .select('*')
        .single();

      if (createError) {
        console.error('❌ User creation error:', createError);
        
        // Handle specific errors
        if (createError.code === '23505') {
          if (createError.message.includes('email')) {
            return sendError(res, 'An account with this email already exists', null, 409);
          }
          if (createError.message.includes('username')) {
            // Retry with a more unique username
            userData.username = `${baseUsername}_${crypto.randomBytes(4).toString('hex')}`;
            
            const { data: retryUser, error: retryError } = await supabase
              .from('users')
              .insert([userData])
              .select('*')
              .single();

            if (retryError) {
              console.error('❌ Retry user creation error:', retryError);
              return sendError(res, 'Failed to create user account', retryError.message, 500);
            }
            user = retryUser;
          } else {
            return sendError(res, 'Duplicate entry error', createError.message, 409);
          }
        } else {
          return sendError(res, 'Failed to create user account', createError.message, 500);
        }
      } else {
        user = newUser;
      }

      console.log('✅ User created successfully:', user.email);
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return sendError(res, 'Server configuration error', null, 500);
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Longer expiry for OAuth users
    );

    // Log successful login activity (optional)
    try {
      await supabase
        .from('user_activity_log')
        .insert([{
          user_id: user.id,
          action: 'google_login',
          description: 'User logged in via Google OAuth',
          ip_address: req.ip || 'unknown',
          user_agent: req.get('User-Agent') || 'unknown',
          metadata: { provider, googleId: googleId.substring(0, 10) + '...' }
        }]);
    } catch (logError) {
      console.warn('⚠️ Failed to log Google login activity:', logError.message);
      // Don't fail the login if activity logging fails
    }

    // Return user data in the format expected by frontend
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      profilePicture: user.profile_picture,
      authProvider: user.auth_provider,
      emailConfirmed: user.email_confirmed,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };

    console.log('🎉 Google login successful for:', user.email);

    sendSuccess(res, 'Google login successful', {
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('💥 Google login error:', error);
    sendError(res, 'Google login failed', error.message, 500);
  }
});

// ==========================================================
// REST OF EXISTING ROUTES CONTINUE HERE...
// ==========================================================

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return sendError(res, 'Logout failed', error.message, 400);
    sendSuccess(res, 'Logged out');
  } catch (err) {
    sendError(res, 'Logout error', err.message, 500);
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    sendSuccess(res, 'Profile retrieved', {
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        emailConfirmed: req.user.email_confirmed,
        createdAt: req.user.created_at
      }
    });
  } catch (err) {
    sendError(res, 'Profile error', err.message, 500);
  }
});

// ==========================================================
// NEW ENDPOINTS FROM COMMANDS.MD - UPDATED WITH REQUIRED PARAMETERS
// ==========================================================

// Register new user (auth.register)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return sendError(res, 'Missing required fields', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'auth.register',
      data: { username, password, email }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'User registered successfully');
    } else {
      sendError(res, 'Registration failed', engineResponse.data, 400);
    }
  } catch (err) {
    sendError(res, 'Registration error', err.message, 500);
  }
});

// Check User Login (auth.login)
app.post('/api/auth/check-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return sendError(res, 'Missing username or password', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'auth.login',
      data: { username, password }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Login validated successfully', engineResponse.data);
    } else {
      sendError(res, 'Login validation failed', null, 400);
    }
  } catch (err) {
    sendError(res, 'Login validation error', err.message, 500);
  }
});

// Login with Google (auth.google)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return sendError(res, 'Missing Google OAuth token', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'auth.google',
      data: { token }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Google login successful', engineResponse.data);
    } else {
      sendError(res, 'Google login failed', null, 400);
    }
  } catch (err) {
    sendError(res, 'Google login error', err.message, 500);
  }
});

// Dashboard Overview (dashboard.overview)
app.get('/api/dashboard/overview', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    console.log("Dashboard overview user_id:", user_id);

    if (!user_id) {
      return sendError(res, 'User ID is required.', null, 400);
    }
    
    const engineResponse = await sendToEngine({
      command: 'dashboard.overview',
      data: { user_id }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Dashboard overview retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get dashboard overview', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Dashboard overview error', err.message, 500);
  }
});

// Dashboard Metrics (dashboard.metrics)
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const engineResponse = await sendToEngine({
      command: 'dashboard.metrics',
      data: {}
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Dashboard metrics retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get dashboard metrics', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Dashboard metrics error', err.message, 500);
  }
});

// Dashboard Alerts (dashboard.alerts)
app.get('/api/dashboard/alerts', async (req, res) => {
  try {
    const engineResponse = await sendToEngine({
      command: 'dashboard.alerts',
      data: {}
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Dashboard alerts retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get dashboard alerts', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Dashboard alerts error', err.message, 500);
  }
});

// Get All APIs (apis.get_all) - UPDATED: Now requires user_id
app.get('/api/apis', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    // Validate required user_id parameter
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }

    const engineResponse = await sendToEngine({
      command: 'apis.get_all',
      data: { user_id: user_id.trim() }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'APIs retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to retrieve APIs', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Get APIs error', err.message, 500);
  }
});

// Create API (apis.create)
app.post('/api/apis/create', async (req, res) => {
  try {
    const { name, description, file } = req.body;
    if (!name) {
      return sendError(res, 'API name is required', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'apis.create',
      data: { name, description, file }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'API created successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to create API', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Create API error', err.message, 500);
  }
});

// Get API Details (apis.details) - UPDATED: Now requires user_id
app.get('/api/apis/details', async (req, res) => {
  try {
    const { api_id, user_id } = req.query;
    
    // Validate required parameters
    if (!api_id) {
      return sendError(res, 'API ID is required', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }

    const engineResponse = await sendToEngine({
      command: 'apis.details',
      data: { 
        api_id: api_id.trim(),
        user_id: user_id.trim()
      }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'API details retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get API details', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Get API details error', err.message, 500);
  }
});

// Update API (apis.update) - UPDATED: Now requires user_id
app.put('/api/apis/update', async (req, res) => {
  try {
    const { api_id, user_id, updates } = req.body;
    
    // Validate required parameters
    if (!api_id) {
      return sendError(res, 'API ID is required', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }

    const engineResponse = await sendToEngine({
      command: 'apis.update',
      data: { 
        api_id: api_id.trim(),
        user_id: user_id.trim(),
        updates
      }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'API updated successfully');
    } else {
      sendError(res, 'Failed to update API', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Update API error', err.message, 500);
  }
});

// Delete API (apis.delete) - UPDATED: Now requires user_id
app.delete('/api/apis/delete', async (req, res) => {
  try {
    const { api_id, user_id } = req.body;
    
    // Validate required parameters
    if (!api_id) {
      return sendError(res, 'API ID is required', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }

    const engineResponse = await sendToEngine({
      command: 'apis.delete',
      data: { 
        api_id: api_id.trim(),
        user_id: user_id.trim()
      }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'API deleted successfully');
    } else {
      sendError(res, 'Failed to delete API', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Delete API error', err.message, 500);
  }
});

// Validate API Key (apis.key.validate) - UPDATED: Now requires user_id and api_id
app.post('/api/apis/key/validate', async (req, res) => {
  try {
    const { api_key, user_id, api_id } = req.body;
    
    // Validate required parameters
    if (!api_key) {
      return sendError(res, 'API key is required', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    
    // const apiIdValidation = validateApiId(api_id, true);
    // if (!apiIdValidation.isValid) {
    //   return sendError(res, apiIdValidation.error, null, 400);
    // }


    const engineResponse = await sendToEngine({
      command: 'apis.key.validate',
      data: { 
        api_key: api_key.trim(),
        user_id: user_id.trim(),
        api_id: api_id.trim()
      }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'API key validated successfully');
    } else {
      sendError(res, 'API key validation failed', engineResponse.data, 400);
    }
  } catch (err) {
    sendError(res, 'API key validation error', err.message, 500);
  }
});

// Set API Key (apis.key.set) - UPDATED: Now requires user_id and api_id
app.post('/api/apis/key/set', async (req, res) => {
  try {
    const { api_key, user_id, api_id } = req.body;
    
    // Validate required parameters
    if (!api_key) {
      return sendError(res, 'API key is required', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    
    // const apiIdValidation = validateApiId(api_id, true);
    // if (!apiIdValidation.isValid) {
    //   return sendError(res, apiIdValidation.error, null, 400);
    // }


    const engineResponse = await sendToEngine({
      command: 'apis.key.set',
      data: { 
        api_key: api_key.trim(),
        user_id: user_id.trim(),
        api_id: api_id.trim()
      }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'API key set successfully');
    } else {
      sendError(res, 'Failed to set API key', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Set API key error', err.message, 500);
  }
});

// Import API from File (apis.import_file) - UPDATED: Now requires user_id
// We will apply the middleware inside, after validating user_id
app.post('/api/import', async (req, res) => {
  // Use multer as a middleware function within the route handler
  upload.single('file')(req, res, async (err) => {
    if (err) {
      // Handle multer-specific errors
      return sendError(res, err.message, null, 400);
    }

    try {
      if (!req.file) {
        return sendError(res, 'No file uploaded', null, 400);
      }

      const { user_id } = req.body;
      
      const userIdValidation = validateUserId(user_id);
      if (!userIdValidation.isValid) {
        // Clean up the uploaded file if validation fails
        if (req.file && req.file.path) fs.unlinkSync(req.file.path);
        return sendError(res, userIdValidation.error, null, 400);
      }

      // The rest of your original logic from this route goes here...
      const fileName = req.file.originalname;
      const tempPath = req.file.path;
      
      const filesDir = path.join(__dirname, 'Files');
      if (!fs.existsSync(filesDir)) {
        fs.mkdirSync(filesDir, { recursive: true });
      }
      
      const finalPath = path.join(filesDir, fileName);
      fs.renameSync(tempPath, finalPath);
      
      console.log(`📁 File saved to: ${finalPath}`);

      const engineRequest = {
        command: "apis.import_file",
        data: {
          file: fileName,
          user_id: user_id.trim()
        }
      };

      const engineResponse = await sendToEngine(engineRequest);

      try {
        fs.unlinkSync(finalPath);
        console.log(`🗑️ Cleaned up file: ${finalPath}`);
      } catch (cleanupErr) {
        console.warn(`⚠️ Failed to cleanup file: ${cleanupErr.message}`);
      }
      
      console.log(engineResponse);

      if (engineResponse.code === 200 || engineResponse.code === '200') {
        const apiId = engineResponse.data?.api_id;
        if (!apiId) {
          return sendError(res, 'Import failed', 'Engine did not return a valid API ID.', 500);
        }
        sendSuccess(res, 'API imported successfully', {
          api_id: apiId,
          filename: fileName
        });
      } else {
        const errorMsg = engineResponse.data || 'Engine processing failed';
        sendError(res, 'Import failed', errorMsg, engineResponse.code || 500);
      }

    } catch (err) {
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
});

// Import API from URL (apis.import_url)
app.post('/api/apis/import/url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return sendError(res, 'URL is required', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'apis.import_url',
      data: { url }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'API imported from URL successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to import API from URL', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Import from URL error', err.message, 500);
  }
});

// List API Endpoints (endpoints.list)
app.post('/api/endpoints', async (req, res) => {
  try {
    const { api_id } = req.body;
    const {user_id} = req.body;
    
    const engineRequest = {
      command: "endpoints.list",
      data: {
        api_id: api_id, 
        user_id: user_id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

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

// Get Endpoint Details (endpoints.details)
app.post('/api/endpoints/details', async (req, res) => {
  try {
    const { endpoint_id, path, method, user_id, api_id } = req.body;
    
    if (!endpoint_id) {
      return sendError(res, 'Missing endpoint_id', null, 400);
    }

    if (!api_id) {
      return sendError(res, 'Missing api_id', null, 400);
    }

    if (!user_id) {
      return sendError(res, 'Missing api_id', null, 400);
    }

    const engineRequest = {
      command: "endpoints.details",
      data: {
        api_id: api_id,
        endpoint_id: endpoint_id,
        user_id: user_id.trim(), 
        path: path,
        method: method
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

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

// Add Endpoint Tags (endpoints.tags.add) - UPDATED: Now requires user_id and api_id
app.post('/api/endpoints/tags/add', async (req, res) => {
  try {
    const { endpoint_id, path, method, tags, user_id, api_id } = req.body;
    console.log(endpoint_id, path, method, tags, user_id, api_id)

    
    // Validate required parameters
    if (!tags || !Array.isArray(tags)) {
      return sendError(res, 'Missing tags (must be array)', null, 400);
    }

    if (!path || !method) {
      return sendError(res, 'Missing path or method', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    // const apiIdValidation = validateApiId(api_id, true);
    // if (!apiIdValidation.isValid) {
    //   return sendError(res, apiIdValidation.error, null, 400);
    // }


    const engineRequest = {
      command: "endpoints.tags.add",
      data: {
        endpoint_id: endpoint_id, 
        path: path,
        method: method,
        tags: tags,
        user_id: user_id.trim(),
        api_id: api_id
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

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

// Remove Endpoint Tags (endpoints.tags.remove) - UPDATED: Now requires user_id and api_id
app.post('/api/endpoints/tags/remove', async (req, res) => {
  try {
    const { endpoint_id, path, method, tags, user_id, api_id } = req.body;
    
    // Validate required parameters
    if (!tags || !Array.isArray(tags)) {
      return sendError(res, 'Missing tags (must be array)', null, 400);
    }

    if (!path || !method) {
      return sendError(res, 'Missing path or method', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    
    // const apiIdValidation = validateApiId(api_id, true);
    // if (!apiIdValidation.isValid) {
    //   return sendError(res, apiIdValidation.error, null, 400);
    // }

    const engineRequest = {
      command: "endpoints.tags.remove",
      data: {
        endpoint_id: endpoint_id, 
        path: path,
        method: method,
        tags: tags,
        user_id: user_id.trim(),
        api_id: api_id.trim()
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

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

// Replace Endpoint Tags (endpoints.tags.replace)
app.post('/api/endpoints/tags/replace', async (req, res) => {
  try {
    const { endpoint_id, path, method, tags } = req.body;
    
    if (!Array.isArray(tags)) {
      return sendError(res, 'Missing tags (must be array)', null, 400);
    }

    if (!path || !method) {
      return sendError(res, 'Missing path or method', null, 400);
    }

    const engineRequest = {
      command: "endpoints.tags.replace",
      data: {
        endpoint_id: endpoint_id, 
        path: path,
        method: method,
        tags: tags
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

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

// List All Tags (tags.list) - UPDATED: Now requires user_id and api_id
app.get('/api/tags', async (req, res) => {
  try {
    const { user_id, api_id } = req.query;
    
    // Validate required parameters
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    
    // const apiIdValidation = validateApiId(api_id, true);
    // if (!apiIdValidation.isValid) {
    //   return sendError(res, apiIdValidation.error, null, 400);
    // }

    const engineRequest = {
      command: "tags.list",
      data: {
        user_id: user_id.trim(),
        api_id: api_id.trim()
      }
    };

    const engineResponse = await sendToEngine(engineRequest);

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

// Add Endpoint Flags (endpoints.flags.add) - UPDATED: Now requires user_id and api_id
app.post('/api/endpoints/flags/add', async (req, res) => {
  try {
    const { endpoint_id, path, method, flags, user_id, api_id } = req.body;
    
    // Validate required parameters
    if (!flags) {
      return sendError(res, 'Missing flags', null, 400);
    }

    if (!endpoint_id && (!path || !method)) {
      return sendError(res, 'Missing endpoint_id or path/method', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    
    // const apiIdValidation = validateApiId(api_id, true);
    // if (!apiIdValidation.isValid) {
    //   return sendError(res, apiIdValidation.error, null, 400);
    // }

    const engineRequest = {
      command: "endpoints.flags.add",
      data: {
        endpoint_id: endpoint_id,
        path: path,
        method: method,
        flags: flags,
        user_id: user_id.trim(),
        api_id: api_id.trim()
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

// Remove Endpoint Flags (endpoints.flags.remove) - UPDATED: Now requires user_id and api_id
app.post('/api/endpoints/flags/remove', async (req, res) => {
  try {
    const { endpoint_id, path, method, flags, user_id, api_id } = req.body;
    
    // Validate required parameters
    if (!flags) {
      return sendError(res, 'Missing flags', null, 400);
    }

    if (!endpoint_id && (!path || !method)) {
      return sendError(res, 'Missing endpoint_id or path/method', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    
    // const apiIdValidation = validateApiId(api_id, true);
    // if (!apiIdValidation.isValid) {
    //   return sendError(res, apiIdValidation.error, null, 400);
    // }

    const engineRequest = {
      command: "endpoints.flags.remove",
      data: {
        endpoint_id: endpoint_id,
        path: path,
        method: method,
        flags: flags,
        user_id: user_id.trim(),
        api_id: api_id.trim()
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

// Create Scan (scan.create) - UPDATED: Now requires user_id (renamed from client_id)
app.post('/api/scan/create', async (req, res) => {
  try {
    const { user_id, scan_profile, api_id } = req.body;
    
    // Use user_id as primary, fall back to client_id for backward compatibility
    const finalUserId = user_id;
    
    // Validate required parameters
    const userIdValidation = validateUserId(finalUserId);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    
    // const apiIdValidation = validateApiId(api_id, true);
    // if (!apiIdValidation.isValid) {
    //   return sendError(res, apiIdValidation.error, null, 400);
    // }

    const engineResponse = await sendToEngine({
      command: 'scan.create',
      data: { 
        user_id: finalUserId.trim(),
        api_id: api_id.trim(),
        scan_profile: scan_profile || 'OWASP_API_10' 
      }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Scan created successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to create scan', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Create scan error', err.message, 500);
  }
});

// Start Scan (scan.start) - UPDATED: Now requires user_id and api_id (renamed from api_name)
app.post('/api/scan/start', async (req, res) => {
  try {
    const { api_id, scan_profile, user_id } = req.body;
    
    // Use api_id as primary, fall back to api_name for backward compatibility
    const finalApiId = api_id;
    
    // Validate required parameters
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    
    const apiIdValidation = validateApiId(finalApiId, true);
    if (!apiIdValidation.isValid) {
      return sendError(res, apiIdValidation.error, null, 400);
    }

    const engineResponse = await sendToEngine({
      command: 'scan.start',
      data: { 
        api_id: finalApiId.trim(),
        user_id: user_id.trim(),
        scan_profile 
      }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Scan started successfully', engineResponse.data);
    } else if (engineResponse.code === 503) {
      sendError(res, 'Scan in Progress', engineResponse.data, 503);
    } else {
      sendError(res, 'Failed to start scan', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Start scan error', err.message, 500);
  }
});

app.post('/api/scan/status', async (req, res) => {
  try {
    const { scan_id } = req.body;

    // Basic validation
    if (!scan_id || typeof scan_id !== 'string') {
      return sendError(res, 'A valid scan_id is required.', null, 400);
    }

    const engineResponse = await sendToEngine({
      command: 'scan.status',
      data: { scan_id: scan_id.trim() }
    });

    if (engineResponse.code === 200) {
      sendSuccess(res, 'Scan status retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get scan status', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Get scan status error', err.message, 500);
  }
});

// index.js around line 1819

// FIX: Change 'scan.details' to 'scan.status' to match the Python backend handler.
app.post('/api/scan/details', async (req, res) => {
  try {
    const { scan_id } = req.body;

    if (!scan_id || typeof scan_id !== 'string') {
      return sendError(res, 'A valid scan_id is required.', null, 400);
    }

    // Forward the request to the python engine
    const engineResponse = await sendToEngine({
      command: 'scan.status', // <-- This was 'scan.details'
      data: { scan_id: scan_id.trim() }
    });

    if (engineResponse.code === 200) {
      sendSuccess(res, 'Scan details retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get scan details', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Get scan details error', err.message, 500);
  }
});
// Check Scan Progress (scan.progress)
app.get('/api/scan/progress', async (req, res) => {
  try {
    const { scan_id } = req.query;
    if (!scan_id) {
      return sendError(res, 'Scan ID is required', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'scan.progress',
      data: { scan_id }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Scan progress retrieved successfully', engineResponse.data);
    } else if (engineResponse.code === 404) {
      sendError(res, 'Scan not found', engineResponse.data, 404);
    } else {
      sendError(res, 'Failed to get scan progress', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Scan progress error', err.message, 500);
  }
});

// Stop Scan (scan.stop)
app.post('/api/scan/stop', async (req, res) => {
  try {
    const { scan_id } = req.body;
    if (!scan_id) {
      return sendError(res, 'Scan ID is required', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'scan.stop',
      data: { scan_id }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Scan stopped successfully');
    } else if (engineResponse.code === 404) {
      sendError(res, 'Scan not found', engineResponse.data, 404);
    } else {
      sendError(res, 'Failed to stop scan', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Stop scan error', err.message, 500);
  }
});

// Get Scan Results (scan.results) - UPDATED: Now requires user_id and api_id
app.get('/api/scan/results', async (req, res) => {
  try {
    const { scan_id, user_id, api_id } = req.query;
    
    // Validate required parameters
    if (!scan_id) {
      return sendError(res, 'Scan ID is required', null, 400);
    }
    
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }
    
    // const apiIdValidation = validateApiId(api_id, true);
    // if (!apiIdValidation.isValid) {
    //   return sendError(res, apiIdValidation.error, null, 400);
    // }

    const engineResponse = await sendToEngine({
      command: 'scan.results',
      data: { 
        scan_id: scan_id.trim(),
        user_id: user_id.trim(),
        api_id: api_id.trim()
      }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Scan results retrieved successfully', engineResponse.data);
    } else if (engineResponse.code === 404) {
      sendError(res, 'Scan not found', null, 404);
    } else {
      sendError(res, 'Failed to get scan results', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Scan results error', err.message, 500);
  }
});

// List All Scans (scan.list) - UPDATED: Now requires user_id
app.get('/api/scan/list', async (req, res) => {
  try {
    const { user_id, api_id } = req.query;
    
    // Validate required user_id parameter
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.isValid) {
      return sendError(res, userIdValidation.error, null, 400);
    }

    const engineResponse = await sendToEngine({
      command: 'scan.list',
      data: { user_id: user_id.trim(), api_id: api_id.trim() }
    });
    
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Scans retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to retrieve scans', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'List scans error', err.message, 500);
  }
});

app.get('/api/scans/schedule', async (req, res) => {
  try {
    const { user_id, api_id } = req.query;
    if (!user_id || !api_id) {
      return sendError(res, 'user_id and api_id are required.', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'scans.schedule.get',
      data: { user_id, api_id }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Schedule retrieved successfully.', engineResponse.data);
    } else {
      sendError(res, 'Failed to retrieve schedule.', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Get schedule error', err.message, 500);
  }
});

app.post('/api/scans/schedule', async (req, res) => {
  try {
    const { user_id, api_id, frequency, is_enabled } = req.body;
    if (!user_id || !api_id || !frequency) {
      return sendError(res, 'user_id, api_id, and frequency are required.', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'scans.schedule.create_or_update',
      data: { user_id, api_id, frequency, is_enabled }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Schedule saved successfully.', engineResponse.data);
    } else {
      sendError(res, 'Failed to save schedule.', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Save schedule error', err.message, 500);
  }
});

app.delete('/api/scans/schedule', async (req, res) => {
  try {
    const { user_id, api_id } = req.body;
     if (!user_id || !api_id) {
      return sendError(res, 'user_id and api_id are required.', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'scans.schedule.delete',
      data: { user_id, api_id }
    });
     if (engineResponse.code === 200) {
      sendSuccess(res, 'Schedule deleted successfully.', engineResponse.data);
    } else {
      sendError(res, 'Failed to delete schedule.', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Delete schedule error', err.message, 500);
  }
});

// List All Templates (templates.list)
app.get('/api/templates/list', async (req, res) => {
  try {
    const engineResponse = await sendToEngine({
      command: 'templates.list',
      data: {}
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Templates retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to retrieve templates', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'List templates error', err.message, 500);
  }
});

// Get Template Details (templates.details)
app.get('/api/templates/details', async (req, res) => {
  try {
    const { template_id } = req.query;
    if (!template_id) {
      return sendError(res, 'Template ID is required', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'templates.details',
      data: { template_id }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Template details retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get template details', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Template details error', err.message, 500);
  }
});

// Use Template (templates.use)
app.post('/api/templates/use', async (req, res) => {
  try {
    const { template_id, api_id } = req.body;
    if (!template_id || !api_id) {
      return sendError(res, 'Template ID and API ID are required', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'templates.use',
      data: { template_id, api_id }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Template used successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to use template', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Use template error', err.message, 500);
  }
});

// Get User Profile (user.profile.get)
app.get('/api/user/profile/get', async (req, res) => {
  try {
    const engineResponse = await sendToEngine({
      command: 'user.profile.get',
      data: {}
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'User profile retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get user profile', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'User profile error', err.message, 500);
  }
});

// Update User Profile (user.profile.update)
app.put('/api/user/profile/update', async (req, res) => {
  try {
    const { username, email } = req.body;
    const engineResponse = await sendToEngine({
      command: 'user.profile.update',
      data: { username, email }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'User profile updated successfully');
    } else {
      sendError(res, 'Failed to update user profile', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Update user profile error', err.message, 500);
  }
});

// Get User Settings (user.settings.get)
app.get('/api/user/settings/get', async (req, res) => {
  try {
    const engineResponse = await sendToEngine({
      command: 'user.settings.get',
      data: {}
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'User settings retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get user settings', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'User settings error', err.message, 500);
  }
});

// Update User Settings (user.settings.update)
app.put('/api/user/settings/update', async (req, res) => {
  try {
    const { notifications } = req.body;
    const engineResponse = await sendToEngine({
      command: 'user.settings.update',
      data: { notifications }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'User settings updated successfully');
    } else {
      sendError(res, 'Failed to update user settings', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Update user settings error', err.message, 500);
  }
});

// List All Reports (reports.list)
app.get('/api/reports/list', async (req, res) => {
  try {
    const engineResponse = await sendToEngine({
      command: 'reports.list',
      data: {}
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Reports retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to retrieve reports', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'List reports error', err.message, 500);
  }
});

// Get Report Details (reports.details)
app.get('/api/reports/details', async (req, res) => {
  try {
    const { report_id } = req.query;
    if (!report_id) {
      return sendError(res, 'Report ID is required', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'reports.details',
      data: { report_id }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Report details retrieved successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to get report details', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Report details error', err.message, 500);
  }
});

// Download Report (reports.download)
app.post('/api/reports/download', async (req, res) => {
  try {
    const { report_id, report_type } = req.body;
    if (!report_id || !report_type) {
      return sendError(res, 'Report ID and report type are required', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'reports.download',
      data: { report_id, report_type }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Report downloaded successfully', engineResponse.data);
    } else {
      sendError(res, 'Failed to download report', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Download report error', err.message, 500);
  }
});

// Connection Test (connection.test)
app.get('/api/connection/test', async (req, res) => {
  try {
    const engineResponse = await sendToEngine({
      command: 'connection.test',
      data: {}
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Connection test successful', engineResponse.data);
    } else {
      sendError(res, 'Connection test failed', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Connection test error', err.message, 500);
  }
});

//////////////
// Forget Password
//////////////

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', createRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  const generic = 'If that account exists, we sent a reset link. Make sure to check your spam folder if you can not find it.';
  try {
    const { email } = req.body || {};
    if (!email) return sendSuccess(res, generic);

    const identifier = String(email).trim().toLowerCase();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', identifier)
      .single();

    if (!error && user) {
      const token = newToken();
      saveResetToken(user.id, token);

      const origin = (req.get('FRONTEND_URL') || 'http://localhost:3000').replace(/\/+$/, '');
      const resetUrl = `${origin}/recover?token=${encodeURIComponent(token)}`;
      // Dev "send": log the link 
      await sendResetEmail(user.email, resetUrl);
    } else if (error) {
      console.warn('forgot-password lookup:', error.message);
    }

    // Always generic to avoid user enumeration
    return sendSuccess(res, generic);
  } catch (err) {
    console.error('forgot-password error:', err);
    return sendSuccess(res, generic);
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {

    const { token, password } = req.body || {};
    if (!token || !password) {
      return sendError(res, 'token_and_password_required', null, 400);
    }

    const rec = consumeResetToken(token);
    if (!rec) return sendError(res, 'invalid_or_expired_token', null, 400);

    // Verify user still exists
    const { data: user, error: uerr } = await supabase
      .from('users')
      .select('id')
      .eq('id', rec.userId)
      .single();

    if (uerr || !user) return sendError(res, 'invalid_or_expired_token', null, 400);

 const hash = await bcrypt.hash(password, 12); 

    const { error: upErr } = await supabase
      .from('users')
      .update({ password: hash, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (upErr) {
      console.error('reset-password update:', upErr);
      return sendError(res, 'Password reset failed', upErr.message, 500);
    }

    return sendSuccess(res, 'password_reset_success');
  } catch (err) {
    console.error('reset-password error:', err);
    return sendError(res, 'Internal server error', err.message, 500);
  }
});

// Share API with another user
app.post('/api/apis/share', async (req, res) => {
  try {
    const { owner_user_id, api_id, email, permission } = req.body;
    if (!owner_user_id || !api_id || !email) {
      return sendError(res, 'owner_user_id, api_id, and email are required.', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'apis.share',
      data: { owner_user_id, api_id, email, permission }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, engineResponse.data?.message || 'API shared successfully.', engineResponse.data);
    } else {
      sendError(res, engineResponse.data?.message || 'Failed to share API.', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Share API error', err.message, 500);
  }
});

// Get users an API is shared with
app.get('/api/apis/shares', async (req, res) => {
  try {
    const { user_id, api_id } = req.query;
    if (!user_id || !api_id) {
      return sendError(res, 'user_id and api_id are required.', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'apis.shares.list',
      data: { user_id, api_id }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Shared users retrieved successfully.', engineResponse.data);
    } else {
      sendError(res, engineResponse.data?.message || 'Failed to retrieve shared users.', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Get shares error', err.message, 500);
  }
});

// Revoke API access from a user
app.delete('/api/apis/share', async (req, res) => {
  try {
    const { owner_user_id, api_id, revoke_user_id } = req.body;
    if (!owner_user_id || !api_id || !revoke_user_id) {
      return sendError(res, 'owner_user_id, api_id, and revoke_user_id are required.', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'apis.shares.revoke',
      data: { owner_user_id, api_id, revoke_user_id }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Access revoked successfully.', engineResponse.data);
    } else {
      sendError(res, engineResponse.data?.message || 'Failed to revoke access.', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Revoke access error', err.message, 500);
  }
});

app.delete('/api/apis/leave-share', async (req, res) => {
  try {
    const { user_id, api_id } = req.body;
    if (!user_id || !api_id) {
      return sendError(res, 'user_id and api_id are required.', null, 400);
    }
    const engineResponse = await sendToEngine({
      command: 'apis.shares.leave',
      data: { user_id, api_id }
    });
    if (engineResponse.code === 200) {
      sendSuccess(res, 'Successfully left API share.', engineResponse.data);
    } else {
      sendError(res, engineResponse.data?.message || 'Failed to leave share.', engineResponse.data, engineResponse.code || 500);
    }
  } catch (err) {
    sendError(res, 'Leave share error', err.message, 500);
  }
});

// 404 handler
app.use('*', (req, res) => {
  sendError(res, 'Route not found', { path: req.originalUrl, method: req.method }, 404);
});

// Global error handler
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
    console.log(`📧 Email configured: ${_label}`);
    console.log(`🔒 Google OAuth: ${supabaseUrl ? 'Enabled' : 'Disabled'}`);
  });
}

module.exports = app;