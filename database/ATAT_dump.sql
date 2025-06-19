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