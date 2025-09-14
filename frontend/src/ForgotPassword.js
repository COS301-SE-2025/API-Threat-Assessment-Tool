import React, { useMemo, useState } from "react";

export default function ForgotPassword() {
  // If URL has ?token=..., show reset form; otherwise show forgot form, might change logic later
  const token = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("token") || "";
    } catch {
      return "";
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Forgot password state
  const [email, setEmail] = useState("");

  // Reset password state
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function doForgot(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always generic so that they dont get any information if they input someone else's email
      setMsg({ type: "ok", text: "If that account exists, we sent a reset link." });
    } catch (err) {
      setMsg({ type: "err", text: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e) {
    e.preventDefault();
    setMsg(null);
    if (password !== confirm) {
      setMsg({ type: "err", text: "Passwords do not match." });
      return;
    }
    if (!token) {
      setMsg({ type: "err", text: "Missing or invalid token." });
      return;
    }
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
        setPassword("");
        setConfirm("");
      } else {
        setMsg({ type: "err", text: data.error || "Reset failed. Link may be invalid or expired." });
      }
    } catch (err) {
      setMsg({ type: "err", text: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  }


  const box = { maxWidth: 420, margin: "40px auto", padding: 16, border: "1px solid #ddd", borderRadius: 8 };
  const input = { width: "100%", padding: "10px 12px", margin: "8px 0", border: "1px solid #ccc", borderRadius: 6 };
  const btn = { width: "100%", padding: "10px 12px", marginTop: 8, borderRadius: 6, cursor: "pointer" };
  const ok = { color: "#0a7d2f", marginTop: 8 };
  const err = { color: "#a31212", marginTop: 8 };

  if (token) {
    // Reset Password
    return (
      <div style={box}>
        <h2>Set a new password</h2>
        <form onSubmit={doReset}>
          <input
            style={input}
            type="password"
            placeholder="New password"
            value={password}
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            style={input}
            type="password"
            placeholder="Confirm password"
            value={confirm}
            minLength={8}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button style={btn} disabled={loading || !token}>
            {loading ? "Saving…" : "Set new password"}
          </button>
        </form>
        {msg && <p style={msg.type === "ok" ? ok : err}>{msg.text}</p>}
      </div>
    );
  }

  // Forgot Password
  return (
    <div style={box}>
      <h2>Forgot password</h2>
      <form onSubmit={doForgot}>
        <input
          style={input}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button style={btn} disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      {msg && <p style={msg.type === "ok" ? ok : err}>{msg.text}</p>}
    </div>
  );
}
