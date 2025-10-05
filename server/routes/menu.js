// backend/routes/menu.js
const express = require('express');
const router = express.Router();
const { list, create, update, remove } = require('../controllers/menuController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

// All routes require authentication and admin privileges
router.get('/', list);
router.post('/', auth, admin, create);
router.put('/:id', auth, admin, update);
router.delete('/:id', auth, admin, remove);

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    console.log('=== DATABASE TEST START ===');
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected');
      return res.status(500).json({ 
        message: 'Database not connected',
        readyState: mongoose.connection.readyState
      });
    }
    
    // Test a simple query
    console.log('Testing database query...');
    const count = await MenuItem.countDocuments();
    console.log('Database query successful. Item count:', count);
    
    res.json({ 
      message: 'Database connection successful',
      menuItemCount: count
    });
    console.log('=== DATABASE TEST SUCCESS ===');
  } catch (error) {
    console.error('=== DATABASE TEST ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Debug endpoint to test request handling
router.post('/debug', (req, res) => {
  console.log('Debug endpoint hit');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  res.json({ 
    message: 'Debug endpoint working',
    body: req.body,
    hasAvailable: req.body.available !== undefined
  });
});

module.exports = router;