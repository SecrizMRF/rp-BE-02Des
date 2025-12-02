const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const isLogin = require('../middleware/isLogin');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.get('/profile', isLogin, authController.getProfile);
router.put('/profile', isLogin, authController.updateProfile);

module.exports = router;
