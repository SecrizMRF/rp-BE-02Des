const ctrl = require("../services/rpServices")

async function getFoundItems(req, res) {
    try {
        const items = await ctrl.getFoundItems()
        res.status(200).json({
            status: "success",
            code: 200,
            message: "ok jalan",
            data: items
        })
    } catch (err) {
        res.status(500).json({
            status: "gagal",
            code: 500,
            message: err.message
        })
    }
}

async function getLostItems(req, res) {
    try {
        const items = await ctrl.getLostItems()
        res.status(200).json({
            status: "success",
            code: 200,
            message: "ok jalan",
            data: items
        })
    } catch (err) {
        res.status(500).json({
            status: "gagal",
            code: 500,
            message: err.message
        })
    }
}

async function addItem(req, res) {
    try {
        const newItem = await ctrl.addItem(req.body)
        res.status(201).json({
            status: "success",
            code: 201,
            message: "ok jalan",
            data: newItem
        })
    } catch (err) {
        res.status(500).json({
            status: "gagal",
            code: 500,
            message: err.message
        })
    }
}

function updateItem(req, res) {
    const updatedItem = ctrl.updateItem(req.params.id, req.body)
    if(!updatedItem) return res.status(404).json({status: 'error', message: 'Baarang tidak ditemukan'})
    res.json({status: 'sukses', data: updatedItem})
}

function deleteItem(req, res){
    const deletedItem = ctrl.deleteItem(req.params.id)
    if(!deletedItem) return res.status(404).json({status: 'error', message: 'Barang tidak ditemukan'})
    res.json({status: 'sukses', data: deletedItem})
}

module.exports = {getFoundItems, getLostItems, addItem, updateItem, deleteItem }