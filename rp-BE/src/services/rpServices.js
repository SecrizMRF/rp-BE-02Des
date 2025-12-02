const pool = require("../db")

async function getFoundItems () {
    const result = await pool.query("SELECT * FROM items WHERE type=$1 ORDER BY created_at DESC", ['found'])
    return result.rows
}

async function getLostItems () {
    const result = await pool.query("SELECT * FROM items WHERE type=$1 ORDER BY created_at DESC", ['lost'])
    return result.rows
}

async function addItem(data) {
  const { type, name, location, date, description, contact } = data;
  console.log("Menambahkan item:", { type, name, location, date, description, contact });
  const result = await pool.query(
    "INSERT INTO items (type, name, location, date, description, contact) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [type, name, location, date, description, contact]
  );
  console.log("Item yang ditambahkan:", result.rows[0]);
  return result.rows[0];
}

async function updateItem(id, data) {
    const { type, name, location, date, description, contact } = data;

    const result = await pool.query(
    `UPDATE items
    SET type = $1, name = $2, location = $3, date = $4, description = $5, contact = $6
    WHERE id = $7
    RETURNING *`,
    [type, name, location, date, description, contact, id]
    );
    return result.rows[0];
}

async function deleteItem(id) {
    const index = items.findIndex(e => e.id === parseInt(id));
    if (index === -1) return null;
    const removed = items.splice(index, 1);
    return removed[0];
}


module.exports = {getFoundItems, getLostItems, addItem, updateItem, deleteItem}