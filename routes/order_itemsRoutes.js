const express = require('express');
const db = require('../db');
const router = express.Router();

 // CREATE order_items (POST)
 router.post('/order_items', (req, res) => {
    const { order_id, ticket_id, quantity, subtotal } = req.body;
    const sql = `INSERT INTO order_items (order_id, ticket_id, quantity, subtotal) VALUES (?, ?, ?,
    ?)`;
    db.query(sql, [ order_id, ticket_id, quantity, subtotal], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(201).send({ order_item_id: result.insertId, order_id, ticket_id, quantity, subtotal });
    });
});
   
// READ all order_items (GET)
router.get('/order_items', (req, res) => {
    const sql = `SELECT * FROM order_items`;
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).send(results);
    });
});

// READ single order_items by order_item_id (GET)
router.get('/order_items/:order_item_id', (req, res) => {
    const sql = `SELECT * FROM order_items WHERE order_item_id = ?`;
    db.query(sql, [req.params.order_item_id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.length === 0) {
            return res.status(404).send({ message: 'order_items not found' });
        }
        res.status(200).send(result[0]);
    });
});

// UPDATE order_items by order_item_id (PUT)
router.put('/order_items/:order_item_id', (req, res) => {
    const { order_id, ticket_id, quantity, subtotal } = req.body;
    const { order_item_id } = req.params; // Ambil order_item_id dari URL params
    
    const sql = `UPDATE order_items 
                 SET order_id = ?, ticket_id = ?, quantity = ?, subtotal = ? 
                 WHERE order_item_id = ?`;

    db.query(sql, [order_id, ticket_id, quantity, subtotal, order_item_id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'order_items not found' });
        }
        res.status(200).send({ order_item_id, order_id, ticket_id, quantity, subtotal });
    });
});


// DELETE order_items by order_item_id (DELETE)
router.delete('/order_items/:order_item_id', (req, res) => {
    const sql = `DELETE FROM order_items WHERE order_item_id = ?`;
    db.query(sql, [req.params.order_item_id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'order_items not found' });
        }
        res.status(200).send({ message: 'order_items deleted successfully' });
    });
});

module.exports = router;
