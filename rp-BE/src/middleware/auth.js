// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// Middleware to verify JWT token
const isLogin = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Get user from database
    const userResult = await pool.query(
      'SELECT id, email, username, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Add user to request object
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Middleware to check if user has admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ 
    success: false,
    message: 'Access denied. Admin only.' 
  });
};

// Middleware to check if user is the owner of the resource
const isOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if the item exists and belongs to the user
    const result = await pool.query(
      'SELECT id FROM items WHERE id = $1 AND reporter = $2',
      [id, req.user.username]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to access this resource' 
      });
    }

    next();
  } catch (error) {
    console.error('Owner check error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Middleware to check if user is owner or admin
const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('isOwnerOrAdmin check:', { id, userId, userRole: req.user.role, username: req.user.username });
    
    // Admins can access any resource
    if (req.user.role === 'admin') {
      console.log('User is admin, allowing access');
      return next();
    }

    // For non-admin users, check if they own the resource
    console.log('Checking ownership for non-admin user');
    const result = await pool.query(
      'SELECT id FROM items WHERE id = $1 AND reporter = $2',
      [id, req.user.username]
    );

    console.log('Ownership check result:', result.rows);

    if (result.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to access this resource' 
      });
    }

    next();
  } catch (error) {
    console.error('Owner/Admin check error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = {
  isLogin,
  isAdmin,
  isOwner,
  isOwnerOrAdmin
};