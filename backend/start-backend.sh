#!/bin/bash

# Start the OAST server in the background on port 8001
echo "Starting OAST mock server..."
python core/vulnerability_tests/mock_servers/oast_server.py &

# Start the mock API server in the background on port 8002
echo "Starting mock API server..."
python core/vulnerability_tests/mock_servers/mock_api.py &

# Start the main backend app in the foreground
# This command keeps the container running.
echo "Starting main backend server..."
# Using Gunicorn for production is recommended, but flask run works too.
# Adjust 'app:app' if your Flask app object is named differently or in another file.
exec gunicorn --bind 0.0.0.0:9011 app:app