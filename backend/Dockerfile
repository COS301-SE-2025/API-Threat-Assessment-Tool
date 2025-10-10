# Use the official Python image.
FROM python:3.10-slim

# Set the working directory.
WORKDIR /app

# Copy and install requirements.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code.
COPY . .

# Copy and make the startup script executable
COPY start-backend.sh .
RUN chmod +x start-backend.sh

# Expose all three ports
EXPOSE 9011 8001 8002

# Set the startup script as the command
CMD ["./start-backend.sh"]