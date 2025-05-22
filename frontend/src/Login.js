// src/App.js
import React, { useState } from "react";
import "./Login.css"; // Make sure this matches your CSS filename
import atatImage from "./img/atat.png";
import googleImage from "./img/google.png";

function App() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin(!isLogin);

  return (
    <div className={`container ${isLogin ? "login-mode" : "signup-mode"}`}>
      <div className="left-panel">
        {isLogin ? (
          <>
            <h1>Welcome to AT-AT</h1>
            <button className="login-btn">LOGIN</button>

            <button className="google-btn">
              <img src={googleImage} alt="Google Logo" />
              Continue with Google
            </button>

            <div className="or-separator">OR</div>

            <input
              type="email"
              placeholder="email@domainName.com"
              className="input-field"
            />
            <input
              type="password"
              placeholder="password"
              className="input-field"
            />

            <button className="continue-btn">Continue</button>

            <p className="signup-text">
              Need an account?{" "}
              <button onClick={toggleForm} className="link-btn" aria-label="Switch to signup">
                SignUp
              </button>
            </p>
          </>
        ) : (
          <>
            <h1>Create an Account</h1>

            <input
              type="text"
              placeholder="Full Name"
              className="input-field"
            />
            <input
              type="email"
              placeholder="email@domainName.com"
              className="input-field"
            />
            <input
              type="password"
              placeholder="password"
              className="input-field"
            />
            <input
              type="password"
              placeholder="Confirm password"
              className="input-field"
            />

            <button className="continue-btn">Sign Up</button>

            <p className="signup-text">
              Already have an account?{" "}
              <button onClick={toggleForm} className="link-btn" aria-label="Switch to login">
                Login
              </button>
            </p>
          </>
        )}
      </div>

      <div className="right-panel">
        <img src={atatImage} alt="AT-AT" />
      </div>
    </div>
  );
}

export default App;
