---
title: Installation Manual
description: Guide for setting up and running the AT-AT system locally.
---

# AT-AT Installation Manual

This document guides you through the complete local installation and execution of the **API Threat Assessment Tool (AT-AT)**.

---

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **npm** ≥ 9
- **Git**
- Recommended: PowerShell (Windows) or bash (Linux/macOS)

---

## 1. Clone the Repository

```bash
git clone https://github.com/YourOrg/API-Threat-Assessment-Tool.git
cd API-Threat-Assessment-Tool
```

---

## 2. Create `.env` Files

Each of the three components — `frontend`, `api`, and `backend` — require `.env` files. Below are their templates:

### `frontend/.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-key
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
PORT=3000
HOST=0.0.0.0
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

---

### `api/.env`

```env
SUPABASE_URL=https://our-link.supabase.co
SUPABASE_KEY=your-supabase-service-key
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
PORT=3001
```

---

### `backend/.env`

```env
PORT=3002
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://our-link.supabase.co
SUPABASE_KEY=your-supabase-service-key
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
```

---

## 3. Setup and Run Backend (Python)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate      # Windows
# or: source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
python main.py
```

---

## 4. Setup and Run API (Node.js)

```powershell
cd api
npm install
node index.js
```

---

## 5. Setup and Run Frontend (React)

```powershell
cd frontend
npm install
npm run start:client
```

If the `start:client` script fails with a host error, ensure your `.env` includes:

```env
HOST=0.0.0.0
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

---

## 6. Test in Browser

Open:

```
http://localhost:3000
```

You should see the AT-AT UI.

- Upload a spec to test backend connectivity
- Verify `localhost:3001` and `localhost:5001` are active

---

## Common Troubleshooting

| Issue                        | Fix                                                                 |
|-----------------------------|----------------------------------------------------------------------|
| `allowedHosts` error        | Add `HOST=0.0.0.0` and `DANGEROUSLY_DISABLE_HOST_CHECK=true`         |
| Supabase not loading        | Ensure all `.env` files have correct `SUPABASE_URL` and `SUPABASE_KEY` |
| Python crash on `dotenv`    | Run `pip install python-dotenv`                                     |

---

## Final Notes

- GitHub Actions CI/CD is available and runs tests on pull requests.
- This setup is for local development as used in Demo 3.