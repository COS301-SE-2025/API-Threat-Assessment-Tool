// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Placeholder route - will be implemented later
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'User routes - coming soon!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;