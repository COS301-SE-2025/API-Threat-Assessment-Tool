// utils/validators.js
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSignupData = (data) => {
  const errors = [];
  const { email, password, firstName, lastName } = data;

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }

  if (!firstName) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  if (!lastName) {
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
  } else if (!EMAIL_REGEX.test(email)) {
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

module.exports = {
  validateSignupData,
  validateLoginData
};