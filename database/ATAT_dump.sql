CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role TEXT DEFAULT 'user'  -- can be 'user', 'admin', etc.
);
CREATE TABLE apis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- owner
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    imported_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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