const express = require('express')

const {getFoundItems, addItem, getLostItems, updateItem, deleteItem} = require('../controller/rpController')
const router = express.Router()

router.get("/items/found", getFoundItems)
router.get("/items/lost", getLostItems)
router.post("/items", addItem)
router.put("/items/:id", updateItem)
router.delete("/items/:id", deleteItem)

module.exports = router