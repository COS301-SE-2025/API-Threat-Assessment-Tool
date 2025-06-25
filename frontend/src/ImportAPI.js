// frontend/src/ImportAPI.js
import React, { useState } from "react";

function ImportAPI({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [importedApi, setImportedApi] = useState(null); // NEW
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setMessage("");
    setImportedApi(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("No file selected.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    setImportedApi(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Upload failed.");
      }
      setMessage(`✅ Imported: ${result.data.filename}`);
      setFile(null);
      setImportedApi(result.data);
      if (onSuccess) onSuccess(result.data);
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // Option: Go to Manage APIs or Dashboard
  const handleGoManage = () => {
    window.location.href = "/manage-apis";
  };

  return (
    <div className="import-api-wrapper" style={{
      minHeight: "100vh",
      background: "linear-gradient(120deg,#262626 0,#333 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 32
    }}>
      <div style={{
        background: "#18181b",
        borderRadius: 24,
        boxShadow: "0 4px 32px #0004",
        padding: "2.5rem 2.5rem 2rem",
        minWidth: 420,
        maxWidth: 480,
        width: "100%",
        color: "#fafafa"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: 22, fontSize: 26, fontWeight: 800, letterSpacing: 1, color: "#c4b5fd" }}>
          📦 Import API Specification
        </h2>
        <form className="import-api-form" onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <label style={{ fontWeight: 600, marginBottom: 2 }}>
            <span>Choose a JSON, YAML, or YML file:</span>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleChange}
              disabled={loading}
              style={{
                marginTop: 8,
                background: "#23232b",
                color: "#fff",
                borderRadius: 7,
                padding: "8px 6px"
              }}
            />
          </label>
          <button
            type="submit"
            disabled={loading || !file}
            className="btn btn-primary"
            style={{
              background: "#a78bfa",
              color: "#222",
              border: "none",
              borderRadius: 8,
              padding: "12px 0",
              fontWeight: 800,
              fontSize: 18,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              boxShadow: "0 2px 10px #0003"
            }}
          >
            {loading ? "Uploading..." : "Upload & Import"}
          </button>
        </form>
        {/* Success/Error states */}
        {message && (
          <div style={{
            background: "#16a34a20",
            color: "#4ade80",
            fontWeight: 600,
            borderRadius: 8,
            marginTop: 22,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div style={{
            background: "#ef444420",
            color: "#f87171",
            fontWeight: 600,
            borderRadius: 8,
            marginTop: 22,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span style={{ fontSize: 22 }}>❌</span>
            <span>{error}</span>
          </div>
        )}
        {/* Show imported API details and next actions */}
        {importedApi && (
          <div style={{
            background: "#23232b",
            color: "#d1fae5",
            borderRadius: 8,
            marginTop: 26,
            padding: "20px 18px 12px",
            boxShadow: "0 2px 10px #0002"
          }}>
            <h4 style={{ marginBottom: 8, fontSize: 20, color: "#a5b4fc" }}>🎉 Imported API</h4>
            <div><b>File:</b> {importedApi.filename}</div>
            <div><b>API ID:</b> {importedApi.api_id}</div>
            <button
              onClick={handleGoManage}
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                marginTop: 18,
                padding: "9px 0",
                fontWeight: 700,
                fontSize: 16,
                width: "100%",
                boxShadow: "0 2px 10px #6366f188",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
            >Manage APIs →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportAPI;
