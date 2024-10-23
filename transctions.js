const express = require('express');
const router = express.Router();
const db = require('../config/database');

// POST /transactions
router.post('/', (req, res, next) => {
    const { type, category, amount, date, description } = req.body;
    if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const sql = `INSERT INTO transactions (type, category, amount, date, description, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [type, category, amount, date, description, req.user.id], function (err) {
        if (err) return next(err);
        res.status(201).json({ id: this.lastID, type, category, amount, date, description });
    });
});

// GET /transactions
router.get('/', (req, res, next) => {
    const sql = `SELECT * FROM transactions WHERE user_id = ?`;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

// GET /transactions/:id
router.get('/:id', (req, res, next) => {
    const { id } = req.params;
    const sql = `SELECT * FROM transactions WHERE id = ? AND user_id = ?`;
    db.get(sql, [id, req.user.id], (err, row) => {
        if (err) return next(err);
        if (!row) return res.status(404).json({ error: 'Transaction not found' });
        res.json(row);
    });
});

// PUT /transactions/:id
router.put('/:id', (req, res, next) => {
    const { id } = req.params;
    const { type, category, amount, date, description } = req.body;
    const sql = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? 
                 WHERE id = ? AND user_id = ?`;
    db.run(sql, [type, category, amount, date, description, id, req.user.id], function (err) {
        if (err) return next(err);
        if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ message: 'Transaction updated successfully' });
    });
});

// DELETE /transactions/:id
router.delete('/:id', (req, res, next) => {
    const { id } = req.params;
    const sql = `DELETE FROM transactions WHERE id = ? AND user_id = ?`;
    db.run(sql, [id, req.user.id], function (err) {
        if (err) return next(err);
        if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ message: `Transaction ${id} deleted successfully` });
    });
});

// GET /summary
router.get('/summary', (req, res, next) => {
    const { startDate, endDate, category } = req.query;
    let sql = `SELECT type, SUM(amount) as total FROM transactions WHERE user_id = ?`;
    let params = [req.user.id];

    if (startDate) {
        sql += ` AND date >= ?`;
        params.push(startDate);
    }
    if (endDate) {
        sql += ` AND date <= ?`;
        params.push(endDate);
    }
    if (category) {
        sql += ` AND category = ?`;
        params.push(category);
    }
    sql += ` GROUP BY type`;

    db.all(sql, params, (err, rows) => {
        if (err) return next(err);

        const summary = {
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0,
        };

        rows.forEach(row => {
            if (row.type === 'income') {
                summary.totalIncome += row.total;
            } else if (row.type === 'expense') {
                summary.totalExpenses += row.total;
            }
        });

        summary.balance = summary.totalIncome - summary.totalExpenses;
        res.json(summary);
    });
});

module.exports = router;
