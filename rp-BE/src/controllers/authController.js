const User = require('../models/userModel');

const authController = {
  // Register a new user
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      // Create user
      const user = await User.create({
        username,
        email,
        password
      });

      // Generate JWT token
      const token = User.generateToken(user);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
      }

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = User.generateToken(user);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const { username, email, currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Find user
      const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (user.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = user.rows[0];
      const updates = [];
      const values = [];
      let valueCount = 1;

      // Check if updating password
      if (currentPassword && newPassword) {
        const isMatch = await User.comparePassword(currentPassword, userData.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        updates.push(`password = $${valueCount++}`);
        values.push(hashedPassword);
      }

      // Update other fields
      if (username && username !== userData.username) {
        // Check if username is taken
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [username, userId]
        );
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ message: 'Username already taken' });
        }
        updates.push(`username = $${valueCount++}`);
        values.push(username);
      }

      if (email && email !== userData.email) {
        // Check if email is taken
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, userId]
        );
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        updates.push(`email = $${valueCount++}`);
        values.push(email);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      // Update user
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${valueCount}
        RETURNING id, username, email, role, created_at
      `;
      
      values.push(userId);
      const result = await pool.query(query, values);
      
      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
