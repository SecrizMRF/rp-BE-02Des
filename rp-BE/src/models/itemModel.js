const { pool } = require('../db');

class Item {
  static async create({
    title,
    description,
    item_type, // 'lost' or 'found'
    location,
    date,
    image_url,
    status = 'open', // 'open', 'claimed', 'resolved'
    reported_by,
    claimed_by = null,
    contact_info
  }) {
    const query = `
      INSERT INTO items (
        title, description, item_type, location, date, 
        image_url, status, reported_by, claimed_by, contact_info
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      title, description, item_type, location, date,
      image_url, status, reported_by, claimed_by, contact_info
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM items WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByType(itemType, { limit = 20, offset = 0, status = 'open' } = {}) {
    const query = `
      SELECT i.*, u.username as reporter_username 
      FROM items i
      JOIN users u ON i.reported_by = u.id
      WHERE i.item_type = $1 AND i.status = $2
      ORDER BY i.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await pool.query(query, [itemType, status, limit, offset]);
    return result.rows;
  }

  static async updateStatus(id, status, claimedBy = null) {
    const query = `
      UPDATE items 
      SET status = $1, claimed_by = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, claimedBy, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM items WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUser(userId) {
    const query = `
      SELECT * FROM items 
      WHERE reported_by = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = Item;
