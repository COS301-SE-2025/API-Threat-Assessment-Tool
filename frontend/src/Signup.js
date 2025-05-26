import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add signup logic here (e.g., API call, form validation)
    navigate('/dashboard');
  };

  return (
    <div className="signup-container">
      <div className="form-container">
        <h2>Create an account</h2>
        <p className="login-link">Already have an account? <Link to="/login">Log in</Link></p>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Fletcher" className="input-field" />
          <input type="text" placeholder="Last name" className="input-field" />
          <input type="email" placeholder="Email" className="input-field" />
          <input type="password" placeholder="Enter your password" className="input-field" />
          <label>
            <input type="checkbox" />
            I agree to the Terms & Conditions
          </label>
          <button type="submit" className="create-btn">Create account</button>
        </form>
        <p className="register-with">or register with</p>
        <div className="social-buttons">
          <button className="social-btn google">Google</button>
          <button className="social-btn apple">Apple</button>
        </div>
      </div>
    </div>
  );
};

export default Signup;