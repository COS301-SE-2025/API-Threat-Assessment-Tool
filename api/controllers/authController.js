// controllers/authController.js
const { supabase } = require('../config/supabase');
const { validateSignupData, validateLoginData } = require('../utils/validators');
const { ApiResponse } = require('../utils/apiResponse');

const signup = async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;

    const validation = validateSignupData(req.body);
    if (!validation.isValid) {
      return ApiResponse.badRequest(res, 'Validation failed', validation.errors);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || null,
          first_name: firstName || null,
          last_name: lastName || null,
          full_name: firstName && lastName ? `${firstName} ${lastName}` : null
        }
      }
    });

    if (error) {
      console.error('Supabase Auth signup error:', error);
      if (error.message.includes('already registered')) {
        return ApiResponse.conflict(res, 'User with this email already exists');
      }
      return ApiResponse.badRequest(res, 'Registration failed', error.message);
    }

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

    return ApiResponse.created(res, 'User registered successfully', responseData);

  } catch (error) {
    console.error('Signup error:', error);
    return ApiResponse.internalError(res, 'Internal server error during signup');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validation = validateLoginData(req.body);
    if (!validation.isValid) {
      return ApiResponse.badRequest(res, 'Validation failed', validation.errors);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase Auth login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        return ApiResponse.unauthorized(res, 'Invalid email or password');
      }
      return ApiResponse.badRequest(res, 'Login failed', error.message);
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

    return ApiResponse.success(res, 'Login successful', responseData);

  } catch (error) {
    console.error('Login error:', error);
    return ApiResponse.internalError(res, 'Internal server error during login');
  }
};

const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase Auth logout error:', error);
      return ApiResponse.badRequest(res, 'Logout failed', error.message);
    }

    return ApiResponse.success(res, 'Logout successful');

  } catch (error) {
    console.error('Logout error:', error);
    return ApiResponse.internalError(res, 'Internal server error during logout');
  }
};

module.exports = {
  signup,
  login,
  logout
};