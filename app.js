const express = require('express');
const transactionsRouter = require('./routes/transactions');
const authRouter = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const app = express();

app.use(express.json());

// Routes
app.use('/auth', authRouter); // Authentication routes (login/register)
app.use('/transactions', authMiddleware, transactionsRouter); // Protect routes

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
