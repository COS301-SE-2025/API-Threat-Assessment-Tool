FROM python:3.10-slim AS backend

WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

COPY ConnectionTest.py /app/backend/tests/ConnectionTest.py

# ----------------------------------------

FROM node:18 AS api

WORKDIR /app/api
COPY api/package*.json ./
RUN npm install
COPY api/ .

# ----------------------------------------

FROM node:18 AS frontend

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# Optional: build if it's a static SPA
# RUN npm run build

# ----------------------------------------

FROM python:3.10-slim AS final

# Install Node.js
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Copy all stages
COPY --from=backend /app/backend /app/backend
COPY --from=api /app/api /app/api
COPY --from=frontend /app/frontend /app/frontend

WORKDIR /app

# Install API deps
RUN cd api && npm install

# Install frontend deps
RUN cd frontend && npm install

# Add script to launch everything
COPY start.sh .

# Expose ports
EXPOSE 5252 8000 3000

# Start all apps
CMD ["bash", "start.sh"]
