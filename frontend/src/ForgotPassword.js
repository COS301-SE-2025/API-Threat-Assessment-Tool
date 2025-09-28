import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "./App";
import Logo from "./components/Logo";
import "./Login.css"; // reuse the same styling system as Login

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [email, setEmail] = useState("");



  // optional entrance animation like Login
  const [animationPhase, setAnimationPhase] = useState("entering");
  useEffect(() => {
    const t = setTimeout(() => setAnimationPhase("entered"), 10);
    return () => clearTimeout(t);
  }, []);

  const handleThemeToggle = () => {
    document.body.style.transition = "all 0.3s ease";
    toggleDarkMode();
    setTimeout(() => { document.body.style.transition = ""; }, 300);
  };

  async function doForgot(e) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setMsg({ type: "ok", text: "If that account exists, we sent a reset link." });
    } catch {
      setMsg({ type: "err", text: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className={`login-page ${darkMode ? "dark-mode" : ""}`}>
      <div className={`login-container ${animationPhase}`}>
        {}
        <header className="login-header">
          <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo />
            <span style={{ fontWeight: 700, fontSize: 24, letterSpacing: 2, color: darkMode ? "#fff" : "#222", userSelect: "none" }}>
            </span>
          </div>
          <div className="user-info">
            <button onClick={handleThemeToggle} className="theme-toggle-btn" aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}>
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </header>

        {}
        <main className="login-main">
          <section className="login-form-section" ref={formRef}>
            {   
              (
              <>
                <h1 className="login-title">Forgot password</h1>
                <p className="login-subtitle">Enter your account email. If it exists, we’ll send a reset link.</p>

                <form onSubmit={doForgot} className="login-form">
                  <div className="form-group">
                    <label htmlFor="email">Email address</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button className="login-btn" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                </form>

                {msg && (
                  <p className={`login-message ${msg.type === "ok" ? "success" : "error"}`}>
                    {msg.text}
                  </p>
                )}

                <div className="login-links" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button type="button" className="google-login-btn" onClick={() => navigate(-1)} aria-label="Go back">
                    ← Back
                  </button>
                  <Link to="/login" className="create-account-link">Go to Login</Link>
                </div>
              </>
            )}
          </section>
        </main>

        {}
<footer className="login-footer">
   <p>© {new Date().getFullYear()} AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
   <div className="footer-links">
     <Link to="/" aria-label="Privacy Policy">Privacy Policy</Link>
     <Link to="/" aria-label="Terms of Service">Terms of Service</Link>
   </div>
 </footer>
      </div>
    </div>
  );
}
