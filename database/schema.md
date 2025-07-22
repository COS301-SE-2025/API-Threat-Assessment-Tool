# 📦 API Threat Assessment Tool – Database Schema

This document outlines the high-level database schema for the **API Threat Assessment Tool (AT-AT)**. The design supports modular API scanning, vulnerability tracking, and secure multi-user collaboration.

---

## 🧑‍💻 Users

Stores user accounts for multi-user access and role-based access control (RBAC).

| Field          | Type        | Description                             |
|----------------|-------------|-----------------------------------------|
| `id`           | UUID / INT  | Primary key                             |
| `name`         | TEXT        | Full name                               |
| `email`        | TEXT        | Unique user email                       |
| `role`         | TEXT        | `student`, `instructor`, `admin`        |
| `password_hash`| TEXT        | Hashed password (if authentication used)|

---

## 🌐 APIs

Represents each API submitted or scanned, with its metadata and source.

| Field          | Type        | Description                            |
|----------------|-------------|----------------------------------------|
| `id`           | UUID / INT  | Primary key                            |
| `name`         | TEXT        | Human-friendly API name                |
| `base_url`     | TEXT        | Base URL of the API                    |
| `source_type`  | TEXT        | `manual`, `openapi`, `postman`, etc.   |
| `uploaded_spec`| TEXT/JSON   | Raw spec file contents or path         |
| `user_id`      | FK → Users  | API owner                              |

---

## 🔁 Endpoints

Stores endpoints discovered through specs or smart scanning.

| Field          | Type        | Description                          |
|----------------|-------------|--------------------------------------|
| `id`           | UUID / INT  | Primary key                          |
| `api_id`       | FK → APIs   | Parent API                           |
| `path`         | TEXT        | Path of the endpoint (e.g., `/login`)|
| `method`       | TEXT        | HTTP method (`GET`, `POST`, etc.)    |
| `requires_auth`| BOOLEAN     | Whether the endpoint requires auth   |

---

## 📊 Scans

Each scan session targeting an API and its endpoints.

| Field          | Type        | Description                               |
|----------------|-------------|-------------------------------------------|
| `id`           | UUID / INT  | Primary key                               |
| `api_id`       | FK → APIs   | API being scanned                         |
| `started_at`   | TIMESTAMP   | Scan start time                           |
| `completed_at` | TIMESTAMP   | Scan end time                             |
| `status`       | TEXT        | `pending`, `in_progress`, `complete`, etc.|
| `scan_config`  | JSON        | Optional settings (e.g., depth, intensity)|

---

## 🛡️ Vulnerabilities

Details of security issues found during a scan.

| Field            | Type        | Description                              |
|------------------|-------------|------------------------------------------|
| `id`             | UUID / INT  | Primary key                              |
| `scan_id`        | FK → Scans  | Associated scan                          |
| `endpoint_id`    | FK → Endpoints | Affected endpoint                      |
| `type`           | TEXT        | Vulnerability type (`SQLi`, `BOLA`, etc.)|
| `risk_level`     | TEXT        | `Low`, `Medium`, `High`, `Critical`      |
| `description`    | TEXT        | Details about the issue                  |
| `recommendation` | TEXT        | Suggested fix                            |
| `evidence`       | TEXT / JSON | Payloads, responses, etc. (optional)     |

---

## 🧾 Audit Logs *(Optional)*

Tracks user activity for transparency and compliance.

| Field         | Type        | Description                            |
|---------------|-------------|----------------------------------------|
| `id`          | UUID / INT  | Primary key                            |
| `user_id`     | FK → Users  | User performing the action             |
| `action`      | TEXT        | Description of the action              |
| `details`     | TEXT / JSON | Extra info or context                  |
| `timestamp`   | TIMESTAMP   | When the action occurred               |

---

## 🔄 Entity Relationships

```text
Users
  └── APIs
        └── Endpoints
              └── Scans
                    └── Vulnerabilities
