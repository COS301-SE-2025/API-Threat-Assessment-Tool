import React, { useMemo, useState } from "react";

export default function Recover() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

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
        setMsg({ type: "err", text: j?.message || "Reset failed." });
      } else {
        setMsg({ type: "ok", text: "Password reset. You can log in now." });
        setPassword(""); setConfirm("");
        // optional: setTimeout(() => (window.location.href = "/login"), 1200);
      }
    } catch {
      setMsg({ type: "err", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }

  const box = { maxWidth: 420, margin: "40px auto", padding: 16, border: "1px solid #ddd", borderRadius: 8 };
  const input = { width: "100%", padding: "10px 12px", margin: "8px 0", border: "1px solid #ccc", borderRadius: 6 };
  const btn = { width: "100%", padding: "10px 12px", marginTop: 8, borderRadius: 6, cursor: "pointer" };
  const ok = { color: "#0a7d2f", marginTop: 8 };
  const err = { color: "#a31212", marginTop: 8 };

  return (
    <div style={box}>
      <h2>Set a new password</h2>
      <form onSubmit={onSubmit}>
        <input style={input} type="password" placeholder="New password" minLength={8}
               value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input style={input} type="password" placeholder="Confirm password" minLength={8}
               value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <button style={btn} disabled={loading || !token}>{loading ? "Saving…" : "Set new password"}</button>
      </form>
      {msg && <p style={msg.type === "ok" ? ok : err}>{msg.text}</p>}
      {!token && <p style={err}>Open this page via the link from your email (or server console).</p>}
    </div>
  );
}
