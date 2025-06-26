FROM python:3.10-slim AS backend

WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

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
RUN chmod +x start.sh


# Expose ports backend api frontend
EXPOSE 9011 3001 3000

# Start all apps
CMD ["bash", "setup.sh"]