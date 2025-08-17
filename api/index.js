// index.js - Enhanced with user profile and preferences endpoints
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

    // Fetch user data from database to ensure user still exists
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

    // Attach user data to request object
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

// Engine management functions (keeping existing functionality)
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

const startEngine = () => {
  return new Promise((resolve, reject) => {
    if (engineProcess || engineStarting) {
      console.log('🔄 Engine already starting or running');
      return resolve();
    }
    
    engineStarting = true;
    console.log('🚀 Starting Python engine...');
    console.log(`📁 Working directory: ${path.join(process.cwd(), '../backend')}`);
    
    engineProcess = spawn('python', ['-u', 'main.py'], {  // Add -u flag for unbuffered output
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(process.cwd(), '../backend'),
      shell: true
    });
    
    console.log(`📍 Spawned process with PID: ${engineProcess.pid}`);
    
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
        console.log(`🔥 Engine response code: ${response.code}`);
        
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
      // NEW USER MANAGEMENT ENDPOINTS
      updateProfile: 'PUT /api/user/update',
      updatePassword: 'PUT /api/user/password',
      getUserPreferences: 'GET /api/user/preferences',
      updatePreferences: 'PUT /api/user/preferences',
      // EXISTING ENDPOINTS
      users: 'GET /users',
      importApi: 'POST /api/import',
      listEndpoints: 'POST /api/endpoints',
      endpointDetails: 'POST /api/endpoints/details',
      addTags: 'POST /api/endpoints/tags/add',
      removeTags: 'POST /api/endpoints/tags/remove',
      replaceTags: 'POST /api/endpoints/tags/replace',
      listTags: 'GET /api/tags'
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
// NEW USER MANAGEMENT ENDPOINTS
// ==========================================================

// Get user profile (new endpoint)
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

// Update user profile (enhanced with activity logging)
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

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.userId)
      .select('id, email, username, first_name, last_name, email_confirmed, created_at')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return sendError(res, 'Username already exists', null, 409);
      }
      console.error('Profile update error:', error);
      return sendError(res, 'Database error', error.message, 500);
    }

    if (!data) {
      return sendError(res, 'User not found or update failed', null, 404);
    }

    // Log successful profile update
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

// Update user password (enhanced with activity logging)
app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const validation = validatePasswordUpdate(req.body);
    if (!validation.isValid) {
      return sendError(res, 'Validation failed', validation.errors, 400);
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.userId)
      .single();

    if (fetchError || !userData) {
      return sendError(res, 'User not found', null, 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
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

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
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

    // Log successful password change
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

// Get user preferences (now using real database)
app.get('/api/user/preferences', authenticateToken, async (req, res) => {
  try {
    // Get preferences from user_preferences table
    const { data: prefsData, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    let preferences;
    if (prefsError && prefsError.code === 'PGRST116') {
      // No preferences found, create default ones
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
        // Return defaults even if insert fails
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
        prefsData = newPrefs;
      }
    }

    if (prefsData) {
      // Convert database format to frontend format
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

// Update user preferences (now using real database)
app.put('/api/user/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return sendError(res, 'Invalid preferences data', null, 400);
    }

    // Convert frontend format to database format
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

    // Update or insert preferences using upsert
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

    // Log user activity
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

// Get user extended profile
app.get('/api/user/extended-profile', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profile_extended')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
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

// Update user extended profile
app.put('/api/user/extended-profile', authenticateToken, async (req, res) => {
  try {
    const { phone, company, position, timezone, bio, website_url, location } = req.body;

    // Validate input
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

    // Log user activity
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
// EXISTING AUTHENTICATION ROUTES (keeping as-is)
// ==========================================================

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

// Profile (existing endpoint - keeping for compatibility)
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
// EXISTING API MANAGEMENT ROUTES (keeping all as-is)
// ==========================================================

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

// [Keep all other existing routes exactly as they are...]
// List API endpoints, tags management, etc.

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

// ==========================================================
// EXISTING ROUTES FROM Commands.MD (keeping all as-is)
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

// [All other existing routes from the original index.js remain unchanged...]

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