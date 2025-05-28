
venv/bin/pip install fastapi uvicorn pytest

venv/bin/uvicorn server:app --port 8000
venv/bin/pytest serverTest.py
