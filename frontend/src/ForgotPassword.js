import React, { useContext, useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "./App";
import Logo from "./components/Logo";
import "./Login.css"; // reuse the same styling system as Login

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const formRef = useRef(null);

  // If URL has ?token=..., show reset form; otherwise show forgot form
  const token = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get("token") || ""; }
    catch { return ""; }
  }, []);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // forgot state
  const [email, setEmail] = useState("");

  // reset state
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

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

  async function doReset(e) {
    e.preventDefault();
    setMsg(null);
    if (password !== confirm) { setMsg({ type: "err", text: "Passwords do not match." }); return; }
    if (!token) { setMsg({ type: "err", text: "Missing or invalid token." }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ type: "ok", text: "Password reset. You can log in now." });
        setPassword(""); setConfirm("");
        setTimeout(() => navigate("/login"), 1000);
      } else {
        setMsg({ type: "err", text: data?.message || "Reset failed. Link may be invalid or expired." });
      }
    } catch {
      setMsg({ type: "err", text: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  }

  // utility classes from Login.css & consistent structure
  return (
    <div className={`login-page ${darkMode ? "dark-mode" : ""}`}>
      <div className={`login-container ${animationPhase}`}>
        {/* HEADER — matches Login.js */}
        <header className="login-header">
          <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo />
            <span style={{ fontWeight: 700, fontSize: 24, letterSpacing: 2, color: darkMode ? "#fff" : "#222", userSelect: "none" }}>
              AT-AT
            </span>
          </div>
          <div className="user-info">
            <button onClick={handleThemeToggle} className="theme-toggle-btn" aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}>
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </header>

        {/* MAIN */}
        <main className="login-main">
          <section className="login-form-section" ref={formRef}>
            {token ? (
              <>
                <h1 className="login-title">Set a new password</h1>
                <p className="login-subtitle">Enter and confirm your new password.</p>

                <form onSubmit={doReset} className="login-form">
                  <div className="form-group">
                    <label htmlFor="new-password">New password</label>
                    <input
                      id="new-password"
                      type="password"
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm-password">Confirm password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                  <button className="login-btn" disabled={loading || !token}>
                    {loading ? "Saving…" : "Set new password"}
                  </button>
                </form>

                {msg && (
                  <p className={`login-message ${msg.type === "ok" ? "success" : "error"}`}>
                    {msg.text}
                  </p>
                )}

                <div className="login-links" style={{ marginTop: 12 }}>
                  <Link to="/login" className="create-account-link">Go to Login</Link>
                </div>
              </>
            ) : (
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

        {/* FOOTER — matches Login.js */}
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
