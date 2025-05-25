import React from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  return (
    <div className="login-container">
      <div className="form-container">
        <h2>Login</h2>
        <form>
          <input type="email" placeholder="Email" className="input-field" />
          <input type="password" placeholder="Password" className="input-field" />
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="register-with">or log in with</p>
        <div className="social-buttons">
          <button className="social-btn google">Google</button>
          <button className="social-btn apple">Apple</button>
        </div>
        <p className="forgot-link">Forgot your password? <a href="#">Reset password</a></p>
        <p className="signup-link">Don't have an account? <Link to="/signup">signup</Link></p>
      </div>
    </div>
  );
};

export default Login;