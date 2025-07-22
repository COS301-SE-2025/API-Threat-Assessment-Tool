#!/bin/bash

# Start backend (Flask) on port 5252
python3 backend/app.py &

# Start API (Express) on port 8000
node api/server.js &

# Start Frontend (React) on port 3000
cd frontend
npm start
