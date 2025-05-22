// src/App.js
import React from "react";
import "./App.css";
import atatImage from "./img/atat.png"; // Put your AT-AT image in src/atat.png

function App() {
  return (
    <div className="container">
      <div className="left-panel">
        <h1>Welcome to AT-AT</h1>
        <button className="login-btn">LOGIN</button>

        <button className="google-btn">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png"
            alt="Google Logo"
          />
          Continue with Google
        </button>

        <div className="or-separator">OR</div>

        <input
          type="email"
          placeholder="email@domainName.com"
          className="input-field"
        />
        <input type="password" placeholder="password" className="input-field" />

        <button className="continue-btn">Continue</button>

        <p className="signup-text">
          Need an account? <a href="#signup">SignUp</a>
        </p>
      </div>

      <div className="right-panel">
        <img src={atatImage} alt="AT-AT" />
      </div>
    </div>
  );
}

export default App;
