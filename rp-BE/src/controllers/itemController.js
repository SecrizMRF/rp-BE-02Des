const pool = require('../db');
const { uploadFile, deleteFile } = require('../services/fileService');
const { validationResult } = require('express-validator');

const itemController = {
  // Create a new item
  async createItem(req, res, next) {
    try {
      const { title, description, item_type, location, date, contact_info } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!title || !item_type || !location) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      // Validate item type
      if (!['lost', 'found'].includes(item_type)) {
        return res.status(400).json({ message: 'Invalid item type. Must be "lost" or "found"' });
      }

      let image_url = null;
      
      // Handle file upload if exists
      if (req.file) {
        try {
          const result = await uploadFile(req.file);
          image_url = result.url;
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          return res.status(500).json({ message: 'Error uploading file' });
        }
      }

      // Create item in database
      const result = await pool.query(
        `INSERT INTO items 
        (type, name, location, date, description, status, contact, photo, reporter)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [item_type, title, location, date, description, 'dicari', contact_info, image_url, req.user.username]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating item:', error);
      next(error);
    }
  },

  // Get all items (with filtering and pagination)
  async getItems(req, res, next) {
    try {
      const { type = 'all', status = 'all', page = 1, limit = 20, search = '' } = req.query;
      console.log('Backend received params:', { type, status, page, limit, search });
      
      // Convert to integers
      const limitNum = parseInt(limit) || 20;
      const pageNum = parseInt(page) || 1;
      const offset = (pageNum - 1) * limitNum;
      
      let query = `
        SELECT i.*, u.username as reporter_name, u.email as reporter_email
        FROM items i
        LEFT JOIN users u ON i.reporter::text = u.username::text
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramCount = 1;

      // Add type filter
      if (type !== 'all') {
        query += ` AND i.type = $${paramCount++}`;
        queryParams.push(type);
      }

      // Add status filter
      if (status !== 'all') {
        query += ` AND i.status = $${paramCount++}`;
        queryParams.push(status);
      }

      // Add search filter
      if (search) {
        query += ` AND (i.name ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
        paramCount++;
      }

      // Add pagination
      query += ` ORDER BY i.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limitNum, offset);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) 
        FROM items i
        WHERE 1=1 
        ${type !== 'all' ? 'AND i.type = $1' : ''}
        ${status !== 'all' ? `AND i.status = $${type !== 'all' ? '2' : '1'}` : ''}
      `;
      
      const countParams = [];
      if (type !== 'all') countParams.push(type);
      if (status !== 'all') countParams.push(status);

      const [itemsResult, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, countParams)
      ]);

      const totalItems = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalItems / limitNum);

      res.json({
        success: true,
        data: itemsResult.rows,
        pagination: {
          total: totalItems,
          totalPages,
          currentPage: pageNum,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Error fetching items:', error);
      next(error);
    }
  },

  // Get item by ID
  async getItemById(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(
        `SELECT i.*, u.username as reporter_name, u.email as reporter_email
         FROM items i
         LEFT JOIN users u ON i.reporter::text = u.username::text
         WHERE i.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Item not found' });
      }

      // Item details are publicly viewable
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching item:', error);
      next(error);
    }
  },

  // Update item status
  async updateItemStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!['dicari', 'ditemukan', 'diclaim'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      // Check if item exists and user is the owner
      const itemResult = await pool.query(
        'SELECT * FROM items WHERE id = $1',
        [id]
      );

      if (itemResult.rows.length === 0) {
        return res.status(404).json({ message: 'Item not found' });
      }

      const item = itemResult.rows[0];

      // Only allow owner or admin to update status
      if (item.reporter !== req.user.username && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this item' });
      }

      const result = await pool.query(
        'UPDATE items SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating item status:', error);
      next(error);
    }
  },

  // Update item
  async updateItem(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, item_type, location, date, contact_info } = req.body;
      const userId = req.user.id;

      console.log('updateItem called with params:', req.params);
      console.log('Request body:', req.body);
      console.log('User info:', req.user);

      // Check if item exists
      const itemResult = await pool.query(
        'SELECT * FROM items WHERE id = $1',
        [id]
      );

      if (itemResult.rows.length === 0) {
        console.log('Item not found');
        return res.status(404).json({ message: 'Item not found' });
      }

      const item = itemResult.rows[0];
      console.log('Item found:', item);

      // Only allow owner or admin to update
      if (item.reporter !== req.user.username && req.user.role !== 'admin') {
        console.log('Authorization failed - not owner or admin');
        return res.status(403).json({ message: 'Not authorized to update this item' });
      }

      console.log('Authorization passed, proceeding with update');

      // Handle file upload if exists
      let image_url = item.photo; // Keep existing photo by default
      if (req.file) {
        try {
          console.log('Uploading new file');
          const result = await uploadFile(req.file);
          image_url = result.url;
          
          // Delete old file if exists
          if (item.photo) {
            try {
              await deleteFile(item.photo);
              console.log('Old file deleted successfully');
            } catch (error) {
              console.error('Error deleting old file:', error);
            }
          }
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          return res.status(500).json({ message: 'Error uploading file' });
        }
      }

      // Update item in database
      const updateResult = await pool.query(
        `UPDATE items 
        SET type = $1, name = $2, location = $3, date = $4, description = $5, contact = $6, photo = $7
        WHERE id = $8
        RETURNING *`,
        [item_type, title, location, date, description, contact_info, image_url, id]
      );

      console.log('Item updated successfully');

      res.json({
        success: true,
        data: updateResult.rows[0]
      });
    } catch (error) {
      console.error('Error updating item:', error);
      next(error);
    }
  },

  // Delete item
  async deleteItem(req, res, next) {
    try {
      console.log('deleteItem called with params:', req.params);
      console.log('User info:', req.user);
      
      const { id } = req.params;
      const userId = req.user.id;

      console.log('Checking if item exists with ID:', id);

      // Check if item exists
      const itemResult = await pool.query(
        'SELECT * FROM items WHERE id = $1',
        [id]
      );

      console.log('Item query result:', itemResult.rows);

      if (itemResult.rows.length === 0) {
        console.log('Item not found');
        return res.status(404).json({ message: 'Item not found' });
      }

      const item = itemResult.rows[0];
      console.log('Item found:', item);

      // Only allow owner or admin to delete
      if (item.reporter !== req.user.username && req.user.role !== 'admin') {
        console.log('Authorization failed - not owner or admin');
        console.log('Item reporter:', item.reporter, 'User username:', req.user.username, 'User role:', req.user.role);
        return res.status(403).json({ message: 'Not authorized to delete this item' });
      }

      console.log('Authorization passed, proceeding with deletion');

      // Delete associated file if exists
      if (item.photo) {
        try {
          console.log('Deleting associated file:', item.photo);
          await deleteFile(item.photo);
          console.log('File deleted successfully');
        } catch (error) {
          console.error('Error deleting file:', error);
          // Continue with item deletion even if file deletion fails
        }
      }

      console.log('Deleting item from database');
      await pool.query('DELETE FROM items WHERE id = $1', [id]);
      console.log('Item deleted successfully');

      res.json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      next(error);
    }
  },

  // Get items reported by the current user
  async getMyItems(req, res, next) {
    try {
      const userId = req.user.id;
      const { type = 'all', status = 'all' } = req.query;

      let query = `
        SELECT * FROM items 
        WHERE reporter = $1
      `;
      
      const queryParams = [req.user.username];
      let paramCount = 2;

      if (type !== 'all') {
        query += ` AND type = $${paramCount++}`;
        queryParams.push(type);
      }

      if (status !== 'all') {
        query += ` AND status = $${paramCount++}`;
        queryParams.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, queryParams);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching user items:', error);
      next(error);
    }
  }
};

module.exports = itemController;