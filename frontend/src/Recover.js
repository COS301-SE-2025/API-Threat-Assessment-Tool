import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "./App";
import Logo from "./components/Logo";
import "./Login.css";

export default function Recover() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const formRef = useRef(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);


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

  async function onSubmit(e) {
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
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg({ type: "err", text: j?.message || "Reset failed. Link may be invalid or expired." });
      } else {
        setMsg({ type: "ok", text: "Password reset. You can log in now." });
        setPassword(""); setConfirm("");
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch {
      setMsg({ type: "err", text: "Network error. Try again." });
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
              AT-AT
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
            <h1 className="login-title">Set a new password</h1>
            <p className="login-subtitle">Enter and confirm your new password.</p>

            <form onSubmit={onSubmit} className="login-form">
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
            {!token && <p className="login-message error">Open this page via the link from your email (or server console).</p>}

            <div className="login-links" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" className="google-login-btn" onClick={() => navigate(-1)} aria-label="Go back">
                ← Back
              </button>
              <Link to="/login" className="create-account-link">Go to Login</Link>
            </div>
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
