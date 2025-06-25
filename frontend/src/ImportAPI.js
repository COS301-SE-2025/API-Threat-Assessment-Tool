import React, { useState } from "react";

function ImportAPI({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setMessage("");
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
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
        credentials: "include", // If you want cookies/sessions
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Upload failed.");
      }
      setMessage(`✅ Imported: ${result.data.filename}`);
      setFile(null);
      if (onSuccess) onSuccess(result.data);
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="import-api-form" onSubmit={handleUpload} style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>Import API Specification</h2>
      <input
        type="file"
        accept=".json,.yaml,.yml"
        onChange={handleChange}
        disabled={loading}
        style={{ marginBottom: 8 }}
      />
      <button
        type="submit"
        disabled={loading || !file}
        className="btn btn-primary"
        style={{ marginLeft: 8 }}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
      {message && <div className="success-msg" style={{ color: "green", marginTop: 8 }}>{message}</div>}
      {error && <div className="error-msg" style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </form>
  );
}

export default ImportAPI;
