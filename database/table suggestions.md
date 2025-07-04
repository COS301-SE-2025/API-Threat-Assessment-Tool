CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    role TEXT DEFAULT 'user'  -- can be 'user', 'admin', etc.
);

CREATE TABLE apis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,  -- owner
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    imported_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE api_access (
    user_id INTEGER NOT NULL,
    api_id INTEGER NOT NULL,
    permission TEXT DEFAULT 'read',  -- e.g. 'read', 'write', 'admin'
    PRIMARY KEY (user_id, api_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (api_id) REFERENCES apis(id)
);

CREATE TABLE endpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_id INTEGER NOT NULL,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    requires_auth BOOLEAN DEFAULT FALSE,
    tags TEXT,
    category TEXT,
    FOREIGN KEY (api_id) REFERENCES apis(id)
);

CREATE TABLE scan_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    api_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT DEFAULT 'running',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (api_id) REFERENCES apis(id),
    FOREIGN KEY (profile_id) REFERENCES scan_profiles(id)
);

CREATE TABLE scan_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL,
    endpoint_id INTEGER NOT NULL,
    test_name TEXT NOT NULL,
    severity TEXT,
    cvss_score REAL,
    description TEXT,
    mitigation TEXT,
    evidence TEXT,
    response_code INTEGER,
    FOREIGN KEY (scan_id) REFERENCES scans(id),
    FOREIGN KEY (endpoint_id) REFERENCES endpoints(id)
);

CREATE TABLE vulnerability_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    default_severity TEXT
);

CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL,
    format TEXT,
    file_path TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scan_id) REFERENCES scans(id)
);