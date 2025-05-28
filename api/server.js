const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.json());

// Mock scan trigger
app.post('/scan', async (req, res) => {
  const { targetUrl } = req.body;

  // Simulate sending request to scanning engine on port 8000
  try {
    // This is a mock call. In real life, you'd forward it like:
    // const response = await axios.post('http://localhost:8000/scan', { targetUrl });

    const mockResponse = {
      status: 'Scan started',
      target: targetUrl,
      scanId: '12345'
    };

    res.status(200).json(mockResponse);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

// Mock scan results
app.get('/results/:scanId', async (req, res) => {
  const { scanId } = req.params;

  const mockResults = {
    scanId,
    vulnerabilities: [
      { name: 'SQL Injection', risk: 'High', endpoint: '/login' },
      { name: 'Excessive Data Exposure', risk: 'Medium', endpoint: '/users' }
    ],
    completed: true
  };

  res.status(200).json(mockResults);
});

// Mock scan status
app.get('/status/:scanId', async (req, res) => {
  const { scanId } = req.params;

  const mockStatus = {
    scanId,
    status: 'In Progress',
    progress: '45%'
  };

  res.status(200).json(mockStatus);
});

// Simple health check
app.get('/', (req, res) => {
  res.send('API Threat Assessment Tool API is running.');
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Demo API server running on http://localhost:${port}`);
  });
}

module.exports = app;
